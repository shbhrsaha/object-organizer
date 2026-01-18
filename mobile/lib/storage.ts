import Constants from 'expo-constants';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createMMKV, useMMKVString } from 'react-native-mmkv';

export type ObjectItem = {
  id: string;
  title: string;
  description: string;
  assetId: string;
  createdAt: number;
  collectionId: string | null;
};

export type CollectionItem = {
  id: string;
  title: string;
  description: string;
  createdAt: number;
};

const STORAGE_ID = 'object-organizer';
const OBJECTS_KEY = 'objects';
const COLLECTIONS_KEY = 'collections';

const isExpoGo = Constants.appOwnership === 'expo';
let storage: ReturnType<typeof createMMKV> | null = null;
let storageError: Error | null = null;

if (!isExpoGo) {
  try {
    storage = createMMKV({ id: STORAGE_ID });
  } catch (error) {
    storageError = error as Error;
  }
}

type SetValue = (value: string | undefined | ((current: string | undefined) => string | undefined)) => void;
type StorageHook = (key: string) => [string | undefined, SetValue];

const memoryStore = new Map<string, string>();
const memoryListeners = new Map<string, Set<() => void>>();

const subscribeMemory = (key: string, listener: () => void) => {
  let listeners = memoryListeners.get(key);
  if (!listeners) {
    listeners = new Set();
    memoryListeners.set(key, listeners);
  }
  listeners.add(listener);
  return () => {
    listeners?.delete(listener);
    if (listeners && listeners.size === 0) {
      memoryListeners.delete(key);
    }
  };
};

const notifyMemory = (key: string) => {
  const listeners = memoryListeners.get(key);
  if (!listeners) return;
  listeners.forEach((listener) => listener());
};

const useMemoryString: StorageHook = (key) => {
  const [value, setValue] = useState<string | undefined>(() => memoryStore.get(key));

  useEffect(() => {
    return subscribeMemory(key, () => setValue(memoryStore.get(key)));
  }, [key]);

  const set = useCallback<SetValue>(
    (next) => {
      const current = memoryStore.get(key);
      const resolved = typeof next === 'function' ? next(current) : next;
      if (typeof resolved === 'undefined') {
        memoryStore.delete(key);
      } else {
        memoryStore.set(key, resolved);
      }
      notifyMemory(key);
    },
    [key],
  );

  return [value, set];
};

const useStorageString: StorageHook = storage
  ? (key) => useMMKVString(key, storage)
  : useMemoryString;

export const isStorageAvailable = Boolean(storage);
export const storageAvailabilityNote = storageError
  ? 'MMKV failed to initialize; using in-memory storage.'
  : isExpoGo
    ? 'MMKV is not available in Expo Go; using in-memory storage.'
    : null;

const parseJson = <T,>(value: string | undefined, fallback: T): T => {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const useObjects = () => {
  const [raw, setRaw] = useStorageString(OBJECTS_KEY);
  const objects = useMemo<ObjectItem[]>(() => parseJson(raw, []), [raw]);

  const setObjects = useCallback(
    (next: ObjectItem[]) => {
      setRaw(JSON.stringify(next));
    },
    [setRaw],
  );

  return { objects, setObjects };
};

export const useCollections = () => {
  const [raw, setRaw] = useStorageString(COLLECTIONS_KEY);
  const collections = useMemo<CollectionItem[]>(() => parseJson(raw, []), [raw]);

  const setCollections = useCallback(
    (next: CollectionItem[]) => {
      setRaw(JSON.stringify(next));
    },
    [setRaw],
  );

  return { collections, setCollections };
};

export const moveItem = <T,>(items: T[], fromIndex: number, toIndex: number) => {
  const next = items.slice();
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
};
