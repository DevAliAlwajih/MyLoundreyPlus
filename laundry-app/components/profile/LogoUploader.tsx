import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useUploadLogo } from '../../hooks/useLaundryProfile';
import { useThemeStore } from '../../stores/themeStore';

interface LogoUploaderProps {
  currentLogoUrl: string | null;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({ currentLogoUrl }) => {
  const { t } = useTranslation();
  const { colors } = useThemeStore();
  const uploadMutation = useUploadLogo();
  const [localUri, setLocalUri] = useState<string | null>(null);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert('Error', 'Image exceeds 5MB limit');
        return;
      }

      setLocalUri(asset.uri);
      
      uploadMutation.mutate(asset.uri, {
        onSuccess: () => {
          Alert.alert('Success', t('profile.logoSuccess'));
        },
        onError: (err: any) => {
          Alert.alert('Error', err.response?.data?.message || t('auth.errors.default'));
          setLocalUri(null); // revert on error
        }
      });
    }
  };

  const displayUri = localUri || currentLogoUrl;
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {displayUri ? (
          <Image source={{ uri: displayUri }} style={styles.image} />
        ) : (
          <Ionicons name="business" size={50} color={colors.textMuted} />
        )}
        
        {uploadMutation.isPending && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={styles.editButton} 
        onPress={handlePickImage}
        disabled={uploadMutation.isPending}
      >
        <Ionicons name="camera" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
    position: 'relative',
    width: 100,
    alignSelf: 'center',
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
});

