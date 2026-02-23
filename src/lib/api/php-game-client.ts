/**
 * 美盛游戏接口客户端（PHP 后端）
 * 请求 /api/v1/game/*（如 game/enter），需登录态 Bearer Token
 *
 * Token 优先级：
 * 1. backend_token（后端登录 /api/v1/auth/login 返回的 JWT，游戏接口专用）
 * 2. token（Supabase JWT，仅无鉴权接口可用，game/enter 会返回 10002）
 *
 * 响应解密：后端 encryption_enabled=true 时所有响应为 AES-256-CBC 加密，
 * 响应头 X-Encrypted:1，内容为 base64(AES-CBC(json))，拦截器自动解密。
 */
import axios, { AxiosInstance } from 'axios'

// AES-256-CBC 解密（与后端 Crypto.php 一致）
const AES_KEY = 'QD2024SecretKey1234567890ABCDEF0'
const AES_IV  = 'QD2024IV12345678'

async function decryptResponse(base64Cipher: string): Promise<any> {
  try {
    const keyBytes = new TextEncoder().encode(AES_KEY)
    const ivBytes  = new TextEncoder().encode(AES_IV)
    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyBytes, { name: 'AES-CBC' }, false, ['decrypt']
    )
    const binaryStr = atob(base64Cipher)
    const cipherBytes = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) cipherBytes[i] = binaryStr.charCodeAt(i)
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: ivBytes }, cryptoKey, cipherBytes)
    return JSON.parse(new TextDecoder().decode(decrypted))
  } catch {
    return null
  }
}

// 统一走 /api/v1 相对路径（同域请求，无 CORS）：
// - 开发：Vite proxy 代理到 VITE_BACKEND_URL（vite.config.ts）
// - 生产 Vercel：vercel.json rewrites 转发
// - 生产 Netlify：netlify.toml redirects 转发到 admin.amjsvip.cc
const PHP_GAME_BASE = '/api/v1'

const phpGameClient: AxiosInstance = axios.create({
  baseURL: PHP_GAME_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json;charset=UTF-8' }
})

phpGameClient.interceptors.request.use((config) => {
  // 优先使用后端 JWT（专门用于游戏接口），其次 fallback 到 Supabase token
  const token =
    localStorage.getItem('backend_token') ||
    sessionStorage.getItem('backend_token') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

phpGameClient.interceptors.response.use(
  async (res) => {
    const encrypted = res.headers['x-encrypted'] === '1'
    if (encrypted && typeof res.data === 'string' && res.data.length > 0) {
      const decrypted = await decryptResponse(res.data)
      return decrypted !== null ? decrypted : res.data
    }
    return res.data
  },
  async (err) => {
    const res = err.response
    if (res) {
      const encrypted = res.headers?.['x-encrypted'] === '1'
      if (encrypted && typeof res.data === 'string' && res.data.length > 0) {
        const decrypted = await decryptResponse(res.data)
        return Promise.reject(decrypted ?? res.data)
      }
      return Promise.reject(res.data ?? err)
    }
    return Promise.reject(err)
  }
)

export default phpGameClient
