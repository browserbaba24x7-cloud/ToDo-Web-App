import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type DeviceSession = {
  session_id: string;
  device_label: string;
  created_at: string;
  last_seen_at: string;
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
  const { error } = await supabase.from("device_sessions").upsert(
    {
      user_id: session.user.id,
      session_id: sessionId,
      device_label: getDeviceLabel(),
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "user_id,session_id" },
  );
  if (error) throw error;
  return sessionId;
};

export const listDeviceSessions = async (): Promise<DeviceSession[]> => {
  const { data, error } = await supabase
    .from("device_sessions")
    .select("session_id, device_label, created_at, last_seen_at")
    .order("last_seen_at", { ascending: false });
  if (error) throw error;
  return data;
};
