import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useChatMessages, useSendMessage, useUploadChatAttachment, useMarkChatAsRead } from '../../../hooks/useChat';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  
  const [isFocused, setIsFocused] = useState(true);
  const [inputText, setInputText] = useState('');
  
  const { data: messages, isLoading, isError } = useChatMessages(id as string, isFocused);
  const sendMessageMutation = useSendMessage(id as string);
  const uploadMutation = useUploadChatAttachment();
  const markAsReadMutation = useMarkChatAsRead(id as string);
  
  const flatListRef = useRef<FlatList>(null);

  useFocusEffect(
    React.useCallback(() => {
      setIsFocused(true);
      // Mark as read when screen is focused
      if (id !== 'support') {
        markAsReadMutation.mutate();
      }
      return () => setIsFocused(false);
    }, [id])
  );

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    sendMessageMutation.mutate(
      { message: inputText.trim() },
      {
        onSuccess: () => {
          setInputText('');
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      }
    );
  };

  const handleAttachImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      handleUploadAndSend(result.assets[0].uri);
    }
  };

  const handleAttachDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        handleUploadAndSend(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Error picking document', err);
    }
  };

  const handleUploadAndSend = (uri: string) => {
    uploadMutation.mutate(uri, {
      onSuccess: (data) => {
        sendMessageMutation.mutate({
          attachmentUrl: data.url,
          attachmentType: data.type
        }, {
          onSuccess: () => {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
          }
        });
      },
      onError: (err) => {
        alert(t('common.error'));
      }
    });
  };

  const isSupport = id === 'support';
  const headerTitle = isSupport ? t('crm.supportChat') : t('crm.customerChat');

  const renderMessage = ({ item }: { item: any }) => {
    const isMine = item.senderRole === 'laundry';
    
    return (
      <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.theirMessage]}>
        {item.message ? (
          <Text style={[styles.messageText, isMine ? styles.myMessageText : styles.theirMessageText]}>
            {item.message}
          </Text>
        ) : null}
        
        {item.attachmentUrl ? (
          <View style={styles.attachmentContainer}>
            {item.attachmentType === 'pdf' ? (
              <View style={styles.pdfContainer}>
                <Ionicons name="document-text" size={32} color={isMine ? "#fff" : "#1a5fa8"} />
                <Text style={[styles.pdfText, isMine ? styles.myMessageText : styles.theirMessageText]}>
                  PDF Document
                </Text>
              </View>
            ) : (
              <Image source={{ uri: item.attachmentUrl }} style={styles.imageAttachment} resizeMode="cover" />
            )}
          </View>
        ) : null}
        
        <Text style={[styles.timeText, isMine ? styles.myTimeText : styles.theirTimeText]}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <View style={styles.placeholder} />
      </View>

      {isLoading && !messages ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1a5fa8" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages || []}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {(uploadMutation.isPending || sendMessageMutation.isPending) && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="small" color="#1a5fa8" />
          <Text style={styles.uploadingText}>{t('crm.sending')}</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton} onPress={handleAttachDocument}>
          <Ionicons name="document-attach-outline" size={24} color="#1a5fa8" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.attachButton} onPress={handleAttachImage}>
          <Ionicons name="image-outline" size={24} color="#1a5fa8" />
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          placeholder={t('crm.typeMessage')}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        
        <TouchableOpacity 
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
          onPress={handleSend}
          disabled={!inputText.trim() || sendMessageMutation.isPending}
        >
          <Ionicons name="send" size={20} color="#fff" style={{ transform: [{ scaleX: -1 }] }} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 50, // For status bar
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#1a5fa8',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
    color: '#333',
  },
  timeText: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTimeText: {
    color: 'rgba(255,255,255,0.7)',
  },
  theirTimeText: {
    color: '#999',
  },
  attachmentContainer: {
    marginTop: 4,
    marginBottom: 4,
  },
  imageAttachment: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  pdfContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
  },
  pdfText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  attachButton: {
    padding: 10,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    marginHorizontal: 8,
    textAlign: 'right',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a5fa8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#a0bce0',
  },
  uploadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  uploadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 12,
  }
});
