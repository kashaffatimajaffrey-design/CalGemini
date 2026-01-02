
import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Mic, ChevronRight, Settings, Loader2, User, ArrowRight, Zap, 
  Activity, LogOut, ChevronLeft, Check, Palette, RefreshCw, 
  Plus, X as CloseIcon, Dumbbell, Brain, Target, TrendingUp, Sparkles, 
  Wind, Activity as ActivityIcon, Sun, Download, Share2, Map as MapIcon, Trash2,
  ShieldCheck, CreditCard, Image as ImageIcon, Calendar, Clock as ClockIcon, Info
} from 'lucide-react';

import * as FirebaseFirestore from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import * as FirebaseAuth from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import { auth, db, isMock } from './services/firebase';
import { FoodEntry, ExerciseEntry, GeminiNutritionResponse, UserProfile, DaySummary, ThemeConfig } from './types';
import { MEAL_TYPES, calculateTargets, getTimelineScenarios } from './constants';
import { CircularProgress } from './components/CircularProgress';
import { FoodLogItem } from './components/FoodLogItem';
import { NutritionModal } from './components/NutritionModal';
import { MacroBar } from './components/MacroBar';
import { ChatAssistant } from './components/ChatAssistant';
import { HistoryDashboard } from './components/HistoryDashboard';
import { OnboardingInterview } from './components/OnboardingInterview';
import { Auth } from './components/Auth';
import { BillingPanel } from './components/BillingPanel';
import { ThemeCustomizer } from './components/ThemeCustomizer';
import { ShareModal } from './components/ShareModal';
import { 
  estimateNutritionFromText, generateMealPlan, estimateExercise, estimateNutritionFromImage
} from './services/geminiService';
import { createCheckoutSession, createPortalSession } from './services/stripeService';

