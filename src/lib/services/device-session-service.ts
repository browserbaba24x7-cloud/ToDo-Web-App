import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type DeviceSession = {
  session_id: string;
  device_label: string;
  created_at: string;
  last_seen_at: string;
  revoked_at: string | null;
};

export const getDeviceSessionErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error !== "object" || error === null || !("message" in error)) {
    return "Could not load device sessions.";
  }

  const { message, details, hint, code } = error as {
    message?: unknown;
    details?: unknown;
    hint?: unknown;
    code?: unknown;
  };
  const parts = [message, details, hint, code]
    .filter((part): part is string => typeof part === "string" && part.length > 0);
  return parts.length > 0 ? parts.join(" — ") : "Could not load device sessions.";
};

const getSessionId = (accessToken: string) => {
  const payloadSegment = accessToken.split(".")[1];
  if (!payloadSegment) throw new Error("The current sign-in session could not be identified.");

  try {
    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const bytes = Uint8Array.from(atob(paddedBase64), (character) => character.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as { session_id?: unknown };
    if (typeof payload.session_id !== "string") {
      throw new Error("The current sign-in session could not be identified.");
    }
    return payload.session_id;
  } catch (error) {
    if (error instanceof Error && error.message === "The current sign-in session could not be identified.") {
      throw error;
    }
    throw new Error("The current sign-in session could not be read.");
  }
};

const getDeviceLabel = () => {
  const userAgent = navigator.userAgent;
  const browser = /Edg\//.test(userAgent)
    ? "Microsoft Edge"
    : /OPR\//.test(userAgent)
      ? "Opera"
      : /Firefox\//.test(userAgent)
        ? "Firefox"
        : /Chrome\//.test(userAgent)
          ? "Chrome"
          : /Safari\//.test(userAgent)
            ? "Safari"
            : "Unknown browser";
  const device = /iPhone|iPad|iPod/.test(userAgent)
    ? "iPhone/iPad"
    : /Android/.test(userAgent)
      ? "Android"
      : /Windows/.test(userAgent)
        ? "Windows"
        : /Macintosh|Mac OS X/.test(userAgent)
          ? "Mac"
          : /Linux/.test(userAgent)
            ? "Linux"
            : "Device";

  return `${browser} on ${device}`;
};

export const registerDeviceSession = async (session: Session) => {
  const sessionId = getSessionId(session.access_token);
  const { data: active, error } = await supabase.rpc("register_device_session", {
    p_device_label: getDeviceLabel(),
  });
  if (error) throw error;
  return { sessionId, active };
};

export const listDeviceSessions = async (): Promise<DeviceSession[]> => {
  const { data, error } = await supabase
    .from("device_sessions")
    .select("session_id, device_label, created_at, last_seen_at, revoked_at")
    .order("last_seen_at", { ascending: false });
  if (error) throw error;
  return data;
};
