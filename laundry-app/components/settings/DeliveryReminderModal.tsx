import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import api from '../../lib/axios';
import { useThemeStore } from '../../stores/themeStore';
import { useLaundryStore, DeliveryReminderPrefs } from '../../stores/laundryStore';
import { useUpdateNotificationPrefs } from '../../hooks/useSettings';

// Helper to safely load expo-notifications without crashing in Expo Go on Android (SDK 53+)
const getExpoNotifications = async () => {
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  if (isExpoGo && Platform.OS === 'android') {
    return null;
  }
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
};

type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'checking';

interface DeliveryReminderModalProps {
  visible: boolean;
  onClose: () => void;
}

const HOUR_PRESETS = [1, 2, 3, 5, 8, 12, 24];
const DAY_PRESETS = [1, 2, 3, 5, 7];

export const DeliveryReminderModal: React.FC<DeliveryReminderModalProps> = ({
  visible,
  onClose,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const { colors, themeMode } = useThemeStore();
  const { notificationPrefs } = useLaundryStore();
  const updatePrefsMutation = useUpdateNotificationPrefs();

  const [enabled, setEnabled] = useState(false);
  const [hoursEnabled, setHoursEnabled] = useState(true);
  const [hours, setHours] = useState(5);
  const [daysEnabled, setDaysEnabled] = useState(true);
  const [days, setDays] = useState(1);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('checking');
  const [isSendingTest, setIsSendingTest] = useState(false);

  // ── Helper to setup Android channels ──────────────────────────────────────
  const setupAndroidChannel = async () => {
    if (Platform.OS === 'android') {
      try {
        const Notifications = await getExpoNotifications();
        if (!Notifications) return;
        await Notifications.setNotificationChannelAsync('delivery_reminders', {
          name: 'تنبيهات مواعيد التسليم',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2563eb',
        });
        await Notifications.setNotificationChannelAsync('default', {
          name: 'الإشعارات العامة',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2563eb',
        });
      } catch (err) {
        console.warn('Channel setup error:', err);
      }
    }
  };

  // ── Check permission status on open ───────────────────────────────────────
  const checkPermissions = useCallback(async () => {
    setPermissionStatus('checking');
    try {
      const Notifications = await getExpoNotifications();
      if (!Notifications) {
        setPermissionStatus('granted');
        return;
      }
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status as PermissionStatus);
    } catch {
      setPermissionStatus('undetermined');
    }
  }, []);

  // Sync state when modal opens or store changes
  useEffect(() => {
    if (!visible) return;
    checkPermissions();
    if (notificationPrefs?.deliveryReminder) {
      setEnabled(notificationPrefs.deliveryReminder.enabled ?? false);
      setHoursEnabled(notificationPrefs.deliveryReminder.hoursEnabled ?? true);
      setHours(notificationPrefs.deliveryReminder.hours ?? 5);
      setDaysEnabled(notificationPrefs.deliveryReminder.daysEnabled ?? true);
      setDays(notificationPrefs.deliveryReminder.days ?? 1);
    } else {
      setEnabled(false);
      setHoursEnabled(true);
      setHours(5);
      setDaysEnabled(true);
      setDays(1);
    }
  }, [visible, notificationPrefs]);

  // ── Handle enabling toggle with permission check ───────────────────────────
  const handleEnableToggle = async (val: boolean) => {
    if (!val) {
      // Disabling: turn off and clear any scheduled local notifications
      setEnabled(false);
      try {
        const { cancelAllDeliveryReminders } = await import('../../services/deliveryReminderService');
        await cancelAllDeliveryReminders();
      } catch {
        // ignore
      }
      return;
    }

    // Enabling: make sure notifications are permitted
    try {
      const { requestNotificationPermissions, setupNotificationChannels, getExpoNotifications } = await import(
        '../../services/deliveryReminderService'
      );
      await setupNotificationChannels();

      const granted = await requestNotificationPermissions();
      setPermissionStatus(granted ? 'granted' : 'denied');

      if (granted) {
        setEnabled(true);
        const Notifications = await getExpoNotifications();
        // Show immediate local confirmation notification so user knows notifications work
        try {
          await Notifications?.scheduleNotificationAsync({
            content: {
              title: t('settings.deliveryReminder.enabledSuccessTitle', 'تنبيهات مواعيد التسليم مفعّلة ⏰'),
              body: t(
                'settings.deliveryReminder.enabledSuccessBody',
                'تم تفعيل التنبيهات بنجاح. ستتلقى إشعارات تلقائية قبل مواعيد التسليم.'
              ),
              sound: 'default',
            },
            trigger: null,
          });
        } catch {
          // ignore
        }
      } else {
        // User denied — inform & offer to open settings
        Alert.alert(
          t('settings.deliveryReminder.permissionDenied', 'إشعارات الجهاز مُعطَّلة'),
          t(
            'settings.deliveryReminder.permissionDeniedDesc',
            'لتلقّي تنبيهات مواعيد التسليم يجب السماح بالإشعارات من إعدادات الجهاز.'
          ),
          [
            { text: t('common.cancel', 'إلغاء'), style: 'cancel' },
            { text: t('settings.openSettings', 'فتح الإعدادات'), onPress: () => Linking.openSettings() },
          ],
        );
        setEnabled(false);
      }
    } catch {
      setEnabled(false);
    }
  };

  // ── Send Test Notification ────────────────────────────────────────────────
  const handleSendTestNotification = async () => {
    setIsSendingTest(true);
    try {
      const { sendTestDeliveryNotification } = await import('../../services/deliveryReminderService');
      await sendTestDeliveryNotification(hours, days, hoursEnabled && !daysEnabled);
      Alert.alert(
        t('common.success', 'نجاح'),
        t('settings.deliveryReminder.testSent', 'تم إرسال إشعار تجريبي بنجاح')
      );
    } catch (err: any) {
      console.warn('Test notification error:', err);
      if (err?.message === 'PERMISSION_NOT_GRANTED') {
        Alert.alert(
          t('common.error', 'تنبيه'),
          t('settings.deliveryReminder.permissionDeniedDesc', 'يرجى تفعيل صلاحية الإشعارات أولاً لإرسال إشعار تجريبي.')
        );
      } else {
        Alert.alert(
          t('common.info', 'تنبيه'),
          'اختبار الإشعارات غير مدعوم داخل تطبيق Expo Go على نظام أندرويد في هذا الإصدار (يتطلب تطبيق Development Build).'
        );
      }
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleStepHours = (step: number) => {
    setHours((prev) => {
      const next = prev + step;
      return next < 1 ? 1 : next > 72 ? 72 : next;
    });
  };

  const handleStepDays = (step: number) => {
    setDays((prev) => {
      const next = prev + step;
      return next < 1 ? 1 : next > 30 ? 30 : next;
    });
  };

  const handleSave = () => {
    const reminderPrefs: DeliveryReminderPrefs = {
      enabled,
      hoursEnabled,
      hours: Math.max(1, Math.min(72, hours || 1)),
      daysEnabled,
      days: Math.max(1, Math.min(30, days || 1)),
    };

    const newPrefs = {
      ...(notificationPrefs || {
        newBooking: true,
        invoiceStatus: true,
        paymentReceived: true,
        systemAlerts: true,
      }),
      deliveryReminder: reminderPrefs,
    };

    updatePrefsMutation.mutate(newPrefs as any, {
      onSuccess: () => {
        Alert.alert(
          t('common.success', 'نجاح'),
          t('settings.deliveryReminder.savedSuccess')
        );
        onClose();
      },
      onError: () => {
        Alert.alert(
          t('common.error', 'خطأ'),
          t('common.unknownError', 'حدث خطأ أثناء حفظ الإعدادات')
        );
      },
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.sheet, { backgroundColor: colors.surface }]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleWrap}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + '18' }]}>
                <Ionicons name="alarm-outline" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>
                  {t('settings.deliveryReminder.title')}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {t('settings.deliveryReminder.subtitle')}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surface2 }]}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* Permission Status Banner */}
            {permissionStatus === 'denied' && (
              <TouchableOpacity
                onPress={() => Linking.openSettings()}
                style={styles.permissionBanner}
                activeOpacity={0.8}
              >
                <Ionicons name="warning-outline" size={18} color="#b45309" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.permissionBannerTitle}>إشعارات الجهاز مُعطَّلة</Text>
                  <Text style={styles.permissionBannerDesc}>اضغط هنا لفتح إعدادات الجهاز وتفعيلها</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#b45309" />
              </TouchableOpacity>
            )}
            {permissionStatus === 'granted' && enabled && (
              <View style={styles.permissionGrantedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#15803d" />
                <Text style={styles.permissionGrantedText}>الإشعارات مفعّلة ✓</Text>
              </View>
            )}

            {/* Master Toggle */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface2,
                  borderColor: enabled ? colors.primary + '50' : colors.border,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t('settings.deliveryReminder.enableAll')}
                  </Text>
                  <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                    {t('settings.deliveryReminder.enableAllDesc')}
                  </Text>
                </View>
                <Switch
                  value={enabled}
                  onValueChange={handleEnableToggle}
                  trackColor={{ false: colors.border, true: colors.primary + '80' }}
                  thumbColor={enabled ? colors.primary : colors.surface}
                />
              </View>
            </View>

            {enabled && (
              <>
                {/* ── 1. تنبيه بالساعات ── */}
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface2,
                      borderColor: hoursEnabled ? colors.primary + '40' : colors.border,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.rowTitleWrap}>
                      <View style={[styles.pillIcon, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name="time-outline" size={18} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>
                          {t('settings.deliveryReminder.hoursSection')}
                        </Text>
                        <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                          {t('settings.deliveryReminder.hoursDesc')}
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={hoursEnabled}
                      onValueChange={setHoursEnabled}
                      trackColor={{ false: colors.border, true: colors.primary + '80' }}
                      thumbColor={hoursEnabled ? colors.primary : colors.surface}
                    />
                  </View>

                  {hoursEnabled && (
                    <View style={styles.controlBox}>
                      <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>
                        {t('settings.deliveryReminder.hoursLabel', { hours })}
                      </Text>

                      {/* Stepper */}
                      <View style={styles.stepperContainer}>
                        <TouchableOpacity
                          style={[styles.stepperBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                          onPress={() => handleStepHours(-1)}
                          disabled={hours <= 1}
                        >
                          <Ionicons
                            name="remove"
                            size={20}
                            color={hours <= 1 ? colors.textMuted : colors.text}
                          />
                        </TouchableOpacity>

                        <View style={[styles.stepperValueBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                          <TextInput
                            style={[styles.stepperInput, { color: colors.text }]}
                            keyboardType="number-pad"
                            value={String(hours)}
                            onChangeText={(val) => {
                              const n = parseInt(val, 10);
                              if (!isNaN(n)) setHours(Math.max(1, Math.min(72, n)));
                              else if (val === '') setHours(1);
                            }}
                            maxLength={2}
                          />
                          <Text style={[styles.unitText, { color: colors.textSecondary }]}>
                            {hours > 1 && hours < 11
                              ? t('settings.deliveryReminder.hoursUnit')
                              : t('settings.deliveryReminder.hourUnit')}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={[styles.stepperBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                          onPress={() => handleStepHours(1)}
                          disabled={hours >= 72}
                        >
                          <Ionicons
                            name="add"
                            size={20}
                            color={hours >= 72 ? colors.textMuted : colors.text}
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Presets */}
                      <View style={styles.presetsRow}>
                        {HOUR_PRESETS.map((p) => {
                          const isSelected = hours === p;
                          return (
                            <TouchableOpacity
                              key={`hour-${p}`}
                              style={[
                                styles.presetChip,
                                {
                                  backgroundColor: isSelected ? colors.primary : colors.surface,
                                  borderColor: isSelected ? colors.primary : colors.border,
                                },
                              ]}
                              onPress={() => setHours(p)}
                            >
                              <Text
                                style={[
                                  styles.presetChipText,
                                  { color: isSelected ? '#fff' : colors.text },
                                ]}
                              >
                                {p} {t('settings.deliveryReminder.hourUnit')}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>

                {/* ── 2. تنبيه بالأيام ── */}
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface2,
                      borderColor: daysEnabled ? colors.primary + '40' : colors.border,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.rowTitleWrap}>
                      <View style={[styles.pillIcon, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>
                          {t('settings.deliveryReminder.daysSection')}
                        </Text>
                        <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                          {t('settings.deliveryReminder.daysDesc')}
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={daysEnabled}
                      onValueChange={setDaysEnabled}
                      trackColor={{ false: colors.border, true: colors.primary + '80' }}
                      thumbColor={daysEnabled ? colors.primary : colors.surface}
                    />
                  </View>

                  {daysEnabled && (
                    <View style={styles.controlBox}>
                      <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>
                        {t('settings.deliveryReminder.daysLabel', { days })}
                      </Text>

                      {/* Stepper */}
                      <View style={styles.stepperContainer}>
                        <TouchableOpacity
                          style={[styles.stepperBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                          onPress={() => handleStepDays(-1)}
                          disabled={days <= 1}
                        >
                          <Ionicons
                            name="remove"
                            size={20}
                            color={days <= 1 ? colors.textMuted : colors.text}
                          />
                        </TouchableOpacity>

                        <View style={[styles.stepperValueBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                          <TextInput
                            style={[styles.stepperInput, { color: colors.text }]}
                            keyboardType="number-pad"
                            value={String(days)}
                            onChangeText={(val) => {
                              const n = parseInt(val, 10);
                              if (!isNaN(n)) setDays(Math.max(1, Math.min(30, n)));
                              else if (val === '') setDays(1);
                            }}
                            maxLength={2}
                          />
                          <Text style={[styles.unitText, { color: colors.textSecondary }]}>
                            {days > 1 && days < 11
                              ? t('settings.deliveryReminder.daysUnit')
                              : t('settings.deliveryReminder.dayUnit')}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={[styles.stepperBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                          onPress={() => handleStepDays(1)}
                          disabled={days >= 30}
                        >
                          <Ionicons
                            name="add"
                            size={20}
                            color={days >= 30 ? colors.textMuted : colors.text}
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Presets */}
                      <View style={styles.presetsRow}>
                        {DAY_PRESETS.map((p) => {
                          const isSelected = days === p;
                          return (
                            <TouchableOpacity
                              key={`day-${p}`}
                              style={[
                                styles.presetChip,
                                {
                                  backgroundColor: isSelected ? colors.primary : colors.surface,
                                  borderColor: isSelected ? colors.primary : colors.border,
                                },
                              ]}
                              onPress={() => setDays(p)}
                            >
                              <Text
                                style={[
                                  styles.presetChipText,
                                  { color: isSelected ? '#fff' : colors.text },
                                ]}
                              >
                                {p} {t('settings.deliveryReminder.dayUnit')}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>

                {/* ── Notification Preview Card ── */}
                {(hoursEnabled || daysEnabled) && (
                  <View style={[styles.previewCard, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                    <View style={styles.previewHeader}>
                      <Ionicons name="notifications" size={16} color={colors.primary} />
                      <Text style={[styles.previewTitle, { color: colors.textSecondary }]}>
                        {t('settings.deliveryReminder.preview')}
                      </Text>
                    </View>

                    {hoursEnabled && (
                      <View style={[styles.previewBubble, { backgroundColor: colors.surface }]}>
                        <View style={styles.previewBubbleHeader}>
                          <Text style={[styles.previewBubbleTitle, { color: colors.text }]}>
                            {t('settings.deliveryReminder.previewHoursTitle')}
                          </Text>
                          <Text style={[styles.previewTime, { color: colors.textMuted }]}>
                            {hours} {t('settings.deliveryReminder.hourUnit')}
                          </Text>
                        </View>
                        <Text style={[styles.previewBubbleBody, { color: colors.textSecondary }]}>
                          {t('settings.deliveryReminder.previewHoursBody', { hours })}
                        </Text>
                      </View>
                    )}

                    {daysEnabled && (
                      <View
                        style={[
                          styles.previewBubble,
                          { backgroundColor: colors.surface, marginTop: hoursEnabled ? 8 : 0 },
                        ]}
                      >
                        <View style={styles.previewBubbleHeader}>
                          <Text style={[styles.previewBubbleTitle, { color: colors.text }]}>
                            {t('settings.deliveryReminder.previewDaysTitle')}
                          </Text>
                          <Text style={[styles.previewTime, { color: colors.textMuted }]}>
                            {days} {t('settings.deliveryReminder.dayUnit')}
                          </Text>
                        </View>
                        <Text style={[styles.previewBubbleBody, { color: colors.textSecondary }]}>
                          {t('settings.deliveryReminder.previewDaysBody', { days })}
                        </Text>
                      </View>
                    )}

                    {/* Test notification button */}
                    <TouchableOpacity
                      style={[
                        styles.testBtn,
                        { borderColor: colors.primary, backgroundColor: colors.surface },
                        isSendingTest && styles.disabledBtn,
                      ]}
                      onPress={handleSendTestNotification}
                      disabled={isSendingTest}
                      activeOpacity={0.8}
                    >
                      {isSendingTest ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <View style={styles.testBtnContent}>
                          <Ionicons name="paper-plane-outline" size={18} color={colors.primary} />
                          <Text style={[styles.testBtnText, { color: colors.primary }]}>
                            {t('settings.deliveryReminder.testNotification')}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Footer Save Button */}
          <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: colors.primary },
                updatePrefsMutation.isPending && styles.disabledBtn,
              ]}
              onPress={handleSave}
              disabled={updatePrefsMutation.isPending}
              activeOpacity={0.8}
            >
              {updatePrefsMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.saveBtnContent}>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.saveBtnText}>
                    {t('settings.deliveryReminder.saveSettings')}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBody: {
    padding: 20,
    paddingBottom: 20,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  permissionBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
  },
  permissionBannerDesc: {
    fontSize: 12,
    color: '#b45309',
    marginTop: 2,
  },
  permissionGrantedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 6,
    alignSelf: 'flex-start',
  },
  permissionGrantedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderText: {
    flex: 1,
    paddingRight: 12,
  },
  rowTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    paddingRight: 10,
  },
  pillIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  controlBox: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150,150,150,0.2)',
  },
  controlLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 14,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValueBox: {
    minWidth: 110,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 4,
  },
  stepperInput: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 0,
    minWidth: 30,
  },
  unitText: {
    fontSize: 13,
    fontWeight: '600',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  previewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  previewBubble: {
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  previewBubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  previewBubbleTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  previewTime: {
    fontSize: 11,
  },
  previewBubbleBody: {
    fontSize: 12,
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  testBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
