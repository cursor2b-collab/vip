/**
 * 游戏相关 API（美盛游戏接口 / PHP 后端）
 *
 * 默认使用美盛接口：后端 POST /api/v1/game/enter
 * - 参数: platform（如 AG/PG）, gameId（lobby 或子游戏代码）, device（mobile/pc）
 * - 成功: code=0, data.url 为游戏链接
 * - 需登录态: Authorization: Bearer <token>
 *
 * 兼容旧配置：未禁用时 VITE_BET_PROXY_URL 仍走 bet-proxy（已弃用，建议仅用美盛）。
 */
import apiClient from './client'
import phpGameClient from './php-game-client'
import { supabase, USE_SUPABASE_DATA, SUPABASE_TABLES } from '@/lib/supabase'
import {
  betCreate,
  betGameUrl,
  betBalance,
  betBalanceAll,
  betTransfer,
  betTransferAll,
  betRecordAll,
  betRecordHistory,
  type BetRecordItem
} from './bet-api'

// ---------------------------------------------------------------------------
// 类型与常量（与接口文档一致）
// ---------------------------------------------------------------------------

/** 游戏类型：1视讯 2老虎机 3彩票 4体育 5电竞 6捕猎 7棋牌 */
const GAME_TYPE_MAP: Record<number, string> = {
  1: '1', 2: '2', 3: '2', 4: '3', 5: '4', 6: '7', 7: '5'
}

const GAME_TYPE_TO_SUPABASE: Record<number, string> = {
  1: 'live', 3: 'slot', 4: 'lottery', 5: 'sport', 6: 'slot'
}

const SUPABASE_TYPE_TO_GAME_TYPE: Record<string, number> = {
  live: 1, slot: 3, lottery: 4, sport: 5, chess: 6, fishing: 3
}

const TYPE_TO_CATEGORY: Record<number, string> = {
  1: 'realbet', 3: 'gaming', 4: 'lottery', 5: 'sport', 6: 'joker'
}

export interface Game {
  id?: number
  name: string
  platform_name: string
  game_code: string
  game_type: number
  gameType: number
  category_id: string
  cover?: string
  app_state?: number
  tags?: string
  params?: Record<string, unknown>
  [key: string]: unknown
}

export interface GameListResponse {
  code: number
  message: string
  data: Game[]
}

export interface GameUrlResponse {
  code: number
  message: string
  status?: string
  data: { game_url?: string; url?: string }
}

export interface GameTransferResponse {
  code: number
  message: string
  status?: string
  data?: { money?: number; [k: string]: unknown }
}

export interface GameApi {
  id: number
  api_name: string
  title: string
  icon_url?: string
  game_type?: number
  [key: string]: unknown
}

export interface GameApiListResponse {
  code: number
  message: string
  data: GameApi[]
}

export interface GameRecord {
  id?: number
  bet_id?: string
  api_name?: string
  game_name?: string
  betAmount?: number
  bet_amount?: number
  validBetAmount?: number
  valid_bet_amount?: number
  win_amount?: number
  netAmount?: number
  net_amount?: number
  betTime?: string
  bet_time?: string
  created_at?: string
  state?: number | string
  status?: number | string
  [key: string]: unknown
}

export interface GameRecordRequest {
  page?: number
  limit?: number
  api_name?: string
  api_code?: string
  gameType?: string | number
  game_type?: string | number
  date?: string
  created_at?: string[]
  start_time?: string
  end_time?: string
}

export interface GameRecordResponse {
  code: number
  message: string
  data: {
    data: GameRecord[]
    current_page?: number
    total?: number
    [key: string]: unknown
  }
}

export interface GameType {
  value: number | string
  label: string
}

export interface GameTypeResponse {
  code: number
  message: string
  data: GameType[]
}

export interface ApiGameItem {
  title: string
  api_name: string
  game_type: number
  platform_name?: string
  game_code?: string
  cover?: string
  [key: string]: unknown
}

export interface ApiMoneyInfo {
  api_name: string
  api_title: string
  money: number | string
}

export interface ApiMoneyResponse {
  code: number
  message: string
  data: { money_info: ApiMoneyInfo[]; is_trans_on?: number }
}

// ---------------------------------------------------------------------------
// 工具（严格按接口文档）
// ---------------------------------------------------------------------------

/** bet-proxy 已弃用，统一走 houduan，始终返回 false */
export const shouldUseBetProxy = (): boolean => false

/** 始终使用 houduan PHP 后端（/api/v1/game/*） */
export const shouldUsePhpGameBackend = (): boolean => true

/** ley 游戏接口已弃用，统一走 houduan，始终返回 false */
export const shouldUseLeyGameApi = (): boolean => false

function getLeyGameBase(): string {
  return (import.meta.env.VITE_GAME_API_URL as string)?.replace(/\/+$/, '')
    || (import.meta.env.VITE_BACKEND_URL as string)?.replace(/\/+$/, '')
    || 'https://admin.amjsvip.cc'
}

/**
 * 生成美盛转账订单号：建议时间戳+随机数字，最小16位，最大32位（接口文档要求）
 */
function makeLeyTransferno(): string {
  const ts = String(Date.now()) // 13 位
  const r = Math.floor(Math.random() * 1e19).toString(10).padStart(19, '0').slice(0, 19)
  return (ts + r).slice(0, 32)
}

