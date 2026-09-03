import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  I18nManager,
  Linking,
} from 'react-native';
import { useAds, Ad } from '../../hooks/useAds';
import api from '../../lib/axios';

const { width: SCREEN_W } = Dimensions.get('window');
const PRIMARY = '#1a5fa8';

export function AdCarousel() {
  const { data: ads, isLoading } = useAds();
  const [activeIdx, setActiveIdx] = useState(0);
  const flatRef = useRef<FlatList>(null);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_W - 32));
    setActiveIdx(idx);
  }, []);

  const handlePress = (ad: Ad) => {
    // Record view in the background
    api.post(`/ads/${ad.id}/view`).catch(() => {});
    
    // Open link if exists
    if (ad.linkUrl) {
      Linking.openURL(ad.linkUrl).catch(() => {});
    }
  };

  if (isLoading || !ads || ads.length === 0) {
    return null; // Do not render anything if loading or empty
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatRef}
        data={ads}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        inverted={I18nManager.isRTL}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.slide}
            onPress={() => handlePress(item)}
          >
            {item.mediaUrls?.[0] && (
              <Image 
                source={{ uri: item.mediaUrls[0] }} 
                style={styles.image} 
                resizeMode="cover" 
              />
            )}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>إعلان</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      
      {/* Dot indicators */}
      {ads.length > 1 && (
        <View style={styles.dots}>
          {ads.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIdx && styles.dotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  slide: {
    width: SCREEN_W - 32,
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e5e7eb', // placeholder color while image loads
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#374151',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d1d5db',
  },
  dotActive: {
    backgroundColor: PRIMARY,
    width: 16,
  },
});
