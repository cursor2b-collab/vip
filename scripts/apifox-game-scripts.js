/**
 * Apifox 游戏接口测试脚本
 * 用法：将下方对应脚本复制到 Apifox 的「前置操作」或「后置操作」中运行。
 * 前置操作：在发送请求前执行（可设置环境变量、动态 URL 等）
 * 后置操作：在收到响应后执行（可断言、提取变量、打印信息）
 */

// ==================== 前置操作示例 ====================
// 复制到 Apifox：请求 -> 前置操作 -> 脚本 中

// 示例1：为 bet-proxy 请求自动生成 body（若用环境变量控制 path）
// const path = pm.environment.get('bet_path') || 'server/create';
// const body = {
//   playerId: pm.environment.get('player_id') || 'testuser01',
//   platType: pm.environment.get('plat_type') || 'pg',
//   currency: pm.environment.get('currency') || 'CNY',
// };
// if (path === 'server/gameUrl') {
//   body.gameType = '2';
//   body.ingress = 'device1';
//   body.gameCode = pm.environment.get('game_code') || '1420892';
// } else if (path === 'server/transfer') {
//   body.type = '1';
//   body.amount = pm.environment.get('transfer_amount') || '100';
//   body.orderId = 'order_' + Date.now();
// }
// pm.request.body.raw = JSON.stringify({ path, body });

// 示例2：确保请求头
// pm.request.headers.upsert({ key: 'Content-Type', value: 'application/json' });


// ==================== 后置操作（测试脚本）示例 ====================
// 复制到 Apifox：请求 -> 后置操作 -> 测试 中

function apifoxPostTestBetProxy() {
  // 解析响应
  const json = pm.response.json();
  const code = json.code;
  const msg = json.msg || json.message || '';
  const data = json.data;

  // 断言：业务码
  pm.test('返回 code 存在', function() {
    pm.expect(code).to.be.a('number');
  });

  // bet-proxy / api-bet 成功码 10000；10002 为账号已存在（创建玩家时视为成功）
  const successCodes = [10000, 10002, 10101];
  if (successCodes.includes(code)) {
    pm.test('接口成功 (code=10000/10002/10101)', function() {
      pm.expect(successCodes).to.include(code);
    });
    if (data && (data.url || data.game_url)) {
      pm.environment.set('last_game_url', data.url || data.game_url);
    }
  } else {
    pm.test('接口失败时记录错误信息', function() {
      console.log('code:', code, 'msg:', msg, 'data:', data);
    });
  }

  // 响应时间
  pm.test('响应时间 < 30s', function() {
    pm.expect(pm.response.responseTime).to.be.below(30000);
  });
}

function apifoxPostTestGameBackend() {
  const json = pm.response.json();
  const code = json.code;
  pm.test('返回 code 存在', function() {
    pm.expect(code).to.be.a('number');
  });
  pm.test('业务成功或可解析', function() {
    pm.expect([200, 0]).to.include(code);
  });
}


// ==================== 在 Apifox 中实际使用的后置脚本（复制下面整段） ====================
// 用于「bet-proxy」请求时粘贴到后置 -> 测试：

/*
const json = pm.response.json();
const code = json.code;
const msg = json.msg || json.message || '';

pm.test('返回 code 为数字', function() {
  pm.expect(code).to.be.a('number');
});

if ([10000, 10002, 10101].includes(code)) {
  pm.test('接口成功', function() {
    pm.expect(true).to.be.true;
  });
  if (json.data && (json.data.url || json.data.game_url)) {
    pm.environment.set('last_game_url', json.data.url || json.data.game_url);
  }
} else {
  pm.test('记录错误', function() {
    console.log('code:', code, 'msg:', msg, 'data:', json.data);
  });
}

pm.test('响应时间 < 60s', function() {
  pm.expect(pm.response.responseTime).to.be.below(60000);
});
*/
