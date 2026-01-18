import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { BouncyPressable } from '@/components/bouncy-pressable';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette } from '@/constants/organizer-theme';

type Props = {
  activeIndex: 0 | 1;
  onSelect: (index: 0 | 1) => void;
  style?: StyleProp<ViewStyle>;
};

export const ModeSwitch = ({ activeIndex, onSelect, style }: Props) => {
  return (
    <View style={[styles.container, style]}>
      <BouncyPressable
        onPress={() => onSelect(0)}
        style={[styles.iconButton, activeIndex === 0 && styles.iconButtonActive]}>
        <IconSymbol name="camera.fill" size={20} color={activeIndex === 0 ? Palette.ink : Palette.inkSoft} />
      </BouncyPressable>
      <BouncyPressable
        onPress={() => onSelect(1)}
        style={[styles.iconButton, activeIndex === 1 && styles.iconButtonActive]}>
        <IconSymbol name="folder.fill" size={20} color={activeIndex === 1 ? Palette.ink : Palette.inkSoft} />
      </BouncyPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 10,
    backgroundColor: '#F7EBDD',
    borderRadius: 22,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E5D6C6',
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: Palette.sun,
  },
});
