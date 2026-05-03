import jwt from 'jsonwebtoken'

const ACCESS_SECRET  = process.env.JWT_SECRET
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
const ACCESS_EXP     = process.env.JWT_EXPIRES_IN         || '24h'
const REFRESH_EXP    = process.env.JWT_REFRESH_EXPIRES_IN || '30d'

// ─── Generate Tokens ──────────────────────────────────────────────────────────
export function generateAccessToken(userId, role, deviceId) {
  return jwt.sign(
    { userId, role, deviceId },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXP }
  )
}

export function generateRefreshToken(userId, deviceId) {
  return jwt.sign(
    { userId, deviceId },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXP }
  )
}

// ─── Verify Refresh Token ─────────────────────────────────────────────────────
export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET)
}

// ─── Generate Token Pair ──────────────────────────────────────────────────────
export function generateTokenPair(userId, role, deviceId) {
  return {
    accessToken:  generateAccessToken(userId, role, deviceId),
    refreshToken: generateRefreshToken(userId, deviceId),
  }
}
