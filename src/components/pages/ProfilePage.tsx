import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { supabase } from '../../services/supabase';
import { User, LogOut, Save, Camera } from 'lucide-react';

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
    <div className="max-w-2xl mx-auto py-12 px-4 relative z-10">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="text-on-surface-variant hover:text-primary font-medium text-sm transition-colors">
          ← Volver
        </button>
        <h1 className="text-3xl font-bold text-on-surface">Mi Perfil</h1>
      </div>

      <div className="bg-surface-container-lowest rounded-[2rem] p-8 editorial-shadow border border-outline-variant/15">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4 w-full md:w-auto">
            <div className="relative w-32 h-32 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container group overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl font-bold uppercase">{fullName.charAt(0) || profile?.email?.charAt(0)}</span>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera size={24} className="text-white" />
              </div>
            </div>
            <p className="text-xs text-on-surface-variant text-center max-w-[150px]">
              La subida de avatares está en desarrollo
            </p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSave} className="flex-grow w-full space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Correo Electrónico (Solo Lectura)</label>
              <input 
                type="text" 
                disabled 
                value={profile?.email || ''} 
                className="w-full px-4 py-3 bg-surface-container rounded-xl text-on-surface-variant border border-outline-variant/15 cursor-not-allowed"
              />
              <p className="text-xs text-on-surface-variant">El correo está vinculado a la cuenta institucional de UTM.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface"
                  placeholder="Tu nombre completo"
                />
              </div>
              <p className="text-xs text-on-surface-variant">Este nombre aparecerá en los horarios que descargues.</p>
            </div>

            {success && (
              <div className="p-3 bg-primary-fixed text-on-primary-fixed-variant rounded-xl text-sm font-medium">
                Perfil actualizado exitosamente.
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-outline-variant/15">
              <button 
                type="submit" 
                disabled={saving}
                className="flex-1 bg-primary text-on-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-all shadow-editorial hover:shadow-editorial-lg disabled:opacity-70"
              >
                {saving ? (
                   <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></div>
                ) : (
                  <><Save size={18} /> Guardar Cambios</>
                )}
              </button>
              
              <button 
                type="button" 
                onClick={handleSignOut}
                className="flex-1 bg-error-container text-error py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-200 transition-all"
              >
                <LogOut size={18} /> Cerrar Sesión
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
