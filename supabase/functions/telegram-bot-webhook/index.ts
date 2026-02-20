import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// 绑定账号需用 anon key 验证密码，请在 Supabase Edge Function 中添加 SUPABASE_ANON_KEY（同 Dashboard → API → anon public）
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";

/** 用户名转 Supabase 邮箱（与 auth.ts 一致） */
function toSupabaseEmail(name: string): string {
  const n = (name || "").trim();
  return n.includes("@") ? n : `${n}@supabase-admin.local`;
}

const BIND_FLOW_EXPIRE_MINUTES = 10;

// 默认欢迎文案与图片（从 sys_config 覆盖）
const DEFAULT_WELCOME_TEXT = `欢迎使用B77娱乐 TG 投注机器人！

在这里，您可以享受Vip贵宾会提供的全方位娱乐体验，包括电子游艺、棋牌对战、体育竞猜、捕鱼等多种热门项目。

官网： www.beebet77.com`;
const DEFAULT_WELCOME_IMAGE = Deno.env.get("TELEGRAM_WELCOME_IMAGE") || "https://www.beebet77.com/logo.png";
const DEFAULT_SERVICE_URL = "https://t.me/B77KF";

/** 从 sys_config 读取机器人配置 */
async function getBotConfig(supabase: ReturnType<typeof createClient>): Promise<{
  welcomeText: string;
  welcomeImage: string;
  serviceUrl: string;
}> {
  const { data } = await supabase
    .from("sys_config")
    .select("key, value")
    .in("key", ["telegram_welcome_text", "telegram_welcome_image", "telegram_service_url"]);
  const kv = Object.fromEntries((data || []).map((r: { key: string; value: string }) => [r.key, r.value]));
  return {
    welcomeText: kv.telegram_welcome_text?.trim() || DEFAULT_WELCOME_TEXT,
    welcomeImage: kv.telegram_welcome_image?.trim() || DEFAULT_WELCOME_IMAGE,
    serviceUrl: kv.telegram_service_url?.trim() || DEFAULT_SERVICE_URL,
  };
}

