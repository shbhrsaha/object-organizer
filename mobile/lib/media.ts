import * as MediaLibrary from 'expo-media-library';

const ALBUM_NAME = 'Object Organizer';

export const ensureMediaLibraryPermissions = async () => {
  const permission = await MediaLibrary.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library permission denied.');
  }
};

export const saveToAlbumAsync = async (fileUri: string) => {
  await ensureMediaLibraryPermissions();
  const asset = await MediaLibrary.createAssetAsync(fileUri);
  let album = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
  if (!album) {
    album = await MediaLibrary.createAlbumAsync(ALBUM_NAME, asset, false);
  } else {
    await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
  }
  return asset;
};

export const getAssetUriAsync = async (assetId: string) => {
  await ensureMediaLibraryPermissions();
  const info = await MediaLibrary.getAssetInfoAsync(assetId);
  return info.localUri ?? info.uri;
};