/** 美盛 ley 接口 POST（application/x-www-form-urlencoded），服务端自动注入 account/api_key */
async function leyGamePost(
  action: string,
  body: Record<string, string | number | undefined>
): Promise<{ Code: number; Message?: string; Data?: Record<string, unknown> }> {
  const base = getLeyGameBase()
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined || v === null) continue
    params.set(k, String(v))
  }
  const res = await fetch(`${base}/ley/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  })
  const json = await res.json().catch(() => ({}))
  return json as { Code: number; Message?: string; Data?: Record<string, unknown> }
}

/** 前端 api_code 转 api-bet platType（小写，如 PG→pg） */
function apiCodeToPlatType(apiCode: string): string {
  const s = String(apiCode || '').replace(/[^a-z0-9]/gi, '').toLowerCase()
  return s || 'ag'
}

/** 前端 gameType 数字转接口 gameType 字符串：1视讯 2老虎机 3彩票 4体育 5电竞 6捕猎 7棋牌 */
function toBetGameType(gameType: number): string {
  return GAME_TYPE_MAP[gameType] ?? '1'
}

/** 语言转货币（接口文档“游戏平台”附录） */
function langToCurrency(lang: string): string {
  const map: Record<string, string> = {
    zh_cn: 'CNY', en: 'USD', zh_hk: 'HKD', th: 'THB', vi: 'VND', id: 'IDR', ja: 'JPY'
  }
  return map[String(lang || '').toLowerCase()] ?? 'CNY'
}

/** playerId：5-11 位小写字母+数字（接口文档要求） */
export function toBetPlayerId(userId: string | number | null): string {
  const raw = String(userId ?? '').replace(/[^a-z0-9]/gi, '').toLowerCase()
  if (raw.length >= 5 && raw.length <= 11) return raw
  if (raw.length > 11) return raw.slice(0, 11)
  return ('u' + raw).slice(0, 11).padEnd(5, '0')
}

/** ley 接口使用的会员账号（与 register 一致，避免 Invalid user Id） */
async function getLeyUsername(): Promise<string | null> {
  const id = await getUserId()
  return id ? toBetPlayerId(id) : null
}

/** 确保已在 ley 注册（首次进入游戏前调用，login 前未注册会报 Invalid user Id） */
async function ensureLeyRegistered(username: string): Promise<void> {
  const r = await leyGamePost('register', { api_code: 'AG', username, password: username })
  if (r.Code === 0 || r.Code === 33) return
  if (r.Message?.includes('already exists') || r.Message?.includes('已存在')) return
}

/** 获取当前货币（BalancePage 等使用） */
export function getCurrency(): string {
  return langToCurrency(localStorage.getItem('ly_lang') || 'zh_cn')
}

/** 单个平台余额（BalancePage 用） */
export const getServerBalance = async (params: {
  playerId: string
  platType: string
  currency: string
}): Promise<{ code: number; message?: string; data?: { balance?: number } }> => {
  if (shouldUseLeyGameApi()) {
    const username = await getLeyUsername()
    if (!username) return { code: 400, message: '未登录', data: { balance: 0 } }
    const code = String(params.platType || '').replace(/[^a-z0-9]/gi, '').toUpperCase() || 'AG'
    const r = await leyGamePost('balance', { api_code: code, username })
    const balance = Number(r.Data?.balance ?? 0) || 0
    return { code: r.Code === 0 ? 200 : r.Code || 500, message: r.Message, data: { balance } }
  }
  if (shouldUsePhpGameBackend()) {
    const res = await getGameBalance(params.platType)
    return { code: res.code === 0 ? 200 : res.code || 500, message: res.message, data: { balance: res.money ?? res.data?.money ?? 0 } }
  }
  try {
    const res = await betBalance(params)
    const ok = (res as { code?: number }).code === 10000
    const balance = (res as { data?: { balance?: number | null } }).data?.balance
    return { code: ok ? 200 : 500, data: { balance: balance != null ? Number(balance) : 0 } }
  } catch (e: any) {
    return { code: 500, message: e?.message ?? '获取失败' }
  }
}

/** 全部平台余额（BalancePage 用） */
export const getServerBalanceAll = async (params: {
  playerId: string
  currency: string
}): Promise<{ code: number; message?: string; data?: Record<string, number> }> => {
  if (shouldUseLeyGameApi()) {
    const r = await leyGamePost('credit', { api_code: 'CURRENCY' })
    const money = Number(r.Data?.money ?? 0) || 0
    return { code: r.Code === 0 ? 200 : r.Code || 500, message: r.Message, data: { CURRENCY: money, currency: money } }
  }
  if (shouldUsePhpGameBackend()) {
    try {
      const res: any = await phpGameClient.get('game/platform-balances')
      const list: Array<{ code: string; balance?: string | number }> = res?.data?.platforms ?? []
      const data: Record<string, number> = {}
      list.forEach((p) => {
        data[p.code] = Number(p.balance ?? 0)
        data[p.code.toLowerCase()] = Number(p.balance ?? 0)
      })
      return { code: (res?.code === 0 ? 200 : res?.code ?? 500), data }
    } catch (e: any) {
      return { code: 500, message: e?.message ?? '获取失败' }
    }
  }
  try {
    const res = await betBalanceAll(params)
    const ok = (res as { code?: number }).code === 10000
    const raw = (res as { data?: Record<string, number | null> }).data ?? {}
    const data: Record<string, number> = {}
    Object.keys(raw).forEach((k) => { data[k] = Number(raw[k] ?? 0); data[k.toLowerCase()] = Number(raw[k] ?? 0) })
    return { code: ok ? 200 : 500, data }
  } catch (e: any) {
    return { code: 500, message: e?.message ?? '获取失败' }
  }
}

/** 一键回收（BalancePage 用） */
export const getServerTransferAll = async (params: {
  playerId: string
  currency: string
}): Promise<{ code: number; message?: string; data?: { balanceAll?: number } }> => {
  if (shouldUseLeyGameApi()) {
    return { code: 501, message: '当前游戏接口暂不支持一键回收', data: { balanceAll: 0 } }
  }
  if (shouldUsePhpGameBackend()) {
    try {
      const res: any = await phpGameClient.post('game/transfer/recall-all', {})
      const ok = (res?.code === 0)
      const total = ok ? Number(res?.data?.totalAmount ?? 0) : 0
      return { code: ok ? 200 : (res?.code ?? 500), message: res?.message, data: { balanceAll: total } }
    } catch (e: any) {
      return { code: 500, message: e?.message ?? '回收失败', data: { balanceAll: 0 } }
    }
  }
  try {
    const res = await betTransferAll(params)
    const ok = (res as { code?: number }).code === 10000
    const raw = (res as { data?: Record<string, number> }).data ?? {}
    const balanceAll = Object.values(raw).reduce((a, b) => a + Number(b || 0), 0)
    return { code: ok ? 200 : 500, data: { balanceAll } }
  } catch (e: any) {
    return { code: 500, message: (e as Error)?.message ?? '回收失败', data: { balanceAll: 0 } }
  }
}

export const getUserId = async (): Promise<string | null> => {
  try {
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      const user = JSON.parse(userInfo) as Record<string, unknown>
      const id = user.id ?? user.user_id ?? user.username
      if (id != null) return String(id)
    }
    const { getUserInfo } = await import('@/lib/api/auth')
    const res = await getUserInfo() as { data?: Record<string, unknown> }
    // 兼容多种后端结构：data.id / data.user_id / data.data.id
    const inner = res?.data?.data as Record<string, unknown> | undefined
    const id =
      res?.data?.id ?? res?.data?.user_id ?? res?.data?.username ??
      inner?.id ?? inner?.user_id ?? inner?.username
    return id != null ? String(id) : null
  } catch (e) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[getUserId] 获取用户ID失败:', e)
    }
    return null
  }
}

function resolveImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return ''
  const t = url.trim()
  if (!t) return ''
  if (t.startsWith('http://') || t.startsWith('https://')) return t
  if (t.startsWith('/images/')) return t
  const base = (import.meta.env.VITE_BACKEND_URL as string || '').replace(/\/+$/, '') || (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '') || (typeof window !== 'undefined' ? window.location.origin : '')
  return base + (t.startsWith('/') ? '' : '/') + t
}

/** 从对象中取第一个非空的图片 URL（兼容接口/DB 多种字段名） */
function pickCoverUrl(row: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k]
    if (v != null && typeof v === 'string' && v.trim()) return resolveImageUrl(v)
  }
  return ''
}

// ---------------------------------------------------------------------------
// 获取游戏链接（美盛接口：POST /api/v1/game/enter）
// ---------------------------------------------------------------------------

export const getGameUrl = async (params: {
  api_code: string
  gameType: number
  gameCode?: string
  isMobile?: number
}): Promise<GameUrlResponse> => {
  const apiCode = String(params.api_code || '').replace(/[^a-z0-9]/gi, '').toUpperCase() || params.api_code
  const platformMapping: Record<string, string> = { PA: 'AG', CQ: 'CQ9', BA: 'BG' }
  const mappedCode = platformMapping[apiCode] || apiCode

  if (shouldUseLeyGameApi()) {
    const username = await getLeyUsername()
    if (!username) throw new Error('请先登录')
    await ensureLeyRegistered(username)
    const isMobile = params.isMobile === 1 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const r = await leyGamePost('login', {
      api_code: mappedCode,
      username,
      gameType: String(params.gameType ?? 1),
      gameCode: params.gameCode && params.gameCode !== '0' ? String(params.gameCode) : '0',
      isMobile: isMobile ? 1 : 0
    })
    if (r.Code !== 0) throw new Error(r.Message || '获取游戏链接失败')
    const rawUrl = r.Data?.url
    const url: string = (rawUrl != null ? String(rawUrl).trim() : '') || ''
    if (url) return { code: 200, message: '成功', status: 'success', data: { game_url: url, url } }
    throw new Error('游戏链接为空')
  }

  // 美盛游戏接口（PHP 后端）。php-game-client 响应拦截器返回 res.data，故 res 即接口 body
  if (shouldUsePhpGameBackend()) {
    // PHP 后端直接使用原始 api_name（不经过 platformMapping），因为后端自己的 game/platforms 已经返回了正确的平台代码
    // platformMapping（PA→AG 等）仅用于旧版 bet-proxy 接口
    const platform = apiCode
    const gameId = (params.gameCode && params.gameCode !== '0' && String(params.gameCode).trim()) || 'lobby'
    const isMobile = params.isMobile === 1 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const device = isMobile ? 'mobile' : 'pc'
    // 传递 type 参数，让后端正确区分游戏大厅类型（live/slot/fishing 等）
    const type = GAME_TYPE_TO_PHP[params.gameType] || 'live'
    const lang = localStorage.getItem('ly_lang') || 'zh_cn'
    let res: { code?: number; message?: string; data?: { url?: string; openType?: string; balance?: string } }
    try {
      res = await phpGameClient.post('game/enter', { platform, gameId, device, type, lang }) as typeof res
    } catch (e: any) {
      const body = e?.response?.data ?? e?.data
      const msg = (body?.message ?? body?.error ?? e?.message ?? '网络或接口异常') as string
      const code = body?.code ?? e?.code
      if (code === 10001 || /Token已过期|未登录|请登录/i.test(String(msg))) {
        throw new Error('请先登录')
      }
      throw new Error(code != null ? `[${code}] ${msg}` : msg)
    }
    const data = res?.data
    const url = (data?.url && String(data.url).trim()) || ''
    if (res?.code === 0 && url) {
      return { code: 200, message: '成功', status: 'success', data: { game_url: url, url } }
    }
    const backendMsg = (res?.message && String(res.message).trim()) || '获取游戏链接失败'
    const backendCode = res?.code
    if (backendCode === 10001 || /Token已过期|未登录|请登录/i.test(String(backendMsg))) {
      throw new Error('请先登录')
    }
    throw new Error(backendCode != null ? `[${backendCode}] ${backendMsg}` : backendMsg)
  }

  if (shouldUseBetProxy()) {
    let gameUrlBody: Record<string, unknown> | undefined
    try {
      const playerId = toBetPlayerId(await getUserId())
      if (!playerId || playerId.length < 5) throw new Error('无法获取用户ID，请先登录')

      const platType = apiCodeToPlatType(mappedCode)
      const lang = localStorage.getItem('ly_lang') || 'zh_cn'
      const currency = langToCurrency(lang)
      const gameTypeStr = toBetGameType(params.gameType)
      const isMobile = params.isMobile === 1 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const ingress = isMobile ? 'device2' : 'device1'

      let gameCode: string | undefined = (params.gameCode && params.gameCode !== '0' && String(params.gameCode).trim()) || undefined
      if (gameCode?.toLowerCase() === 'lobby') gameCode = undefined
      else if (gameCode?.includes('_')) {
        const after = gameCode.slice(gameCode.indexOf('_') + 1).trim()
        gameCode = after && after.toLowerCase() !== 'lobby' ? after : undefined
      }
      if (gameCode === '') gameCode = undefined

      const siteOrigin = (import.meta.env.VITE_SITE_URL as string)?.trim()?.replace(/\/+$/, '') || ''
      const isProd = siteOrigin && !/localhost|127\.0\.0\.1/i.test(siteOrigin)
      const returnUrl = isProd ? `${siteOrigin}/gamelobby` : undefined

      gameUrlBody = { playerId, platType, currency, gameType: gameTypeStr, ingress }
      if (returnUrl) gameUrlBody.returnUrl = returnUrl
      if (gameCode) gameUrlBody.gameCode = gameCode

      if (typeof console !== 'undefined' && console.info) {
        console.info('[getGameUrl] bet-proxy 请求参数:', {
          create: { playerId, platType, currency },
          gameUrlBody,
          betProxyUrl: (import.meta.env.VITE_BET_PROXY_URL as string) || '(同源)'
        })
      }

      await betCreate({ playerId, platType, currency })

      try {
        const { getUserInfo } = await import('@/lib/api/auth')
        const userRes = (await getUserInfo()) as { data?: { money?: number; balance?: number } }
        const wallet = Number(userRes?.data?.money ?? userRes?.data?.balance ?? 0) || 0
        if (wallet > 0) {
          const balRes = await betBalance({ playerId, platType, currency })
          const gameBal = Number(balRes.data?.balance ?? 0) || 0
          const need = wallet - gameBal
          if (need > 0.01) {
            await betTransfer({
              playerId, platType, currency,
              type: '1',
              amount: String(Math.floor(need * 100) / 100),
              orderId: `in_${playerId}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
            }).catch(() => {})
          }
        }
      } catch (_) {}

      const res = await betGameUrl(gameUrlBody as Parameters<typeof betGameUrl>[0])
      const data = res?.data
      const url = (data && typeof data === 'object' && 'url' in data)
        ? (data as { url?: string }).url
        : undefined
      const gameUrl = (url && String(url).trim()) || (data as { game_url?: string })?.game_url || (data as { gameUrl?: string })?.gameUrl
      if (gameUrl) {
        return { code: 200, message: '成功', status: 'success', data: { game_url: gameUrl, url: gameUrl } }
      }
      const msg = (res as { msg?: string })?.msg
      throw new Error(msg || '游戏链接为空')
    } catch (err: unknown) {
      const e = err as Error & { code?: number; response?: unknown; path?: string }
      if (gameUrlBody !== undefined) (e as Error & { requestBody?: unknown }).requestBody = gameUrlBody
      console.error('❌ bet-proxy 获取游戏链接失败:', { message: e?.message, code: e?.code, response: e?.response, requestBody: gameUrlBody })
      throw err
    }
  }

  const lang = localStorage.getItem('ly_lang') || 'zh_cn'
  const res = await apiClient.get<GameUrlResponse>('game/login', {
    params: {
      api_code: mappedCode,
      gameType: params.gameType,
      isMobile: params.isMobile ?? 1,
      lang,
      ...(params.gameCode && params.gameCode !== '0' && params.gameCode !== '' ? { gameCode: params.gameCode } : {})
    }
  })
  const d = res?.data ?? res
  const url = d?.data?.game_url ?? d?.data?.url ?? (d as { url?: string })?.url ?? ''
  if (d?.status === 'error') {
    return { code: (d as { code?: number }).code ?? 400, message: (d as { message?: string }).message ?? '失败', status: 'error', data: {} }
  }
  if (url) {
    return { code: 200, message: '成功', status: 'success', data: { game_url: url, url } }
  }
  return { code: (d as { code?: number }).code ?? 400, message: (d as { message?: string }).message ?? '游戏链接为空', status: 'error', data: {} }
}

