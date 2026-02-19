#!/usr/bin/env bash
# 游戏接口（bet-proxy）快速检查脚本
# 用法: ./scripts/check-bet-proxy.sh [bet-proxy根地址]
# 示例: ./scripts/check-bet-proxy.sh https://api.amjsvip.cc

set -e
BASE="${1:-${VITE_BET_PROXY_URL:-https://api.amjsvip.cc}}"
BASE="${BASE%/}"
URL="${BASE}/api/bet-proxy"

echo "=========================================="
echo "检查 bet-proxy: $URL"
echo "=========================================="

# 1. 简单连通性：POST server/create
echo ""
echo "[1/3] POST server/create (创建玩家)..."
HTTP=$(curl -s -o /tmp/bet-proxy-check.json -w "%{http_code}" -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"path":"server/create","body":{"playerId":"check_'$(date +%s)'","platType":"pg","currency":"CNY"}}' \
  --connect-timeout 10 --max-time 25 2>/dev/null || echo "000")

if [ "$HTTP" = "000" ]; then
  echo "    结果: 失败 (连接超时或无法连接)"
  echo "    建议: 检查域名解析、防火墙、服务器是否启动 bet-proxy"
  exit 1
fi

echo "    HTTP 状态: $HTTP"
if [ "$HTTP" != "200" ]; then
  echo "    响应体:"
  cat /tmp/bet-proxy-check.json 2>/dev/null | head -c 500
  echo ""
  echo "    建议: 502/504 多为上游 api-bet 超时或不可达，请查 Nginx 错误日志与上游白名单"
  exit 1
fi

CODE=$(node -e "try{const d=require('/tmp/bet-proxy-check.json');console.log(d.code||'')}catch(e){console.log('')}" 2>/dev/null || echo "")
if [ "$CODE" = "10000" ] || [ "$CODE" = "10002" ] || [ "$CODE" = "10101" ]; then
  echo "    业务码: $CODE (正常)"
else
  echo "    业务码: $CODE (非 10000/10002/10101 可能表示配置或上游异常)"
fi

# 2. 获取游戏链接
echo ""
echo "[2/3] POST server/gameUrl (获取游戏链接)..."
HTTP2=$(curl -s -o /tmp/bet-proxy-game.json -w "%{http_code}" -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"path":"server/gameUrl","body":{"playerId":"test01","platType":"pg","currency":"CNY","gameType":"2","ingress":"device1","gameCode":"1420892"}}' \
  --connect-timeout 10 --max-time 25 2>/dev/null || echo "000")

echo "    HTTP 状态: $HTTP2"
if [ "$HTTP2" = "200" ]; then
  HAS_URL=$(node -e "try{const d=require('/tmp/bet-proxy-game.json');console.log(d.data&&d.data.url?'ok':'')}catch(e){console.log('')}" 2>/dev/null || echo "")
  if [ "$HAS_URL" = "ok" ]; then
    echo "    结果: 成功，已返回游戏 URL"
  else
    echo "    结果: 200 但未包含 data.url，请查看返回 code/msg"
  fi
else
  echo "    结果: 失败 (HTTP $HTTP2)"
fi

# 3. 余额
echo ""
echo "[3/3] POST server/balance (查询余额)..."
HTTP3=$(curl -s -o /tmp/bet-proxy-balance.json -w "%{http_code}" -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"path":"server/balance","body":{"playerId":"test01","platType":"pg","currency":"CNY"}}' \
  --connect-timeout 10 --max-time 15 2>/dev/null || echo "000")
echo "    HTTP 状态: $HTTP3"

echo ""
echo "=========================================="
echo "检查结束。若 HTTP 均为 200 且业务码正常，则接口可用。"
echo "详细说明见: docs/check-bet-proxy.md"
echo "=========================================="
