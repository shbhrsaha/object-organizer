import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';

import { BouncyPressable } from '@/components/bouncy-pressable';
import { ObjectTile } from '@/components/object-tile';
import { PaperBackground } from '@/components/paper-background';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette, Fonts } from '@/constants/organizer-theme';
import { ensureMediaLibraryPermissions } from '@/lib/media';
import { moveItem, useCollections, useObjects, ObjectItem } from '@/lib/storage';

export default function CollectionDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const collectionId = params.id;
  const { collections } = useCollections();
  const { objects, setObjects } = useObjects();
  const [isEditing, setIsEditing] = useState(false);

  const collection = collections.find((item) => item.id === collectionId);

  const { collectionObjects, collectionIndices } = useMemo(() => {
    const indices: number[] = [];
    const items: ObjectItem[] = [];
    objects.forEach((object, index) => {
      if (object.collectionId === collectionId) {
        indices.push(index);
        items.push(object);
      }
    });
    return { collectionObjects: items, collectionIndices: indices };
  }, [collectionId, objects]);

  const handleDeleteObject = (object: ObjectItem) => {
    Alert.alert('Delete object', 'This removes it from Photos and your collections.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await ensureMediaLibraryPermissions();
            await MediaLibrary.deleteAssetsAsync([object.assetId]);
          } catch {
            // ignore if Photos cleanup fails
          }
          setObjects(objects.filter((item) => item.id !== object.id));
        },
      },
    ]);
  };

  const moveWithinCollection = (objectId: string, direction: -1 | 1) => {
    const currentIndex = collectionObjects.findIndex((item) => item.id === objectId);
    if (currentIndex < 0) return;
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= collectionIndices.length) return;
    const fromIndex = collectionIndices[currentIndex];
    const toIndex = collectionIndices[targetIndex];
    setObjects(moveItem(objects, fromIndex, toIndex));
  };

  return (
    <SafeAreaView style={styles.container}>
      <PaperBackground />
      <View style={styles.header}>
        <BouncyPressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={18} color={Palette.ink} />
          <Text style={styles.backText}>Back</Text>
        </BouncyPressable>
        <BouncyPressable onPress={() => setIsEditing((prev) => !prev)} style={styles.editButton}>
          <IconSymbol name="line.3.horizontal.decrease.circle" size={18} color={Palette.ink} />
          <Text style={styles.editText}>{isEditing ? 'Done' : 'Arrange'}</Text>
        </BouncyPressable>
      </View>

      <Text style={styles.title}>{collection?.title ?? 'Collection'}</Text>
      {collection?.description ? (
        <Text style={styles.subtitle}>{collection.description}</Text>
      ) : null}

      <FlatList
        data={collectionObjects}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columns}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ObjectTile
            object={item}
            isEditing={isEditing}
            onDelete={() => handleDeleteObject(item)}
            onMoveUp={() => moveWithinCollection(item.id, -1)}
            onMoveDown={() => moveWithinCollection(item.id, 1)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyBody}>Assign some cutouts to this collection.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.paper,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1E6D8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  backText: {
    fontFamily: Fonts.bodyBold,
    color: Palette.ink,
    fontSize: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1E6D8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  editText: {
    fontFamily: Fonts.bodyBold,
    color: Palette.ink,
    fontSize: 12,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 26,
    color: Palette.ink,
    marginTop: 16,
  },
  subtitle: {
    fontFamily: Fonts.body,
    color: Palette.inkSoft,
    marginTop: 6,
    marginBottom: 10,
  },
  columns: {
    gap: 16,
    justifyContent: 'space-between',
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 120,
  },
  emptyState: {
    marginTop: 24,
    backgroundColor: '#FFF9F1',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8DCCB',
  },
  emptyTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Palette.ink,
  },
  emptyBody: {
    marginTop: 6,
    fontFamily: Fonts.body,
    color: Palette.inkSoft,
  },
});