// ---------------------------------------------------------------------------
// 游戏转出（接口文档：余额 + 转账 type=2）
// ---------------------------------------------------------------------------

export const gameTransferOut = async (apiCode: string): Promise<GameTransferResponse> => {
  const code = String(apiCode || '').replace(/[^a-z0-9]/gi, '').toUpperCase()
  const mapped = { PA: 'AG', CQ: 'CQ9', BA: 'BG' }[code] || code

  if (shouldUseLeyGameApi()) {
    const username = await getLeyUsername()
    if (!username) return { code: 400, message: '请先登录', status: 'error', data: {} }
    const bal = await leyGamePost('balance', { api_code: mapped, username })
    if (bal.Code !== 0) throw new Error(bal.Message || '查询余额失败')
    const balance = Number(bal.Data?.balance ?? 0) || 0
    if (balance <= 0) return { code: 200, message: '该接口余额为0，无需转出', status: 'success', data: { money: 0 } }
    const amount = Math.floor(balance * 100) / 100
    const amountInt = Math.floor(amount)
    if (amountInt < 1) return { code: 200, message: '该接口余额不足1，无需转出', status: 'success', data: { money: 0 } }
    const transferno = makeLeyTransferno()
    const r = await leyGamePost('withdrawal', { api_code: mapped, username, amount: amountInt, transferno })
    if (r.Code !== 0) throw new Error(r.Message || '转出失败')
    return { code: 200, message: '转出成功', status: 'success', data: { money: amountInt } }
  }

  if (shouldUsePhpGameBackend()) {
    const balRes = await getGameBalance(mapped)
    const balance = balRes.money || 0
    if (balance <= 0) return { code: 200, message: '该接口余额为0，无需转出', status: 'success', data: { money: 0 } }
    const amount = Math.floor(balance * 100) / 100
    const res: any = await phpGameClient.post('game/transfer/out', { platform: mapped, amount: String(amount) })
    if (res?.code === 0) {
      return { code: 200, message: '转出成功', status: 'success', data: { money: amount } }
    }
    throw new Error(res?.message || '转出失败')
  }

  if (shouldUseBetProxy()) {
    const playerId = toBetPlayerId(await getUserId())
    if (!playerId || playerId.length < 5) return { code: 400, message: '请先登录', status: 'error', data: {} }
    const platType = apiCodeToPlatType(mapped)
    const currency = langToCurrency(localStorage.getItem('ly_lang') || 'zh_cn')
    const balRes = await betBalance({ playerId, platType, currency })
    const balance = Number(balRes.data?.balance ?? 0) || 0
    if (balance <= 0) return { code: 200, message: '该接口余额为0，无需转出', status: 'success', data: { money: 0 } }
    const amount = Math.floor(balance * 100) / 100
    await betTransfer({
      playerId, platType, currency,
      type: '2',
      amount: String(amount),
      orderId: `out_${playerId}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    })
    return { code: 200, message: '转出成功', status: 'success', data: { money: amount } }
  }

  const lang = localStorage.getItem('ly_lang') || 'zh_cn'
  const balanceRes = await apiClient.post<{ code?: number; money?: number; data?: { money?: number } }>('game/balance', { api_code: mapped }, { params: { lang } })
  const money = Number(balanceRes.data?.money ?? balanceRes.data?.data?.money ?? 0) || 0
  if (money <= 0) return { code: 200, message: '该接口余额为0，无需转出', status: 'success', data: { money: 0 } }
  const outRes = await apiClient.post<{ code?: number; message?: string; status?: string; money?: number }>(
    'game/withdrawal',
    { api_code: mapped, money: Math.floor(money) },
    { params: { lang } }
  )
  const r = outRes.data ?? outRes
  if (r?.status === 'error' || (r?.code != null && r.code !== 200)) {
    return { code: r?.code ?? 400, message: (r as { message?: string }).message ?? '转出失败', status: 'error', data: {} }
  }
  return { code: 200, message: '转出成功', status: 'success', data: { money: (r as { money?: number }).money ?? Math.floor(money) } }
}

// ---------------------------------------------------------------------------
// 余额、转入（bet-proxy 时走 api-bet）
// ---------------------------------------------------------------------------

export const getGameBalance = async (apiCode: string): Promise<{ code: number; message?: string; money: number; data?: { money?: number } }> => {
  const code = String(apiCode || '').replace(/[^a-z0-9]/gi, '').toUpperCase()
  const mapped = { PA: 'AG', CQ: 'CQ9', BA: 'BG' }[code] || code

  if (shouldUseLeyGameApi()) {
    const username = await getLeyUsername()
    if (!username) return { code: 400, message: '未登录', money: 0 }
    const r = await leyGamePost('balance', { api_code: mapped, username })
    const money = Number(r.Data?.balance ?? 0) || 0
    return { code: r.Code === 0 ? 200 : r.Code || 500, message: r.Message, money, data: { money } }
  }

  if (shouldUsePhpGameBackend()) {
    const res: any = await phpGameClient.get(`game/balance/${mapped}`)
    const money = Number(res?.data?.balance ?? 0) || 0
    return { code: res?.code === 0 ? 200 : (res?.code ?? 200), money, data: { money } }
  }

  if (shouldUseBetProxy()) {
    const playerId = toBetPlayerId(await getUserId())
    if (!playerId) return { code: 400, message: '未登录', money: 0 }
    const platType = apiCodeToPlatType(mapped)
    const currency = langToCurrency(localStorage.getItem('ly_lang') || 'zh_cn')
    const { data } = await betBalance({ playerId, platType, currency })
    const money = Number(data?.balance ?? 0) || 0
    return { code: 200, money, data: { money } }
  }
  const lang = localStorage.getItem('ly_lang') || 'zh_cn'
  const res = await apiClient.post<{ code?: number; money?: number; data?: { money?: number } }>('game/balance', { api_code: mapped }, { params: { lang } })
  const m = Number(res.data?.money ?? res.data?.data?.money ?? 0) || 0
  return { code: res.data?.code ?? 200, money: m, data: { money: m } }
}

export const gameTransferIn = async (apiCode: string, amount?: number): Promise<GameTransferResponse> => {
  const code = String(apiCode || '').replace(/[^a-z0-9]/gi, '').toUpperCase()
  const mapped = { PA: 'AG', CQ: 'CQ9', BA: 'BG' }[code] || code

  if (shouldUseLeyGameApi()) {
    const username = await getLeyUsername()
    if (!username) return Promise.reject(new Error('请先登录'))
    const amt = amount != null && !Number.isNaN(amount) ? Math.floor(Math.max(0, amount)) : 0
    if (amt < 1) return Promise.reject(new Error('转入金额无效（美盛仅支持整数）'))
    const transferno = makeLeyTransferno()
    const r = await leyGamePost('deposit', { api_code: mapped, username, amount: amt, transferno })
    if (r.Code !== 0) throw new Error(r.Message || '转入失败')
    return { code: 200, message: '成功', status: 'success', data: { money: amt } }
  }

  if (shouldUsePhpGameBackend()) {
    const amt = amount != null && !Number.isNaN(amount) ? Math.max(0, amount) : 0
    if (amt < 0.01) return Promise.reject(new Error('转入金额无效'))
    const res: any = await phpGameClient.post('game/transfer/in', { platform: mapped, amount: String(amt) })
    if (res?.code === 0) {
      return { code: 200, message: '成功', status: 'success', data: { money: amt } }
    }
    throw new Error(res?.message || '转入失败')
  }

  if (shouldUseBetProxy()) {
    const amt = amount != null && !Number.isNaN(amount) ? Math.max(0, amount) : 0
    if (amt < 0.01) return Promise.reject(new Error('转入金额无效'))
    const playerId = toBetPlayerId(await getUserId())
    if (!playerId) return Promise.reject(new Error('请先登录'))
    const platType = apiCodeToPlatType(mapped)
    const currency = langToCurrency(localStorage.getItem('ly_lang') || 'zh_cn')
    await betTransfer({
      playerId, platType, currency,
      type: '1',
      amount: String(Math.floor(amt * 100) / 100),
      orderId: `in_${playerId}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    })
    return { code: 200, message: '成功', status: 'success', data: { money: amt } }
  }
  const lang = localStorage.getItem('ly_lang') || 'zh_cn'
  const amt = amount != null && !Number.isNaN(amount) ? Math.floor(amount) : undefined
  if (amt == null || amt < 0) return Promise.reject(new Error('转入金额无效'))
  const res = await apiClient.post<{ code?: number; message?: string; status?: string; money?: number }>(
    'game/deposit',
    { api_code: mapped, money: amt },
    { params: { lang } }
  )
  const r = res.data ?? res
  return { code: r?.code ?? 200, message: (r as { message?: string }).message ?? '', status: (r as { status?: string }).status, data: { money: (r as { money?: number }).money ?? amt } }
}

