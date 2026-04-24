import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, Eye, EyeOff, User, GraduationCap, Check, ArrowLeft, AlertCircle } from 'lucide-react';
import { signInWithEmail, signUpWithEmail, resetPasswordForEmail, isSupabaseConfigured } from '../../services/supabase';

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

  const handleSwitchView = (newView: AuthView) => {
    resetState();
    setView(newView);
  };

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
      if (err.message.includes("User already registered")) {
        setError("Este correo ya está registrado. Por favor, inicia sesión.");
      } else if (err.message.includes("Invalid login")) {
        setError("Credenciales incorrectas.");
      } else {
        setError(err.message || "Ocurrió un error. Inténtalo de nuevo.");
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

  return (
    <div className="min-h-[calc(100vh-80px)] w-full flex items-center justify-center p-4 relative z-10">
      {/* Container */}
      <div className="bg-surface-container-lowest rounded-3xl editorial-shadow w-full max-w-md max-h-[calc(100vh-40px)] overflow-y-auto relative flex flex-col border border-outline-variant/15">
        
        {/* Close/Back Button */}
        <button 
          onClick={onBack} 
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors z-20 bg-surface-container p-2 rounded-full"
        >
          <X size={20} />
        </button>

        {/* Content Area */}
        <div className="p-8">
          
          {/* Header Section */}
          <div className="text-center mb-5">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(0,240,255,0.4)]">
              <GraduationCap size={28} className="text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Bienvenido a Inforario</h2>
            <p className="text-xs text-muted-foreground mt-1">Gestiona tu horario universitario de manera inteligente</p>
          </div>

          {/* View: Forgot Password Header Override */}
          {view === 'FORGOT_PASSWORD' ? (
             <div className="mb-5">
                <button 
                  onClick={() => handleSwitchView('LOGIN')}
                  className="flex items-center text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
                >
                  <ArrowLeft size={14} className="mr-1" /> Volver al inicio
                </button>
                <h3 className="text-lg font-bold text-foreground">Recuperar Contraseña</h3>
                <p className="text-xs text-muted-foreground">Ingresa tu correo para recibir un enlace de recuperación.</p>
             </div>
          ) : (
            /* Tabs */
            <div className="flex bg-background border border-muted p-1 rounded-xl mb-5">
              <button 
                onClick={() => handleSwitchView('LOGIN')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${view === 'LOGIN' ? 'bg-card text-foreground shadow-sm border border-muted' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Iniciar Sesión
              </button>
              <button 
                onClick={() => handleSwitchView('REGISTER')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${view === 'REGISTER' ? 'bg-card text-foreground shadow-sm border border-muted' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Registrarse
              </button>
            </div>
          )}

          {/* Error / Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive text-xs rounded-lg flex items-start gap-2 border border-destructive/20">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 bg-green-900/20 text-green-400 text-xs rounded-lg flex items-start gap-2 border border-green-900/30">
              <Check size={14} className="mt-0.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            
            {/* Full Name (Register Only) */}
            {view === 'REGISTER' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Nombre completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input 
                    type="text" 
                    required={view === 'REGISTER'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Juan Pérez"
                    className="w-full pl-9 pr-4 py-2.5 bg-background border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-foreground placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="estudiante@utm.edu.ec"
                  className="w-full pl-9 pr-4 py-2.5 bg-background border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-foreground placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            {/* Password */}
            {view !== 'FORGOT_PASSWORD' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-background border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-foreground placeholder:text-muted-foreground/50"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Password Validation Indicators (Register Only) */}
            {view === 'REGISTER' && (
              <div className="space-y-2 pt-1">
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                   <div 
                      className={`h-full transition-all duration-300 ${isPasswordValid ? 'bg-green-500' : 'bg-primary'}`}
                      style={{ width: `${(Object.values(pwdValidations).filter(Boolean).length / 4) * 100}%` }}
                   ></div>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                  <span className={`flex items-center gap-1 ${pwdValidations.length ? 'text-green-400 font-medium' : ''}`}>
                    {pwdValidations.length ? <Check size={10} /> : null} 8+ caracteres
                  </span>
                  <span className={`flex items-center gap-1 ${pwdValidations.uppercase ? 'text-green-400 font-medium' : ''}`}>
                    {pwdValidations.uppercase ? <Check size={10} /> : null} Mayúscula
                  </span>
                  <span className={`flex items-center gap-1 ${pwdValidations.lowercase ? 'text-green-400 font-medium' : ''}`}>
                    {pwdValidations.lowercase ? <Check size={10} /> : null} Minúscula
                  </span>
                  <span className={`flex items-center gap-1 ${pwdValidations.number ? 'text-green-400 font-medium' : ''}`}>
                    {pwdValidations.number ? <Check size={10} /> : null} Número
                  </span>
                </div>
              </div>
            )}

            {/* Forgot Password Link */}
            {view === 'LOGIN' && (
              <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={() => handleSwitchView('FORGOT_PASSWORD')}
                  className="text-xs text-primary hover:text-cyan-300 font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={loading || (view === 'REGISTER' && !isPasswordValid)}
              className="w-full py-2.5 bg-primary hover:bg-cyan-300 text-primary-foreground font-bold rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></span>
              ) : (
                view === 'LOGIN' ? 'Iniciar Sesión' : view === 'REGISTER' ? 'Crear cuenta' : 'Enviar enlace'
              )}
            </button>
          </form>

          <div className="mt-4 text-center text-[10px] text-muted-foreground">
            Al {view === 'REGISTER' ? 'crear tu cuenta' : 'iniciar sesión'}, aceptas nuestros <a href="#" className="underline hover:text-foreground">términos de servicio</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;