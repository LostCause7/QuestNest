import type { createClient } from "@/lib/supabase/server";
import type { TxKind } from "@/types/database";

type Client = Awaited<ReturnType<typeof createClient>>;

const MISSING_RPC = /could not find|schema cache|does not exist/i;

/** Write a ledger row with an explicit tx_kind cast (via RPC when 0029 is applied). */
export async function insertLedger(
  supabase: Client,
  row: {
    family_id: string;
    child_id: string;
    amount: number;
    kind: TxKind;
    ref_id?: string | null;
    note?: string | null;
    created_by?: string | null;
  }
) {
  const rpc = await supabase.rpc("record_points", {
    p_family: row.family_id,
    p_child: row.child_id,
    p_amount: row.amount,
    p_kind: row.kind,
    p_ref: row.ref_id ?? null,
    p_note: row.note ?? null,
  });
  if (!rpc.error || !MISSING_RPC.test(rpc.error.message)) {
    return { error: rpc.error };
  }
  const fallback = await supabase.from("point_transactions").insert({
    family_id: row.family_id,
    child_id: row.child_id,
    amount: row.amount,
    kind: row.kind,
    ref_id: row.ref_id ?? null,
    note: row.note ?? null,
    created_by: row.created_by ?? null,
  });
  return { error: fallback.error };
}
