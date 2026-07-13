import { TFunction } from 'i18next';

/**
 * errorMapper.ts
 *
 * مكتبة مركزية لتحويل errorCode القادم من الباك إند
 * إلى مفتاح i18n مترجم.
 *
 * القاعدة الذهبية:
 *   - الموبايل لا يعرض أبداً error.response.data.message مباشرة
 *   - الموبايل يقرأ errorCode فقط ويحوّله عبر هذه الدالة
 *   - إذا كان errorCode غير معروف → 'auth.errors.default'
 */

// ────────────────────────────────────────────────────────────
// خريطة: errorCode → مفتاح i18n
// ────────────────────────────────────────────────────────────
const ERROR_CODE_MAP: Record<string, string> = {
  // ── شبكة ──────────────────────────────────────────────────
  NETWORK_ERROR              : 'auth.errors.networkError',
  SERVICE_UNAVAILABLE        : 'auth.errors.serviceUnavailable',
  DATABASE_UNAVAILABLE       : 'auth.errors.serviceUnavailable',

  // ── تسجيل ─────────────────────────────────────────────────
  EMAIL_ALREADY_EXISTS       : 'auth.errors.emailExists',
  PHONE_ALREADY_EXISTS       : 'auth.errors.phoneExists',
  DUPLICATE_ENTRY            : 'auth.errors.duplicateEntry',

  // ── دخول ──────────────────────────────────────────────────
  INVALID_CREDENTIALS        : 'auth.errors.invalidCredentials',
  ACCOUNT_SUSPENDED          : 'auth.errors.accountSuspended',
  ACCOUNT_INACTIVE           : 'auth.errors.accountSuspended', // alias قديم
  ACCOUNT_BANNED             : 'auth.errors.accountBanned',
  DEVICE_LIMIT_EXCEEDED      : 'auth.errors.deviceLimitExceeded',

  // ── OTP ───────────────────────────────────────────────────
  EMAIL_NOT_FOUND            : 'auth.errors.emailNotFound',
  OTP_INVALID                : 'auth.errors.otpInvalid',
  OTP_EXPIRED                : 'auth.errors.otpExpired',
  OTP_MAX_ATTEMPTS           : 'auth.errors.otpMaxAttempts',

  // ── Refresh / Session ─────────────────────────────────────
  TOKEN_EXPIRED              : 'auth.errors.sessionExpired',
  INVALID_TOKEN              : 'auth.errors.invalidSession',
  TOKEN_REVOKED              : 'auth.errors.sessionRevoked',
  REFRESH_TOKEN_INVALID      : 'auth.errors.sessionExpired',  // alias قديم

  // ── Validation ────────────────────────────────────────────
  VALIDATION_ERROR           : 'auth.errors.validationError',
  BAD_REQUEST                : 'auth.errors.validationError',
  PRISMA_VALIDATION_ERROR    : 'auth.errors.validationError',

  // ── أخرى ──────────────────────────────────────────────────
  RECORD_NOT_FOUND           : 'auth.errors.notFound',
  FOREIGN_KEY_ERROR          : 'auth.errors.default',
  INTERNAL_ERROR             : 'auth.errors.default',
  UNKNOWN_ERROR              : 'auth.errors.default',

  // ── تغيير الإيميل ─────────────────────────────────────────
  INVALID_EMAIL_CHANGE_REQUEST: 'auth.errors.otpExpired',
};

// ────────────────────────────────────────────────────────────
// الدالة الرئيسية — استخدمها في كل onError بدون استثناء
// ────────────────────────────────────────────────────────────

/**
 * تحوّل أي خطأ من Axios إلى نص مترجم جاهز للعرض.
 *
 * @param error  - الخطأ الخام من useMutation أو useQuery
 * @param t      - دالة الترجمة من useTranslation()
 * @returns نص الرسالة بلغة المستخدم الحالية
 *
 * @example
 * onError: (error) => {
 *   setApiError(mapErrorToMessage(error, t));
 * }
 */
export function mapErrorToMessage(error: any, t: TFunction): string {
  // ── 1. خطأ شبكة (لا يوجد error.response أصلاً) ─────────
  if (error?.isNetworkError || !error?.response) {
    return t('auth.errors.networkError');
  }

  // ── 2. استخرج errorCode من الباك إند ──────────────────────
  const errorCode: string | undefined = error?.response?.data?.errorCode;

  // ── 3. حوّله عبر الخريطة ─────────────────────────────────
  const i18nKey = errorCode ? (ERROR_CODE_MAP[errorCode] ?? 'auth.errors.default') : 'auth.errors.default';

  return t(i18nKey);
}

/**
 * نسخة مبسّطة — تُعيد errorCode فقط (مفيد لـ logging أو conditional logic)
 */
export function extractErrorCode(error: any): string {
  if (error?.isNetworkError || !error?.response) return 'NETWORK_ERROR';
  return error?.response?.data?.errorCode ?? 'UNKNOWN_ERROR';
}
