import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Palette } from '@/constants/organizer-theme';

export const PaperBackground = () => {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobMiddle]} />
      <View style={[styles.blob, styles.blobBottom]} />
      <View style={[styles.dot, styles.dotOne]} />
      <View style={[styles.dot, styles.dotTwo]} />
    </View>
  );
};

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    borderRadius: 220,
    opacity: 0.4,
  },
  blobTop: {
    width: 260,
    height: 260,
    backgroundColor: Palette.fog,
    top: -120,
    left: -80,
  },
  blobMiddle: {
    width: 220,
    height: 220,
    backgroundColor: '#F1E6D8',
    top: 220,
    right: -70,
  },
  blobBottom: {
    width: 280,
    height: 280,
    backgroundColor: '#EADFD1',
    bottom: -140,
    left: -40,
  },
  dot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Palette.mint,
    opacity: 0.7,
  },
  dotOne: {
    top: 140,
    left: 40,
  },
  dotTwo: {
    bottom: 180,
    right: 60,
    backgroundColor: Palette.coral,
  },
});