// ---------------------------------------------------------------------------
// 游戏列表、API 列表（Supabase 或后端）
// ---------------------------------------------------------------------------

/** 电游大厅需要请求游戏列表的平台（ley gamelist 按 api_code 逐个请求后合并） */
const LEY_GAMELIST_PLATFORMS = ['PG', 'PP', 'JDB', 'CQ9', 'MG', 'PT', 'AT', 'OB', 'TTG', 'FC', 'ISB', 'PNG', 'RTG', 'GSS', 'AG', 'BBIN']

export const getGameList = (_category?: string): Promise<GameListResponse> => {
  if (shouldUseLeyGameApi()) {
    return Promise.all(
      LEY_GAMELIST_PLATFORMS.map((api_code) =>
        leyGamePost('gamelist', { api_code }).then((r) => ({ api_code, r })).catch(() => ({ api_code: '', r: { Code: -1, Data: undefined as Record<string, unknown> | undefined } }))
      )
    ).then((results) => {
      let globalIndex = 0
      const list: Game[] = []
      for (const { api_code, r } of results) {
        if (r.Code !== 0 || !api_code) continue
        const data = r.Data as Record<string, unknown> | undefined
        // 兼容多种返回：Data.gamelist / Data.Gamelist / Data.GameList / Data.list / Data 本身为数组
        const raw =
          (data && typeof data === 'object' && Array.isArray(data.gamelist) && data.gamelist) ||
          (data && typeof data === 'object' && Array.isArray((data as any).Gamelist) && (data as any).Gamelist) ||
          (data && typeof data === 'object' && Array.isArray((data as any).GameList) && (data as any).GameList) ||
          (data && typeof data === 'object' && Array.isArray(data.list) && data.list) ||
          (Array.isArray(r.Data) ? r.Data : [])
        const items = Array.isArray(raw) ? raw : []
        for (const g of items as Record<string, unknown>[]) {
          const status = String(g.status ?? '1')
          if (status === '2') continue
          const gameType = Number(g.gameType ?? 3)
          const categoryId = TYPE_TO_CATEGORY[gameType] || 'gaming'
          const cover = pickCoverUrl(g, 'img', 'cover', 'icon')
          list.push({
            id: ++globalIndex,
            category_id: categoryId,
            name: String(g.name || ''),
            platform_name: api_code.toUpperCase(),
            game_code: String(g.gameCode ?? '0'),
            game_type: gameType,
            gameType,
            app_state: 1,
            cover,
            tags: '',
            params: { gameCode: g.gameCode ?? '0', gameType }
          })
        }
      }
      return { code: 200, message: 'success', data: list }
    }).catch((err) => ({ code: 500, message: (err as Error)?.message || '获取失败', data: [] }))
  }
  if (shouldUsePhpGameBackend()) {
    return phpGameClient
      .get('game/list', { params: { limit: 5000 } })
      .then((res: any) => {
        const raw: any[] = res?.data?.list ?? res?.list ?? []
        const list: Game[] = (Array.isArray(raw) ? raw : []).map((g: any): Game => {
          const type = String(g.type || 'slot').toLowerCase()
          const gameType = SUPABASE_TYPE_TO_GAME_TYPE[type] ?? 3
          const categoryId = TYPE_TO_CATEGORY[gameType] || 'gaming'
          const cover = pickCoverUrl(g as Record<string, unknown>, 'cover', 'icon', 'cover_url', 'icon_url')
          return {
            id: Number(g.id) || 0,
            category_id: categoryId,
            name: String(g.name || ''),
            platform_name: String(g.platform || '').toUpperCase(),
            game_code: String(g.gameId ?? g.game_id ?? ''),
            game_type: gameType,
            gameType: gameType,
            app_state: 1,
            cover,
            tags: '',
            params: { gameCode: g.gameId ?? g.game_id, gameType }
          }
        })
        return { code: 200, message: 'success', data: list }
      })
      .catch((err: any) => ({ code: 500, message: (err as Error)?.message || '获取失败', data: [] }))
  }
  if (USE_SUPABASE_DATA) {
    const p = supabase
      .from(SUPABASE_TABLES.caipiao_game)
      .select('id, game_id, name, platform, type, icon, cover, hot, new, status, sort')
      .eq('status', 'online')
      .order('sort', { ascending: true })
      .order('id', { ascending: true })
      .then(({ data, error }) => {
        if (error) return { code: 500, message: error.message, data: [] }
        const list: Game[] = (data || []).map((row: Record<string, unknown>) => {
          const gameType = SUPABASE_TYPE_TO_GAME_TYPE[String(row.type)] ?? 3
          const categoryId = TYPE_TO_CATEGORY[gameType] || 'gaming'
          const cover = pickCoverUrl(row, 'cover', 'icon', 'cover_url', 'icon_url', 'image', 'img')
      return {
            id: row.id as number,
            category_id: categoryId,
            name: String(row.name || ''),
            platform_name: String(row.platform || '').toUpperCase(),
            game_code: String(row.game_id || ''),
            game_type: gameType,
            gameType: gameType,
            app_state: 1,
            cover,
            tags: '',
            params: { gameCode: row.game_id, gameType },
            hot: row.hot != null ? Number(row.hot) : 0,
            raw: row
          }
        })
        return { code: 200, message: 'success', data: list }
      })
    return Promise.resolve(p)
  }
  const gameTypes = [1, 3, 4, 5, 6]
  const typeMap: Record<number, string> = { 1: 'live', 3: 'slot', 4: 'lottery', 5: 'sport', 6: 'fishing' }
  return Promise.all(
    gameTypes.map(gt =>
      apiClient.get('game/list', { params: { type: typeMap[gt] ?? 'slot', page: 1, limit: 500 } }).then((res: any) => {
        const raw = res?.data?.list ?? res?.data ?? res
        const arr: any[] = Array.isArray(raw) ? raw : (raw?.data ?? [])
        return arr.map((g: any): Game => {
          const typeNum: number = (typeof g.type === 'string' ? SUPABASE_TYPE_TO_GAME_TYPE[g.type] : undefined) ?? (Number(g.game_type ?? gt) || gt)
          const categoryId = TYPE_TO_CATEGORY[typeNum] || 'concise'
          const cover = pickCoverUrl(g as Record<string, unknown>, 'cover', 'icon', 'cover_url', 'icon_url', 'image', 'img', 'full_image_url', 'img_url', 'mobile_pic', 'web_pic')
          return {
            id: Number(g.id) || 0,
            category_id: categoryId,
            name: String(g.name || ''),
            platform_name: String((g.platform ?? g.api_name) ?? '').toUpperCase(),
            game_code: String(g?.params?.gameCode ?? g.gameId ?? g.game_code ?? ''),
            game_type: typeNum,
            gameType: typeNum,
            app_state: (g.is_open === 1 || g.is_open === '1') ? 1 : 0,
            cover,
            tags: String(g.tags || ''),
            params: g.params ?? {},
          }
        })
      }).catch(() => [] as Game[])
    )
  ).then(results => ({ code: 200, message: 'success', data: results.flat() } as GameListResponse))
    .catch(err => ({ code: 500, message: (err as Error)?.message || '获取游戏列表失败', data: [] } as GameListResponse))
}

