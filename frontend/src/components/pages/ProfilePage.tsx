import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { supabase } from '../../services/supabase/supabaseClient';
import { User, LogOut, Save, Camera, ArrowLeft } from 'lucide-react';

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
          .single();
        
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
        // Upsert the profile
        await supabase
          .from('profiles')
          .upsert({
            id: session.user.id,
            email: session.user.email,
            full_name: fullName,
            updated_at: new Date().toISOString()
          });
        
        // Update auth metadata
        await supabase.auth.updateUser({
          data: { full_name: fullName }
        });
        
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto max-w-3xl">
      <div className="mb-8">
        <button onClick={onBack} className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary-fixed">
          <ArrowLeft size={16} /> Volver
        </button>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Mi Perfil</h1>
        <p className="mt-2 text-sm text-on-surface-variant">Administra tu identidad académica en el portal.</p>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-outline/40 bg-surface-container-low editorial-shadow">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-primary/40 via-primary/20 to-secondary/20" />

        <div className="px-6 pb-8 md:px-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-start">
            {/* Avatar Section */}
            <div className="-mt-12 flex w-full flex-col items-center gap-4 md:w-auto">
              <div className="group relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-surface-container-low bg-primary text-on-primary shadow-glow-primary">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold uppercase">{fullName.charAt(0) || profile?.email?.charAt(0)}</span>
                )}
                <div className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera size={22} className="text-on-surface" />
                </div>
              </div>
              <p className="max-w-[150px] text-center text-xs text-on-surface-variant">
                La subida de avatares está en desarrollo
              </p>
            </div>

            {/* Form Section */}
            <form onSubmit={handleSave} className="w-full flex-grow space-y-6 pt-4">
              <div className="space-y-2">
                <label className="text-[0.7rem] font-bold uppercase tracking-wider text-primary-fixed">Correo electrónico</label>
                <input
                  type="text"
                  disabled
                  value={profile?.email || ''}
                  className="w-full cursor-not-allowed rounded-xl border border-outline/40 bg-surface-container px-4 py-3 text-on-surface-variant"
                />
                <p className="text-xs text-on-surface-variant">El correo está vinculado a la cuenta institucional de UTM.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[0.7rem] font-bold uppercase tracking-wider text-primary-fixed">Nombre completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-outline bg-surface-container-high py-3 pl-11 pr-4 text-on-surface transition-all focus:border-primary-fixed focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Tu nombre completo"
                  />
                </div>
                <p className="text-xs text-on-surface-variant">Este nombre aparecerá en los horarios que descargues.</p>
              </div>

              {success && (
                <div className="rounded-xl border border-primary/30 bg-success-container p-3 text-sm font-medium text-primary-fixed">
                  Perfil actualizado exitosamente.
                </div>
              )}

              <div className="flex flex-col gap-4 border-t border-outline/40 pt-6 sm:flex-row">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-on-primary transition-all hover:bg-primary-container hover:shadow-glow-primary disabled:opacity-70"
                >
                  {saving ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-on-primary/30 border-t-on-primary" />
                  ) : (
                    <><Save size={18} /> Guardar Cambios</>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-error/40 bg-error-container py-3 font-bold text-on-error-container transition-all hover:bg-error/20"
                >
                  <LogOut size={18} /> Cerrar Sesión
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
