// Valores por defecto del proyecto Supabase de producción.
// Se pueden sobrescribir con VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en .env.local.
// La clave "publishable" es pública por diseño: la seguridad depende de las políticas RLS.
export const SUPABASE_URL = "https://jmybcsusmazaxforhsms.supabase.co";
export const SUPABASE_KEY = "sb_publishable_Sb2jQcuTd4OLQhloeIZTww_k95fFjdw";

// ID de cliente OAuth de Google (público). Debe coincidir con el secreto GOOGLE_CLIENT_ID
// configurado en las Edge Functions de Supabase.
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || "303071798512-muiirok53evctbn1rdmtisl2f6rednbn.apps.googleusercontent.com";