export const getApiGames = (): Promise<{ code: number; message: string; data: ApiGameItem[] }> => {
  if (shouldUsePhpGameBackend()) {
    return phpGameClient
      .get('game/list', { params: { limit: 500 } })
      .then((res: any) => {
        const raw: any[] = res?.data?.list ?? res?.list ?? []
        const data: ApiGameItem[] = (Array.isArray(raw) ? raw : []).map((row: any) => ({
          title: String(row.name || ''),
          api_name: String(row.platform || ''),
          game_type: 1,
          platform_name: String(row.platform || '').toUpperCase(),
          game_code: String(row.gameId ?? row.game_id ?? ''),
          cover: pickCoverUrl(row, 'cover', 'icon')
        }))
        return { code: 200, message: 'success', data }
      })
      .catch(() => ({ code: 500, message: '获取失败', data: [] }))
  }
  if (USE_SUPABASE_DATA) {
    return supabase
      .from(SUPABASE_TABLES.caipiao_game)
      .select('id, game_id, name, platform, type, icon, cover, hot, new')
      .eq('status', 'online')
      .order('sort', { ascending: true })
      .then(({ data, error }) => {
        if (error) return { code: 500, message: error.message, data: [] }
        const list: ApiGameItem[] = (data || []).map((row: Record<string, unknown>) => ({
          title: String(row.name || ''),
          api_name: String(row.platform || ''),
          game_type: 1,
          mobile_pic: row.cover || row.icon,
          web_pic: row.cover || row.icon,
          platform_name: String(row.platform || '').toUpperCase(),
          game_code: String(row.game_id || ''),
          cover: (row.cover || row.icon) ? resolveImageUrl(String(row.cover || row.icon || '')) : ''
        }))
        return { code: 200, message: 'success', data: list }
      }) as Promise<{ code: number; message: string; data: ApiGameItem[] }>
  }
  return apiClient.get('game/list', { params: { page: 1, limit: 500 } }).then((res: { data?: unknown; code?: number }) => {
    const raw = (res.data as { list?: unknown[] })?.list ?? (res.data as { data?: unknown[] })?.data ?? res.data
    const arr = Array.isArray(raw) ? raw : []
    const data: ApiGameItem[] = arr.map((item: Record<string, unknown>) => ({
      title: String(item.title ?? item.name ?? item.api_name ?? ''),
      api_name: String(item.platform ?? item.api_name ?? ''),
      game_type: Number(item.game_type ?? 1),
      mobile_pic: item.mobile_pic ?? item.cover ?? item.icon,
      web_pic: item.web_pic ?? item.cover ?? item.icon,
      platform_name: String((item.platform ?? item.api_name) ?? '').toUpperCase(),
      game_code: String((item.params as { gameCode?: string })?.gameCode ?? item.game_code ?? item.game_id ?? '0'),
      cover: pickCoverUrl(item, 'cover', 'icon', 'mobile_pic', 'web_pic')
    }))
    return { code: res.code ?? 200, message: 'success', data }
  })
}

