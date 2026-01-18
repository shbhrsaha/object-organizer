import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BouncyPressable } from '@/components/bouncy-pressable';
import { ModeSwitch } from '@/components/mode-switch';
import { PaperBackground } from '@/components/paper-background';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette, Fonts } from '@/constants/organizer-theme';
import { makeId } from '@/lib/ids';
import { saveToAlbumAsync } from '@/lib/media';
import { useCollections, useObjects } from '@/lib/storage';
import { isSegmentationAvailable, segmentImageAsync } from 'object-segmentation';

type Props = {
  activeIndex?: 0 | 1;
  onSelectTab?: (index: 0 | 1) => void;
};

export default function CaptureScreen({ activeIndex, onSelectTab }: Props) {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const { objects, setObjects } = useObjects();
  const { collections } = useCollections();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [cutoutUri, setCutoutUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [collectionId, setCollectionId] = useState<string | null>(null);

  const isReadyToSave = Boolean(cutoutUri);
  const segmentationAvailable = isSegmentationAvailable;
  const showModeSwitch = typeof onSelectTab === 'function' && typeof activeIndex === 'number';
  const resolvedIndex: 0 | 1 = activeIndex === 1 ? 1 : 0;

  const resetCapture = () => {
    setPhotoUri(null);
    setCutoutUri(null);
    setTitle('');
    setDescription('');
    setCollectionId(null);
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current || !isCameraReady) return;
    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      if (!photo?.uri) {
        throw new Error('Missing photo uri');
      }
      setPhotoUri(photo.uri);
      setCutoutUri(null);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      Alert.alert('Camera', 'Could not take photo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSegment = async () => {
    if (!photoUri) return;
    if (!segmentationAvailable) {
      Alert.alert(
        'Dev client required',
        'Subject lifting needs the iOS dev client. Run `npx expo run:ios` to enable it.',
      );
      return;
    }
    setIsProcessing(true);
    try {
      const resultUri = await segmentImageAsync(photoUri);
      setCutoutUri(resultUri);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      Alert.alert('Cutout failed', 'Could not lift the subject from the photo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!cutoutUri) return;
    setIsProcessing(true);
    try {
      const asset = await saveToAlbumAsync(cutoutUri);
      const nextObject = {
        id: makeId('obj'),
        title: title.trim() || 'Untitled object',
        description: description.trim(),
        assetId: asset.id,
        createdAt: Date.now(),
        collectionId,
      };
      setObjects([nextObject, ...objects]);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetCapture();
    } catch (err) {
      Alert.alert('Save failed', 'Could not save the cutout to Photos.');
    } finally {
      setIsProcessing(false);
    }
  };

  const collectionChips = useMemo(() => {
    return [
      { id: null, title: 'No collection' },
      ...collections.map((collection) => ({
        id: collection.id,
        title: collection.title,
      })),
    ];
  }, [collections]);

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <PaperBackground />
        {showModeSwitch ? (
          <ModeSwitch
            activeIndex={resolvedIndex}
            onSelect={onSelectTab as (index: 0 | 1) => void}
            style={styles.modeSwitch}
          />
        ) : null}
        <Text style={styles.title}>Camera access</Text>
        <Text style={styles.subtitle}>We need the camera to lift objects from photos.</Text>
        <BouncyPressable onPress={requestPermission} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Enable Camera</Text>
        </BouncyPressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PaperBackground />
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.select({ ios: 'padding', android: undefined })}>
        {showModeSwitch ? (
          <ModeSwitch
            activeIndex={resolvedIndex}
            onSelect={onSelectTab as (index: 0 | 1) => void}
            style={styles.modeSwitch}
          />
        ) : null}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Object Organizer</Text>
            <Text style={styles.subtitle}>Lift, label, and collect your finds.</Text>
          </View>

          <View style={styles.cameraFrame}>
            {!photoUri ? (
              <CameraView
                ref={cameraRef}
                facing="back"
                style={styles.camera}
                onCameraReady={() => setIsCameraReady(true)}
                onMountError={(event) => setCameraError(event.nativeEvent.message)}
              />
            ) : (
              <BouncyPressable
                onLongPress={handleSegment}
                delayLongPress={220}
                style={styles.previewWrap}
                disabled={isProcessing}>
                <Image
                  source={{ uri: cutoutUri ?? photoUri }}
                  style={styles.previewImage}
                  contentFit="contain"
                />
                <View style={styles.previewHint}>
                  <IconSymbol name="sparkles" size={16} color={Palette.ink} />
                  <Text style={styles.previewHintText}>
                    {cutoutUri ? 'Cutout ready' : 'Press & hold to lift subject'}
                  </Text>
                </View>
              </BouncyPressable>
            )}
          </View>

          {!photoUri ? (
            <View style={styles.controls}>
              <BouncyPressable
                onPress={handleTakePhoto}
                style={[styles.captureButton, !isCameraReady && styles.captureButtonDisabled]}
                disabled={!isCameraReady || isProcessing}>
                <View style={styles.captureDot} />
              </BouncyPressable>
              <Text style={styles.helperText}>
                {cameraError
                  ? 'Camera unavailable on this device.'
                  : isCameraReady
                    ? 'Snap an object with a clean background.'
                    : 'Starting the camera...'}
              </Text>
            </View>
          ) : (
            <View style={styles.controls}>
              <View style={styles.actionRow}>
                <BouncyPressable onPress={handleSegment} style={styles.secondaryButton} disabled={isProcessing}>
                  <IconSymbol name="sparkles" size={16} color={Palette.ink} />
                  <Text style={styles.secondaryButtonText}>Lift subject</Text>
                </BouncyPressable>
                <BouncyPressable onPress={resetCapture} style={styles.secondaryButton}>
                  <IconSymbol name="xmark" size={16} color={Palette.ink} />
                  <Text style={styles.secondaryButtonText}>Retake</Text>
                </BouncyPressable>
              </View>
              {!segmentationAvailable ? (
                <Text style={styles.noticeText}>
                  Subject lifting needs the iOS dev client build.
                </Text>
              ) : null}

              <View style={styles.form}>
                <Text style={styles.sectionTitle}>Details</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Object title"
                  placeholderTextColor="#8F847B"
                  value={title}
                  onChangeText={setTitle}
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Short description"
                  placeholderTextColor="#8F847B"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />

                <Text style={styles.sectionTitle}>Collection</Text>
                <View style={styles.chipRow}>
                  {collectionChips.map((chip) => {
                    const selected = chip.id === collectionId;
                    return (
                      <BouncyPressable
                        key={chip.id ?? 'none'}
                        onPress={() => setCollectionId(chip.id)}
                        style={[styles.chip, selected && styles.chipSelected]}>
                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                          {chip.title}
                        </Text>
                      </BouncyPressable>
                    );
                  })}
                </View>
              </View>

              <BouncyPressable
                onPress={handleSave}
                style={[styles.primaryButton, !isReadyToSave && styles.primaryButtonDisabled]}
                disabled={!isReadyToSave || isProcessing}>
                <IconSymbol name="checkmark" size={16} color={Palette.ink} />
                <Text style={styles.primaryButtonText}>Save to Photos</Text>
              </BouncyPressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.paper,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  modeSwitch: {
    marginTop: 8,
    marginBottom: 6,
  },
  header: {
    marginTop: 16,
    marginBottom: 20,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 28,
    color: Palette.ink,
  },
  subtitle: {
    fontFamily: Fonts.body,
    color: Palette.inkSoft,
    marginTop: 6,
  },
  cameraFrame: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E6D9CA',
    backgroundColor: '#F1E6D8',
    height: 320,
  },
  camera: {
    flex: 1,
  },
  previewWrap: {
    flex: 1,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    contentFit: 'contain',
  },
  previewHint: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 249, 241, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  previewHintText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Palette.ink,
  },
  controls: {
    justifyContent: 'flex-start',
    marginTop: 20,
  },
  captureButton: {
    alignSelf: 'center',
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#FFF9F1',
    borderWidth: 2,
    borderColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureDot: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Palette.coral,
  },
  helperText: {
    textAlign: 'center',
    marginTop: 14,
    fontFamily: Fonts.body,
    color: Palette.inkSoft,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  noticeText: {
    marginTop: 10,
    fontFamily: Fonts.body,
    color: Palette.inkSoft,
    fontSize: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F7EBDD',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5D6C6',
  },
  secondaryButtonText: {
    fontFamily: Fonts.bodyBold,
    color: Palette.ink,
    fontSize: 13,
  },
  form: {
    marginTop: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: Fonts.bodyBold,
    color: Palette.ink,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF9F1',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E8DCCB',
    fontFamily: Fonts.body,
    color: Palette.ink,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 80,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#F1E6D8',
    borderWidth: 1,
    borderColor: '#E5D6C6',
  },
  chipSelected: {
    backgroundColor: Palette.blue,
    borderColor: Palette.blue,
  },
  chipText: {
    fontFamily: Fonts.bodyBold,
    color: Palette.ink,
    fontSize: 12,
  },
  chipTextSelected: {
    color: '#FFF9F1',
  },
  primaryButton: {
    backgroundColor: Palette.sun,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E0B445',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontFamily: Fonts.bodyBold,
    color: Palette.ink,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: Palette.paper,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
});