const DEFAULT_THEME: ThemeConfig = {
  primary: '#0f172a', secondary: '#10b981', accent: '#f59e0b', background: '#f8fafc', style: 'minimalism'
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [allSummaries, setAllSummaries] = useState<DaySummary[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Synchronizing...');
  const [view, setView] = useState<'daily' | 'stats' | 'settings' | 'planner' | 'billing' | 'aura'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [inputValue, setInputValue] = useState('');
  const [prediction, setPrediction] = useState<GeminiNutritionResponse | null>(null);
  const [activeMealType, setActiveMealType] = useState<typeof MEAL_TYPES[number]>('Breakfast');
  const [mealPlanMarkdown, setMealPlanMarkdown] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (isMock) {
      const savedUser = localStorage.getItem('calgemini_mock_user');
      if (savedUser) { setUser(JSON.parse(savedUser)); loadUserProfile('mock'); }
      setIsAuthLoading(false);
    } else {
      const unsubscribe = FirebaseAuth.onAuthStateChanged(auth, async (u) => {
        if (u) { setUser(u); await loadUserProfile(u.uid); }
        else setUser(null);
        setIsAuthLoading(false);
      });
      return () => unsubscribe();
    }
  }, []);

  useEffect(() => { if (user) loadData(user.uid, selectedDate); }, [user, selectedDate]);

  useEffect(() => {
    if (profile?.theme) {
      applyTheme(profile.theme);
    } else {
      applyTheme(DEFAULT_THEME);
    }
  }, [profile?.theme]);

  const loadUserProfile = async (uid: string) => {
    if (isMock) {
      const saved = localStorage.getItem(`profile_${uid}`);
      if (saved) { 
        const p = JSON.parse(saved); 
        setProfile(p); 
      }
      else setShowOnboarding(true);
      return;
    }
    const doc = await FirebaseFirestore.getDoc(FirebaseFirestore.doc(db, "users", uid));
    if (doc.exists()) {
      const p = doc.data() as UserProfile;
      setProfile(p); 
      setShowOnboarding(false);
    } else setShowOnboarding(true);
  };

  const loadData = async (uid: string, date: string) => {
    if (isMock) {
      const fe = JSON.parse(localStorage.getItem(`entries_${uid}`) || '[]');
      setEntries(fe.filter((e: any) => e.timestamp?.startsWith(date)));
      const ex = JSON.parse(localStorage.getItem(`exercises_${uid}`) || '[]');
      setExercises(ex.filter((e: any) => e.timestamp?.startsWith(date)));
    } else {
      const q = FirebaseFirestore.query(FirebaseFirestore.collection(db, "users", uid, "entries"), FirebaseFirestore.where("timestamp", ">=", date));
      FirebaseFirestore.onSnapshot(q, s => setEntries(s.docs.map(d => d.data() as FoodEntry).filter(e => e.timestamp?.startsWith(date))));
      const eq = FirebaseFirestore.query(FirebaseFirestore.collection(db, "users", uid, "exercises"), FirebaseFirestore.where("timestamp", ">=", date));
      FirebaseFirestore.onSnapshot(eq, s => setExercises(s.docs.map(d => d.data() as ExerciseEntry).filter(e => e.timestamp?.startsWith(date))));
    }
  };

  const handleSubscribe = async (tier: 'monthly' | 'annual' | 'student', details: any) => {
    setIsLoading(true);
    setLoadingMessage('Securing Payment Channel...');
    if (isMock) {
      setTimeout(() => {
        const newProfile = { 
          ...profile!, 
          isPro: true, 
          subscriptionTier: tier,
          invoices: [
            ...(profile?.invoices || []),
            { 
              id: 'INV-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
              date: new Date().toLocaleDateString(),
              amount: tier === 'annual' ? 99.99 : tier === 'monthly' ? 12.99 : 5.99,
              status: 'paid',
              tier: tier,
              cardLast4: details.last4
            }
          ]
        } as UserProfile;
        setProfile(newProfile);
        localStorage.setItem(`profile_${user.uid}`, JSON.stringify(newProfile));
        setIsLoading(false);
      }, 2000);
      return;
    }
    try {
      const priceIds = { monthly: 'price_monthly_id', annual: 'price_annual_id', student: 'price_student_id' };
      const { url } = await createCheckoutSession(priceIds[tier]);
      window.location.href = url;
    } catch (e) { alert("Billing connection failed."); } finally { setIsLoading(false); }
  };

  const handlePortal = async () => {
    if (isMock) { alert("Simulation: Redirecting to Stripe Customer Portal..."); return; }
    setIsLoading(true);
    setLoadingMessage('Opening Portal...');
    try { const { url } = await createPortalSession(); window.location.href = url; } 
    catch (e) { alert("Portal access failed."); } finally { setIsLoading(false); }
  };

  const handleExport = () => {
    const data = { profile, entries, exercises };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `CalGemini_Export_${selectedDate}.json`; a.click();
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleTextScan = async (q: string) => {
    if (!q.trim()) return;
    setIsLoading(true);
    setLoadingMessage('Analyzing Metabolic Query...');
    try {
      if (q.toLowerCase().match(/(run|gym|workout|swim|walk|cycle)/)) {
        setLoadingMessage('Estimating Energy Expenditure...');
        const est = await estimateExercise(q, profile?.weight || 70);
        const ex: ExerciseEntry = { id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString(), name: est.name || q, caloriesBurned: est.caloriesBurned || 100, duration: est.duration || 30, type: est.type as any || 'cardio' };
        if (isMock) {
          const all = JSON.parse(localStorage.getItem(`exercises_${user.uid}`) || '[]');
          localStorage.setItem(`exercises_${user.uid}`, JSON.stringify([ex, ...all]));
          setExercises([ex, ...exercises]);
        } else {
          await FirebaseFirestore.setDoc(FirebaseFirestore.doc(FirebaseFirestore.collection(db, "users", user.uid, "exercises"), ex.id), ex);
        }
        setInputValue('');
      } else {
        setLoadingMessage('Calculating Nutritional Density...');
        const result = await estimateNutritionFromText(q);
        setPrediction(result);
      }
    } finally { setIsLoading(false); }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVisionScan = async () => {
    if (!selectedImage) return;
    setIsLoading(true);
    setLoadingMessage('Optical Analysis Engaged...');
    try {
      const base64Data = selectedImage.split(',')[1];
      const mimeType = selectedImage.split(';')[0].split(':')[1];
      const result = await estimateNutritionFromImage(base64Data, mimeType);
      setPrediction(result);
      setSelectedImage(null);
    } catch (err) {
      alert("Vision analysis failed. Ensure the image is clear.");
    } finally { setIsLoading(false); }
  };

  const toggleVoiceInput = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return alert("Acoustic input not supported on this device.");
    const recognition = new SpeechRec();
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInputValue(transcript);
      handleTextScan(transcript);
    };
    recognition.start();
  };

  const applyTheme = (theme: ThemeConfig) => {
    if (!theme) return;
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--secondary', theme.secondary);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--background', theme.background);
  };

  const saveTheme = async (newTheme: ThemeConfig) => {
    if (!profile) return;
    const updatedProfile = { ...profile, theme: newTheme };
    setProfile(updatedProfile);
    if (isMock) {
      localStorage.setItem(`profile_${user.uid}`, JSON.stringify(updatedProfile));
    } else {
      await FirebaseFirestore.updateDoc(FirebaseFirestore.doc(db, "users", user.uid), { theme: newTheme });
    }
  };

  const totals = entries.reduce((acc, curr) => ({
    calories: acc.calories + (curr.calories || 0),
    protein: acc.protein + (curr.protein || 0),
    carbs: acc.carbs + (curr.carbs || 0),
    fat: acc.fat + (curr.fat || 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const burned = exercises.reduce((acc, curr) => acc + (curr.caloriesBurned || 0), 0);
  const timeline = profile ? getTimelineScenarios(profile) : null;

  const handleSignOut = async () => {
    try {
      if (FirebaseAuth && typeof FirebaseAuth.signOut === 'function' && auth) {
        await FirebaseAuth.signOut(auth);
      }
    } catch (err) {
      console.warn("Firebase SignOut error, bypassing...", err);
    }
    setUser(null);
    localStorage.removeItem('calgemini_mock_user');
  };

  const handleGeneratePlan = async () => {
    if (!profile) return;
    setIsLoading(true);
    setLoadingMessage('Constructing Metabolic Schedule...');
    try {
      const plan = await generateMealPlan(profile);
      setMealPlanMarkdown(plan);
    } catch (e) {
      console.error("Planner error:", e);
      setMealPlanMarkdown("### Protocol Sync Error\n\nThe AI was unable to synthesize your schedule at this time. Please ensure your metabolic markers are fully updated and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;

  if (!user) return <Auth onSuccess={setUser} onMockBypass={() => { const mockUser = { uid: 'mock', email: 'operative@simulation.com' }; setUser(mockUser); localStorage.setItem('calgemini_mock_user', JSON.stringify(mockUser)); loadUserProfile('mock'); }} />;

  return (
    <div className="min-h-screen pb-32 transition-colors duration-700 bg-[var(--background)]" style={{ backgroundColor: 'var(--background)' }}>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-3xl border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('daily')}>
            <div className="w-7 h-7 bg-[var(--primary)] rounded-lg flex items-center justify-center transition-colors"><Zap className="w-3 h-3 text-white fill-white" /></div>
            <h1 className="text-sm font-black tracking-tightest">Cal Gemini</h1>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setView('daily')} className={`p-2 rounded-lg transition-colors ${view === 'daily' ? 'bg-[var(--primary)] text-white' : 'text-slate-400 hover:bg-slate-50'}`}><Target className="w-4 h-4"/></button>
            <button onClick={() => setView('planner')} className={`p-2 rounded-lg transition-colors ${view === 'planner' ? 'bg-[var(--primary)] text-white' : 'text-slate-400 hover:bg-slate-50'}`}><MapIcon className="w-4 h-4"/></button>
            <button onClick={() => setView('stats')} className={`p-2 rounded-lg transition-colors ${view === 'stats' ? 'bg-[var(--primary)] text-white' : 'text-slate-400 hover:bg-slate-50'}`}><TrendingUp className="w-4 h-4"/></button>
            <button onClick={() => setView('settings')} className={`p-2 rounded-lg transition-colors ${view === 'settings' ? 'bg-[var(--primary)] text-white' : 'text-slate-400 hover:bg-slate-50'}`}><Settings className="w-4 h-4"/></button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6">
        {showOnboarding ? (
          <OnboardingInterview user={user} defaultTheme={DEFAULT_THEME} onComplete={p => { setProfile(p); setShowOnboarding(false); if (isMock) localStorage.setItem(`profile_${user.uid}`, JSON.stringify(p)); }} />
        ) : (
          <>
            {view === 'daily' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                <section className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-3">
                    <p className="text-[7px] font-black uppercase text-slate-400 tracking-[0.2em]">Metabolic Budget</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-6xl font-black text-slate-900">{(profile?.dailyCalorieTarget || 0) - totals.calories + burned}</span>
                      <span className="text-[10px] font-black text-slate-300 uppercase">kcal</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black uppercase flex items-center gap-1.5"><Sun className="w-3 h-3"/> Active</div>
                      <div className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[8px] font-black uppercase flex items-center gap-1.5"><ActivityIcon className="w-3 h-3"/> -{burned} Burned</div>
                    </div>
                  </div>
                  <CircularProgress current={totals.calories} total={profile?.dailyCalorieTarget || 2000} />
                </section>

                {/* Timeline ETA Prediction Card */}
                {timeline && (
                   <section className="bg-[var(--primary)] text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-700">
                      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><ClockIcon className="w-32 h-32" /></div>
                      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        {'realistic' in timeline ? (
                          <>
                            <div className="space-y-2 text-center md:text-left">
                              <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-40">Estimated Goal Arrival</p>
                              <div className="flex items-baseline justify-center md:justify-start gap-2">
                                <span className="text-6xl font-black">{timeline.realistic}</span>
                                <span className="text-lg font-black opacity-30 uppercase">Weeks</span>
                              </div>
                              <p className="text-[10px] font-black opacity-60 uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
                                <Target className="w-3 h-3" /> Target: {profile?.targetWeight} kg
                              </p>
                            </div>
                            <div className="space-y-4">
                               <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                                  <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-emerald-400">
                                    <Sparkles className="w-3 h-3"/> Metabolic Forecast
                                  </div>
                                  <p className="text-xs font-bold leading-relaxed opacity-80">{timeline.analysis}</p>
                               </div>
                               {timeline.warning && (
                                 <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex items-start gap-3">
                                    <Info className="w-4 h-4 text-amber-400 shrink-0" />
                                    <p className="text-[10px] font-black text-amber-200 uppercase leading-tight">{timeline.warning}</p>
                                 </div>
                               )}
                            </div>
                          </>
                        ) : (
                          <div className="col-span-full p-6 bg-white/5 rounded-2xl text-center">
                            <Info className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                            <p className="text-xs font-bold opacity-80">{(timeline as any).warning}</p>
                          </div>
                        )}
                      </div>
                   </section>
                )}

                <section className="grid grid-cols-3 gap-3">
                  <MacroBar label="Protein" current={totals.protein} target={profile?.dailyMacroTargets?.protein || 150} color="bg-blue-500" />
                  <MacroBar label="Carbs" current={totals.carbs} target={profile?.dailyMacroTargets?.carbs || 200} color="bg-amber-500" />
                  <MacroBar label="Fat" current={totals.fat} target={profile?.dailyMacroTargets?.fat || 70} color="bg-rose-500" />
                </section>

                <section className="bg-white p-6 rounded-[32px] border border-slate-50 shadow-sm space-y-4">
                  <div className="flex gap-1 overflow-x-auto pb-2">
                    {MEAL_TYPES.map(t => <button key={t} onClick={() => setActiveMealType(t)} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase transition-all ${activeMealType === t ? 'bg-[var(--primary)] text-white' : 'bg-slate-50 text-slate-400'}`}>{t}</button>)}
                  </div>
                  
                  {selectedImage && (
                    <div className="relative w-full h-48 bg-slate-900 rounded-2xl overflow-hidden group mb-4">
                      <img src={selectedImage} className="w-full h-full object-cover opacity-50" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white">
                        <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Vision Analysis</p>
                        <div className="flex gap-2">
                          <button onClick={handleVisionScan} className="px-6 py-2 bg-emerald-500 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-4 h-4"/> Analyze</button>
                          <button onClick={() => setSelectedImage(null)} className="px-6 py-2 bg-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest">Discard</button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="relative">
                    <input type="text" placeholder="I had a protein shake..." value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleTextScan(inputValue)} className="w-full pl-6 pr-32 py-5 bg-slate-50 rounded-[24px] text-sm font-black outline-none focus:bg-white transition-all" />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button onClick={toggleVoiceInput} title="Voice Feed" className="p-3 text-slate-400 hover:text-[var(--primary)] transition-colors"><Mic className="w-5 h-5"/></button>
                      <button onClick={() => fileInputRef.current?.click()} title="Vision Feed" className="p-3 text-slate-400 hover:text-[var(--primary)] transition-colors"><Camera className="w-5 h-5"/></button>
                      <button onClick={() => handleTextScan(inputValue)} title="Process Query" className="p-3 bg-[var(--primary)] text-white rounded-2xl transition-colors"><ChevronRight className="w-4 h-4"/></button>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleImageSelect} />
                  </div>
                </section>

                <div className="space-y-4">
                  <h3 className="text-[8px] font-black text-slate-300 uppercase tracking-widest px-4">Tactical Log</h3>
                  <div className="space-y-3">
                    {exercises.map(ex => (
                      <div key={ex.id} className="bg-rose-50/50 p-4 rounded-[24px] border border-rose-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center"><Wind className="w-5 h-5"/></div>
                          <div><h4 className="font-black text-sm">{ex.name}</h4><p className="text-[8px] font-black text-rose-400 uppercase">{ex.duration} mins • {ex.type}</p></div>
                        </div>
                        <div className="text-right"><span className="text-xl font-black text-rose-600">-{ex.caloriesBurned || 0}</span><span className="text-[7px] block font-black text-rose-300">kcal</span></div>
                      </div>
                    ))}
                    {entries.map(e => <FoodLogItem key={e.id} entry={e} onDelete={() => {}} />)}
                  </div>
                </div>
              </div>
            )}

            {view === 'planner' && profile && (
              <div className="space-y-8 animate-in fade-in">
                <div className="bg-[var(--primary)] text-white p-10 rounded-[48px] shadow-3xl relative overflow-hidden text-center sm:text-left transition-colors">
                  <div className="absolute top-0 right-0 p-10 opacity-5"><MapIcon className="w-48 h-48" /></div>
                  <div className="relative z-10 space-y-6">
                    <h2 className="text-4xl font-black leading-none">Protocol Planner.</h2>
                    <p className="text-white/60 text-sm max-w-sm">AI-generated metabolic schedule for the next 72 hours.</p>
                    <button onClick={handleGeneratePlan} className="px-8 py-4 bg-[var(--secondary)] text-[var(--primary)] rounded-[22px] font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] transition-all">Generate Plan <Sparkles className="w-4 h-4"/></button>
                  </div>
                </div>
                {mealPlanMarkdown && (
                  <div className="bg-white p-8 rounded-[40px] border border-slate-100 prose prose-slate max-w-none text-sm font-bold animate-in fade-in slide-in-from-top-4 duration-500">
                    {mealPlanMarkdown.split('\n').map((l, i) => (
                      <p key={i} className={l.startsWith('#') ? 'text-lg font-black mt-6 mb-2 text-slate-900 border-l-4 border-[var(--secondary)] pl-4' : 'mb-1 text-slate-600'}>
                        {l}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {view === 'billing' && profile && <BillingPanel profile={profile} onSubscribe={handleSubscribe} onPortal={handlePortal} onBack={() => setView('settings')} />}
            
            {view === 'aura' && profile && (
              <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
                <button onClick={() => setView('settings')} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors"><ChevronLeft className="w-4 h-4"/> Return to Settings</button>
                <ThemeCustomizer currentTheme={profile.theme} onThemeChange={applyTheme} onSave={saveTheme} />
              </div>
            )}

            {view === 'settings' && (
              <div className="max-w-md mx-auto space-y-6">
                <h2 className="text-3xl font-black text-center">Protocol Settings.</h2>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 space-y-2">
                  <button onClick={() => setView('aura')} className="w-full p-4 bg-slate-50 rounded-xl flex items-center justify-between group hover:bg-[var(--primary)] hover:text-white transition-all">
                    <div className="flex items-center gap-3"><Palette className="w-4 h-4"/><span className="font-black text-xs">Recalibrate Interface Aura</span></div>
                    <ChevronRight className="w-4 h-4"/>
                  </button>
                  <button onClick={() => setView('billing')} className="w-full p-4 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-between group hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                    <div className="flex items-center gap-3"><ShieldCheck className="w-4 h-4"/><span className="font-black text-xs">{profile?.isPro ? 'Manage Elite Access' : 'Upgrade to Elite Intelligence'}</span></div>
                    <ChevronRight className="w-4 h-4"/>
                  </button>
                  <button onClick={handleExport} className="w-full p-4 bg-slate-50 rounded-xl flex items-center justify-between group hover:bg-slate-900 hover:text-white transition-all"><div className="flex items-center gap-3"><Download className="w-4 h-4"/><span className="font-black text-xs">Dump Metabolic Data</span></div><ChevronRight className="w-4 h-4"/></button>
                  <button onClick={handleShare} className="w-full p-4 bg-slate-50 rounded-xl flex items-center justify-between group hover:bg-slate-900 hover:text-white transition-all"><div className="flex items-center gap-3"><Share2 className="w-4 h-4"/><span className="font-black text-xs">Share Progress</span></div><ChevronRight className="w-4 h-4"/></button>
                  <button onClick={handleSignOut} className="w-full p-4 bg-rose-50 text-rose-700 rounded-xl flex items-center justify-between group"><div className="flex items-center gap-3"><LogOut className="w-4 h-4"/><span className="font-black text-xs">Terminate Protocol</span></div></button>
                </div>
              </div>
            )}

            {view === 'stats' && profile && <HistoryDashboard profile={profile} summaries={allSummaries} onSelectDate={(d) => { setSelectedDate(d); setView('daily'); }} onUpdateWeight={async () => {}} onDeleteWeight={async () => {}} />}
          </>
        )}
      </main>

      {profile && <ChatAssistant profile={profile} entries={entries} totals={totals} />}
      {prediction && <NutritionModal data={prediction} originalQuery={inputValue} onCancel={() => setPrediction(null)} onConfirm={async (m, d) => {
        const e: FoodEntry = { ...d!, id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString(), mealType: activeMealType, portionMultiplier: m };
        if (isMock) {
          const all = JSON.parse(localStorage.getItem(`entries_${user.uid}`) || '[]');
          localStorage.setItem(`entries_${user.uid}`, JSON.stringify([e, ...all]));
          setEntries([e, ...entries]);
        } else {
          await FirebaseFirestore.setDoc(FirebaseFirestore.doc(FirebaseFirestore.collection(db, "users", user.uid, "entries"), e.id), e);
        }
        setPrediction(null); setInputValue('');
      }} />}
      
      {profile && (
        <ShareModal 
          isOpen={isShareModalOpen} 
          onClose={() => setIsShareModalOpen(false)} 
          profile={profile} 
          totals={totals}
          burned={burned}
        />
      )}

      {isLoading && (
        <div className="fixed inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-white rounded-[32px] shadow-3xl flex items-center justify-center animate-bounce">
              <Loader2 className="animate-spin text-slate-900 w-10 h-10" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900">{loadingMessage}</p>
              <div className="flex gap-1">
                 {[0, 0.2, 0.4].map(d => <div key={d} className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-pulse" style={{ animationDelay: `${d}s` }} />)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
