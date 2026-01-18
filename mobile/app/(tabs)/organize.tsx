import React, { memo, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';

import { BouncyPressable } from '@/components/bouncy-pressable';
import { CollectionCard } from '@/components/collection-card';
import { ModeSwitch } from '@/components/mode-switch';
import { ObjectTile } from '@/components/object-tile';
import { PaperBackground } from '@/components/paper-background';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette, Fonts } from '@/constants/organizer-theme';
import { makeId } from '@/lib/ids';
import { ensureMediaLibraryPermissions } from '@/lib/media';
import { CollectionItem, moveItem, ObjectItem, useCollections, useObjects } from '@/lib/storage';

type HeaderProps = {
  isEditing: boolean;
  onToggleEdit: () => void;
  isCreating: boolean;
  onStartCreate: () => void;
  onCancelCreate: () => void;
  onCreate: () => void;
  newTitle: string;
  onChangeTitle: (value: string) => void;
  newDescription: string;
  onChangeDescription: (value: string) => void;
  collections: CollectionItem[];
  collectionCounts: Record<string, number>;
  onPressCollection: (id: string) => void;
  onDeleteCollection: (collection: CollectionItem) => void;
  onMoveCollectionUp: (index: number) => void;
  onMoveCollectionDown: (index: number) => void;
};

