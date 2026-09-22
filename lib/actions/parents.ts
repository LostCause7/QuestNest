"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireFamily } from "@/lib/data/family";
import { AVATAR_KEYS, COLOR_KEYS } from "@/lib/avatars";
import { KID_MODE_COOKIE } from "@/lib/supabase/proxy";
import { fail, friendlyError, guardAction, ok, type ActionResult } from "./result";
import type { ParentProfile } from "@/types/database";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(40),
  avatar: z.enum(AVATAR_KEYS as [string, ...string[]]),
  color: z.enum(COLOR_KEYS as [string, ...string[]]),
  motto: z.string().trim().max(80).optional().nullable(),
});

const pinSchema = z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits.");

function revalidate() {
  revalidatePath("/app", "layout");
  revalidatePath("/kids", "layout");
}

export async function createParentProfile(
  input: z.infer<typeof schema> & { pin: string }
): Promise<ActionResult<ParentProfile>> {
  return guardAction(async () => {
    if ((await cookies()).get(KID_MODE_COOKIE)?.value === "1") {
      return fail("Ask a parent to add another parent.");
    }
    const parsed = schema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input.");
    const pin = pinSchema.safeParse(input.pin);
    if (!pin.success) return fail(pin.error.issues[0]?.message ?? "Invalid PIN.");

    const family = await requireFamily();
    const supabase = await createClient();
    const { count, error: countErr } = await supabase
      .from("parent_profiles")
      .select("id", { count: "exact", head: true })
      .eq("family_id", family.id);
    if (countErr && /does not exist|schema cache/i.test(countErr.message)) {
      return fail("Extra parents need the latest nest update in Supabase.");
    }

    const { data, error } = await supabase
      .from("parent_profiles")
      .insert({
        family_id: family.id,
        ...parsed.data,
        motto: parsed.data.motto || null,
        sort_order: count ?? 0,
      })
      .select()
      .single();
    if (error && /does not exist|schema cache/i.test(error.message)) {
      return fail("Extra parents need the latest nest update in Supabase.");
    }
    if (error || !data) return fail(friendlyError(error?.message ?? "Could not add that parent."));

    const { error: pinErr } = await supabase.rpc("set_parent_profile_pin", { p_parent: data.id, p_pin: pin.data });
    if (pinErr) {
      await supabase.from("parent_profiles").delete().eq("id", data.id);
      return fail(friendlyError(pinErr.message));
    }

    revalidate();
    return ok(data as ParentProfile, `${data.name} can pick their face on the nest.`);
  });
}