const GAME_TYPE_TO_PHP: Record<number, string> = {
  1: 'live', 2: 'slot', 3: 'slot', 4: 'lottery', 5: 'sport', 6: 'fishing', 7: 'chess'
}

export const getGameApiList = (gameType: number, _isMobile: number = 1): Promise<GameApiListResponse> => {
  if (shouldUsePhpGameBackend()) {
    const type = GAME_TYPE_TO_PHP[gameType] || 'slot'
    return phpGameClient
      .get('game/platforms', { params: { type } })
      .then((res: any) => {
        const raw: any[] = res?.data?.list ?? []
        const data: GameApi[] = raw.map((row: any, i: number) => ({
          id: (row.id as number) ?? i + 1,
          api_name: String(row.code || ''),
          title: String(row.name || ''),
          icon_url: row.icon ? String(row.icon) : undefined,
          game_type: gameType
        }))
        return { code: 200, message: 'success', data }
      })
      .catch(() => ({ code: 500, message: '获取失败', data: [] }))
  }
  if (USE_SUPABASE_DATA) {
    const st = GAME_TYPE_TO_SUPABASE[gameType] || 'slot'
    return supabase
      .from(SUPABASE_TABLES.caipiao_game)
      .select('id, game_id, name, platform, type, icon, cover')
      .eq('type', st)
      .eq('status', 'online')
      .order('sort', { ascending: true })
      .then(({ data, error }) => {
        if (error) return { code: 500, message: error.message, data: [] }
        const apis: GameApi[] = (data || []).map((row: Record<string, unknown>) => ({
          id: row.id as number,
          api_name: String(row.platform || ''),
          title: String(row.name || ''),
          icon_url: (row.icon || row.cover) != null ? String(row.icon || row.cover) : undefined,
          game_type: gameType
        }))
        return { code: 200, message: 'success', data: apis }
      }) as Promise<GameApiListResponse>
  }
  const type = GAME_TYPE_TO_PHP[gameType] || 'slot'
  return apiClient.get('game/platforms', { params: { type } }).then((res: { data?: GameApi[] | { list?: GameApi[] }; code?: number; message?: string }) => {
    const raw = (res.data as { list?: GameApi[] })?.list ?? res.data
    const data = Array.isArray(raw) ? raw : []
    return { code: res.code ?? 200, message: res.message ?? '', data }
  })
}

