import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function tgApi(method: string, body: Record<string, unknown>): Promise<{ ok?: boolean; description?: string }> {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

type ContentType = "text" | "photo" | "video";

interface BroadcastRow {
  id: number;
  content_type: ContentType;
  content: string | null;
  media_url: string | null;
  inline_keyboard: { text: string; url?: string; callback_data?: string }[][] | null;
  scheduled_at: string | null;
  status: string;
}

async function sendToOne(
  chatId: number,
  row: BroadcastRow
): Promise<{ ok: boolean; err?: string }> {
  const replyMarkup =
    row.inline_keyboard && row.inline_keyboard.length > 0
      ? { inline_keyboard: row.inline_keyboard }
      : undefined;

  if (row.content_type === "photo" && row.media_url) {
    const r = await tgApi("sendPhoto", {
      chat_id: chatId,
      photo: row.media_url,
      caption: row.content || undefined,
      reply_markup: replyMarkup,
    });
    return { ok: r?.ok === true, err: r?.description };
  }
  if (row.content_type === "video" && row.media_url) {
    const r = await tgApi("sendVideo", {
      chat_id: chatId,
      video: row.media_url,
      caption: row.content || undefined,
      reply_markup: replyMarkup,
    });
    return { ok: r?.ok === true, err: r?.description };
  }
  const r = await tgApi("sendMessage", {
    chat_id: chatId,
    text: row.content || "",
    reply_markup: replyMarkup,
  });
  return { ok: r?.ok === true, err: r?.description };
}

Deno.serve(async (req: Request) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    let body: { action?: string; broadcast_id?: number } = {};
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ ok: false, message: "Invalid JSON" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const action = body.action || "";
    const broadcastId = body.broadcast_id;

    if (!BOT_TOKEN) {
      return new Response(
        JSON.stringify({ ok: false, message: "TELEGRAM_BOT_TOKEN not set" }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    if (action === "send" && broadcastId) {
      const { data: row, error } = await supabase
        .from("telegram_broadcast")
        .select("*")
        .eq("id", broadcastId)
        .eq("status", "pending")
        .single();

      if (error || !row) {
        return new Response(
          JSON.stringify({ ok: false, message: "Broadcast not found or not pending" }),
          { status: 404, headers: { ...cors, "Content-Type": "application/json" } }
        );
      }

      await supabase
        .from("telegram_broadcast")
        .update({ status: "sending", updated_at: new Date().toISOString() })
        .eq("id", broadcastId);

      const { data: binds } = await supabase
        .from("telegram_user_bind")
        .select("telegram_user_id");

      const chatIds = (binds || []).map((b: { telegram_user_id: number }) => b.telegram_user_id);
      let success = 0;
      let failed = 0;
      let lastErr = "";

      for (const chatId of chatIds) {
        const res = await sendToOne(chatId, row as BroadcastRow);
        if (res.ok) success++;
        else {
          failed++;
          lastErr = res.err || "unknown";
          if (res.err?.includes("blocked") || res.err?.includes("deactivated")) continue;
          await new Promise((r) => setTimeout(r, 50));
        }
      }

      await supabase
        .from("telegram_broadcast")
        .update({
          status: failed === chatIds.length ? "failed" : "sent",
          sent_at: new Date().toISOString(),
          error_msg: failed > 0 ? `success=${success} failed=${failed} last=${lastErr}` : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", broadcastId);

      return new Response(
        JSON.stringify({ ok: true, message: `已发送 ${success}/${chatIds.length}` }),
        { headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    if (action === "cron") {
      const now = new Date().toISOString();
      const { data: rows } = await supabase
        .from("telegram_broadcast")
        .select("*")
        .eq("status", "pending")
        .not("scheduled_at", "is", null)
        .lte("scheduled_at", now);

      const processed: number[] = [];
      for (const row of rows || []) {
        const { data: binds } = await supabase
          .from("telegram_user_bind")
          .select("telegram_user_id");
        const chatIds = (binds || []).map((b: { telegram_user_id: number }) => b.telegram_user_id);

        await supabase
          .from("telegram_broadcast")
          .update({ status: "sending", updated_at: new Date().toISOString() })
          .eq("id", row.id);

        let success = 0;
        let failed = 0;
        let lastErr = "";
        for (const chatId of chatIds) {
          const res = await sendToOne(chatId, row as BroadcastRow);
          if (res.ok) success++;
          else {
            failed++;
            lastErr = res.err || "";
          }
        }

        await supabase
          .from("telegram_broadcast")
          .update({
            status: failed === chatIds.length ? "failed" : "sent",
            sent_at: new Date().toISOString(),
            error_msg: failed > 0 ? `success=${success} failed=${failed}` : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        processed.push(row.id);
      }

      return new Response(
        JSON.stringify({ ok: true, processed: processed.length, ids: processed }),
        { headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: false, message: "Unknown action" }),
      { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[telegram-broadcast]", err);
    return new Response(
      JSON.stringify({ ok: false, message: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }
});
