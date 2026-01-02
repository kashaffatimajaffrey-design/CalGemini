
import React, { useState } from 'react';
import { Brain, ArrowRight, Check, ChevronRight, ChevronLeft, Target, Activity, Heart, Utensils, Zap, Shield, User, Ruler, Clock, Plus, Palette, Wand2 } from 'lucide-react';
import { UserProfile, ThemeConfig, UIStyle } from '../types';
import { calculateTargets } from '../constants';
import { suggestTheme } from '../services/geminiService';

interface OnboardingInterviewProps {
  user: any;
  onComplete: (profile: UserProfile) => void;
  defaultTheme: ThemeConfig;
}

export const OnboardingInterview: React.FC<OnboardingInterviewProps> = ({ user, onComplete, defaultTheme }) => {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isGeneratingAura, setIsGeneratingAura] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const [answers, setAnswers] = useState<any>({
    name: user.displayName || '', age: '', gender: 'male', weight: '', height: '', targetWeight: '', region: 'North America',
    goalType: 'fat_loss', secondaryGoals: [], bodyType: 'mesomorph', frameStructure: [], fatStoragePattern: 'overall',
    jobType: 'sedentary', dailySittingHours: '8', workSchedule: 'morning',
    isCurrentlyWorkingOut: false, workoutLocation: 'gym', trainingType: 'resistance', trainingFrequency: '3', experienceLevel: 'beginner', preferredWorkoutLength: '30-40',
    healthConditions: [], stressLevel: 'moderate', sleepDuration: '6-7', energyLevels: 'moderate',
    dietaryPreference: 'non_vegetarian', allergies: [], mealsPerDay: '3', snackingHabits: 'moderate', waterIntake: '1-2L',
    dietHistory: 'consistent', gainSpeed: 'moderately', physiquePreference: 'lean_toned', avoidBulky: false, focusAreas: [],
    pacePreference: 'moderate', okWithLifestyleChanges: true, primaryMotivation: 'Health', biggestStruggle: 'Consistency', adherenceProbability: '5-6',
    auraInspiration: '', auraStyle: 'minimalism' as UIStyle,
  });

  const categories = [
    { id: 'bio', label: 'Baseline', icon: User, questions: [
      { key: 'name', question: "Identify your callsign?", placeholder: "Full Name" },
      { key: 'age', question: "Years operational (Age)?", placeholder: "Age", type: 'number' },
      { key: 'gender', question: "Biological sex?", options: ['male', 'female', 'other'] },
      { key: 'weight', question: "Current mass (kg)?", placeholder: "e.g. 80", type: 'number' },
      { key: 'height', question: "Stature (cm)?", placeholder: "e.g. 175", type: 'number' },
      { key: 'targetWeight', question: "Objective mass (kg)?", placeholder: "e.g. 75", type: 'number' },
    ]},
    { id: 'goals', label: 'Objectives', icon: Target, questions: [
      { key: 'goalType', question: "Primary metabolic objective?", options: ['fat_loss', 'muscle_gain', 'maintenance', 'recomposition'] },
      { key: 'secondaryGoals', question: "Secondary metrics?", type: 'multiselect', options: ['Stamina', 'Strength', 'Posture', 'Flexibility', 'Heart Health', 'Skin Health', 'Brain Fog', 'Longevity', 'Custom...'] },
    ]},
    { id: 'body', label: 'Morphology', icon: Ruler, questions: [
      { key: 'bodyType', question: "Morphology class?", options: ['ectomorph', 'mesomorph', 'endomorph', 'not_sure'] },
      { key: 'fatStoragePattern', question: "Adipose focus?", options: ['belly', 'hips_thighs', 'arms', 'overall'] },
    ]},
    { id: 'lifestyle', label: 'Lifestyle', icon: Clock, questions: [
      { key: 'jobType', question: "Occupation activity?", options: ['sedentary', 'mixed', 'physical'] },
      { key: 'dailySittingHours', question: "Hours sitting daily?", type: 'number' },
    ]},
    { id: 'exercise', label: 'Exercise', icon: Activity, questions: [
      { key: 'isCurrentlyWorkingOut', question: "Active training?", options: ['Yes', 'No'], transform: (v: string) => v === 'Yes' },
      { key: 'trainingFrequency', question: "Sessions/week?", type: 'number' },
      { key: 'preferredWorkoutLength', question: "Session duration?", options: ['15-20', '30-40', '45-60'] },
    ]},
    { id: 'health', label: 'Vitals', icon: Heart, questions: [
      { key: 'healthConditions', question: "Biological factors?", type: 'multiselect', options: ['PCOS', 'Insulin Resistance', 'Thyroid', 'High Cholesterol', 'None', 'Custom...'] },
      { key: 'stressLevel', question: "Stress baseline?", options: ['low', 'moderate', 'high'] },
      { key: 'sleepDuration', question: "Sleep recharge?", options: ['<5', '6-7', '8+'] },
    ]},
    { id: 'diet', label: 'Nutrition', icon: Utensils, questions: [
      { key: 'dietaryPreference', question: "Fuel philosophy?", options: ['vegetarian', 'non_vegetarian', 'vegan'] },
      { key: 'snackingHabits', question: "Snack intensity?", options: ['rare', 'moderate', 'frequent'] },
    ]},
    { id: 'metabolism', label: 'Metabolism', icon: Zap, questions: [
      { key: 'gainSpeed', question: "Mass acquisition speed?", options: ['easily', 'moderately', 'difficulty'] },
    ]},
    { id: 'aesthetics', label: 'Aesthetics', icon: Shield, questions: [
      { key: 'physiquePreference', question: "Target aesthetic?", options: ['lean_toned', 'athletic', 'slim'] },
    ]},
    { id: 'aura', label: 'Aura Sync', icon: Palette, questions: [
      { key: 'auraInspiration', question: "Describe your interface mood.", placeholder: "e.g. Deep Ocean, Sunset, Neon..." },
      { key: 'auraStyle', question: "UI priority?", options: ['minimalism', 'bold_modern', 'neon', 'pastel'] },
    ]}
  ];

  const currentCategory = categories[currentCategoryIndex];
  const currentQ = currentCategory.questions[currentQuestionIndex];

  const handleNext = async () => {
    if (showCustomInput && customInput.trim()) {
      const key = currentQ.key;
      const newList = [...(answers[key] || []).filter((x: string) => x !== 'Custom...'), customInput.trim()];
      setAnswers({ ...answers, [key]: newList });
      setCustomInput(''); setShowCustomInput(false);
    }
    if (currentQuestionIndex < currentCategory.questions.length - 1) setCurrentQuestionIndex(currentQuestionIndex + 1);
    else if (currentCategoryIndex < categories.length - 1) { setCurrentCategoryIndex(currentCategoryIndex + 1); setCurrentQuestionIndex(0); }
    else await finalize();
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(currentQuestionIndex - 1);
    else if (currentCategoryIndex > 0) { setCurrentCategoryIndex(currentCategoryIndex - 1); setCurrentQuestionIndex(categories[currentCategoryIndex - 1].questions.length - 1); }
  };

  const finalize = async () => {
    setIsGeneratingAura(true);
    let finalTheme = defaultTheme;
    try { if (answers.auraInspiration) finalTheme = await suggestTheme(answers.auraInspiration, answers.auraStyle); } catch (e) {}
    
    const baseProfile: Partial<UserProfile> = {
      ...answers,
      theme: finalTheme,
      startDate: new Date().toISOString().split('T')[0],
      weightHistory: [{ date: new Date().toISOString().split('T')[0], weight: parseFloat(answers.weight) || 70 }]
    };

    // Calculate targets and ensure the returned properties (dailyCalorieTarget, dailyMacroTargets) 
    // are correctly merged into the final profile.
    const targets = calculateTargets(baseProfile);
    const finalProfile = { ...baseProfile, ...targets } as UserProfile;
    
    onComplete(finalProfile);
    setIsGeneratingAura(false);
  };

  const toggleOption = (key: string, opt: string) => {
    if (opt === 'Custom...') { setShowCustomInput(true); return; }
    const current = answers[key] || [];
    setAnswers({ ...answers, [key]: current.includes(opt) ? current.filter((x: string) => x !== opt) : [...current, opt] });
  };

  if (isGeneratingAura) return (
    <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in-95">
      <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse"><Wand2 className="text-emerald-400 w-8 h-8" /></div>
      <h2 className="text-xl font-black tracking-tightest">Synchronizing Aura...</h2>
    </div>
  );

  return (
    <div className="max-w-md mx-auto py-8 px-4 space-y-4 animate-in fade-in slide-in-from-bottom-6">
      <div className="flex items-center justify-between bg-white/40 backdrop-blur-xl border border-white/20 p-3 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center"><currentCategory.icon className="w-4 h-4" /></div>
          <div><h4 className="text-[8px] font-black uppercase text-slate-400">Step {currentCategoryIndex + 1}/{categories.length}</h4><h3 className="font-black text-xs leading-none">{currentCategory.label}</h3></div>
        </div>
        <div className="flex gap-1">{categories.map((_, i) => <div key={i} className={`h-1 rounded-full transition-all ${i === currentCategoryIndex ? 'w-4 bg-slate-900' : 'w-1 bg-slate-100'}`} />)}</div>
      </div>

      <div className="bg-white rounded-[40px] p-8 shadow-2xl border border-slate-50 relative min-h-[300px] flex flex-col justify-center">
        <div className="space-y-6 relative z-10">
          <h2 className="text-xl font-black text-slate-900 leading-tight tracking-tightest">{currentQ.question}</h2>
          <div className="space-y-2">
            {(currentQ as any).type === 'multiselect' ? (
              <div className="grid grid-cols-2 gap-2">
                {(currentQ as any).options.map((opt: string) => (
                  <button key={opt} onClick={() => toggleOption(currentQ.key, opt)} className={`px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all text-left flex items-center justify-between border-2 ${answers[currentQ.key]?.includes(opt) ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-200'}`}>
                    {opt.replace('_', ' ')} {answers[currentQ.key]?.includes(opt) ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 opacity-20" />}
                  </button>
                ))}
                {showCustomInput && <input type="text" autoFocus placeholder="Specify..." value={customInput} onChange={e => setCustomInput(e.target.value)} onBlur={() => !customInput && setShowCustomInput(false)} className="col-span-full p-3 bg-emerald-50 border-2 border-emerald-100 rounded-xl text-[10px] font-black outline-none" />}
              </div>
            ) : (currentQ as any).options ? (
              <div className="grid grid-cols-2 gap-2">
                {(currentQ as any).options.map((opt: string) => (
                  <button key={opt} onClick={() => { setAnswers({ ...answers, [currentQ.key]: (currentQ as any).transform ? (currentQ as any).transform(opt) : opt }); handleNext(); }} className={`px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all text-left flex items-center justify-between border-2 ${answers[currentQ.key] === ((currentQ as any).transform ? (currentQ as any).transform(opt) : opt) ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-200'}`}>
                    {opt.replace('_', ' ')} <ChevronRight className="w-3 h-3 opacity-20" />
                  </button>
                ))}
              </div>
            ) : (
              <input type={(currentQ as any).type === 'number' ? 'number' : 'text'} autoFocus placeholder={(currentQ as any).placeholder} value={answers[currentQ.key]} onChange={e => setAnswers({ ...answers, [currentQ.key]: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleNext()} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-base font-black outline-none focus:ring-4 focus:ring-slate-100 transition-all placeholder:text-slate-200" />
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-2 pt-2">
        <button onClick={handleBack} disabled={currentCategoryIndex === 0 && currentQuestionIndex === 0} className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-slate-300 hover:text-slate-900 disabled:opacity-0 transition-all"><ChevronLeft className="w-3 h-3" /> Back</button>
        {(!(currentQ as any).options || (currentQ as any).type === 'multiselect') && <button onClick={handleNext} className="px-6 py-3 bg-slate-900 text-white rounded-[18px] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 hover:scale-105 transition-all">{currentCategoryIndex === categories.length - 1 ? 'Finalize' : 'Next'} <ArrowRight className="w-3 h-3" /></button>}
      </div>
    </div>
  );
};
