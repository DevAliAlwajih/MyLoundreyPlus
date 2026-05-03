import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { getUserDevices, setDeviceStatus, setPrimaryDevice } from '../services/device.service.js'
import { sendSuccess } from '../middleware/errorHandler.js'

const router = Router()

router.use(authenticate)

// ─── GET /api/v1/devices/me — List my devices ─────────────────────────────────
router.get('/me', async (req, res, next) => {
  try {
    const devices = await getUserDevices(req.user.id)
    return sendSuccess(res, devices)
  } catch (err) { next(err) }
})

// ─── PATCH /api/v1/devices/me/:deviceId/status — Activate/Deactivate own device
router.patch('/me/:deviceId/status', async (req, res, next) => {
  try {
    const { is_active } = req.body
    const device = await setDeviceStatus(req.params.deviceId, req.user.id, is_active)
    return sendSuccess(res, device, is_active ? 'تم تفعيل الجهاز' : 'تم إلغاء تفعيل الجهاز')
  } catch (err) { next(err) }
})

// ─── PATCH /api/v1/devices/me/:deviceId/set-primary — Set own primary device ──
router.patch('/me/:deviceId/set-primary', async (req, res, next) => {
  try {
    const device = await setPrimaryDevice(req.params.deviceId, req.user.id)
    return sendSuccess(res, device, 'تم تعيين الجهاز كافتراضي')
  } catch (err) { next(err) }
})

export default router
