import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Content-Type": "application/json",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const tg = url.searchParams.get("tg");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  let userId: string | null = null;

  if (token) {
    const { data: row } = await supabase
      .from("telegram_login_tokens")
      .select("user_id")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (row) userId = row.user_id;
    if (userId) {
      await supabase.from("telegram_login_tokens").delete().eq("token", token);
    }
  } else if (tg) {
    const { data: bind } = await supabase
      .from("telegram_user_bind")
      .select("user_id")
      .eq("telegram_user_id", parseInt(tg, 10))
      .maybeSingle();
    if (bind) userId = bind.user_id;
  }

  if (!userId) {
    return new Response(
      JSON.stringify({ error: "链接已过期或无效，请返回机器人重新点击「进入游戏」" }),
      { status: 400, headers: cors }
    );
  }

  const { data: user } = await supabase.auth.admin.getUserById(userId);
  const email = user?.user?.email;
  if (!email) {
    return new Response(JSON.stringify({ error: "用户不存在" }), { status: 400, headers: cors });
  }

  // 魔术链接重定向地址：优先 TELEGRAM_FRONTEND_URL 环境变量，其次 sys_config.frontend_url，禁止 vercel.app
  let redirectTo =
    (Deno.env.get("TELEGRAM_FRONTEND_URL") || "").trim() ||
    (await supabase.rpc("get_frontend_url").then((r) => (r.data as string) || "")) ||
    "https://www.beebet77.com";
  redirectTo = redirectTo.replace(/\/$/, "") + "/";
  if (redirectTo.includes("vercel.app")) {
    redirectTo = "https://www.beebet77.com/";
  }

  const { data: linkData, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  const actionLink = (linkData as any)?.properties?.action_link ?? (linkData as any)?.action_link;
  if (error || !actionLink) {
    return new Response(
      JSON.stringify({ error: error?.message || "生成登录链接失败" }),
      { status: 500, headers: cors }
    );
  }

  return new Response(
    JSON.stringify({ redirect_url: actionLink }),
    { status: 200, headers: cors }
  );
});
