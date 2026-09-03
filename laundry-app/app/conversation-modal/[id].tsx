import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  Dimensions,
  StatusBar,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Paths, File as FSFile } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';

import {
  useChatMessages,
  useSendMessage,
  useUploadChatAttachment,
  useMarkChatAsRead,
  useDeleteMessage,
  ChatMessage,
} from '../../hooks/useChat';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string, locale: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const isAr = i18n.language === 'ar';

  const [isFocused, setIsFocused] = useState(true);
  const [inputText, setInputText] = useState('');
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [savingImage, setSavingImage] = useState(false);

  const { data: messages, isLoading } = useChatMessages(id as string, isFocused);
  const sendMessageMutation = useSendMessage(id as string);
  const uploadMutation = useUploadChatAttachment();
  const markAsReadMutation = useMarkChatAsRead(id as string);
  const deleteMessageMutation = useDeleteMessage(id as string);

  const flatListRef = useRef<FlatList>(null);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      if (id !== 'support') {
        markAsReadMutation.mutate();
      }
      return () => setIsFocused(false);
    }, [id]),
  );

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessageMutation.mutate(
      { message: inputText.trim() },
      {
        onSuccess: () => {
          setInputText('');
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
        },
      },
    );
  };

  const handleAttachImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      handleUploadAndSend({
        uri: asset.uri,
        name: asset.fileName || asset.uri.split('/').pop() || 'image.jpg',
        type: asset.mimeType || 'image/jpeg',
      });
    }
  };

  const handleAttachDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        handleUploadAndSend({
          uri: asset.uri,
          name: asset.name || asset.uri.split('/').pop() || 'document.pdf',
          type: asset.mimeType || 'application/pdf',
        });
      }
    } catch (err) {
      console.log('Error picking document', err);
    }
  };

  const handleUploadAndSend = (file: { uri: string; name: string; type: string }) => {
    uploadMutation.mutate(file, {
      onSuccess: (data) => {
        sendMessageMutation.mutate(
          { attachmentUrl: data.url, attachmentType: data.type },
          {
            onSuccess: () =>
              setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150),
          },
        );
      },
      onError: () => Alert.alert(t('common.error'), t('common.tryAgain')),
    });
  };

  // ─── Media viewer actions ──────────────────────────────────────────────────

  const handleImagePress = (imageUrl: string) => {
    setViewerImage(imageUrl);
  };

  const handleSaveImage = async () => {
    if (!viewerImage) return;
    try {
      setSavingImage(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          isAr ? 'صلاحية مطلوبة' : 'Permission Required',
          isAr ? 'يرجى السماح بالوصول إلى المعرض لحفظ الصور' : 'Please allow gallery access to save images',
        );
        return;
      }
      const destFile = new FSFile(Paths.cache, 'chat_image_' + Date.now() + '.jpg');
      const downloadedFile = await FSFile.downloadFileAsync(viewerImage, destFile);
      await MediaLibrary.saveToLibraryAsync(downloadedFile.uri);
      Alert.alert(
        isAr ? 'تم الحفظ' : 'Saved',
        isAr ? 'تم حفظ الصورة في المعرض بنجاح' : 'Image saved to gallery successfully',
      );
    } catch (err) {
      console.error('Save image error:', err);
      Alert.alert(t('common.error'), isAr ? 'فشل حفظ الصورة' : 'Failed to save image');
    } finally {
      setSavingImage(false);
    }
  };

  const handleShareImage = async () => {
    if (!viewerImage) return;
    try {
      const destFile = new FSFile(Paths.cache, 'chat_share_' + Date.now() + '.jpg');
      const downloadedFile = await FSFile.downloadFileAsync(viewerImage, destFile);
      await Sharing.shareAsync(downloadedFile.uri);
    } catch (err) {
      console.error('Share image error:', err);
    }
  };

  const handlePdfPress = async (pdfUrl: string) => {
    try {
      await WebBrowser.openBrowserAsync(pdfUrl);
    } catch (err) {
      // fallback to system browser
      Linking.openURL(pdfUrl);
    }
  };

  const handleSharePdf = async (pdfUrl: string) => {
    try {
      const destFile = new FSFile(Paths.cache, 'chat_doc_' + Date.now() + '.pdf');
      const downloadedFile = await FSFile.downloadFileAsync(pdfUrl, destFile);
      await Sharing.shareAsync(downloadedFile.uri);
    } catch (err) {
      console.error('Share PDF error:', err);
      Alert.alert(t('common.error'), isAr ? 'فشل مشاركة الملف' : 'Failed to share file');
    }
  };

  const handleLongPress = (item: ChatMessage) => {
    const isMyMessage = item.senderId === user?.id;
    if (!isMyMessage) return;

    Alert.alert(
      isAr ? 'حذف الرسالة' : 'Delete Message',
      isAr ? 'هل تريد حذف هذه الرسالة نهائياً؟' : 'Are you sure you want to delete this message?',
      [
        { text: isAr ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isAr ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: () => deleteMessageMutation.mutate(item.id),
        },
      ],
    );
  };

  // ─── Render helpers ─────────────────────────────────────────────────────────

  const isSupport = id === 'support';
  const headerTitle = isSupport
    ? isAr ? 'الدعم الفني' : 'Technical Support'
    : isAr ? 'محادثة العميل' : 'Customer Chat';

  const renderDateSeparator = (dateStr: string) => (
    <View style={styles.dateSeparatorWrap}>
      <View style={[styles.dateSeparatorLine, { backgroundColor: colors.border }]} />
      <Text style={[styles.dateSeparatorText, { color: colors.textSecondary, backgroundColor: colors.background }]}>
        {formatDate(dateStr, i18n.language)}
      </Text>
      <View style={[styles.dateSeparatorLine, { backgroundColor: colors.border }]} />
    </View>
  );

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isMyMessage = item.senderId === user?.id;
    const prevMessage = messages?.[index - 1];
    const showDateSeparator = !prevMessage || !isSameDay(prevMessage.sentAt, item.sentAt);

    return (
      <>
        {showDateSeparator && renderDateSeparator(item.sentAt)}

        <TouchableWithoutFeedback onLongPress={() => handleLongPress(item)}>
          <View style={[styles.bubbleWrap, isMyMessage ? styles.bubbleWrapRight : styles.bubbleWrapLeft]}>
            {/* اسم المُرسل (للأدمن فقط) */}
            {!isMyMessage && item.senderRole === 'admin' && (
              <Text style={[styles.senderName, { color: colors.primary }]}>
                {isAr ? 'الدعم الفني' : 'Support Team'}
              </Text>
            )}

            <View
              style={[
                styles.messageBubble,
                isMyMessage
                  ? [styles.myMessage, { backgroundColor: colors.primary }]
                  : [styles.theirMessage, { backgroundColor: colors.surface }],
              ]}
            >
              {/* نص الرسالة */}
              {item.message ? (
                <Text
                  style={[
                    styles.messageText,
                    isMyMessage ? styles.myMessageText : [styles.theirMessageText, { color: colors.text }],
                  ]}
                >
                  {item.message}
                </Text>
              ) : null}

              {/* مرفق صورة */}
              {item.attachmentUrl && item.attachmentType !== 'pdf' ? (
                <TouchableOpacity activeOpacity={0.85} onPress={() => handleImagePress(item.attachmentUrl!)}>
                  <Image
                    source={{ uri: item.attachmentUrl }}
                    style={styles.imageAttachment}
                    resizeMode="cover"
                  />
                  <View style={styles.mediaOverlayHint}>
                    <Ionicons name="expand-outline" size={14} color="#fff" />
                  </View>
                </TouchableOpacity>
              ) : null}

              {/* مرفق PDF */}
              {item.attachmentUrl && item.attachmentType === 'pdf' ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handlePdfPress(item.attachmentUrl!)}
                  onLongPress={() => handleSharePdf(item.attachmentUrl!)}
                >
                  <View style={[styles.pdfContainer, { backgroundColor: isMyMessage ? 'rgba(255,255,255,0.15)' : colors.background }]}>
                    <Ionicons name="document-text" size={28} color={isMyMessage ? '#fff' : colors.primary} />
                    <Text style={[styles.pdfText, isMyMessage ? styles.myMessageText : { color: colors.text }]}>
                      PDF
                    </Text>
                    <Ionicons name="open-outline" size={16} color={isMyMessage ? 'rgba(255,255,255,0.7)' : colors.textSecondary} />
                  </View>
                  <Text style={[styles.mediaTapHint, { color: isMyMessage ? 'rgba(255,255,255,0.5)' : colors.textSecondary }]}>
                    {isAr ? 'اضغط لفتح · اضغط مطولاً لمشاركة' : 'Tap to open · Long press to share'}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {/* الوقت والتاريخ */}
              <View style={styles.timeRow}>
                {isMyMessage && (
                  <Ionicons
                    name={item.isRead ? 'checkmark-done' : 'checkmark'}
                    size={13}
                    color={item.isRead ? '#a8d8ff' : 'rgba(255,255,255,0.6)'}
                    style={{ marginRight: 3 }}
                  />
                )}
                <Text style={[styles.timeText, isMyMessage ? styles.myTimeText : [styles.theirTimeText, { color: colors.textSecondary }]]}>
                  {formatTime(item.sentAt)}
                </Text>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="headset-outline" size={64} color={colors.textSecondary} style={{ opacity: 0.5 }} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {isAr ? 'ابدأ محادثة مع الدعم الفني' : 'Start a conversation with Support'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {isAr
          ? 'فريقنا متاح للإجابة على جميع استفساراتك'
          : 'Our team is available to answer all your inquiries'}
      </Text>
    </View>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* ── Header ── */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name={isAr ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={[styles.headerAvatar, { backgroundColor: colors.primary + '22' }]}>
              <Ionicons name="headset" size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>{headerTitle}</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {isAr ? 'متاح لمساعدتك' : 'Available to help'}
              </Text>
            </View>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* ── Messages List ── */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages ?? []}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={[
              styles.messagesList,
              (!messages || messages.length === 0) && styles.messagesListEmpty,
            ]}
            ListEmptyComponent={renderEmptyState}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* ── Sending indicator ── */}
        {(uploadMutation.isPending || sendMessageMutation.isPending) && (
          <View style={[styles.uploadingContainer, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.uploadingText, { color: colors.textSecondary }]}>
              {isAr ? 'جاري الإرسال...' : 'Sending...'}
            </Text>
          </View>
        )}

        {/* ── Input Bar ── */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.attachButton} onPress={handleAttachDocument}>
            <Ionicons name="document-attach-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.attachButton} onPress={handleAttachImage}>
            <Ionicons name="image-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            placeholder={isAr ? 'اكتب رسالة...' : 'Type a message...'}
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            textAlign={isAr ? 'right' : 'left'}
          />

          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary }, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sendMessageMutation.isPending}
          >
            <Ionicons name="send" size={18} color="#fff" style={isAr ? { transform: [{ scaleX: -1 }] } : undefined} />
          </TouchableOpacity>
        </View>

        {/* ── Image Viewer Modal ── */}
        <Modal visible={!!viewerImage} transparent animationType="fade" onRequestClose={() => setViewerImage(null)}>
          <View style={styles.viewerOverlay}>
            <StatusBar barStyle="light-content" />
            {/* Top bar */}
            <SafeAreaView edges={['top']} style={styles.viewerTopBar}>
              <TouchableOpacity onPress={() => setViewerImage(null)} style={styles.viewerBtn}>
                <Ionicons name="close" size={26} color="#fff" />
              </TouchableOpacity>
              <View style={styles.viewerActions}>
                <TouchableOpacity onPress={handleShareImage} style={styles.viewerBtn}>
                  <Ionicons name="share-outline" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveImage} style={styles.viewerBtn} disabled={savingImage}>
                  {savingImage ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="download-outline" size={24} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </SafeAreaView>
            {/* Image */}
            {viewerImage && (
              <Image
                source={{ uri: viewerImage }}
                style={styles.viewerImage}
                resizeMode="contain"
              />
            )}
            {/* Bottom hint */}
            <SafeAreaView edges={['bottom']} style={styles.viewerBottomBar}>
              <Text style={styles.viewerHintText}>
                {isAr ? 'اضغط على أيقونة التحميل لحفظ الصورة' : 'Tap download icon to save image'}
              </Text>
            </SafeAreaView>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  backButton: {
    padding: 6,
    width: 40,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  messagesList: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  messagesListEmpty: {
    justifyContent: 'center',
  },

  // Date separator
  dateSeparatorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 8,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
  },
  dateSeparatorText: {
    fontSize: 12,
    paddingHorizontal: 8,
    fontWeight: '500',
  },

  // Bubble
  bubbleWrap: {
    marginBottom: 10,
  },
  bubbleWrapRight: {
    alignItems: 'flex-end',
  },
  bubbleWrapLeft: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginHorizontal: 4,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    borderRadius: 18,
  },
  myMessage: {
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {},

  // Time row
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
  },
  myTimeText: {
    color: 'rgba(255,255,255,0.7)',
  },
  theirTimeText: {},

  // Attachments
  imageAttachment: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginTop: 6,
    marginBottom: 2,
  },
  pdfContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  pdfText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mediaOverlayHint: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaTapHint: {
    fontSize: 10,
    marginTop: 3,
    textAlign: 'center',
  },

  // Image viewer modal
  viewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 10,
  },
  viewerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  viewerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.7,
  },
  viewerBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 16,
  },
  viewerHintText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },

  // Input bar
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 4,
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 1,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },

  // Uploading
  uploadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  uploadingText: {
    fontSize: 12,
  },
});
