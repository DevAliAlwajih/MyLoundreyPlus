import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, Linking, ScrollView, Modal, FlatList, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';

import { useLaundryStore } from '../../../stores/laundryStore';
import { useUpdateProfile } from '../../../hooks/useLaundryProfile';
import { GULF_COUNTRIES } from '../../../constants/gulfCountries';
import { useThemeStore } from '../../../stores/themeStore';
import { StatusBar } from 'expo-status-bar';



type CountryType = (typeof GULF_COUNTRIES)[number];
type CityType = CountryType['cities'][number];

export default function LocationScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const isAr = i18n.language === 'ar';
  const { colors, themeMode } = useThemeStore();

  const { profile } = useLaundryStore();
  const updateMutation = useUpdateProfile();
  const mapRef = useRef<MapView>(null);

  // ─── Resolve saved values from profile ───
  const savedCountry = useMemo(() => {
    if (!profile?.country) return null;
    return GULF_COUNTRIES.find(c => c.code === profile.country) || null;
  }, [profile?.country]);

  const savedCity = useMemo(() => {
    if (!savedCountry || !profile?.city) return null;
    return savedCountry.cities.find(
      c => c.nameAr === profile.city || c.nameEn === profile.city,
    ) || null;
  }, [savedCountry, profile?.city]);

  // ─── State ───
  const [selectedCountry, setSelectedCountry] = useState<CountryType | null>(savedCountry);
  const [selectedCity, setSelectedCity] = useState<CityType | null>(savedCity);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(
    profile?.latitude && profile?.longitude
      ? { lat: Number(profile.latitude), lng: Number(profile.longitude) }
      : savedCity
        ? { lat: savedCity.lat, lng: savedCity.lng }
        : null,
  );
  const [isLocating, setIsLocating] = useState(false);

  // ─── Modals ───
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  const bothSelected = selectedCountry && selectedCity;

  // ─── Handlers ───
  const handleSelectCountry = useCallback((country: CountryType) => {
    setSelectedCountry(country);
    setSelectedCity(null);
    setMarkerPosition(null);
    setCountryModalVisible(false);
  }, []);

  const handleSelectCity = useCallback((city: CityType) => {
    setSelectedCity(city);
    setMarkerPosition({ lat: city.lat, lng: city.lng });
    setCityModalVisible(false);

    // Animate map to city center
    setTimeout(() => {
      mapRef.current?.animateToRegion({
        latitude: city.lat,
        longitude: city.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 600);
    }, 100);
  }, []);

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('profile.locationPermissionDenied'),
          '',
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('profile.openSettings'), onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const newPos = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
      setMarkerPosition(newPos);

      mapRef.current?.animateToRegion({
        latitude: newPos.lat,
        longitude: newPos.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 600);
    } catch (error) {
      console.log('Error getting location:', error);
      Alert.alert(t('common.error'), t('common.locationFailed'));
    } finally {
      setIsLocating(false);
    }
  };

  const handleMarkerDragEnd = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarkerPosition({ lat: latitude, lng: longitude });
  };

  const handleSave = () => {
    if (!selectedCountry || !selectedCity || !markerPosition) return;

    updateMutation.mutate(
      {
        country: selectedCountry.code,
        city: isAr ? selectedCity.nameAr : selectedCity.nameEn,
        latitude: markerPosition.lat,
        longitude: markerPosition.lng,
      } as any,
      {
        onSuccess: () => {
          Alert.alert(t('common.success'), t('profile.updateSuccess'), [
            { text: t('common.ok'), onPress: () => router.back() },
          ]);
        },
        onError: (err: any) => {
          Alert.alert(
            t('common.error'),
            err.response?.data?.message || t('common.updateFailed'),
          );
        },
      },
    );
  };

  // ─── Picker Label Helpers ───
  const countryLabel = selectedCountry
    ? (isAr ? selectedCountry.nameAr : selectedCountry.nameEn)
    : t('location.selectCountry');

  const cityLabel = selectedCity
    ? (isAr ? selectedCity.nameAr : selectedCity.nameEn)
    : t('location.selectCity');

  const styles = getStyles(colors);

  // ─── Render ───
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('profile.location')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>

        {/* ─── 1. Country Picker ─── */}
        <Text style={[styles.label, isRTL && styles.textRight]}>
          {t('location.country')}
        </Text>
        <TouchableOpacity
          style={[styles.pickerButton, isRTL && { flexDirection: 'row-reverse' }]}
          onPress={() => setCountryModalVisible(true)}
        >
          <Text style={[
            styles.pickerText,
            !selectedCountry && styles.pickerPlaceholder,
            isRTL && styles.textRight,
          ]}>
            {countryLabel}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* ─── 2. City Picker ─── */}
        <Text style={[styles.label, isRTL && styles.textRight, { marginTop: 16 }]}>
          {t('location.city')}
        </Text>
        <TouchableOpacity
          style={[
            styles.pickerButton,
            !selectedCountry && styles.pickerDisabled,
            isRTL && { flexDirection: 'row-reverse' },
          ]}
          onPress={() => selectedCountry && setCityModalVisible(true)}
          disabled={!selectedCountry}
        >
          <Text style={[
            styles.pickerText,
            !selectedCity && styles.pickerPlaceholder,
            !selectedCountry && { color: '#ccc' },
            isRTL && styles.textRight,
          ]}>
            {cityLabel}
          </Text>
          <Ionicons name="chevron-down" size={20} color={selectedCountry ? colors.textSecondary : colors.textMuted} />
        </TouchableOpacity>

        {/* ─── 3. GPS Button ─── */}
        {bothSelected && (
          <TouchableOpacity
            style={[styles.gpsButton, isRTL && { flexDirection: 'row-reverse' }]}
            onPress={handleUseCurrentLocation}
            disabled={isLocating}
          >
            {isLocating ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Ionicons name="locate" size={22} color={colors.primary} />
            )}
            <Text style={[styles.gpsButtonText, isRTL && { marginRight: 10, marginLeft: 0 }]}>
              {t('location.useCurrentLocation')}
            </Text>
          </TouchableOpacity>
        )}

        {/* ─── 4. Map or Placeholder ─── */}
        <View style={styles.mapWrapper}>
          {bothSelected && markerPosition ? (
            <MapView
              ref={mapRef}
              provider={undefined}
              style={styles.map}
              initialRegion={{
                latitude: markerPosition.lat,
                longitude: markerPosition.lng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            >
              <Marker
                coordinate={{
                  latitude: markerPosition.lat,
                  longitude: markerPosition.lng,
                }}
                draggable
                onDragEnd={handleMarkerDragEnd}
              />
            </MapView>
          ) : (
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map-outline" size={48} color={colors.textMuted} />
              <Text style={styles.mapPlaceholderText}>
                {t('location.selectCountryCityFirst')}
              </Text>
            </View>
          )}
        </View>

        {/* Coordinates display */}
        {markerPosition && (
          <View style={[styles.coordsRow, isRTL && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={styles.coordsText}>
              {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}
            </Text>
          </View>
        )}

      </ScrollView>

      {/* ─── 5. Save Button ─── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!bothSelected || !markerPosition) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!bothSelected || !markerPosition || updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>{t('profile.saveLocation')}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ─── Country BottomSheet Modal ─── */}
      <Modal visible={countryModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('location.selectCountry')}</Text>
              <TouchableOpacity onPress={() => setCountryModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={GULF_COUNTRIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => {
                const isSelected = selectedCountry?.code === item.code;
                return (
                  <TouchableOpacity
                    style={[styles.listItem, isSelected && styles.listItemSelected]}
                    onPress={() => handleSelectCountry(item)}
                  >
                    <Text style={[
                      styles.listItemText,
                      isSelected && styles.listItemTextSelected,
                      isRTL && styles.textRight,
                    ]}>
                      {isAr ? item.nameAr : item.nameEn}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* ─── City BottomSheet Modal ─── */}
      <Modal visible={cityModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('location.selectCity')}</Text>
              <TouchableOpacity onPress={() => setCityModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={selectedCountry?.cities || []}
              keyExtractor={(item) => item.nameEn}
              renderItem={({ item }) => {
                const isSelected = selectedCity?.nameEn === item.nameEn;
                return (
                  <TouchableOpacity
                    style={[styles.listItem, isSelected && styles.listItemSelected]}
                    onPress={() => handleSelectCity(item)}
                  >
                    <Text style={[
                      styles.listItemText,
                      isSelected && styles.listItemTextSelected,
                      isRTL && styles.textRight,
                    ]}>
                      {isAr ? item.nameAr : item.nameEn}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  textRight: {
    textAlign: 'right',
  },

  // ─── Picker ───
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
  },
  pickerDisabled: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
  },
  pickerText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  pickerPlaceholder: {
    color: colors.textMuted,
  },

  // ─── GPS Button ───
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gpsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 10,
  },

  // ─── Map ───
  mapWrapper: {
    marginTop: 20,
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface2,
  },
  mapPlaceholderText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // ─── Coords ───
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  coordsText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // ─── Footer ───
  footer: {
    padding: 20,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.border,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // ─── Modal ───
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  listItemSelected: {
    backgroundColor: colors.surface2,
  },
  listItemText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  listItemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});

