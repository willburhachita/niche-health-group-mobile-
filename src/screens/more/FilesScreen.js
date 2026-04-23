import React, { useState } from 'react';
import { View, FlatList, Pressable, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { SearchBar } from '../../components/common/SearchBar';
import { Divider } from '../../components/common/Divider';
import { formatFileSize } from '../../utils/formatters';
import { useAlert } from '../../components/common/CustomAlert';
import { formatTimestamp } from '../../utils/dateHelpers';
import { getUserById } from '../../data/mockUsers';

const ICONS = { folder: 'folder', pdf: 'file-text', xlsx: 'file', doc: 'file-text', png: 'image', jpg: 'image' };
const COLORS = { folder: colors.navyBlue, pdf: colors.error, xlsx: colors.success, doc: colors.navyBlue, png: colors.peach, jpg: colors.peach };

export default function FilesScreen({ navigation }) {
  const { currentAccount } = useAuth();
  const alert = useAlert();
  const currentUserId = currentAccount?.userId;
  const convexFiles = useQuery(api.files.listFiles) || [];
  const uploadFileRecord = useMutation(api.files.uploadFileRecord);
  const conversations = useQuery(api.messages.listConversations) || [];
  const channels = useQuery(api.channels.listChannels) || [];
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const folders = convexFiles.filter(f => f.fileType === 'folder');
  const fileItems = convexFiles.filter(f => f.fileType !== 'folder');
  const allItems = [...folders, ...fileItems];
  const filtered = search
    ? allItems.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : allItems;

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        const ext = asset.name.split('.').pop()?.toLowerCase() || 'file';
        await uploadFileRecord({
          name: asset.name,
          fileType: ext,
          size: asset.size || 0,
          uploadedBy: currentUserId,
        });
        alert({ type: 'success', title: 'Uploaded', message: `${asset.name} has been added to your files.` });
      }
    } catch {
      alert({ type: 'error', title: 'Error', message: 'Could not pick a document.' });
    }
  };

  const handleFilePress = (item) => {
    if (item.fileType === 'folder') return;
    alert({
      type: 'info',
      title: item.name,
      message: `Size: ${formatFileSize(item.size)}`,
      buttons: [
        { label: 'Close', style: 'cancel' },
        { label: 'Share', onPress: () => { setSelectedFile(item); setShowShareModal(true); } },
      ],
    });
  };

  const handleShare = (target) => {
    setShowShareModal(false);
    alert({ type: 'success', title: 'Shared', message: `"${selectedFile?.name}" shared to ${target.name || target.displayName}.` });
    setSelectedFile(null);
  };

  // Build share targets: conversations + channels
  const shareTargets = [
    ...conversations.map(c => {
      const other = c.members?.find(m => m !== currentUserId);
      const user = getUserById(other);
      return { id: c._id, name: c.type === 'group' ? c.name : (user?.displayName || 'Chat'), icon: c.type === 'group' ? 'users' : 'message-circle', type: 'chat' };
    }),
    ...channels.map(c => ({ id: c._id, name: c.displayName, icon: c.type === 'private' ? 'lock' : 'hash', type: 'channel' })),
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}><Feather name="chevron-left" size={24} color={colors.black} /></Pressable>
        <AppText variant="h3">Files & Documents</AppText>
        <Pressable onPress={handleUpload} hitSlop={12}><Feather name="upload" size={22} color={colors.navyBlue} /></Pressable>
      </View>
      <SearchBar placeholder="Search files..." value={search} onChangeText={setSearch} />

      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
        contentContainerStyle={{ padding: spacing.base }}
        renderItem={({ item }) => {
          const icon = ICONS[item.fileType] || 'file';
          const iconColor = COLORS[item.fileType] || colors.mediumGrey;
          const uploader = item.uploadedBy ? getUserById(item.uploadedBy) : null;

          return (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              onPress={() => handleFilePress(item)}
              onLongPress={() => { setSelectedFile(item); setShowShareModal(true); }}
            >
              <View style={[styles.iconBox, { backgroundColor: iconColor + '15' }]}>
                <Feather name={icon} size={22} color={iconColor} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyBold" numberOfLines={1}>{item.name}</AppText>
                {item.fileType === 'folder' ? (
                  <AppText variant="caption" color={colors.mediumGrey}>{item.itemCount} items</AppText>
                ) : (
                  <AppText variant="caption" color={colors.mediumGrey}>
                    {formatFileSize(item.size)}{uploader ? ` - ${uploader.displayName}` : ''} - {formatTimestamp(item.uploadedAt)}
                  </AppText>
                )}
              </View>
              <Pressable hitSlop={10} onPress={() => { if (item.fileType !== 'folder') { setSelectedFile(item); setShowShareModal(true); } }}>
                <Feather name={item.fileType === 'folder' ? 'chevron-right' : 'share-2'} size={16} color={colors.mediumGrey} />
              </Pressable>
            </Pressable>
          );
        }}
        ItemSeparatorComponent={() => <Divider type="avatarInset" />}
        ListEmptyComponent={<AppText variant="body" color={colors.mediumGrey} style={{ textAlign: 'center', marginTop: spacing.xxl }}>No files found</AppText>}
      />

      {/* Share Modal */}
      <Modal visible={showShareModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <AppText variant="h2">Share to...</AppText>
            <Pressable onPress={() => { setShowShareModal(false); setSelectedFile(null); }} hitSlop={12}>
              <Feather name="x" size={24} color={colors.black} />
            </Pressable>
          </View>
          {selectedFile && (
            <View style={styles.shareFilePreview}>
              <Feather name="file-text" size={20} color={colors.navyBlue} />
              <AppText variant="bodyBold" style={{ marginLeft: spacing.sm, flex: 1 }} numberOfLines={1}>{selectedFile.name}</AppText>
            </View>
          )}
          <FlatList
            data={shareTargets}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <Pressable style={styles.shareRow} onPress={() => handleShare(item)}>
                <View style={[styles.shareIcon, { backgroundColor: item.type === 'channel' ? colors.navyLight : colors.offWhite }]}>
                  <Feather name={item.icon} size={18} color={colors.navyBlue} />
                </View>
                <AppText variant="body" style={{ flex: 1 }}>{item.name}</AppText>
                <Feather name="send" size={16} color={colors.mediumGrey} />
              </Pressable>
            )}
            ItemSeparatorComponent={() => <Divider type="inset" />}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, height: 56, borderBottomWidth: 1, borderBottomColor: colors.lightGrey },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
  pressed: { backgroundColor: colors.offWhite },
  iconBox: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  modalContainer: { flex: 1, backgroundColor: colors.white },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.base,
    borderBottomWidth: 1, borderBottomColor: colors.lightGrey,
  },
  shareFilePreview: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    backgroundColor: colors.offWhite,
  },
  shareRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
  },
  shareIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
});
