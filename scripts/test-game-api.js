/**
 * 游戏接口本地测试脚本（与 Apifox 请求一致，便于对照）
 * 运行：在 B77qianduan 目录下执行 node scripts/test-game-api.js
 * 环境变量：可设置 VITE_BET_PROXY_URL、TEST_PLAYER_ID，或直接修改下方 CONFIG
 */

const CONFIG = {
  betProxyUrl: process.env.VITE_BET_PROXY_URL || 'https://api.amjsvip.cc',
  playerId: process.env.TEST_PLAYER_ID || 'testuser01',
  platType: 'pg',
  currency: 'CNY',
  gameCode: '1420892',
}

async function betProxy(path, body = {}) {
  const base = CONFIG.betProxyUrl.replace(/\/+$/, '')
  const url = base + '/api/bet-proxy'
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, body }),
  })
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Response is not JSON: ' + text.slice(0, 200))
  }
  return { status: res.status, data }
}

async function main() {
  console.log('Config:', CONFIG)
  console.log('---')

  console.log('1. Create player server/create')
  const createRes = await betProxy('server/create', {
    playerId: CONFIG.playerId,
    platType: CONFIG.platType,
    currency: CONFIG.currency,
  })
  console.log('   HTTP', createRes.status)
  console.log('   Body', JSON.stringify(createRes.data, null, 2))
  const ok = [10000, 10002, 10101].includes(createRes.data && createRes.data.code)
  if (!ok) console.log('   Create failed, gameUrl may fail.')
  console.log('---')

  console.log('2. Get game URL server/gameUrl')
  const urlRes = await betProxy('server/gameUrl', {
    playerId: CONFIG.playerId,
    platType: CONFIG.platType,
    currency: CONFIG.currency,
    gameType: '2',
    ingress: 'device1',
    gameCode: CONFIG.gameCode,
  })
  console.log('   HTTP', urlRes.status)
  console.log('   Body', JSON.stringify(urlRes.data, null, 2))
  const u = urlRes.data && urlRes.data.data && urlRes.data.data.url
  if (u) console.log('   URL:', u.slice(0, 80) + '...')
  console.log('---')

  console.log('3. Balance server/balance')
  const balRes = await betProxy('server/balance', {
    playerId: CONFIG.playerId,
    platType: CONFIG.platType,
    currency: CONFIG.currency,
  })
  console.log('   HTTP', balRes.status)
  console.log('   Body', JSON.stringify(balRes.data, null, 2))
  console.log('---')

  console.log('Done. Use same path/body in Apifox to compare.')
}

main().catch(function (err) {
  console.error(err)
  process.exit(1)
})
