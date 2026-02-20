/**
 * 美盛游戏接口客户端（PHP 后端）
 * 请求 /api/v1/game/*（如 game/enter），需登录态 Bearer Token
 *
 * Token 优先级：
 * 1. backend_token（后端登录 /api/v1/auth/login 返回的 JWT，游戏接口专用）
 * 2. token（Supabase JWT，仅无鉴权接口可用，game/enter 会返回 10002）
 */
import axios, { AxiosInstance } from 'axios'

// 统一走 /api/v1 相对路径：
// - 开发：Vite proxy 代理到 VITE_BACKEND_URL（见 vite.config.ts）
// - 生产（Vercel）：vercel.json rewrites 代理到 https://admin.amjsvip.cc，避免跨域 CORS
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
  (res) => res.data,
  (err) => Promise.reject(err.response?.data ?? err)
)

export default phpGameClient
