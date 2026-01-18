import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import CaptureScreen from './capture';
import OrganizeScreen from './organize';

export default function HomePager() {
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState<0 | 1>(0);

  const handleSelect = (index: 0 | 1) => {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setActiveIndex(index);
  };

  const handleScrollEnd = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(nextIndex === 0 ? 0 : 1);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        bounces={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}>
        <View style={[styles.page, { width }]}>
          <CaptureScreen activeIndex={activeIndex} onSelectTab={handleSelect} />
        </View>
        <View style={[styles.page, { width }]}>
          <OrganizeScreen activeIndex={activeIndex} onSelectTab={handleSelect} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  page: {
    flex: 1,
  },
});
