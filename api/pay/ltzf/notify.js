/**
 * 朝风支付 - 支付结果异步回调（GET）
 * 朝风支付成功后会 GET 此地址，需验签后入账并返回 "success"
 * Vercel 部署后地址：https://你的域名.vercel.app/api/pay/ltzf/notify
 *
 * 环境变量（Vercel 中与前端共用）：
 * - VITE_LTZF_KEY 或 LTZF_KEY：朝风对接秘钥，用于验签
 */
const crypto = require('crypto');

function ltzfSignVerify(params, key) {
  const sorted = [];
  for (const k of Object.keys(params).sort()) {
    if (k === 'sign') continue;
    const v = params[k];
    if (v === undefined || v === null || v === '') continue;
    sorted.push(`${k}=${v}`);
  }
  const stringA = sorted.join('&');
  const stringSignTemp = stringA + '&key=' + key;
  const sign = crypto.createHash('md5').update(stringSignTemp).digest('hex').toUpperCase();
  return sign;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const key = process.env.LTZF_KEY || process.env.VITE_LTZF_KEY || '';
  if (!key) {
    console.error('[ltzf/notify] 未配置 LTZF_KEY 或 VITE_LTZF_KEY');
    res.status(500).send('fail');
    return;
  }

  const query = req.query || {};
  const sign = query.sign;
  if (!sign) {
    console.error('[ltzf/notify] 缺少 sign');
    res.status(400).send('fail');
    return;
  }

  const computedSign = ltzfSignVerify(query, key);
  if (computedSign !== sign) {
    console.error('[ltzf/notify] 签名校验失败');
    res.status(400).send('fail');
    return;
  }

  const status = Number(query.status);
  const mchOrderNo = query.mchOrderNo || '';
  const amount = Number(query.amount) || 0; // 单位：分
  const payOrderId = query.payOrderId || '';

  // status: 2-支付成功 3-业务处理完成（都表示支付成功）
  if (status !== 2 && status !== 3) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send('success');
    return;
  }

  const amountYuan = amount / 100;
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
    if (supabaseUrl && serviceRoleKey) {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      const { data: orderRow, error: orderErr } = await supabase
        .from('ltzf_recharge_orders')
        .select('id, user_id, amount_yuan, status')
        .eq('mch_order_no', mchOrderNo)
        .maybeSingle();
      if (orderErr) {
        console.error('[ltzf/notify] 查询订单失败', orderErr);
      } else if (orderRow && orderRow.status !== 'paid') {
        const userId = orderRow.user_id;
        const add = Number(amountYuan) || 0;
        if (add > 0) {
          const { error: rpcErr } = await supabase.rpc('increment_profile_balance', {
            p_user_id: userId,
            p_delta: add,
          });
          if (rpcErr) {
            const { data: prof } = await supabase.from('profiles').select('balance').eq('id', userId).single();
            const before = Number(prof?.balance ?? 0) || 0;
            const after = Math.round((before + add) * 100) / 100;
            const { error: updateBalErr } = await supabase
              .from('profiles')
              .update({ balance: after, updated_at: new Date().toISOString() })
              .eq('id', userId);
            if (updateBalErr) console.error('[ltzf/notify] 更新余额失败', updateBalErr);
            else console.log('[ltzf/notify] 自动上分成功(直更)', { mchOrderNo, userId, amountYuan });
          }
        }
        await supabase
          .from('ltzf_recharge_orders')
          .update({
            status: 'paid',
            pay_order_id: payOrderId || null,
            updated_at: new Date().toISOString(),
          })
          .eq('mch_order_no', mchOrderNo);
        console.log('[ltzf/notify] 自动上分成功', { mchOrderNo, userId, amountYuan });
      } else if (orderRow && orderRow.status === 'paid') {
        console.log('[ltzf/notify] 订单已处理过，跳过', mchOrderNo);
      } else {
        console.warn('[ltzf/notify] 未找到订单，无法上分', mchOrderNo);
      }
    } else {
      console.log('[ltzf/notify] 未配置 Supabase Service Role，仅记录', { mchOrderNo, payOrderId, amountYuan });
    }
  } catch (err) {
    console.error('[ltzf/notify] 入账失败', err);
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.status(200).send('success');
}
