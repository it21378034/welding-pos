import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  KeyRound,
  AlertCircle
} from 'lucide-react';
import { SUPER_ADMIN_EMAIL, SUPER_ADMIN_DEFAULT_PASSWORD } from '../lib/authService';

export const LoginScreen: React.FC = () => {
  const { login, settings } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || 'Invalid credentials.');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillAdmin = () => {
    setEmail(SUPER_ADMIN_EMAIL);
    setPassword(SUPER_ADMIN_DEFAULT_PASSWORD);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden selection:bg-amber-500 selection:text-slate-950">
      {/* Background ambient glowing sparks & radial gradient */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-amber-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #f59e0b 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Login Card */}
      <div className="relative w-full max-w-md my-auto">
        {/* Glow Border Frame */}
        <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-2xl p-7 sm:p-9 shadow-2xl shadow-slate-950/80">
          
          {/* Top Logo & Heading */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="relative mb-3.5 group">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 opacity-60 blur group-hover:opacity-100 transition duration-500" />
              <img
                src={settings.logoUrl || '/logo.png'}
                alt="Logo"
                className="relative w-20 h-20 rounded-full object-contain p-1.5 bg-slate-900 border-2 border-amber-500 shadow-xl"
              />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-extrabold uppercase tracking-widest mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Authorized Access Only</span>
            </div>

            <h1 className="text-2xl font-black text-slate-100 tracking-tight">
              {settings.name || 'Dasanayake Iron Works'}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Welding & Metal Fabrication POS System
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">
                {error}
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Username / Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. deshithanayanajith@gmail.com"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Fill Button */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleFillAdmin}
                className="text-[11px] font-semibold text-amber-400/90 hover:text-amber-300 flex items-center gap-1 transition"
              >
                <KeyRound className="w-3 h-3" />
                <span>Fill Owner Credentials</span>
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to System</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Security Notice */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Multi-user access control & Cloud Sync Enabled</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
