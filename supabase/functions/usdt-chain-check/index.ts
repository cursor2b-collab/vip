import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const TRC20_USDT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const ERC20_USDT = "0xdac17f958d2ee523a2206206994597c13d831ec7";
/** 金额匹配容差（USDT 小数） */
const AMOUNT_TOLERANCE = 0.0001;

interface PendingOrder {
  id: number;
  user_id: string;
  bill_no: string;
  receive_address: string;
  usdt_amount: number;
  cny_amount: number;
  usdt_type: string;
  expire_at: string;
  created_at: string;
}

interface ChainTransfer {
  from: string;
  to: string;
  value: number;
  tx_hash: string;
  block_timestamp: number;
}

/** TRC20 转入记录（Tronscan API） */
async function getTrc20Transfers(toAddress: string, minTimestamp: number): Promise<ChainTransfer[]> {
  const url =
    "https://apilist.tronscan.org/api/token_trc20/transfers" +
    "?to_address=" + encodeURIComponent(toAddress) +
    "&contract_address=" + TRC20_USDT +
    "&limit=50" +
    (minTimestamp > 0 ? "&min_timestamp=" + minTimestamp : "");
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await res.json();
    const list = data?.token_transfers ?? [];
    return list.map((t: any) => ({
      from: t.from_address ?? "",
      to: t.to_address ?? "",
      value: Number((t.quant ?? 0) / 1e6),
      tx_hash: t.transaction_id ?? "",
      block_timestamp: Number(t.block_timestamp ?? 0),
    }));
  } catch (e) {
    console.error("Tronscan error:", e);
    return [];
  }
}

/** ERC20 转入记录（Etherscan API，需 API Key 时在 URL 加 &apikey=xxx） */
async function getErc20Transfers(toAddress: string, minTimestampSec: number): Promise<ChainTransfer[]> {
  const addr = toAddress.toLowerCase();
  const url =
    "https://api.etherscan.io/api?module=account&action=tokentx" +
    "&contractaddress=" + ERC20_USDT +
    "&address=" + addr +
    "&page=1&offset=50&sort=desc";
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await res.json();
    const list = Array.isArray(data?.result) ? data.result : [];
    const out: ChainTransfer[] = [];
    for (const t of list) {
      const to = (t.to ?? "").toLowerCase();
      if (to !== addr) continue;
      const ts = Number(t.timeStamp ?? 0);
      if (minTimestampSec > 0 && ts < minTimestampSec) continue;
      out.push({
        from: t.from ?? "",
        to,
        value: Number(t.value ?? 0) / 1e6,
        tx_hash: t.hash ?? "",
        block_timestamp: ts * 1000,
      });
    }
    return out;
  } catch (e) {
    console.error("Etherscan error:", e);
    return [];
  }
}

function matchAmount(a: number, b: number): boolean {
  return Math.abs(a - b) <= AMOUNT_TOLERANCE;
}

Deno.serve(async (req: Request) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  const url = new URL(req.url);
  const auth = req.headers.get("Authorization");
  const secret = Deno.env.get("USDT_CRON_SECRET");
  if (secret && url.searchParams.get("secret") !== secret && auth !== "Bearer " + secret) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const now = new Date().toISOString();
  const { data: orders, error: ordersErr } = await supabase
    .from("usdt_recharge_orders")
    .select("id, user_id, bill_no, receive_address, usdt_amount, cny_amount, usdt_type, expire_at, created_at")
    .eq("status", 1)
    .gt("expire_at", now);

  if (ordersErr || !orders?.length) {
    return new Response(
      JSON.stringify({ ok: true, message: "No pending orders", processed: 0 }),
      { status: 200, headers: { "Content-Type": "application/json", ...cors } }
    );
  }

  const pending = orders as PendingOrder[];
  const byKey: Record<string, PendingOrder[]> = {};
  for (const o of pending) {
    const key = o.receive_address + "|" + (o.usdt_type || "TRC20");
    if (!byKey[key]) byKey[key] = [];
    byKey[key].push(o);
  }

  let processed = 0;
  const oldestCreated = Math.min(...pending.map((o) => new Date(o.created_at).getTime()));
  const minTsMs = oldestCreated - 60 * 1000;
  const minTsSec = Math.floor(minTsMs / 1000);

  for (const key of Object.keys(byKey)) {
    const [receive_address, usdt_type] = key.split("|");
    const chain = (usdt_type || "TRC20").toUpperCase();
    const transfers =
      chain === "ERC20"
        ? await getErc20Transfers(receive_address, minTsSec)
        : await getTrc20Transfers(receive_address, minTsMs);

    for (const order of byKey[key]) {
      const want = Number(order.usdt_amount);
      const found = transfers.find((t) => matchAmount(t.value, want));
      if (!found) continue;

      const { error: upOrder } = await supabase
        .from("usdt_recharge_orders")
        .update({
          status: 2,
          tx_hash: found.tx_hash,
          from_address: found.from,
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (upOrder) {
        console.error("Update order error:", upOrder);
        continue;
      }

      const { error: upProfile } = await supabase.rpc("increment_profile_balance", {
        p_user_id: order.user_id,
        p_delta: order.cny_amount,
      });
      if (upProfile) console.error("increment_profile_balance error:", upProfile);
      processed++;
    }
  }

  return new Response(
    JSON.stringify({ ok: true, pending: pending.length, processed }),
    { status: 200, headers: { "Content-Type": "application/json", ...cors } }
  );
});
