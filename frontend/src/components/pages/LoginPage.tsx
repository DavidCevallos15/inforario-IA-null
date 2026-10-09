import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Check, ArrowLeft, AlertCircle } from 'lucide-react';
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

    // Normalizar: los correos no distinguen mayúsculas y suelen pegarse con espacios
    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (view === 'LOGIN') {
        if (!normalizedEmail.endsWith('@utm.edu.ec')) {
          throw new Error("Debes usar tu correo institucional (@utm.edu.ec) para iniciar sesión.");
        }
        await signInWithEmail(normalizedEmail, password);
        onLogin(); // App.tsx listener will handle session update
      } else if (view === 'REGISTER') {
        if (!normalizedEmail.endsWith('@utm.edu.ec')) {
          throw new Error("El registro es exclusivo para correos institucionales de la UTM (@utm.edu.ec).");
        }
        if (!isPasswordValid) {
          throw new Error("La contraseña no cumple con los requisitos.");
        }
        await signUpWithEmail(normalizedEmail, password, fullName.trim());
        setSuccessMsg("¡Cuenta creada! Revisa tu correo para confirmar.");
      } else if (view === 'FORGOT_PASSWORD') {
        await resetPasswordForEmail(normalizedEmail);
        setSuccessMsg("Si el correo existe, recibirás un enlace de recuperación.");
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "";
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
    'w-full rounded-md border border-outline bg-surface-container-lowest py-3 pl-10 pr-4 text-base text-on-surface placeholder:text-on-surface-variant/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25';

  const checks: [keyof typeof pwdValidations, string][] = [
    ['length', '8 o más caracteres'],
    ['uppercase', 'Una mayúscula'],
    ['lowercase', 'Una minúscula'],
    ['number', 'Un número'],
  ];

  return (
    <div className="mx-auto w-full max-w-md pb-20 pt-8 sm:pt-14">
      <button
        type="button"
        onClick={handleClose}
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-bold text-on-surface-variant transition-colors hover:text-primary"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      <h1 className="text-4xl font-extrabold tracking-[-0.03em] text-on-surface">
        {view === 'FORGOT_PASSWORD' ? 'Recuperar contraseña' : view === 'REGISTER' ? 'Crea tu cuenta' : 'Ingresa'}
      </h1>
      <p className="mt-3 text-base leading-7 text-on-surface-variant">
        {view === 'FORGOT_PASSWORD'
          ? 'Escribe tu correo institucional y te enviaremos un enlace para crear una nueva.'
          : 'Con tu correo @utm.edu.ec tus horarios quedan guardados y puedes sincronizarlos con Google Calendar.'}
      </p>

      {view !== 'FORGOT_PASSWORD' && (
        <div role="tablist" className="mt-8 flex gap-6 border-b border-outline-variant">
          {(['LOGIN', 'REGISTER'] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              type="button"
              aria-selected={view === tab}
              onClick={() => handleSwitchView(tab)}
              className={`relative pb-3 text-base font-bold transition-colors ${view === tab ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              {tab === 'LOGIN' ? 'Iniciar sesión' : 'Registrarse'}
              {view === tab && <span aria-hidden className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-6 flex items-start gap-2 rounded bg-error-container px-3 py-2.5 text-sm font-semibold text-on-error-container">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-error" />
          {error}
        </p>
      )}
      {successMsg && (
        <p role="status" className="mt-6 flex items-start gap-2 rounded bg-primary-fixed px-3 py-2.5 text-sm font-semibold text-on-primary-fixed">
          <Check size={18} className="mt-0.5 shrink-0" />
          {successMsg}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate={false}>
        {view === 'REGISTER' && (
          <div className="space-y-2">
            <label htmlFor="auth-name" className="block text-sm font-bold text-on-surface">
              Nombre completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
              <input
                id="auth-name"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tus nombres y apellidos"
                className={inputClass}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="auth-email" className="block text-sm font-bold text-on-surface">
            Correo institucional
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@utm.edu.ec"
              className={inputClass}
            />
          </div>
        </div>

        {view !== 'FORGOT_PASSWORD' && (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <label htmlFor="auth-password" className="block text-sm font-bold text-on-surface">
                Contraseña
              </label>
              {view === 'LOGIN' && (
                <button
                  type="button"
                  onClick={() => handleSwitchView('FORGOT_PASSWORD')}
                  className="text-sm font-bold text-primary underline decoration-primary/40 hover:decoration-primary"
                >
                  ¿La olvidaste?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={view === 'REGISTER' ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-on-surface-variant hover:text-primary"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {view === 'REGISTER' && (
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-sm">
                {checks.map(([key, label]) => (
                  <li key={key} className={`flex items-center gap-1.5 ${pwdValidations[key] ? 'font-bold text-on-surface' : 'text-on-surface-variant'}`}>
                    <Check size={14} strokeWidth={3} className={pwdValidations[key] ? 'text-primary' : 'opacity-30'} />
                    {label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (view === 'REGISTER' && !isPasswordValid)}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3.5 text-base font-bold text-on-primary shadow-editorial transition-colors hover:bg-primary-container active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-on-primary/30 border-t-on-primary" />}
          {view === 'LOGIN' ? 'Iniciar sesión' : view === 'REGISTER' ? 'Crear cuenta' : 'Enviar enlace'}
        </button>

        {view === 'FORGOT_PASSWORD' && (
          <button
            type="button"
            onClick={() => handleSwitchView('LOGIN')}
            className="w-full text-center text-sm font-bold text-on-surface-variant hover:text-primary"
          >
            Volver a iniciar sesión
          </button>
        )}
      </form>
    </div>
  );
};

export default LoginPage;