// ---------------------------------------------------------------------------
// 投注记录、游戏类型、接口余额（走后端）
// ---------------------------------------------------------------------------

export const getGameType = (): Promise<GameTypeResponse> => {
  const lang = localStorage.getItem('ly_lang') || 'zh_cn'
  return phpGameClient.get('game/categories', { params: { lang } }).then((res: any) => ({
    code: res?.code ?? 200,
    message: res?.message ?? '',
    data: res?.data ?? res?.list ?? []
  })).catch(() => ({ code: 200, message: '', data: [] }))
}

/** 默认游戏货币，与 api-bet 文档一致 */
const DEFAULT_CURRENCY = 'CNY'

/** 将 recordAll/recordHistory 返回的单条转为 GameRecord */
function mapBetRecordToGameRecord(item: BetRecordItem, index: number): GameRecord {
    return {
    id: index + 1,
    bet_id: item.gameOrderId,
    api_name: item.platType,
    game_name: item.gameName,
    playDetail: item.gameName,
    bet_amount: item.betAmount,
    betAmount: item.betAmount,
    valid_bet_amount: item.validAmount,
    validBetAmount: item.validAmount,
    net_amount: item.settledAmount,
    netAmount: item.settledAmount,
    win_amount: Number(item.betAmount) + Number(item.settledAmount),
    bet_time: item.betTime || item.lastUpdateTime,
    betTime: item.betTime || item.lastUpdateTime,
    created_at: item.lastUpdateTime || item.betTime,
    status: item.status,
    state: item.status
  }
}

