
import React, { useState } from 'react';
import { 
  Zap, Mail, Lock, LogIn, UserPlus, Globe, 
  AlertCircle, ChevronRight, Github, Chrome, 
  ArrowLeft, Loader2, ShieldCheck, CheckCircle2
} from 'lucide-react';
import * as FirebaseAuth from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth, googleProvider, isMock } from '../services/firebase';

interface AuthProps {
  onSuccess: (user: any) => void;
  onMockBypass: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onSuccess, onMockBypass }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // If in Mock mode or Firebase Auth failed to init, bypass to simulation
    if (isMock || !auth) {
      setTimeout(() => {
        onMockBypass();
        setIsLoading(false);
      }, 800);
      return;
    }

    try {
      // Set persistence based on "Remember Me"
      const persistence = rememberMe 
        ? FirebaseAuth.browserLocalPersistence 
        : FirebaseAuth.browserSessionPersistence;
      await FirebaseAuth.setPersistence(auth, persistence);

      if (mode === 'signup') {
        const res = await FirebaseAuth.createUserWithEmailAndPassword(auth, email, password);
        await FirebaseAuth.updateProfile(res.user, { displayName: name });
        onSuccess(res.user);
      } else if (mode === 'login') {
        const res = await FirebaseAuth.signInWithEmailAndPassword(auth, email, password);
        onSuccess(res.user);
      } else {
        await FirebaseAuth.sendPasswordResetEmail(auth, email);
        alert("Reset link dispatched to your bio-terminal (email).");
        setMode('login');
      }
    } catch (err: any) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);

    // CRITICAL FIX: Prevent '_getRecaptchaConfig' error by not calling Firebase SDK if auth is null
    if (isMock || !auth) {
      setTimeout(() => {
        onMockBypass();
        setIsLoading(false);
      }, 800);
      return;
    }

    try {
      const res = await FirebaseAuth.signInWithPopup(auth, googleProvider);
      onSuccess(res.user);
    } catch (err: any) {
      // Handle closed popup specifically
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Synchronization interrupted: Auth window was closed.");
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
      {/* Dynamic Aura Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(255,255,255,0.15)] rotate-3 group transition-transform hover:rotate-0">
            <Zap className="w-10 h-10 text-slate-950 fill-slate-950" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tightest">CAL GEMINI</h1>
            <p className="text-emerald-500/60 font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-2">
              <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
              Metabolic Vault Access
            </p>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-8 rounded-[40px] shadow-2xl space-y-6">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-start gap-3 animate-in shake duration-300">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-rose-200 leading-relaxed uppercase tracking-wider">{error}</p>
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest px-1">Callsign</label>
                <div className="relative">
                  <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    required 
                    placeholder="Full Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/5 rounded-2xl font-bold text-sm outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all placeholder:text-slate-700"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest px-1">Email Terminal</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="email" 
                  required 
                  placeholder="name@terminal.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/5 rounded-2xl font-bold text-sm outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all placeholder:text-slate-700"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest px-1 flex justify-between">
                  Encryption Key
                  {mode === 'login' && (
                    <button type="button" onClick={() => setMode('forgot')} className="text-emerald-500 hover:text-emerald-400 transition-colors">Lost Key?</button>
                  )}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="password" 
                    required 
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/5 rounded-2xl font-bold text-sm outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all placeholder:text-slate-700"
                  />
                </div>
              </div>
            )}

            {mode !== 'forgot' && (
              <div className="flex items-center justify-between px-1">
                <button 
                  type="button" 
                  onClick={() => setRememberMe(!rememberMe)}
                  className="flex items-center gap-2 group"
                >
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${rememberMe ? 'bg-emerald-500 border-emerald-500' : 'border-white/10'}`}>
                    {rememberMe && <CheckCircle2 className="w-3 h-3 text-slate-950" />}
                  </div>
                  <span className="text-[9px] font-black uppercase text-slate-500 group-hover:text-slate-300 transition-colors">Stay Synchronized</span>
                </button>
              </div>
            )}

            <button 
              disabled={isLoading}
              className="w-full py-5 bg-emerald-500 text-slate-950 rounded-[22px] font-black text-xs tracking-widest uppercase shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 mt-4"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  {mode === 'login' ? <LogIn className="w-5 h-5" /> : mode === 'signup' ? <UserPlus className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                  <span>{mode === 'login' ? 'Engage Protocol' : mode === 'signup' ? 'Initialize Body' : 'Reset Bio-Link'}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {mode !== 'forgot' && (
            <div className="space-y-6">
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
                <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.3em] text-slate-600 bg-transparent px-4">OR SOCIAL SYNC</div>
              </div>

              <button 
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all group"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4 group-hover:scale-110 transition-transform" alt="Google" />
                Sync with Google Intelligence
              </button>
            </div>
          )}

          <div className="text-center">
            {mode === 'forgot' ? (
              <button onClick={() => setMode('login')} className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors flex items-center gap-2 mx-auto">
                <ArrowLeft className="w-3 h-3" /> Return to Login
              </button>
            ) : (
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                {mode === 'login' ? "New operative?" : "Already verified?"} {' '}
                <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-emerald-500 hover:text-emerald-400 transition-colors underline underline-offset-4 decoration-emerald-500/20">
                  {mode === 'login' ? 'Create Profile' : 'Access Vault'}
                </button>
              </p>
            )}
          </div>
        </div>

        <button 
          onClick={onMockBypass}
          className="w-full py-3 text-slate-600 hover:text-slate-400 font-black text-[9px] uppercase tracking-[0.5em] transition-colors"
        >
          &mdash; Run Offline Simulation &mdash;
        </button>
      </div>
    </div>
  );
};
