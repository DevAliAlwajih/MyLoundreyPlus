import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/theme';
import useInvoiceStore from '../../src/store/useInvoiceStore';

const { width } = Dimensions.get('window');

export default function ScannerScreen() {
  const { findCustomerByQR } = useInvoiceStore();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [manualId, setManualId] = useState('');

  // Dynamically import expo-camera only on native platforms
  const CameraComp = Platform.OS === 'web' ? null : (() => {
    try { return require('expo-camera'); } catch { return null; }
  })();

  useEffect(() => {
    if (Platform.OS !== 'web' && CameraComp) {
      CameraComp.Camera.requestCameraPermissionsAsync().then(({ status }) => {
        setHasPermission(status === 'granted');
      });
    }
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned || isLoading) return;
    setScanned(true);
    setIsLoading(true);
    try {
      const parsed = JSON.parse(data);
      const uniqueId = parsed.uniqueId;
      const result = await findCustomerByQR(uniqueId);
      if (result.success) {
        setCustomer(result.customer);
      } else {
        Alert.alert('خطأ', result.error, [{ text: 'حسناً', onPress: () => setScanned(false) }]);
      }
    } catch {
      Alert.alert('خطأ', 'رمز QR غير صالح', [{ text: 'حسناً', onPress: () => setScanned(false) }]);
    }
    setIsLoading(false);
  };

  if (customer) {
    return (
      <View style={styles.container}>
        <View style={styles.resultCard}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
          </View>
          <Text style={styles.resultTitle}>تم التعرف على العميل</Text>
          <Text style={styles.customerName}>{customer.full_name}</Text>
          <Text style={styles.customerId}>ID: {customer.unique_id}</Text>
          {customer.phone_number && (
            <Text style={styles.customerPhone}>📞 {customer.phone_number}</Text>
          )}
          <View style={styles.resultActions}>
            <TouchableOpacity style={[styles.resultBtn, { backgroundColor: COLORS.primary }]}>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.resultBtnText}>إنشاء فاتورة</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.resultBtn, { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border }]}
              onPress={() => { setCustomer(null); setScanned(false); }}>
              <Ionicons name="scan" size={20} color={COLORS.text} />
              <Text style={[styles.resultBtnText, { color: COLORS.text }]}>مسح مرة أخرى</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Web fallback (no camera)
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.webFallback}>
          <Ionicons name="qr-code" size={80} color={COLORS.primary} />
          <Text style={styles.webTitle}>ماسح QR Code</Text>
          <Text style={styles.webSub}>
            ماسح الـ QR يعمل على تطبيقات الجوال والتابلت فقط.{'\n'}
            يمكنك إدخال رقم العميل الفريد يدوياً:
          </Text>
          {/* Manual ID input for web */}
          <TouchableOpacity style={styles.manualBtn}>
            <Text style={styles.manualBtnText}>البحث بالرقم الفريد</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={{ color: COLORS.textSub, fontSize: 16 }}>جاري طلب إذن الكاميرا...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera-off" size={56} color={COLORS.danger} />
        <Text style={styles.permText}>لا يوجد إذن للكاميرا</Text>
        <TouchableOpacity style={styles.permBtn}
          onPress={() => CameraComp?.Camera.requestCameraPermissionsAsync()}>
          <Text style={styles.permBtnText}>منح الإذن</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { CameraView } = CameraComp || {};

  return (
    <View style={styles.container}>
      <View style={styles.scannerHeader}>
        <Text style={styles.scannerTitle}>مسح QR Code</Text>
        <Text style={styles.scannerSub}>وجّه الكاميرا نحو رمز QR الخاص بالعميل</Text>
      </View>

      <View style={styles.cameraContainer}>
        {CameraView && (
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
        )}
        {/* Scanner overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>جاري البحث عن العميل...</Text>
          </View>
        )}
      </View>

      {scanned && !isLoading && (
        <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.rescanText}>إعادة المسح</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const FRAME = width * 0.65;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  scannerHeader: { position: 'absolute', top: Platform.OS === 'ios' ? 80 : 60, alignItems: 'center', zIndex: 10 },
  scannerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 6 },
  scannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  cameraContainer: { width: '100%', height: '70%', position: 'relative' },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanFrame: {
    width: FRAME, height: FRAME, position: 'relative',
  },
  corner: {
    position: 'absolute', width: 30, height: 30,
    borderColor: COLORS.primary, borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,82,204,0.85)',
    justifyContent: 'center', alignItems: 'center',
  },
  loadingText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  rescanBtn: {
    position: 'absolute', bottom: 80, flexDirection: 'row', gap: 8,
    backgroundColor: COLORS.primary, paddingHorizontal: 24,
    paddingVertical: 14, borderRadius: 14, alignItems: 'center',
  },
  rescanText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  // Result card
  resultCard: {
    backgroundColor: COLORS.surface, borderRadius: 24, padding: 32,
    alignItems: 'center', margin: 24, width: '90%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2, shadowRadius: 40, elevation: 12,
  },
  successIcon: { marginBottom: 16 },
  resultTitle: { fontSize: 18, color: COLORS.textSub, marginBottom: 12 },
  customerName: { fontSize: 28, fontWeight: '900', color: COLORS.text, marginBottom: 6 },
  customerId: { fontSize: 13, color: COLORS.textLight, marginBottom: 4 },
  customerPhone: { fontSize: 15, color: COLORS.textSub, marginBottom: 24 },
  resultActions: { flexDirection: 'row', gap: 12, width: '100%' },
  resultBtn: {
    flex: 1, flexDirection: 'row', height: 50, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  resultBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  // Web fallback
  webFallback: { alignItems: 'center', padding: 32 },
  webTitle: { fontSize: 28, fontWeight: '900', color: '#fff', marginTop: 20, marginBottom: 10 },
  webSub: { fontSize: 15, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  manualBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 24,
    paddingVertical: 14, borderRadius: 12,
  },
  manualBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  // Permissions
  permText: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 20 },
  permBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  permBtnText: { color: '#fff', fontWeight: '700' },
});
