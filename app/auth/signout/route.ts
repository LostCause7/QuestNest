import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const response = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  response.cookies.delete("qn_active_child");
  response.cookies.delete("qn_active_parent");
  response.cookies.delete("qn_kid_mode");
  return response;
}
