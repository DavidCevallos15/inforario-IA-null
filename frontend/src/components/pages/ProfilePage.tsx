import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { supabase } from '../../services/supabase/supabaseClient';
import { ArrowLeft, Check, User, LogOut, Save } from 'lucide-react';

interface ProfilePageProps {
  onBack: () => void;
  onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onBack, onLogout }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (data) {
          setProfile(data);
          setFullName(data.full_name || "");
        } else {
          // Si no hay perfil, creamos un placeholder
          setProfile({
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || ''
          });
          setFullName(session.user.user_metadata?.full_name || "");
        }
      }
    } catch (err) {
      console.error("Error al obtener perfil", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Supabase no lanza excepciones: hay que revisar `error` explícitamente
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: session.user.id,
            email: session.user.email,
            full_name: fullName.trim(),
            updated_at: new Date().toISOString()
          });
        if (upsertError) throw upsertError;

        // Actualiza los metadatos de auth (dispara USER_UPDATED y refresca la Navbar)
        const { error: authError } = await supabase.auth.updateUser({
          data: { full_name: fullName.trim() }
        });
        if (authError) throw authError;
        
        setSuccess(true);
      }
    } catch (err) {
      console.error("Error guardando perfil:", err);
      alert("Hubo un error al guardar el perfil.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-xl space-y-4 py-14" role="status" aria-label="Cargando perfil">
        <div className="h-16 w-16 animate-pulse rounded-xl bg-pencil/20" />
        <div className="h-8 w-48 animate-pulse rounded bg-pencil/20" />
        <div className="h-12 w-full animate-pulse rounded bg-pencil/15" />
      </div>
    );
  }

  const initial = (fullName.charAt(0) || profile?.email?.charAt(0) || '?').toUpperCase();

  return (
    <div className="mx-auto w-full max-w-xl pb-20 pt-8 sm:pt-14">
      <button
        type="button"
        onClick={onBack}
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-bold text-on-surface-variant transition-colors hover:text-primary"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="flex items-center gap-4">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-xl object-cover" />
        ) : (
          <span aria-hidden className="ink grid h-16 w-16 place-items-center rounded-xl bg-hl-yellow text-3xl font-bold text-[#14213d]">
            {initial}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-on-surface">Tu perfil</h1>
          <p className="truncate text-base text-on-surface-variant">{profile?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-10 space-y-6">
        <div className="space-y-2">
          <label htmlFor="profile-name" className="block text-sm font-bold text-on-surface">
            Nombre completo
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
            <input
              id="profile-name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setSuccess(false);
              }}
              className="w-full rounded-md border border-outline bg-surface-container-lowest py-3 pl-10 pr-4 text-base text-on-surface transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
              placeholder="Tus nombres y apellidos"
            />
          </div>
          <p className="text-sm text-on-surface-variant">Aparece en el encabezado del PDF que exportes.</p>
        </div>

        {success && (
          <p role="status" className="flex items-center gap-2 rounded bg-primary-fixed px-3 py-2.5 text-sm font-semibold text-on-primary-fixed">
            <Check size={18} /> Cambios guardados.
          </p>
        )}

        <div className="flex flex-col gap-3 border-t border-outline-variant pt-6 sm:flex-row">
          <button
            type="submit"
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary py-3 text-base font-bold text-on-primary shadow-editorial transition-colors hover:bg-primary-container disabled:opacity-60"
          >
            {saving ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-on-primary/30 border-t-on-primary" /> : <Save size={18} />}
            Guardar cambios
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex flex-1 items-center justify-center gap-2 rounded-md border border-outline-variant py-3 text-base font-bold text-on-surface transition-colors hover:border-error hover:text-error"
          >
            <LogOut size={18} /> Cerrar sesión
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
