import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../../stores/themeStore';
import { useLaundryConversations, ConversationListResponse } from '../../../hooks/useChat';
import { useCustomers } from '../../../hooks/useCRM';

function formatTime(isoStr: string, isAr: boolean) {
  const date = new Date(isoStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();
  if (isYesterday) {
    return isAr ? 'أمس' : 'Yesterday';
  }
  
  return date.toLocaleDateString(isAr ? 'ar-SA' : 'en-GB', { month: 'short', day: 'numeric' });
}

export default function CustomerConversationsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors } = useThemeStore();
  const isAr = i18n.language === 'ar';

  const { data: conversations, isLoading, refetch, isRefetching } = useLaundryConversations();

  // Modal State for New Chat
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: customersList, isLoading: isLoadingCustomers } = useCustomers(searchQuery, false);

  const startNewChat = (customerId: string) => {
    // التحقق مما إذا كان المعرف هو UUID (حساب حقيقي) وليس مجرد رقم هاتف (عميل محلي)
    const isUUID = customerId.length === 36 && customerId.includes('-');
    if (!isUUID) {
      alert(isAr ? 'هذا العميل غير مسجل في التطبيق ولا يمكن محادثته.' : 'This customer is not registered in the app and cannot be chatted with.');
      return;
    }
    
    setModalVisible(false);
    router.push(`/conversation-modal/${customerId}`);
  };

  const renderConversationItem = ({ item }: { item: ConversationListResponse }) => {
    return (
      <TouchableOpacity
        style={[styles.chatItem, { backgroundColor: colors.surface }]}
        onPress={() => router.push(`/conversation-modal/${item.id}`)}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary + '22' }]}>
          {item.customer.avatarUrl ? (
            <Ionicons name="person" size={24} color={colors.primary} /> // Can be replaced with Image
          ) : (
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {item.customer.fullName?.charAt(0) || '?'}
            </Text>
          )}
        </View>
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatName, { color: colors.text }]} numberOfLines={1}>
              {item.customer.fullName || 'عميل مجهول'}
            </Text>
            <Text style={[styles.chatTime, { color: item.unreadCount > 0 ? colors.primary : colors.textSecondary }]}>
              {formatTime(item.lastMessage.sentAt, isAr)}
            </Text>
          </View>
          <View style={styles.chatMessageRow}>
            <Text
              style={[
                styles.chatMessage,
                { color: item.unreadCount > 0 ? colors.text : colors.textSecondary },
                item.unreadCount > 0 && { fontWeight: 'bold' }
              ]}
              numberOfLines={1}
            >
              {item.lastMessage.attachmentUrl
                ? (item.lastMessage.attachmentType === 'pdf' ? (isAr ? '📄 ملف PDF' : '📄 PDF Document') : (isAr ? '📷 صورة' : '📷 Image'))
                : item.lastMessage.message}
            </Text>
            {item.unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={60} color={colors.textSecondary} style={{ opacity: 0.5 }} />
      <Text style={[styles.emptyText, { color: colors.text }]}>
        {isAr ? 'لا توجد محادثات' : 'No conversations'}
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
        {isAr ? 'اضغط على زر الإضافة أدناه لبدء محادثة جديدة' : 'Tap the add button below to start a new chat'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name={isAr ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isAr ? 'محادثات العملاء' : 'Customer Chats'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading && !isRefetching ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          contentContainerStyle={[
            styles.listContainer,
            (!conversations || conversations.length === 0) && styles.emptyContainer,
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshing={isRefetching}
          onRefresh={refetch}
        />
      )}

      {/* FAB to start new chat */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="chatbox-ellipses" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Select Customer Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isAr ? 'اختر عميلاً' : 'Select Customer'}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={[styles.searchBox, { backgroundColor: colors.background }]}>
              <Ionicons name="search" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={isAr ? 'ابحث عن عميل...' : 'Search for a customer...'}
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                textAlign={isAr ? 'right' : 'left'}
              />
            </View>

            {isLoadingCustomers ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={customersList}
                keyExtractor={(item, index) => item.customerId || `cust-${index}`}
                contentContainerStyle={{ paddingVertical: 10 }}
                renderItem={({ item }: any) => (
                  <TouchableOpacity
                    style={[styles.customerItem, { borderBottomColor: colors.border }]}
                    onPress={() => item.customerId && startNewChat(item.customerId)}
                  >
                    <View style={[styles.avatarSmall, { backgroundColor: colors.primary + '22' }]}>
                      <Text style={[styles.avatarSmallText, { color: colors.primary }]}>
                        {item.customerName?.charAt(0) || item.customerPhone?.charAt(0) || '?'}
                      </Text>
                    </View>
                    <View style={{ flex: 1, alignItems: isAr ? 'flex-end' : 'flex-start' }}>
                      <Text style={[styles.customerName, { color: colors.text }]}>{item.customerName || 'عميل محلي'}</Text>
                      <Text style={[styles.customerPhone, { color: colors.textSecondary }]}>{item.customerPhone}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={[styles.emptySubtext, { color: colors.textSecondary, marginTop: 20, textAlign: 'center' }]}>
                    {isAr ? 'لم يتم العثور على عملاء' : 'No customers found'}
                  </Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  chatContent: {
    flex: 1,
    marginLeft: 14,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
    textAlign: 'left',
  },
  chatTime: {
    fontSize: 12,
  },
  chatMessageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatMessage: {
    fontSize: 14,
    flex: 1,
    marginRight: 10,
    textAlign: 'left',
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  customerItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  avatarSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarSmallText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 13,
  },
});
