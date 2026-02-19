/**
 * api-bet.net 游戏接口封装（与管理后台 ht 统一走同一代理）
 * - 浏览器内始终走同域 /api/bet-proxy，由 Vite 代理或 Vercel 重写转发，避免 CORS
 * - VITE_BET_PROXY_URL：开发时 Vite 代理目标；生产时由 vercel.json 重写到 api.amjsvip.cc
 */

/** 浏览器内使用同源，避免跨域；Node/SSR 时使用 VITE_BET_PROXY_URL 或空 */
function getProxyBase(): string {
  if (typeof window !== 'undefined') return window.location.origin
  const url = (import.meta.env.VITE_BET_PROXY_URL as string) || ''
  return url.replace(/\/+$/, '') || ''
}

export interface BetApiResponse<T = unknown> {
  code: number
  msg: string
  data: T
}

export async function betProxyRequest<T = unknown>(
  path: string,
  body: Record<string, unknown> = {}
): Promise<BetApiResponse<T>> {
  const base = getProxyBase()
  const url = `${base}/api/bet-proxy`
  if (typeof console !== 'undefined' && console.info) {
    console.info('[bet-proxy] 请求:', url, { path, body })
  }
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, body })
    })
  } catch (e: any) {
    const msg = e?.message ?? '网络请求失败'
    if (typeof console !== 'undefined' && console.error) {
      console.error('[bet-proxy] 请求异常:', msg, 'URL:', url, e)
    }
    const err = new Error(msg) as Error & { code?: number; isNetworkError?: boolean }
    err.isNetworkError = true
    throw err
  }
  const raw = await res.text()
  let data: BetApiResponse<T>
  try {
    data = (raw ? JSON.parse(raw) : {}) as BetApiResponse<T>
  } catch {
    const msg = res.status === 502 || res.status === 504
      ? `代理或上游超时(${res.status})，请检查 bet-proxy 与 api-bet 网络`
      : `响应非 JSON (HTTP ${res.status})`
    throw new Error(msg)
  }
  if (!res.ok) {
    const msg = (data as { msg?: string }).msg ?? `HTTP ${res.status}`
    throw new Error(msg)
  }
  // api-bet.net 成功码为 10000；10002=账号已存在，创建玩家时视为成功
  const code = (data as { code?: number }).code
  if (code != null && code !== 10000) {
    if (path === 'server/create' && [10002, 10101].includes(code)) return data // 账号已存在等视为成功，与 boyue 一致
    const msg = (data as { msg?: string }).msg ?? `接口错误(code: ${code})`
    const err = new Error(msg) as Error & { code?: number; response?: unknown; path?: string }
    err.code = code
    err.response = data
    err.path = path
    throw err
  }
  return data
}

export function betCreate(params: { playerId: string; platType: string; currency: string }) {
  return betProxyRequest('server/create', params)
}

export function betBalance(params: { playerId: string; platType: string; currency: string }) {
  return betProxyRequest<{ balance: number | null }>('server/balance', params)
}

export function betBalanceAll(params: { playerId: string; currency: string }) {
  return betProxyRequest<Record<string, number | null>>('server/balanceAll', params)
}

export function betTransferAll(params: { playerId: string; currency: string }) {
  return betProxyRequest<Record<string, number>>('server/transferAll', params)
}

export function betGameUrl(params: {
  playerId: string
  platType: string
  currency: string
  gameType: string
  ingress: string
  lang?: string
  gameCode?: string
  returnUrl?: string
  oddsType?: string
}) {
  return betProxyRequest<{ url: string }>('server/gameUrl', params)
}

export function betDemoUrl(params: {
  platType: string
  currency: string
  gameType: string
  ingress: string
  lang?: string
  gameCode?: string
  returnUrl?: string
}) {
  return betProxyRequest<{ url: string }>('server/demoUrl', params)
}

export function betRecordAll(params: { currency: string; pageNo?: string; pageSize?: string }) {
  return betProxyRequest<{
    total: number
    pageNo: number
    pageSize: number
    list: BetRecordItem[]
  }>('server/recordAll', params)
}

export function betRecordHistory(params: {
  currency: string
  startTime: string
  endTime: string
  pageNo?: string
  pageSize?: string
}) {
  return betProxyRequest<{
    total: number
    pageNo: number
    pageSize: number
    list: BetRecordItem[]
  }>('server/recordHistory', params)
}

export function betRecordOrder(params: { currency: string; orderId: string }) {
  return betProxyRequest<{
    total: number
    pageNo: number
    pageSize: number
    list: BetRecordItem[]
  }>('server/recordOrder', params)
}

export function betTransfer(params: {
  playerId: string
  platType: string
  currency: string
  type: '1' | '2'
  amount: string
  orderId?: string
}) {
  return betProxyRequest('server/transfer', params)
}

export function betTransferStatus(params: {
  playerId: string
  currency: string
  orderId: string
}) {
  return betProxyRequest<{
    playerId: string
    orderId: string
    createTime: string
    amount: number
    afterBalance: number
    status: number
  }>('server/transferStatus', params)
}

export function betGameCode(params: { platType: string }) {
  return betProxyRequest<BetGameCodeItem[]>('server/gameCode', params)
}

export function betQuota(params: { currency: string }) {
  return betProxyRequest<BetQuotaData>('server/quota', params)
}

export interface BetRecordItem {
  playerId: string
  platType: string
  currency: string
  gameType: string
  gameName: string
  round: string
  table: string
  seat: string
  betAmount: number
  validAmount: number
  settledAmount: number
  betContent: string
  status: number
  gameOrderId: string
  betTime: string
  lastUpdateTime: string
}

export interface BetGameCodeItem {
  platType: string
  gameType: string
  gameCode: string
  ingress: string
  gameName: Record<string, string>
}

export interface BetQuotaData {
  model: string
  [currency: string]: unknown
  costRatio?: number
  ratios?: { platfrom: string; ratio: number }[]
}
