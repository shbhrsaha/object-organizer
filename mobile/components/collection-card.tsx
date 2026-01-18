import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { BouncyPressable } from '@/components/bouncy-pressable';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette, Fonts } from '@/constants/organizer-theme';
import { CollectionItem } from '@/lib/storage';

type Props = {
  collection: CollectionItem;
  count: number;
  onPress: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isEditing?: boolean;
};

export const CollectionCard = ({
  collection,
  count,
  onPress,
  onDelete,
  onMoveUp,
  onMoveDown,
  isEditing,
}: Props) => {
  return (
    <Animated.View entering={FadeInUp.duration(320).springify()}>
      <BouncyPressable onPress={onPress} style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>{collection.title}</Text>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{count}</Text>
          </View>
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {collection.description}
        </Text>
        {isEditing ? (
          <View style={styles.actions}>
            <BouncyPressable onPress={onMoveUp} style={styles.iconButton}>
              <IconSymbol name="arrow.up" size={16} color={Palette.ink} />
            </BouncyPressable>
            <BouncyPressable onPress={onMoveDown} style={styles.iconButton}>
              <IconSymbol name="arrow.down" size={16} color={Palette.ink} />
            </BouncyPressable>
            <BouncyPressable onPress={onDelete} style={[styles.iconButton, styles.deleteButton]}>
              <IconSymbol name="trash" size={16} color={Palette.ink} />
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
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    shadowColor: Palette.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: '#E8DCCB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: Palette.ink,
  },
  description: {
    fontFamily: Fonts.body,
    color: Palette.inkSoft,
    fontSize: 14,
  },
  pill: {
    backgroundColor: Palette.sun,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    fontFamily: Fonts.bodyBold,
    color: Palette.ink,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 10,
  },
  iconButton: {
    backgroundColor: '#F1E6D8',
    borderRadius: 14,
    padding: 8,
  },
  deleteButton: {
    backgroundColor: '#FCE1D5',
  },
});
