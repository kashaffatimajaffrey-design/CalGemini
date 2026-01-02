
import React, { useState } from 'react';
import { FoodEntry } from '../types';
import { Trash2, Clock, Zap, Volume2, Loader2 } from 'lucide-react';
import { speakText, decodeAudio } from '../services/geminiService';

interface FoodLogItemProps {
  entry: FoodEntry;
  onDelete: (id: string) => void;
}

export const FoodLogItem: React.FC<FoodLogItemProps> = ({ entry, onDelete }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleSpeak = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const summary = `${entry.name}. ${entry.calories} calories, ${entry.protein} grams protein, ${entry.carbs} carbs, ${entry.fat} fat.`;
      const audioBase64 = await speakText(summary);
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
      console.error("TTS failed:", e);
      setIsSpeaking(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-50 flex flex-col gap-4 group transition-all hover:border-[var(--primary)] hover:shadow-lg card overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[6px] font-black px-2 py-1 rounded-md bg-[var(--primary)] text-white uppercase tracking-widest whitespace-nowrap">
              {entry.mealType}
            </span>
            <div className="flex items-center text-[7px] text-slate-300 font-black uppercase tracking-widest">
              <Clock className="w-3 h-3 mr-1" />
              {time}
            </div>
          </div>
          <h3 className="font-black text-slate-900 capitalize text-lg tracking-tight leading-tight truncate">
            {entry.name}
          </h3>
          {entry.portionMultiplier !== 1 && (
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-slate-200" /> Scaled {entry.portionMultiplier}x
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="flex items-center justify-end gap-1">
             <span className="text-2xl font-black text-slate-950 leading-none">{entry.calories}</span>
             <Zap className="w-3 h-3 text-[var(--secondary)] fill-[var(--secondary)]" />
          </div>
          <span className="text-[7px] text-slate-300 block uppercase font-black tracking-widest mt-0.5">Kcal</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-50">
        <div className="flex gap-6">
          <div className="flex flex-col">
            <span className="text-[7px] font-black text-slate-300 uppercase tracking-tighter">P</span>
            <span className="text-sm font-black text-blue-500">{entry.protein}g</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[7px] font-black text-slate-300 uppercase tracking-tighter">C</span>
            <span className="text-sm font-black text-amber-500">{entry.carbs}g</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[7px] font-black text-slate-300 uppercase tracking-tighter">L</span>
            <span className="text-sm font-black text-rose-500">{entry.fat}g</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleSpeak}
            className={`p-2 transition-all rounded-lg hover:bg-slate-50 active:scale-90 ${isSpeaking ? 'text-[var(--secondary)]' : 'text-slate-200 hover:text-[var(--primary)]'}`}
          >
            {isSpeaking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="p-2 text-slate-200 hover:text-rose-500 transition-all rounded-lg hover:bg-rose-50 active:scale-90"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
