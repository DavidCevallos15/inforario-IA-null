import React, { useState, useEffect, useCallback } from 'react';
import { X, Mail, Lock, Eye, EyeOff, User, GraduationCap, Check, ArrowLeft, AlertCircle } from 'lucide-react';
import { signInWithEmail, signUpWithEmail, resetPasswordForEmail, isSupabaseConfigured } from '../../services/supabase/supabaseClient';

interface LoginPageProps {
  onLogin: () => void;
  onBack: () => void;
}

type AuthView = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onBack }) => {
  const [view, setView] = useState<AuthView>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Password Validation State
  const [pwdValidations, setPwdValidations] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  });

  useEffect(() => {
    if (view === 'REGISTER') {
      setPwdValidations({
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password)
      });
    }
  }, [password, view]);

  // isPasswordValid is computed
  const isPasswordValid = Object.values(pwdValidations).every(Boolean);

  const resetState = () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(false);
  };

  const resetFormFields = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setShowPassword(false);
    setPwdValidations({
      length: false,
      uppercase: false,
      lowercase: false,
      number: false
    });
  };

  const resetAuthFlow = useCallback((nextView: AuthView = 'LOGIN') => {
    resetState();
    resetFormFields();
    setView(nextView);
  }, []);

  const handleSwitchView = (newView: AuthView) => {
    resetAuthFlow(newView);
  };

  useEffect(() => {
    // Ensure each open starts clean in LOGIN view.
    resetAuthFlow('LOGIN');
  }, [resetAuthFlow]);

  const handleClose = useCallback(() => {
    resetAuthFlow('LOGIN');
    onBack();
  }, [onBack, resetAuthFlow]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();
    setLoading(true);

    if (!isSupabaseConfigured()) {
       // Demo mode for preview without keys
       setTimeout(() => {
         setLoading(false);
         onLogin();
         onBack();
       }, 1000);
       return;
    }

    try {
      if (view === 'LOGIN') {
        if (!email.endsWith('@utm.edu.ec')) {
          throw new Error("Debes usar tu correo institucional (@utm.edu.ec) para iniciar sesión.");
        }
        await signInWithEmail(email, password);
        onLogin(); // App.tsx listener will handle session update
      } else if (view === 'REGISTER') {
        if (!email.endsWith('@utm.edu.ec')) {
          throw new Error("El registro es exclusivo para correos institucionales de la UTM (@utm.edu.ec).");
        }
        if (!isPasswordValid) {
          throw new Error("La contraseña no cumple con los requisitos.");
        }
        await signUpWithEmail(email, password, fullName);
        setSuccessMsg("¡Cuenta creada! Revisa tu correo para confirmar.");
      } else if (view === 'FORGOT_PASSWORD') {
        await resetPasswordForEmail(email);
        setSuccessMsg("Si el correo existe, recibirás un enlace de recuperación.");
      }
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "";
      if (msg.includes("User already registered")) {
        setError("Este correo ya está registrado. Por favor, inicia sesión.");
      } else if (msg.includes("Invalid login")) {
        setError("Credenciales incorrectas.");
      } else if (msg.includes("Email address not authorized")) {
        setError("Tu proyecto usa el SMTP por defecto de Supabase: solo envía a correos autorizados del equipo. Configura un SMTP propio para enviar a estudiantes.");
      } else if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("too many requests")) {
        setError("Límite de envíos alcanzado temporalmente. Intenta más tarde o revisa los límites de Auth en Supabase.");
      } else {
        setError(msg || "Ocurrió un error. Inténtalo de nuevo.");
      }
    } finally {
      if (view !== 'REGISTER' && view !== 'FORGOT_PASSWORD') {
         setLoading(false);
      } else if (error) {
         setLoading(false);
      } else {
         setLoading(false);
      }
    }
  };

  const inputClass =
    "w-full rounded-xl border border-outline bg-surface-container-high px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 transition-all focus:border-primary-fixed focus:outline-none focus:ring-2 focus:ring-primary/30";
  const labelClass = "text-[0.7rem] font-bold uppercase tracking-wider text-primary-fixed";

  return (
    <div className="cyber-bg relative flex min-h-screen w-full">
      {/* Left hero */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 lg:flex">
        <img src="/login-library.png" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-br from-background/85 via-background/70 to-background" />

        <div className="relative z-10 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-glow-primary">
            <GraduationCap size={22} className="text-on-primary" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-primary-fixed">INFORARIO</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="display-lg text-balance text-on-surface">
            Tu vida académica, <span className="text-primary-fixed">curada.</span>
          </h1>
          <p className="mt-6 body-lg max-w-sm text-pretty text-on-surface-variant">
            Accede a tus horarios, recursos institucionales y tu agenda UTM en una experiencia digital refinada.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
          <span className="h-2 w-2 rounded-full bg-secondary animate-pulse-utm" />
          Portal Institucional v4.0
        </div>
      </div>

      {/* Right form panel */}
      <div className="relative flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <button
          onClick={handleClose}
          className="absolute right-6 top-6 z-20 flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-2 text-xs font-semibold text-on-surface-variant transition-colors hover:text-on-surface"
        >
          <X size={16} /> Cerrar
        </button>

        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <GraduationCap size={22} className="text-on-primary" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-primary-fixed">INFORARIO</span>
          </div>

          {view === 'FORGOT_PASSWORD' ? (
            <div className="mb-7">
              <button
                onClick={() => handleSwitchView('LOGIN')}
                className="mb-5 flex items-center text-xs font-semibold text-on-surface-variant transition-colors hover:text-primary-fixed"
              >
                <ArrowLeft size={14} className="mr-1" /> Volver al inicio
              </button>
              <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Recuperar acceso</h2>
              <p className="mt-2 text-sm text-on-surface-variant">Ingresa tu correo institucional para recibir un enlace de recuperación.</p>
            </div>
          ) : (
            <div className="mb-7">
              <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">
                {view === 'LOGIN' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
              </h2>
              <p className="mt-2 text-sm text-on-surface-variant">
                {view === 'LOGIN'
                  ? 'Inicia sesión en tu cuenta de estudiante UTM.'
                  : 'Regístrate con tu correo institucional (@utm.edu.ec).'}
              </p>
            </div>
          )}

          {/* Tabs */}
          {view !== 'FORGOT_PASSWORD' && (
            <div className="mb-6 flex gap-1 rounded-xl border border-outline/60 bg-surface-container p-1">
              <button
                onClick={() => handleSwitchView('LOGIN')}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${view === 'LOGIN' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => handleSwitchView('REGISTER')}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${view === 'REGISTER' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Registrarse
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-error/30 bg-error-container p-3 text-xs text-on-error-container">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-primary/30 bg-success-container p-3 text-xs text-primary-fixed">
              <Check size={14} className="mt-0.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'REGISTER' && (
              <div className="space-y-1.5">
                <label className={labelClass}>Nombre completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Juan Pérez"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className={labelClass}>Correo institucional</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="estudiante@utm.edu.ec"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            {view !== 'FORGOT_PASSWORD' && (
              <div className="space-y-1.5">
                <label className={labelClass}>Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClass} px-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary-fixed"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {view === 'REGISTER' && (
              <div className="space-y-2 pt-1">
                <div className="h-1 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className={`h-full transition-all duration-300 ${isPasswordValid ? 'bg-primary-fixed' : 'bg-secondary'}`}
                    style={{ width: `${(Object.values(pwdValidations).filter(Boolean).length / 4) * 100}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-on-surface-variant">
                  <span className={`flex items-center gap-1 ${pwdValidations.length ? 'font-medium text-primary-fixed' : ''}`}>
                    {pwdValidations.length ? <Check size={10} /> : null} 8+ caracteres
                  </span>
                  <span className={`flex items-center gap-1 ${pwdValidations.uppercase ? 'font-medium text-primary-fixed' : ''}`}>
                    {pwdValidations.uppercase ? <Check size={10} /> : null} Mayúscula
                  </span>
                  <span className={`flex items-center gap-1 ${pwdValidations.lowercase ? 'font-medium text-primary-fixed' : ''}`}>
                    {pwdValidations.lowercase ? <Check size={10} /> : null} Minúscula
                  </span>
                  <span className={`flex items-center gap-1 ${pwdValidations.number ? 'font-medium text-primary-fixed' : ''}`}>
                    {pwdValidations.number ? <Check size={10} /> : null} Número
                  </span>
                </div>
              </div>
            )}

            {view === 'LOGIN' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSwitchView('FORGOT_PASSWORD')}
                  className="text-xs font-semibold text-secondary hover:text-secondary-container"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (view === 'REGISTER' && !isPasswordValid)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-on-primary transition-all hover:bg-primary-container hover:shadow-glow-primary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-on-primary/30 border-t-on-primary" />
              ) : view === 'LOGIN' ? (
                'Iniciar Sesión'
              ) : view === 'REGISTER' ? (
                'Crear cuenta'
              ) : (
                'Enviar enlace'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[0.7rem] font-semibold uppercase tracking-widest text-on-surface-variant">
            Acceso institucional seguro
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
