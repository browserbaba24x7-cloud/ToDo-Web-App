import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type DeviceSession = {
  session_id: string;
  device_label: string;
  created_at: string;
  last_seen_at: string;
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
  const browser = /Edg(?:e|iOS)?\//.test(userAgent)
    ? "Microsoft Edge"
    : /OPR\/|OPiOS\//.test(userAgent)
      ? "Opera"
        : /SamsungBrowser\//.test(userAgent)
          ? "Samsung Internet"
          : /FxiOS\/|Firefox\//.test(userAgent)
        ? "Firefox"
          : /CriOS\/|Chrome\//.test(userAgent)
          ? "Chrome"
          : /Safari\//.test(userAgent)
            ? "Safari"
              : "Web browser";
  const isIPad = /iPad/.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const device = isIPad
    ? "iPad"
    : /iPhone/.test(userAgent)
        ? "iPhone"
        : /iPod/.test(userAgent)
          ? "iPod"
    : /Android/.test(userAgent)
      ? "Android"
      : /Windows/.test(userAgent)
        ? "Windows"
        : /Macintosh|Mac OS X/.test(userAgent)
          ? "Mac"
          : /CrOS/.test(userAgent)
            ? "ChromeOS"
          : /Linux/.test(userAgent)
            ? "Linux"
              : "this device";

  return `${browser} on ${device}`;
};

const normalizeDeviceLabel = (label: string) => {
  const [browser, device] = label.split(" on ", 2);
  const readableBrowser = browser === "Unknown browser" ? "Web browser" : browser;
  const readableDevice = device === "Device" || !device ? "this device" : device;
  return `${readableBrowser} on ${readableDevice}`;
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
    .select("session_id, device_label, created_at, last_seen_at")
    .is("revoked_at", null)
    .order("last_seen_at", { ascending: false });
  if (error) throw error;
  return data.map((device) => ({
    ...device,
    device_label: normalizeDeviceLabel(device.device_label),
  }));
};