// 生成随机用户名（备用，当 Telegram 用户名为空或冲突时）
function genUsername(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const len = 6 + Math.floor(Math.random() * 3);
  let s = "";
  for (let i = 0; i < len; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

/** 从 Telegram 用户信息生成注册用户名（优先使用 @username） */
function usernameFromTelegram(from: unknown, tgUserId: number): string {
  const u = from as { username?: string } | null | undefined;
  const raw = String(u?.username ?? "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (raw.length >= 5 && raw.length <= 32) return raw;
  return "tg" + String(tgUserId);
}

// 生成随机密码（大小写+数字，8位，如 b8ZV6fjA）
function genPassword(): string {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const num = "0123456789";
  const all = lower + upper + num;
  let s = "";
  s += lower[Math.floor(Math.random() * lower.length)];
  s += upper[Math.floor(Math.random() * upper.length)];
  s += num[Math.floor(Math.random() * num.length)];
  for (let i = 0; i < 5; i++) {
    s += all[Math.floor(Math.random() * all.length)];
  }
  return s.split("").sort(() => Math.random() - 0.5).join("");
}

async function tgApi(method: string, body: Record<string, unknown>): Promise<{ ok?: boolean; description?: string; [k: string]: unknown }> {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data?.ok === false) {
    console.error("[tgApi]", method, "failed:", data.description || data);
  }
  return data;
}




// 进入游戏按钮链接：使用 tg（Telegram 用户 ID）实现可重复使用的链接，无需一次性 token
const FRONTEND_URL = "https://www.beebet77.com";

function buildGameUrl(tgUserId: number): string {
  const u = `${FRONTEND_URL}/telegram-game?tg=${tgUserId}`;
  if (u.includes("vercel.app")) {
    console.error("[BUG] gameUrl 含 vercel 域名! 强制修正", u);
  }
  return u;
}

/** 提现页面链接（带 tg 参数便于前端识别 Telegram 用户） */
function buildWithdrawUrl(tgUserId: number): string {
  return `${FRONTEND_URL}/withdraw?tg=${tgUserId}`;
}

/** 充值页面链接 */
function buildDepositUrl(tgUserId: number): string {
  return `${FRONTEND_URL}/deposit?tg=${tgUserId}`;
}

// 账号信息自定义表情 ID
const CUSTOM_EMOJI = {
  memberId: "5454158795729029479",     // 💎 会员ID
  memberAccount: "5456197560869873446", // 🇦🇪 会员账号
  memberPassword: "5467447119600180530", // 🔒 会员密码
  wallet: "5199527184229751349",        // 💰 钱包余额
  vip: "5909069246251406492",           // 😝 VIP等级
};

/** 构建账号信息（主键盘「账号信息」展示格式：您的账号信息 + 会员ID/账号/USDT/VIP） */
function buildAccountInfo(opts: {
  numId: string | number;
  username: string;
  password?: string;  // 注册成功时显示明文，否则不展示
  balance: number;
  vipLevel: number;
}) {
  const { numId, username, password, balance, vipLevel } = opts;
  const line1 = "您的账号信息\n\n";
  const line2 = `会员ID：${numId ?? "-"}\n`;
  const line3 = `会员账号：${username ?? "-"}\n`;
  const line4 = password !== undefined ? `会员密码：${password}\n` : "";
  const line5 = `USDT：${Number(balance ?? 0).toFixed(2)}\n`;
  const line6 = `VIP等级：${vipLevel ?? 0}`;

  const e1 = "💎", e2 = "🇦🇪", e3 = "🔒", e4 = "💰", e5 = "😝";  // 占位，由 custom_emoji 覆盖
  const text = line1 + e1 + " " + line2 + e2 + " " + line3 + (line4 ? e3 + " " + line4 : "") + e4 + " " + line5 + e5 + " " + line6;

  let o = line1.length;
  const entities: { type: "custom_emoji"; offset: number; length: number; custom_emoji_id: string }[] = [
    { type: "custom_emoji", offset: o, length: e1.length, custom_emoji_id: CUSTOM_EMOJI.memberId },
  ];
  o += e1.length + 1 + line2.length;
  entities.push({ type: "custom_emoji", offset: o, length: e2.length, custom_emoji_id: CUSTOM_EMOJI.memberAccount });
  o += e2.length + 1 + line3.length;
  if (line4) {
    entities.push({ type: "custom_emoji", offset: o, length: e3.length, custom_emoji_id: CUSTOM_EMOJI.memberPassword });
    o += e3.length + 1 + line4.length;
  }
  entities.push({ type: "custom_emoji", offset: o, length: e4.length, custom_emoji_id: CUSTOM_EMOJI.wallet });
  o += e4.length + 1 + line5.length;
  entities.push({ type: "custom_emoji", offset: o, length: e5.length, custom_emoji_id: CUSTOM_EMOJI.vip });

  return { text, entities };
}

/** 账号信息内联键盘（按截图布局，提现按钮打开提现页面） */
function buildAccountInfoInlineKeyboard(gameUrl: string, tgUserId: number) {
  const depositUrl = buildDepositUrl(tgUserId);
  const withdrawUrl = buildWithdrawUrl(tgUserId);
  const domainUrl = "https://9z.vip";
  return {
    inline_keyboard: [
      [{ text: "🎮 进入游戏", web_app: { url: gameUrl } }, { text: "🎧 官方客服", callback_data: "service" }],
      [{ text: "👥 邀请好友", callback_data: "invite" }, { text: "💰 充值", web_app: { url: depositUrl } }],
      [{ text: "📲 下载APP", url: `${FRONTEND_URL}/download` }, { text: "🏦 提现", web_app: { url: withdrawUrl } }],
      [{ text: "🔗 USDT钱包推荐,谨防假钱包", url: depositUrl }],
      [{ text: "🔗 易记域名(九洲VIP): 9Z.VIP", url: domainUrl }],
    ] as unknown[],
  };
}

/** 发送账号信息 */
async function sendAccountInfo(
  chatId: number,
  opts: { numId: string | number; username: string; password?: string; balance: number; vipLevel: number },
  replyMarkup: { inline_keyboard: unknown[] }
) {
  const { text, entities } = buildAccountInfo(opts);
  const r = await tgApi("sendMessage", { chat_id: chatId, text, entities, reply_markup: replyMarkup });
  if (r?.ok === false) {
    await tgApi("sendMessage", { chat_id: chatId, text, reply_markup: replyMarkup });
  }
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ ok: false }), { status: 405 });
    }
    if (!BOT_TOKEN) {
      console.error("TELEGRAM_BOT_TOKEN not set");
      return new Response(JSON.stringify({ ok: false }), { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  let payload: {
    message?: { chat: { id: number }; from?: { id: number }; text?: string };
    callback_query?: { id: string; from: { id: number }; data?: string; message?: { chat: { id: number } } };
  };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 400 });
  }

  const chatId = payload.message?.chat?.id ?? payload.callback_query?.message?.chat?.id;
  const tgUserId = payload.message?.from?.id ?? payload.callback_query?.from?.id;
  if (!chatId || !tgUserId) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  // 处理绑定流程中的用户输入（需在其它消息处理之前）
  if (payload.message?.text && !payload.callback_query) {
    const expireAt = new Date(Date.now() - BIND_FLOW_EXPIRE_MINUTES * 60 * 1000).toISOString();
    const { data: flow } = await supabase
      .from("telegram_bind_flow")
      .select("step, pending_username")
      .eq("telegram_user_id", tgUserId)
      .gt("created_at", expireAt)
      .maybeSingle();

    if (flow) {
      const txt = payload.message.text.trim();
      if (txt === "取消" || txt.toLowerCase() === "cancel") {
        await supabase.from("telegram_bind_flow").delete().eq("telegram_user_id", tgUserId);
        await tgApi("sendMessage", { chat_id: chatId, text: "已取消绑定" });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (flow.step === "username") {
        const username = txt;
        if (!username || username.length < 2) {
          await tgApi("sendMessage", { chat_id: chatId, text: "账号格式不正确，请输入有效的会员账号" });
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
        await supabase
          .from("telegram_bind_flow")
          .update({ step: "password", pending_username: username })
          .eq("telegram_user_id", tgUserId);
        await tgApi("sendMessage", {
          chat_id: chatId,
          text: "请输入您的登录密码",
          reply_markup: { inline_keyboard: [[{ text: "❌ 取消", callback_data: "bind_cancel" }]] },
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      if (flow.step === "password") {
        const password = txt;
        const username = flow.pending_username || "";
        await supabase.from("telegram_bind_flow").delete().eq("telegram_user_id", tgUserId);

        if (!SUPABASE_ANON_KEY) {
          await tgApi("sendMessage", { chat_id: chatId, text: "绑定功能暂不可用，请联系客服协助绑定" });
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }

        try {
          const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
          const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
            email: toSupabaseEmail(username),
            password,
          });

          if (signInError || !signInData?.user?.id) {
            await tgApi("sendMessage", { chat_id: chatId, text: "账号或密码错误，请检查后重试" });
            return new Response(JSON.stringify({ ok: true }), { status: 200 });
          }

          const userId = signInData.user.id;

          // 检查该账号是否已被其它 Telegram 绑定
          const { data: existingBind } = await supabase
            .from("telegram_user_bind")
            .select("telegram_user_id")
            .eq("user_id", userId)
            .maybeSingle();
          if (existingBind && existingBind.telegram_user_id !== tgUserId) {
            await tgApi("sendMessage", { chat_id: chatId, text: "该账号已绑定其他 Telegram，如需更换请联系客服" });
            return new Response(JSON.stringify({ ok: true }), { status: 200 });
          }

          await supabase.from("telegram_user_bind").upsert(
            { telegram_user_id: tgUserId, user_id: userId },
            { onConflict: "telegram_user_id" }
          );

          const { data: profile } = await supabase
            .from("profiles")
            .select("username, balance, vip_level, num_id")
            .eq("id", userId)
            .single();

          const gameUrl = buildGameUrl(tgUserId);
          await tgApi("sendMessage", { chat_id: chatId, text: "✅ 绑定成功！" });
          await sendAccountInfo(chatId, {
            numId: profile?.num_id ?? "-",
            username: profile?.username ?? username,
            balance: Number(profile?.balance ?? 0),
            vipLevel: profile?.vip_level ?? 0,
          }, buildAccountInfoInlineKeyboard(gameUrl, tgUserId));
        } catch (e) {
          console.error("[bind] verify error:", e);
          await tgApi("sendMessage", { chat_id: chatId, text: "验证失败，请稍后重试" });
        }
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
    }
  }

  // 处理主键盘按钮：账号信息
  if (payload.message?.text === "📋 账号信息" || payload.message?.text === "账号信息") {
    const { data: existing } = await supabase
      .from("telegram_user_bind")
      .select("user_id")
      .eq("telegram_user_id", tgUserId)
      .maybeSingle();
    if (existing?.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, balance, vip_level, num_id")
        .eq("id", existing.user_id)
        .single();
      const gameUrl = buildGameUrl(tgUserId);
      await sendAccountInfo(chatId, {
        numId: profile?.num_id ?? "-",
        username: profile?.username ?? "-",
        balance: Number(profile?.balance ?? 0),
        vipLevel: profile?.vip_level ?? 0,
      }, buildAccountInfoInlineKeyboard(gameUrl, tgUserId));
    } else {
      await tgApi("sendMessage", {
        chat_id: chatId,
        text: "请先注册或绑定账号",
        reply_markup: {
          inline_keyboard: [
            [{ text: "👤 注册账号", callback_data: "register" }],
            [{ text: "🔗 绑定账号", callback_data: "bind" }],
          ],
        },
      });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  // 处理主键盘按钮：充值（按截图格式）
  if (payload.message?.text === "💰 充值") {
    const { data: existing } = await supabase
      .from("telegram_user_bind")
      .select("user_id")
      .eq("telegram_user_id", tgUserId)
      .maybeSingle();
    if (existing?.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", existing.user_id)
        .maybeSingle();
      const balance = Number(profile?.balance ?? 0).toFixed(2);
      const depositUrl = buildDepositUrl(tgUserId);
      await tgApi("sendMessage", {
        chat_id: chatId,
        text: `✅ 用户充值\n💰 充值\n💸 余额: ${balance} USDT`,
        reply_markup: {
          inline_keyboard: [
            [{ text: "💵 USDT-TRC-20", web_app: { url: depositUrl } }, { text: "💻 充值记录", url: `${FRONTEND_URL}/deposit?tab=record&tg=${tgUserId}` }],
            [{ text: "🎧 官方客服", callback_data: "service" }],
          ],
        },
      });
    } else {
      await tgApi("sendMessage", {
        chat_id: chatId,
        text: "请先注册或绑定账号",
        reply_markup: {
          inline_keyboard: [
            [{ text: "👤 注册账号", callback_data: "register" }],
            [{ text: "🔗 绑定账号", callback_data: "bind" }],
          ],
        },
      });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  // 处理主键盘按钮：提现（按截图格式，提现按钮打开提现页面）
  if (payload.message?.text === "🏦 提现" || payload.message?.text === "💳 提现") {
    const { data: existing } = await supabase
      .from("telegram_user_bind")
      .select("user_id")
      .eq("telegram_user_id", tgUserId)
      .maybeSingle();
    if (existing?.user_id) {
      const withdrawUrl = buildWithdrawUrl(tgUserId);
      await tgApi("sendMessage", {
        chat_id: chatId,
        text: "✅ 用户提现\n💳 提现",
        reply_markup: {
          inline_keyboard: [
            [{ text: "💳 提现", web_app: { url: withdrawUrl } }],
            [{ text: "🎧 官方客服", callback_data: "service" }, { text: "📲 下载APP", url: `${FRONTEND_URL}/download` }],
          ],
        },
      });
    } else {
      await tgApi("sendMessage", {
        chat_id: chatId,
        text: "请先注册或绑定账号",
        reply_markup: {
          inline_keyboard: [
            [{ text: "👤 注册账号", callback_data: "register" }],
            [{ text: "🔗 绑定账号", callback_data: "bind" }],
          ],
        },
      });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  // 处理主键盘按钮：进入游戏（按截图：先发「点击进入游戏」，再发带按钮的消息）
  if (payload.message?.text === "🎮 进入游戏") {
    const { data: existing } = await supabase
      .from("telegram_user_bind")
      .select("user_id")
      .eq("telegram_user_id", tgUserId)
      .maybeSingle();
    if (existing?.user_id) {
      const gameUrl = buildGameUrl(tgUserId);
      await tgApi("sendMessage", { chat_id: chatId, text: "🎮 👉 点击进入游戏" });
      await tgApi("sendMessage", {
        chat_id: chatId,
        text: "🎮 进入游戏",
        reply_markup: {
          inline_keyboard: [[{ text: "🎮 进入游戏", web_app: { url: gameUrl } }]],
        },
      });
    } else {
      await tgApi("sendMessage", {
        chat_id: chatId,
        text: "请先注册或绑定账号",
        reply_markup: {
          inline_keyboard: [
            [{ text: "👤 注册账号", callback_data: "register" }],
            [{ text: "🔗 绑定账号", callback_data: "bind" }],
          ],
        },
      });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  // 处理主键盘按钮：切换语言
  if (payload.message?.text === "🌍 切换语言") {
    await tgApi("sendMessage", {
      chat_id: chatId,
      text: "请点击下方选择语言 / Please select language:",
      reply_markup: {
        inline_keyboard: [
          [{ text: "简体中文", callback_data: "lang_zh_cn" }, { text: "繁體中文", callback_data: "lang_zh_hk" }],
          [{ text: "English", callback_data: "lang_en" }, { text: "ไทย", callback_data: "lang_th" }],
        ],
      },
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  // 处理 /start
  if (payload.message?.text === "/start") {
    const cfg = await getBotConfig(supabase);
    // 欢迎消息用纯文本按钮（sendPhoto + web_app 键盘组合可能导致图片发送失败）
    const kbd = {
      keyboard: [
        [{ text: "📋 账号信息" }, { text: "🎮 进入游戏" }],
        [{ text: "💰 充值" }, { text: "🏦 提现" }],
        [{ text: "👥 邀请好友" }, { text: "🎧 官方客服" }],
        [{ text: "📲 下载APP" }, { text: "🌍 切换语言" }],
      ],
      resize_keyboard: true,
    };
    const photoR = cfg.welcomeImage
      ? await tgApi("sendPhoto", { chat_id: chatId, photo: cfg.welcomeImage, caption: cfg.welcomeText, reply_markup: kbd })
      : { ok: false };
    if (photoR?.ok === false) {
      await tgApi("sendMessage", { chat_id: chatId, text: cfg.welcomeText, reply_markup: kbd });
    }

    // 2. 已注册/绑定：直接发账号信息；未注册：发注册/绑定选择
    const { data: existing } = await supabase
      .from("telegram_user_bind")
      .select("user_id")
      .eq("telegram_user_id", tgUserId)
      .maybeSingle();

    if (existing?.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, balance, vip_level, num_id")
        .eq("id", existing.user_id)
        .single();
      const gameUrl = buildGameUrl(tgUserId);
      await sendAccountInfo(chatId, {
        numId: profile?.num_id ?? "-",
        username: profile?.username ?? "-",
        balance: Number(profile?.balance ?? 0),
        vipLevel: profile?.vip_level ?? 0,
      }, buildAccountInfoInlineKeyboard(gameUrl, tgUserId));
    } else {
      await tgApi("sendMessage", {
        chat_id: chatId,
        text: "请选择绑定或注册账号",
        reply_markup: {
          inline_keyboard: [
            [{ text: "👤 注册账号", callback_data: "register" }],
            [{ text: "🔗 绑定账号", callback_data: "bind" }],
          ],
        },
      });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  // 处理 callback_query
  const cb = payload.callback_query;
  if (cb) {
    const data = cb.data || "";
    const cfg = await getBotConfig(supabase);

    if (data === "service" && cfg.serviceUrl) {
      await tgApi("answerCallbackQuery", { callback_query_id: cb.id, url: cfg.serviceUrl });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    await tgApi("answerCallbackQuery", { callback_query_id: cb.id });

    if (data === "register") {
      const { data: existing } = await supabase
        .from("telegram_user_bind")
        .select("user_id")
        .eq("telegram_user_id", tgUserId)
        .maybeSingle();

      if (existing?.user_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, balance, vip_level, num_id")
          .eq("id", existing.user_id)
          .single();
        const gameUrl = buildGameUrl(tgUserId);
        await sendAccountInfo(chatId, {
          numId: profile?.num_id ?? "-",
          username: profile?.username ?? "-",
          balance: Number(profile?.balance ?? 0),
          vipLevel: profile?.vip_level ?? 0,
        }, buildAccountInfoInlineKeyboard(gameUrl, tgUserId));
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      const tgFrom = cb.from;
      let username = usernameFromTelegram(tgFrom, tgUserId);
      const password = genPassword();
      const email = `${username}@supabase-admin.local`;

      // 检查用户名是否已存在，冲突时加随机后缀
      for (let i = 0; i < 5; i++) {
        const { data: dup } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
        if (!dup) break;
        username = usernameFromTelegram(tgFrom, tgUserId) + "_" + genUsername().slice(0, 4);
      }

      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username,
          telegram_password: password,
          telegram_user_id: tgUserId,
        },
      });

      if (createError) {
        await tgApi("sendMessage", {
          chat_id: chatId,
          text: `注册失败：${createError.message}`,
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      const userId = createData.user?.id;
      if (!userId) {
        await tgApi("sendMessage", { chat_id: chatId, text: "注册失败，请稍后重试" });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      await supabase.rpc("ensure_invite_code", { p_user_id: userId });

      await supabase.from("telegram_user_bind").upsert(
        { telegram_user_id: tgUserId, user_id: userId },
        { onConflict: "telegram_user_id" }
      );

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, balance, vip_level, num_id")
        .eq("id", userId)
        .single();

      const gameUrl = buildGameUrl(tgUserId);

      await sendAccountInfo(chatId, {
        numId: profile?.num_id ?? "-",
        username: profile?.username ?? username,
        password,
        balance: Number(profile?.balance ?? 0),
        vipLevel: profile?.vip_level ?? 0,
      }, buildAccountInfoInlineKeyboard(gameUrl, tgUserId));
    } else if (data === "bind") {
      const { data: existing } = await supabase
        .from("telegram_user_bind")
        .select("user_id")
        .eq("telegram_user_id", tgUserId)
        .maybeSingle();
      if (existing?.user_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, balance, vip_level, num_id")
          .eq("id", existing.user_id)
          .single();
        const gameUrl = buildGameUrl(tgUserId);
        await sendAccountInfo(chatId, {
          numId: profile?.num_id ?? "-",
          username: profile?.username ?? "-",
          balance: Number(profile?.balance ?? 0),
          vipLevel: profile?.vip_level ?? 0,
        }, buildAccountInfoInlineKeyboard(gameUrl, tgUserId));
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      await supabase
        .from("telegram_bind_flow")
        .upsert({ telegram_user_id: tgUserId, step: "username", pending_username: null, created_at: new Date().toISOString() }, { onConflict: "telegram_user_id" });
      await tgApi("sendMessage", {
        chat_id: chatId,
        text: "请输入您的账号",
        reply_markup: { inline_keyboard: [[{ text: "❌ 取消", callback_data: "bind_cancel" }]] },
      });
    } else if (data === "bind_cancel") {
      await supabase.from("telegram_bind_flow").delete().eq("telegram_user_id", tgUserId);
      await tgApi("sendMessage", { chat_id: chatId, text: "已取消绑定" });
    }
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error("[telegram-bot-webhook] error:", err);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }
});
