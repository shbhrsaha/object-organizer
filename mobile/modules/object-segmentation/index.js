const { Platform } = require('react-native');
const { requireOptionalNativeModule } = require('expo-modules-core');

const nativeModule =
  Platform.OS === 'ios' ? requireOptionalNativeModule('ObjectSegmentation') : null;
const isSegmentationAvailable = Boolean(nativeModule);

async function segmentImageAsync(uri) {
  if (!nativeModule) {
    throw new Error(
      'Object segmentation is unavailable. Build the iOS dev client to enable it.'
    );
  }
  return nativeModule.segmentImage(uri);
}

module.exports = {
  segmentImageAsync,
  isSegmentationAvailable,
};
