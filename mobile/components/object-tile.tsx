import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Image } from 'expo-image';

import { BouncyPressable } from '@/components/bouncy-pressable';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette, Fonts } from '@/constants/organizer-theme';
import { useAssetUri } from '@/hooks/use-asset-uri';
import { ObjectItem } from '@/lib/storage';

type Props = {
  object: ObjectItem;
  onPress?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isEditing?: boolean;
  index?: number;
};

export const ObjectTile = ({
  object,
  onPress,
  onDelete,
  onMoveUp,
  onMoveDown,
  isEditing,
  index = 0,
}: Props) => {
  const { uri } = useAssetUri(object.assetId);

  return (
    <Animated.View entering={FadeInUp.delay(index * 40).duration(260).springify()}>
      <BouncyPressable onPress={onPress} style={styles.card}>
        <View style={styles.imageWrap}>
          {uri ? (
            <Image source={{ uri }} style={styles.image} contentFit="contain" />
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {object.title}
        </Text>
        {object.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {object.description}
          </Text>
        ) : null}
        {isEditing ? (
          <View style={styles.actions}>
            <BouncyPressable onPress={onMoveUp} style={styles.iconButton}>
              <IconSymbol name="arrow.up" size={14} color={Palette.ink} />
            </BouncyPressable>
            <BouncyPressable onPress={onMoveDown} style={styles.iconButton}>
              <IconSymbol name="arrow.down" size={14} color={Palette.ink} />
            </BouncyPressable>
            <BouncyPressable onPress={onDelete} style={[styles.iconButton, styles.deleteButton]}>
              <IconSymbol name="trash" size={14} color={Palette.ink} />
            </BouncyPressable>
          </View>
        ) : null}
      </BouncyPressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF9F1',
    borderRadius: 22,
    padding: 14,
    marginBottom: 16,
    flex: 1,
    minWidth: 150,
    borderWidth: 1,
    borderColor: '#E8DCCB',
    shadowColor: Palette.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  imageWrap: {
    height: 130,
    borderRadius: 18,
    backgroundColor: '#F3EADF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  image: {
    width: '82%',
    height: '82%',
  },
  placeholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8DCCB',
  },
  title: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Palette.ink,
  },
  description: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Palette.inkSoft,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  iconButton: {
    backgroundColor: '#F1E6D8',
    borderRadius: 12,
    padding: 6,
  },
  deleteButton: {
    backgroundColor: '#FCE1D5',
  },
});