/** 根据 date 或 start_time/end_time 计算时间范围，格式 yyyy-MM-dd HH:mm:ss */
function getRecordTimeRange(params: GameRecordRequest): { startTime?: string; endTime?: string } {
  if (params.start_time && params.end_time) return { startTime: params.start_time, endTime: params.end_time }
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const todayStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} 00:00:00`
  const todayEnd = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  const date = params.date ?? ''
  if (date === '1') return { startTime: todayStart, endTime: todayEnd }
  if (date === '2') {
    const y = new Date(now); y.setDate(y.getDate() - 1)
    const ys = `${y.getFullYear()}-${pad(y.getMonth() + 1)}-${pad(y.getDate())} 00:00:00`
    const ye = `${y.getFullYear()}-${pad(y.getMonth() + 1)}-${pad(y.getDate())} 23:59:59`
    return { startTime: ys, endTime: ye }
  }
  if (date === '4') {
    const from = new Date(now); from.setDate(from.getDate() - 30)
    const fs = `${from.getFullYear()}-${pad(from.getMonth() + 1)}-${pad(from.getDate())} 00:00:00`
    return { startTime: fs, endTime: todayEnd }
  }
  return {}
}

export const getGameRecord = (params: GameRecordRequest = {}): Promise<GameRecordResponse> => {
  const limit = params.limit ?? 20
  const page = params.page ?? 1
  const currency = DEFAULT_CURRENCY
  const pageNo = String(page)
  const pageSize = String(limit)

  const buildResponse = (list: GameRecord[], total: number) => {
    const lastPage = Math.max(1, Math.ceil(total / limit))
    let sumBet = 0, sumSettled = 0
    list.forEach((r: GameRecord) => {
      sumBet += Number(r.bet_amount ?? r.betAmount ?? 0)
      sumSettled += Number(r.net_amount ?? r.netAmount ?? 0)
    })
      return {
        code: 200,
      message: '',
      data: { data: list, current_page: page, total, last_page: lastPage },
      statistic: { sum_bet_amount: sumBet, sum_net_amount: sumSettled }
    }
  }

  return (async (): Promise<GameRecordResponse> => {
    try {
      const { startTime, endTime } = getRecordTimeRange(params)
      if (startTime && endTime) {
        const res = await betRecordHistory({ currency, startTime, endTime, pageNo, pageSize })
        if (res.code === 10000 && res.data?.list) {
          const list = res.data.list.map((r, i) => mapBetRecordToGameRecord(r, (page - 1) * limit + i))
          return buildResponse(list, res.data.total ?? 0)
        }
      } else {
        const res = await betRecordAll({ currency, pageNo, pageSize })
        if (res.code === 10000 && res.data?.list) {
          const list = res.data.list.map((r, i) => mapBetRecordToGameRecord(r, (page - 1) * limit + i))
          return buildResponse(list, res.data.total ?? 0)
        }
      }
    } catch (_) {
      // bet-proxy 不可用或报错时走 PHP
    }
    if (shouldUsePhpGameBackend()) {
      const { startTime, endTime } = getRecordTimeRange(params)
      const res: any = await phpGameClient.get('game/records', {
        params: {
          platform: params.api_name || params.api_code,
          startDate: startTime,
          endDate: endTime,
          page,
          pageSize: limit
        }
      })
      const rawList: any[] = res?.data?.list ?? []
      const list: GameRecord[] = rawList.map((r: any) => ({
        id: r.id,
        bet_id: r.orderNo ?? r.order_no,
        api_name: r.platform,
        game_name: r.gameName ?? r.game_name,
        bet_amount: r.betAmount ?? r.bet_amount,
        betAmount: r.betAmount ?? r.bet_amount,
        valid_bet_amount: r.betAmount ?? r.bet_amount,
        validBetAmount: r.betAmount ?? r.bet_amount,
        net_amount: r.profit ?? r.win_amount,
        netAmount: r.profit ?? r.win_amount,
        win_amount: r.winAmount ?? r.win_amount,
        bet_time: r.betTime ?? r.bet_time ?? r.created_at,
        betTime: r.betTime ?? r.bet_time ?? r.created_at,
        created_at: r.betTime ?? r.bet_time ?? r.created_at,
        status: r.status,
        state: r.status
      }))
      const total: number = res?.data?.total ?? list.length
      return buildResponse(list, total)
    }
    const lang = localStorage.getItem('ly_lang') || 'zh_cn'
    const body: Record<string, unknown> = { limit, page }
    if (params.api_name) body.api_name = params.api_name
    else if (params.api_code) body.api_name = params.api_code
    if (params.gameType != null && params.gameType !== '') body.gameType = params.gameType
    else if (params.game_type != null && params.game_type !== '') body.gameType = params.game_type
    if (params.created_at?.length) body.created_at = params.created_at
    if (params.start_time && params.end_time) body.created_at = [params.start_time, params.end_time]
    return apiClient.post(`/game/record`, body, { params: { lang } })
  })()
}

export const getApiMoney = (apiCode: string): Promise<ApiMoneyResponse> => {
  return (phpGameClient.get('game/platform-balances') as Promise<any>).then((res: any) => {
    const list: Array<{ code: string; balance?: string | number }> = res?.data?.platforms ?? []
    const platform = String(apiCode || '').toUpperCase()
    const item = list.find((p) => String(p.code).toUpperCase() === platform)
    const money = item ? Number(item.balance ?? 0) : 0
    const money_info = [{ api_name: platform, api_title: platform, money }]
    return { code: 200, message: 'success', data: { money_info, is_trans_on: 1 } }
  }).catch(() => ({ code: 500, message: '获取失败', data: { money_info: [], is_trans_on: 1 } }))
}
