// ─── Sound Utility for Admin Dashboard Notifications ─────────────────────────
let sharedAudioCtx = null

function getAudioContext() {
  try {
    if (!sharedAudioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        sharedAudioCtx = new AudioCtx()
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {})
    }
    return sharedAudioCtx
  } catch (_) {
    return null
  }
}

// Unlock AudioContext on first user interaction
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext()
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
  }
  window.addEventListener('click', unlockAudio, { passive: true })
  window.addEventListener('keydown', unlockAudio, { passive: true })
  window.addEventListener('touchstart', unlockAudio, { passive: true })
}

/**
 * تشغيل نغمة إشعار احترافية وواضحة (3 نغمات متناغمة)
 */
export function playNotificationSound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => playChimes(ctx)).catch(() => {})
    } else {
      playChimes(ctx)
    }
  } catch (err) {
    console.warn('Notification sound error:', err)
  }
}

function playChimes(ctx) {
  const now = ctx.currentTime
  // نغمة إشعار ناعمة وواضحة: 3 نغمات تصاعدية سريعة (587Hz -> 880Hz -> 1046Hz)
  const notes = [
    { freq: 587.33, start: 0.00, dur: 0.14 }, // D5
    { freq: 880.00, start: 0.11, dur: 0.16 }, // A5
    { freq: 1046.5, start: 0.22, dur: 0.28 }, // C6
  ]

  notes.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now + start)

    gain.gain.setValueAtTime(0.001, now + start)
    gain.gain.exponentialRampToValueAtTime(0.28, now + start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now + start)
    osc.stop(now + start + dur + 0.05)
  })
}
