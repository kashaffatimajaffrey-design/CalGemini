
import React, { useState } from 'react';
import { GeminiNutritionResponse } from '../types';
import { Check, X, MessageCircle, Loader2, Zap, Plus, Minus, Wand2, Scale, HelpCircle, ArrowRight, Volume2 } from 'lucide-react';
import { refineNutrition, speakText, decodeAudio } from '../services/geminiService';

interface NutritionModalProps {
  data: GeminiNutritionResponse;
  originalQuery: string;
  onConfirm: (multiplier: number, updatedData?: GeminiNutritionResponse) => void;
  onCancel: () => void;
}

export const NutritionModal: React.FC<NutritionModalProps> = ({ data: initialData, originalQuery, onConfirm, onCancel }) => {
  const [data, setData] = useState(initialData);
  const [multiplier, setMultiplier] = useState(1);
  const [refinementText, setRefinementText] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const adjust = (val: number) => setMultiplier(prev => Math.max(0.1, Math.min(10, prev + val)));

  const handleRefine = async (specialText?: string) => {
    setIsRefining(true);
    try {
      const textToRefine = specialText || refinementText;
      const refined = await refineNutrition(data.name, textToRefine);
      setData(refined);
      setRefinementText('');
      if (textToRefine.toLowerCase().match(/(plus|with|add|half|double|triple|serving|portion)/)) {
          setMultiplier(1);
      }
    } catch (err) {
      alert("Refining failed. Gemini might be busy.");
    } finally { setIsRefining(false); }
  };

  const handleSpeak = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const text = `${data.name}. Estimates indicate ${Math.round(data.calories * multiplier)} calories. Protein is ${Math.round(data.protein * multiplier)} grams.`;
      const audioBase64 = await speakText(text);
      if (audioBase64) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const pcmData = decodeAudio(audioBase64);
        const int16 = new Int16Array(pcmData.buffer);
        const float32 = new Float32Array(int16.length);
        for(let i=0; i<int16.length; i++) float32[i] = int16[i] / 32768;
        
        const buffer = audioContext.createBuffer(1, float32.length, 24000);
        buffer.getChannelData(0).set(float32);
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (e) {
      setIsSpeaking(false);
    }
  };

  const finalCalories = Math.round(data.calories * multiplier);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] w-full max-w-lg p-8 shadow-3xl border relative max-h-[90vh] overflow-y-auto">
        <button onClick={onCancel} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"><X className="w-5 h-5"/></button>

        <div className="space-y-6">
          <div className="space-y-1">
             <div className="flex items-center justify-between">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">AI Estimation</p>
               <button 
                onClick={handleSpeak}
                className={`p-2 rounded-xl transition-all ${isSpeaking ? 'bg-[var(--primary)] text-white animate-pulse' : 'bg-slate-50 text-slate-400 hover:text-[var(--primary)]'}`}
               >
                 {isSpeaking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
               </button>
             </div>
             <h2 className="text-3xl font-black tracking-tightest capitalize break-words">{data.name}</h2>
          </div>

          {data.isAmbiguous && (
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-[32px] space-y-3 animate-bounce-in">
              <div className="flex items-center gap-2 text-amber-700 font-black text-[10px] uppercase tracking-widest">
                <HelpCircle className="w-4 h-4" /> AI Clarification Needed
              </div>
              <p className="text-sm font-bold text-amber-900 leading-relaxed italic">"{data.clarifyingQuestion}"</p>
              <div className="relative">
                <input 
                  type="text" 
                  value={refinementText}
                  onChange={e => setRefinementText(e.target.value)}
                  placeholder="Type your answer..."
                  className="w-full pl-4 pr-12 py-3 bg-white rounded-xl border-none font-bold text-xs outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button onClick={() => handleRefine()} className="absolute right-1 top-1/2 -translate-y-1/2 p-2 bg-amber-500 text-white rounded-lg">
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          <div className="bg-[var(--primary)] text-white p-8 rounded-[32px] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Zap className="w-24 h-24" /></div>
            <div className="flex items-baseline gap-2">
              <p className="text-6xl font-black leading-none">{finalCalories}</p>
              <p className="text-lg font-bold opacity-30 uppercase tracking-tighter">kcal</p>
            </div>
            
            <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-6">
               <div className="flex flex-col gap-1">
                  <p className="text-[8px] font-black uppercase opacity-40 tracking-widest">Quantity Scale</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => adjust(-0.25)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"><Minus className="w-4 h-4"/></button>
                    <span className="text-xl font-black min-w-[3.5rem] text-center">{multiplier.toFixed(2)}x</span>
                    <button onClick={() => adjust(0.25)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"><Plus className="w-4 h-4"/></button>
                  </div>
               </div>
               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                 <Scale className="w-6 h-6 opacity-30" />
               </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {['Protein', 'Carbs', 'Fat'].map((label) => (
              <div key={label} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tight mb-1">{label}</p>
                <p className="text-lg font-black break-all">{Math.round((data as any)[label.toLowerCase()] * multiplier)}g</p>
              </div>
            ))}
          </div>

          {!data.isAmbiguous && (
            <div className="space-y-4">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Quick Adjustments</p>
               <div className="flex flex-wrap gap-2">
                  {data.suggestions.slice(0, 3).map(t => (
                    <button key={t} onClick={() => handleRefine(`plus ${t}`)} className="px-3 py-2 bg-slate-50 rounded-lg text-[9px] font-black hover:bg-[var(--primary)] hover:text-white transition-all whitespace-nowrap">
                      + {t}
                    </button>
                  ))}
               </div>
            </div>
          )}

          <button 
            onClick={() => onConfirm(multiplier, data)} 
            disabled={data.isAmbiguous}
            className={`w-full py-6 rounded-[24px] font-black text-lg shadow-xl hover:scale-[1.01] active:scale-95 transition-all flex flex-col items-center justify-center ${data.isAmbiguous ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[var(--primary)] text-white'}`}
          >
            <div className="flex items-center gap-2">
               <Check className="w-6 h-6" /> <span>{data.isAmbiguous ? 'Answer AI Above First' : 'Log Protocol Entry'}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