const OrganizeHeader = memo((props: HeaderProps) => {
  const {
    isEditing,
    onToggleEdit,
    isCreating,
    onStartCreate,
    onCancelCreate,
    onCreate,
    newTitle,
    onChangeTitle,
    newDescription,
    onChangeDescription,
    collections,
    collectionCounts,
    onPressCollection,
    onDeleteCollection,
    onMoveCollectionUp,
    onMoveCollectionDown,
  } = props;

  return (
    <View style={styles.headerWrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Organize</Text>
        <BouncyPressable onPress={onToggleEdit} style={styles.editButton}>
          <IconSymbol name="line.3.horizontal.decrease.circle" size={18} color={Palette.ink} />
          <Text style={styles.editButtonText}>{isEditing ? 'Done' : 'Arrange'}</Text>
        </BouncyPressable>
      </View>
      <Text style={styles.subtitle}>Group the objects you have lifted.</Text>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Collections</Text>
      </View>

      {isCreating ? (
        <View style={styles.createCard}>
          <TextInput
            style={styles.input}
            placeholder="Collection title"
            placeholderTextColor="#8F847B"
            value={newTitle}
            onChangeText={onChangeTitle}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description"
            placeholderTextColor="#8F847B"
            value={newDescription}
            onChangeText={onChangeDescription}
            multiline
          />
          <View style={styles.createActions}>
            <BouncyPressable onPress={onCancelCreate} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </BouncyPressable>
            <BouncyPressable onPress={onCreate} style={styles.primaryButton}>
              <IconSymbol name="plus" size={16} color={Palette.ink} />
              <Text style={styles.primaryButtonText}>Create</Text>
            </BouncyPressable>
          </View>
        </View>
      ) : (
        <BouncyPressable onPress={onStartCreate} style={styles.newCollection}>
          <IconSymbol name="plus" size={16} color={Palette.ink} />
          <Text style={styles.newCollectionText}>New collection</Text>
        </BouncyPressable>
      )}

      {collections.map((collection, index) => (
        <CollectionCard
          key={collection.id}
          collection={collection}
          count={collectionCounts[collection.id] ?? 0}
          onPress={() => onPressCollection(collection.id)}
          onDelete={() => onDeleteCollection(collection)}
          onMoveUp={isEditing && index > 0 ? () => onMoveCollectionUp(index) : undefined}
          onMoveDown={
            isEditing && index < collections.length - 1 ? () => onMoveCollectionDown(index) : undefined
          }
          isEditing={isEditing}
        />
      ))}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All Objects</Text>
      </View>
    </View>
  );
});

type Props = {
  activeIndex?: 0 | 1;
  onSelectTab?: (index: 0 | 1) => void;
};

export default function OrganizeScreen({ activeIndex, onSelectTab }: Props) {
  const router = useRouter();
  const { objects, setObjects } = useObjects();
  const { collections, setCollections } = useCollections();

  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const showModeSwitch = typeof onSelectTab === 'function' && typeof activeIndex === 'number';
  const resolvedIndex: 0 | 1 = activeIndex === 1 ? 1 : 0;

  const collectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    objects.forEach((object) => {
      if (object.collectionId) {
        counts[object.collectionId] = (counts[object.collectionId] ?? 0) + 1;
      }
    });
    return counts;
  }, [objects]);

  const handleCreateCollection = () => {
    const trimmed = newTitle.trim();
    if (!trimmed) {
      Alert.alert('Collection title', 'Add a title to create a collection.');
      return;
    }
    const nextCollection: CollectionItem = {
      id: makeId('col'),
      title: trimmed,
      description: newDescription.trim(),
      createdAt: Date.now(),
    };
    setCollections([nextCollection, ...collections]);
    setNewTitle('');
    setNewDescription('');
    setIsCreating(false);
  };

  const handleDeleteCollection = (collection: CollectionItem) => {
    Alert.alert(
      'Delete collection',
      'Objects will stay in your library but will be unassigned.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setCollections(collections.filter((item) => item.id !== collection.id));
            setObjects(
              objects.map((object) =>
                object.collectionId === collection.id
                  ? { ...object, collectionId: null }
                  : object,
              ),
            );
          },
        },
      ],
    );
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <PaperBackground />
      {showModeSwitch ? (
        <ModeSwitch
          activeIndex={resolvedIndex}
          onSelect={onSelectTab as (index: 0 | 1) => void}
          style={styles.modeSwitch}
        />
      ) : null}
      <FlatList
        data={objects}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <OrganizeHeader
            isEditing={isEditing}
            onToggleEdit={() => setIsEditing((prev) => !prev)}
            isCreating={isCreating}
            onStartCreate={() => setIsCreating(true)}
            onCancelCreate={() => setIsCreating(false)}
            onCreate={handleCreateCollection}
            newTitle={newTitle}
            onChangeTitle={setNewTitle}
            newDescription={newDescription}
            onChangeDescription={setNewDescription}
            collections={collections}
            collectionCounts={collectionCounts}
            onPressCollection={(id) => router.push(`/collection/${id}`)}
            onDeleteCollection={handleDeleteCollection}
            onMoveCollectionUp={(index) =>
              setCollections(moveItem(collections, index, index - 1))
            }
            onMoveCollectionDown={(index) =>
              setCollections(moveItem(collections, index, index + 1))
            }
          />
        }
        numColumns={2}
        columnWrapperStyle={styles.columns}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <ObjectTile
            object={item}
            index={index}
            isEditing={isEditing}
            onDelete={() => handleDeleteObject(item)}
            onMoveUp={
              isEditing && index > 0 ? () => setObjects(moveItem(objects, index, index - 1)) : undefined
            }
            onMoveDown={
              isEditing && index < objects.length - 1
                ? () => setObjects(moveItem(objects, index, index + 1))
                : undefined
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No objects yet</Text>
            <Text style={styles.emptyBody}>Capture a few silhouettes to begin.</Text>
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
  },
  modeSwitch: {
    marginTop: 8,
    marginHorizontal: 20,
    marginBottom: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  headerWrap: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1E6D8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  editButtonText: {
    fontFamily: Fonts.bodyBold,
    color: Palette.ink,
    fontSize: 12,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: Fonts.bodyBold,
    color: Palette.ink,
    fontSize: 16,
  },
  newCollection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F7EBDD',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5D6C6',
    marginBottom: 16,
  },
  newCollectionText: {
    fontFamily: Fonts.bodyBold,
    color: Palette.ink,
    fontSize: 13,
  },
  createCard: {
    backgroundColor: '#FFF9F1',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8DCCB',
    marginBottom: 16,
  },
  createActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F7EBDD',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5D6C6',
    fontFamily: Fonts.body,
    color: Palette.ink,
    marginBottom: 10,
  },
  textArea: {
    minHeight: 70,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.sun,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  primaryButtonText: {
    fontFamily: Fonts.bodyBold,
    color: Palette.ink,
    fontSize: 12,
  },
  secondaryButton: {
    backgroundColor: '#F1E6D8',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    fontFamily: Fonts.bodyBold,
    color: Palette.ink,
    fontSize: 12,
  },
  columns: {
    gap: 16,
    justifyContent: 'space-between',
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
