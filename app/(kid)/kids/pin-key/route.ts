import { NextResponse, type NextRequest } from "next/server";
import { pressPinKey } from "@/lib/actions/kid-mode";
import { isNextRedirect } from "@/lib/errors";

export const dynamic = "force-dynamic";

function sameSiteOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  let originHost = "";
  try {
    originHost = new URL(origin).host.split(":")[0];
  } catch {
    return false;
  }
  if (originHost === "chorehall.net" || originHost === "www.chorehall.net") return true;
  if (originHost === "localhost" || originHost === "127.0.0.1") return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(originHost)) return true;
  const requestHost = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "")
    .split(",")[0]
    .trim()
    .split(":")[0];
  return originHost === requestHost;
}

/** Full-page POST — iPad WebKit can tap this the same way it follows a profile Link. */
export async function POST(request: NextRequest) {
  if (!sameSiteOrigin(request)) {
    return NextResponse.redirect(new URL("/kids", request.url), 303);
  }
  const formData = await request.formData();
  try {
    await pressPinKey(formData);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    throw error;
  }
  return NextResponse.redirect(new URL("/kids", request.url), 303);
}

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/kids", request.url), 303);
}
