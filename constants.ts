import { ChartBar, Calendar, Download, Save, Palette, Upload, LogIn } from "lucide-react";

// Real Supabase Credentials
// Configured with specific project keys provided by the user.
export const SUPABASE_URL = "https://ieckwowgbxmaorsiuzbr.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllY2t3b3dnYnhtYW9yc2l1emJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0Mjk3NjcsImV4cCI6MjA4MDAwNTc2N30.Q7UJD2k3BUKXA2kRs4HCjiQod-fuXvdH5nNK4cyZ254";

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
export const GOOGLE_CLIENT_ID = getEnvVar("GOOGLE_CLIENT_ID") || (typeof window !== 'undefined' ? localStorage.getItem('google_client_id') : "") || "";

export const FEATURES = {
  GUEST: ['UPLOAD', 'PROCESS', 'RESOLVE_CONFLICT'],
  REGISTERED: ['UPLOAD', 'PROCESS', 'RESOLVE_CONFLICT', 'EDIT_NAME', 'SAVE_CLOUD', 'CUSTOMIZE_COLOR', 'DOWNLOAD_PDF', 'SYNC_CALENDAR']
};