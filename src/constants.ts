import { ChartBar, Calendar, Download, Save, Palette, Upload, LogIn } from "lucide-react";

// Real Supabase Credentials
// Configured with specific project keys provided by the user.
export const SUPABASE_URL = "https://jmybcsusmazaxforhsms.supabase.co";
export const SUPABASE_KEY = "sb_publishable_Sb2jQcuTd4OLQhloeIZTww_k95fFjdw";
// Google Calendar
// En tu archivo constants.ts
// Safe process.env access
const getEnvVar = (key: string) => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
  } catch (e) {
    // Ignore error
  }
  return "";
};

// Try process.env first, then fallback to localStorage for browser-based configuration
export const GOOGLE_CLIENT_ID = getEnvVar("GOOGLE_CLIENT_ID") || (typeof window !== 'undefined' ? localStorage.getItem('google_client_id') : "") || "303071798512-muiirok53evctbn1rdmtisl2f6rednbn.apps.googleusercontent.com";

export const FEATURES = {
  GUEST: ['UPLOAD', 'PROCESS', 'RESOLVE_CONFLICT'],
  REGISTERED: ['UPLOAD', 'PROCESS', 'RESOLVE_CONFLICT', 'EDIT_NAME', 'SAVE_CLOUD', 'CUSTOMIZE_COLOR', 'DOWNLOAD_PDF', 'SYNC_CALENDAR']
};