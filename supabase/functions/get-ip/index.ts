import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * 获取 Supabase Edge Function 的出站 IP 地址
 * 用于添加到游戏 API 的白名单中
 */
Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // 方法1: 使用 ipify.org 获取出站 IP
    const ipifyResponse = await fetch("https://api.ipify.org?format=json");
    const ipifyData = await ipifyResponse.json();
    const ipifyIp = ipifyData.ip;

    // 方法2: 使用 httpbin.org 获取详细信息
    let httpbinData = null;
    try {
      const httpbinResponse = await fetch("https://httpbin.org/ip");
      httpbinData = await httpbinResponse.json();
    } catch (e) {
      console.log("httpbin.org failed:", e);
    }

    // 方法3: 使用 icanhazip.com 获取纯文本 IP
    let icanhazipIp = null;
    try {
      const icanhazipResponse = await fetch("https://icanhazip.com");
      icanhazipIp = (await icanhazipResponse.text()).trim();
    } catch (e) {
      console.log("icanhazip.com failed:", e);
    }

    // 返回结果
    const result = {
      success: true,
      message: "Edge Function 出站 IP 地址",
      ips: {
        ipify: ipifyIp,
        icanhazip: icanhazipIp,
        httpbin: httpbinData?.origin || null,
      },
      // 推荐使用的 IP（优先使用 ipify）
      recommendedIp: ipifyIp || icanhazipIp || httpbinData?.origin,
      note: "Supabase Edge Functions 使用动态 IP，建议联系 Supabase 获取 IP 范围，或使用域名白名单",
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        note: "无法获取 IP 地址，请检查网络连接或联系 Supabase 支持",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});
