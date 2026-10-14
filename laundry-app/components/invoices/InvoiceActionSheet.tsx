import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useThemeStore } from '../../stores/themeStore';
import { useLaundryStore } from '../../stores/laundryStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { APP_LOGO_BASE64 } from '../../constants/AppLogoBase64';

const SHEET_HEIGHT = 260;

interface InvoiceActionSheetProps {
  visible: boolean;
  invoiceData: any;
  onClose: () => void;
}

export function InvoiceActionSheet({ visible, invoiceData, onClose }: InvoiceActionSheetProps) {
  const { colors } = useThemeStore();
  const laundry = useLaundryStore((s) => s.profile);
  const { currency } = useCurrencyStore();

  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: SHEET_HEIGHT, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  // ── دوال مساعدة ──────────────────────────────────────────────────────────

  const fetchLogoBase64 = async (url: string): Promise<string> => {
    try {
      const localPath = `${FileSystem.cacheDirectory}logo_cache.jpg`;
      const downloadResult = await FileSystem.downloadAsync(url, localPath);
      if (downloadResult.status !== 200) return APP_LOGO_BASE64;
      const base64Data = await FileSystem.readAsStringAsync(downloadResult.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const ext  = url.split('?')[0].split('.').pop()?.toLowerCase() || 'jpeg';
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      return `data:${mime};base64,${base64Data}`;
    } catch {
      return APP_LOGO_BASE64;
    }
  };

  const generateInvoiceHTML = (logoSrc: string): string => {
    if (!invoiceData) return '';

    const subtotal  = Number(invoiceData.subtotal       ?? 0);
    const discount  = Number(invoiceData.discountAmount  ?? 0);
    const tax       = Number(invoiceData.taxAmount       ?? 0);
    const total     = Number(invoiceData.total           ?? 0);

    const deliveryDate = invoiceData.expectedDeliveryAt
      ? new Date(invoiceData.expectedDeliveryAt).toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' })
      : new Date(invoiceData.createdAt || Date.now()).toLocaleDateString('ar-EG',  { year: 'numeric', month: '2-digit', day: '2-digit' });

    const paymentLabel =
      invoiceData.paymentType === 'cash'         ? 'نقدي'
      : invoiceData.paymentType === 'card'       ? 'بطاقة'
      : invoiceData.paymentType === 'deferred'   ? 'آجل'
      : invoiceData.paymentType === 'electronic' ? 'إلكتروني'
      : (invoiceData.paymentType || '');

    const laundryCity     = laundry?.city        || '';
    const laundryAddress  = laundry?.address     || '';
    const laundryPhone    = laundry?.phoneNumber || '';
    const laundryLocation = [laundryCity, laundryAddress].filter(Boolean).join(' - ');
    const currSymbol      = useCurrencyStore.getState().currency.symbol;
    const items: any[]    = invoiceData.items || [];

    return `
      <html dir="rtl">
        <head>
          <meta charset="utf-8" />
          <style>
            @page { size: 80mm auto; margin: 4mm; }
            * { box-sizing: border-box; }
            body { margin:0; padding:0; background:#fff; color:#111; font-family: Arial, Helvetica, sans-serif; }
            .sheet { width:80mm; max-width:80mm; margin:0 auto; padding:4mm 3mm 5mm; }
            .center { text-align:center; }
            .logo-wrap { display:flex; justify-content:center; align-items:center; margin-bottom:5px; }
            .logo { width:52px; height:52px; border-radius:12px; object-fit:cover; background:transparent; border:1px solid #eee; }
            .brand-name { font-size:19px; font-weight:800; margin:4px 0 2px; line-height:1.2; }
            .laundry-info { font-size:8.5px; color:#555; line-height:1.5; margin:2px 0 0; }
            .divider { border-top:1px solid #111; margin:8px 0 7px; }
            .meta { display:grid; grid-template-columns:1fr 1fr; gap:4px 8px; font-size:9px; line-height:1.4; }
            .meta-box { display:flex; flex-direction:column; }
            .meta-label { color:#666; font-size:8px; margin-bottom:2px; }
            .meta-value { font-weight:700; word-break:break-word; }
            table { width:100%; border-collapse:collapse; margin-top:8px; font-size:8.5px; }
            th, td { border-bottom:1px dashed #666; padding:3px 2px; text-align:center; vertical-align:top; }
            th { font-size:8px; font-weight:700; color:#111; }
            th:first-child, td:first-child { text-align:right; }
            td:first-child { width:40%; }
            .totals { width:100%; margin-top:8px; font-size:9px; }
            .line { display:flex; justify-content:space-between; padding:2px 0; border-bottom:1px solid #eee; }
            .grand { font-size:11px; font-weight:700; border-top:1px solid #111; border-bottom:none; margin-top:4px; padding-top:4px; }
            .notes { margin-top:8px; font-size:8.5px; line-height:1.5; border-top:1px dashed #666; padding-top:6px; }
            .footer { margin-top:10px; text-align:center; font-size:8.5px; line-height:1.6; border-top:1px dashed #999; padding-top:6px; }
            .footer-brand { margin-top:6px; font-weight:700; }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="center">
              ${logoSrc ? `<div class="logo-wrap"><img src="${logoSrc}" class="logo" alt="logo" /></div>` : ''}
              <p class="brand-name">${laundry?.name || 'المغسلة'}</p>
              ${laundryLocation ? `<p class="laundry-info">📍 ${laundryLocation}</p>` : ''}
              ${laundryPhone    ? `<p class="laundry-info">📞 ${laundryPhone}</p>`    : ''}
            </div>
            <div class="divider"></div>
            <div class="meta">
              <div class="meta-box"><span class="meta-label">رقم الفاتورة</span><span class="meta-value">#${invoiceData.invoiceNumber || ''}</span></div>
              <div class="meta-box"><span class="meta-label">تاريخ التسليم</span><span class="meta-value">${deliveryDate}</span></div>
              <div class="meta-box"><span class="meta-label">اسم العميل</span><span class="meta-value">${invoiceData.customerName || '-'}</span></div>
              <div class="meta-box"><span class="meta-label">نوع الدفع</span><span class="meta-value">${paymentLabel}</span></div>
              <div class="meta-box" style="grid-column:1 / -1;"><span class="meta-label">رقم العميل</span><span class="meta-value">${invoiceData.customerPhone || '-'}</span></div>
            </div>
            <table>
              <thead><tr><th style="text-align:right;">الصنف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
              <tbody>
                ${items.map((item: any) => {
                  const lineTotal = Number(item.unitPrice ?? 0) * Number(item.quantity ?? 0);
                  return `<tr><td>${item.itemNameAr || item.itemName || 'صنف'}</td><td>${Number(item.quantity ?? 0)}</td><td>${Number(item.unitPrice ?? 0).toFixed(2)}</td><td>${lineTotal.toFixed(2)}</td></tr>`;
                }).join('')}
              </tbody>
            </table>
            <div class="totals">
              <div class="line"><span>المجموع الفرعي</span><span>${subtotal.toFixed(2)} ${currSymbol}</span></div>
              <div class="line"><span>الخصم</span><span>-${discount.toFixed(2)} ${currSymbol}</span></div>
              <div class="line"><span>ضريبة القيمة المضافة</span><span>${tax.toFixed(2)} ${currSymbol}</span></div>
              <div class="line grand"><span>الإجمالي</span><span>${total.toFixed(2)} ${currSymbol}</span></div>
            </div>
            ${invoiceData.notes ? `<div class="notes"><strong>ملاحظة:</strong> ${invoiceData.notes}</div>` : ''}
            <div class="footer">
              <div>شكراً لتعاملكم معنا 🙏</div>
              ${laundryPhone ? `<div>${laundry?.name || 'المغسلة'} | 📞 ${laundryPhone}</div>` : ''}
              <div class="footer-brand">تم الإعداد بواسطة MyLoundreyPlus</div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const getShareablePdfUri = async (html: string): Promise<string> => {
    const result = await Print.printToFileAsync({ html, base64: true });
    const base64 = result.base64;
    if (!base64) throw new Error('Failed to generate PDF base64');
    const dir = `${FileSystem.documentDirectory}invoices/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const safeUri = `${dir}invoice_${Date.now()}.pdf`;
    await FileSystem.writeAsStringAsync(safeUri, base64, { encoding: FileSystem.EncodingType.Base64 });
    return safeUri;
  };

  const generateShareMessage = (): string => {
    if (!invoiceData) return '';
    const laundryPhone    = laundry?.phoneNumber || '';
    const laundryCity     = laundry?.city        || '';
    const laundryAddress  = laundry?.address     || '';
    const laundryLocation = [laundryCity, laundryAddress].filter(Boolean).join(' - ');
    const sym = currency.symbol;

    let msg = `*${laundry?.name || 'المغسلة'}*\n`;
    if (laundryLocation) msg += `📍 ${laundryLocation}\n`;
    if (laundryPhone)    msg += `📞 ${laundryPhone}\n`;
    msg += `\n*فاتورة رقم #${invoiceData.invoiceNumber}*\n`;
    msg += `*العميل:* ${invoiceData.customerName}\n`;
    msg += `*التاريخ:* ${new Date(invoiceData.createdAt || Date.now()).toLocaleDateString('ar-EG')}\n`;
    msg += `\n*الخدمات:*\n`;
    (invoiceData.items || []).forEach((item: any) => {
      const lineTotal = Number(item.unitPrice ?? 0) * Number(item.quantity ?? 0);
      msg += `- ${item.itemNameAr || item.itemName} (${item.quantity} x ${Number(item.unitPrice ?? 0).toFixed(2)}) = ${lineTotal.toFixed(2)} ${sym}\n`;
    });
    if (Number(invoiceData.discountAmount)   > 0) msg += `\n*الخصم:* ${Number(invoiceData.discountAmount).toFixed(2)} ${sym}`;
    if (Number(invoiceData.urgencyFeeAmount) > 0) msg += `\n*رسوم الاستعجال:* ${Number(invoiceData.urgencyFeeAmount).toFixed(2)} ${sym}`;
    if (Number(invoiceData.taxAmount)        > 0) msg += `\n*الضريبة (${invoiceData.taxPercent}%):* ${Number(invoiceData.taxAmount).toFixed(2)} ${sym}`;
    msg += `\n\n*المجموع الإجمالي:* ${Number(invoiceData.total ?? 0).toFixed(2)} ${sym}\n`;
    msg += `\nشكراً لتعاملكم مع ${laundry?.name || 'المغسلة'} 🙏`;
    return msg;
  };

  // ── معالجات ─────────────────────────────────────────────────────────────

  const handleWhatsApp = async () => {
    setLoadingAction('whatsapp');
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) { Alert.alert('خطأ', 'المشاركة غير متاحة على هذا الجهاز'); return; }
      const rawLogoUrl = laundry?.logoUrl;
      const logoSrc = rawLogoUrl ? await fetchLogoBase64(rawLogoUrl) : APP_LOGO_BASE64;
      const uri = await getShareablePdfUri(generateInvoiceHTML(logoSrc));
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `فاتورة #${invoiceData?.invoiceNumber}`, UTI: 'com.adobe.pdf' });
    } catch { Alert.alert('خطأ', 'تعذر مشاركة الفاتورة'); }
    finally   { setLoadingAction(null); }
  };

  const handleSMS = () => {
    const phone = invoiceData?.customerPhone || '';
    if (!phone) { Alert.alert('تنبيه', 'لا يوجد رقم هاتف للعميل'); return; }
    const msg = generateShareMessage();
    const sep = Platform.OS === 'ios' ? '&' : '?';
    Linking.openURL(`sms:${phone}${sep}body=${encodeURIComponent(msg)}`).catch(() =>
      Alert.alert('خطأ', 'حدث خطأ أثناء فتح تطبيق الرسائل'),
    );
  };

  const handleDownloadPDF = async () => {
    setLoadingAction('pdf');
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) { Alert.alert('خطأ', 'المشاركة غير متاحة على هذا الجهاز'); return; }
      const rawLogoUrl = laundry?.logoUrl;
      const logoSrc = rawLogoUrl ? await fetchLogoBase64(rawLogoUrl) : APP_LOGO_BASE64;
      const uri = await getShareablePdfUri(generateInvoiceHTML(logoSrc));
      await Sharing.shareAsync(uri, { UTI: 'com.adobe.pdf', mimeType: 'application/pdf', dialogTitle: 'مشاركة الفاتورة' });
    } catch { Alert.alert('خطأ', 'حدث خطأ أثناء إنشاء الفاتورة'); }
    finally   { setLoadingAction(null); }
  };

  const handlePrint = async () => {
    setLoadingAction('print');
    try {
      const rawLogoUrl = laundry?.logoUrl;
      const logoSrc = rawLogoUrl ? await fetchLogoBase64(rawLogoUrl) : APP_LOGO_BASE64;
      await Print.printAsync({ html: generateInvoiceHTML(logoSrc) });
    } catch { Alert.alert('خطأ', 'حدث خطأ أثناء الطباعة'); }
    finally   { setLoadingAction(null); }
  };

  // ── تعريف أزرار الإجراءات ────────────────────────────────────────────────

  const ACTIONS = [
    { key: 'whatsapp', ionName: 'logo-whatsapp', ionColor: '#25D366', labelTop: 'Share via', labelBot: 'WhatsApp', onPress: handleWhatsApp },
    { key: 'sms',      ionName: 'chatbubble-ellipses', ionColor: '#3B9EFF', labelTop: 'رسالة',   labelBot: 'SMS',      onPress: handleSMS },
    { key: 'pdf',      ionName: 'document-text',        ionColor: '#E05252', labelTop: 'Download', labelBot: 'PDF',      onPress: handleDownloadPDF },
    { key: 'print',    ionName: 'print',                ionColor: '#AAAAAA', labelTop: 'Print',    labelBot: 'Invoice',  onPress: handlePrint },
  ] as const;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      {/* Overlay شفاف قابل للضغط للإغلاق */}
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      {/* Sheet ينزلق من الأسفل */}
      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: colors.surface, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* مقبض السحب */}
        <View style={styles.sheetHandle} />

        {/* شارة النجاح */}
        <View style={styles.sheetHeader}>
          <View style={styles.successBadge}>
            <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
            <Text style={styles.successText}>تمت إضافة الفاتورة بنجاح</Text>
          </View>
        </View>

        {/* صف الأزرار الأربعة */}
        <View style={styles.actionsRow}>
          {ACTIONS.map((action) => {
            const isLoading = loadingAction === action.key;
            return (
              <TouchableOpacity
                key={action.key}
                style={styles.actionCard}
                onPress={action.onPress}
                disabled={loadingAction !== null}
                activeOpacity={0.72}
              >
                <View style={styles.actionIconWrap}>
                  {isLoading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Ionicons name={action.ionName as any} size={30} color={action.ionColor} />
                  }
                </View>
                <Text style={styles.actionLabelTop}>{action.labelTop}</Text>
                <Text style={styles.actionLabelBot}>{action.labelBot}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* زر الإغلاق */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
          <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          <Text style={[styles.closeText, { color: colors.textSecondary }]}>إغلاق</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 38 : 22,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 24,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#555',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34,197,94,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.30)',
  },
  successText: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 18,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#1C1C1C',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 96,
  },
  actionIconWrap: {
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabelTop: {
    color: '#D0D0D0',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  actionLabelBot: {
    color: '#D0D0D0',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  closeText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
