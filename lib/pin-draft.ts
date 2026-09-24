import { cookies } from "next/headers";

export const PIN_DRAFT_COOKIE = "qn_pin_draft";
export const PIN_ERROR_COOKIE = "qn_pin_error";

/** Browser path to return to after a key press. Not the cookie path. */
export function pinPagePath(role: string, id: string, requested = "") {
  if (role === "child" && isId(id)) return `/kids/${id}/pin`;
  if (role === "extra" && isId(id)) return `/kids/parents/${id}/pin`;
  if (role === "parent" || role === "parent-open") {
    return requested === "/kids/exit" ? "/kids/exit" : "/kids/parent";
  }
  return "/kids";
}

function isId(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function pack(role: string, id: string, payload: string) {
  return `${role}|${id}|${payload}`;
}

function unpack(raw: string, role: string, id: string) {
  const [storedRole, storedId, ...rest] = raw.split("|");
  if (storedRole !== role || storedId !== id) return "";
  return rest.join("|");
}

function cookieOpts(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function consumePinDraft(role: string, id: string) {
  const store = await cookies();
  const draft = unpack(store.get(PIN_DRAFT_COOKIE)?.value ?? "", role, id);
  const errorRaw = unpack(store.get(PIN_ERROR_COOKIE)?.value ?? "", role, id);
  return { draft: /^\d{0,6}$/.test(draft) ? draft : "", error: errorRaw || null };
}

export async function writePinDraft(role: string, id: string, draft: string) {
  const store = await cookies();
  store.set(PIN_DRAFT_COOKIE, pack(role, id, draft), cookieOpts(120));
  store.set(PIN_ERROR_COOKIE, "", cookieOpts(0));
}

export async function writePinError(role: string, id: string, message: string) {
  const store = await cookies();
  store.set(PIN_DRAFT_COOKIE, "", cookieOpts(0));
  store.set(PIN_ERROR_COOKIE, pack(role, id, message), cookieOpts(30));
}

export async function clearPinDraft() {
  const store = await cookies();
  store.set(PIN_DRAFT_COOKIE, "", cookieOpts(0));
  store.set(PIN_ERROR_COOKIE, "", cookieOpts(0));
}
