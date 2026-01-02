
import React, { useState } from 'react';
import { UserProfile, DaySummary } from '../types';
import { 
  Calendar, TrendingUp, History, Info, ChevronRight, Zap, 
  Flame, Target, Clock, Trophy, Scale, Plus, ArrowUpRight, 
  ArrowDownRight, Check, Activity, Trash2
} from 'lucide-react';

interface HistoryDashboardProps {
  profile: UserProfile;
  summaries: DaySummary[];
  onSelectDate: (date: string) => void;
  onUpdateWeight: (newWeight: number) => Promise<void>;
  onDeleteWeight: (date: string) => Promise<void>;
}

export const HistoryDashboard: React.FC<HistoryDashboardProps> = ({ profile, summaries, onSelectDate, onUpdateWeight, onDeleteWeight }) => {
  const [newWeight, setNewWeight] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const joinDate = profile.startDate ? new Date(profile.startDate) : new Date();
  const daysSinceStart = Math.ceil((new Date().getTime() - joinDate.getTime()) / (1000 * 3600 * 24));

  const sortedSummaries = [...summaries].sort((a, b) => b.date.localeCompare(a.date));
  
  const currentWeight = profile.weight;
  const startWeight = profile.weightHistory?.[0]?.weight || currentWeight;
  const targetWeight = profile.targetWeight || profile.weight;
  const weightLost = Math.max(0, startWeight - currentWeight);
  const progressPercent = Math.min(100, Math.max(0, ((startWeight - currentWeight) / (startWeight - targetWeight)) * 100));

  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight || isNaN(parseFloat(newWeight))) return;
    setIsUpdating(true);
    await onUpdateWeight(parseFloat(newWeight));
    setNewWeight('');
    setIsUpdating(false);
  };

  const generateWeightGraph = () => {
    const history = profile.weightHistory || [];
    if (history.length < 2) return null;
    
    const maxWeight = Math.max(...history.map(h => h.weight)) + 1;
    const minWeight = Math.min(...history.map(h => h.weight), targetWeight) - 1;
    const range = maxWeight - minWeight;
    
    const points = history.map((h, i) => {
      const x = (i / (history.length - 1)) * 200;
      const y = 60 - ((h.weight - minWeight) / range) * 60;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="w-full h-16 overflow-visible" viewBox="0 0 200 60">
        <polyline
          fill="none"
          stroke="var(--primary)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          className="opacity-20"
        />
        <polyline
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  const generateEnergyGraph = () => {
    if (summaries.length < 2) return null;
    const data = [...summaries].sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
    const maxKcal = Math.max(...data.map(d => d.totalCalories), profile.tdee) * 1.1;
    
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 200;
      const y = 60 - (d.totalCalories / maxKcal) * 60;
      return `${x},${y}`;
    }).join(' ');

    const tdeeY = 60 - (profile.tdee / maxKcal) * 60;

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-[7px] font-black uppercase text-slate-400">
           <span>Energy Velocity (7d)</span>
           <span>TDEE Line: {profile.tdee}</span>
        </div>
        <svg className="w-full h-16 overflow-visible" viewBox="0 0 200 60">
          <line x1="0" y1={tdeeY} x2="200" y2={tdeeY} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" />
          <polyline
            fill="none"
            stroke="var(--secondary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="space-y-2 text-center">
        <h2 className="text-3xl font-black tracking-tightest leading-none">Metabolic Dashboard.</h2>
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Metrics & Historical Archive</p>
      </header>

      {/* Weight Progress Card */}
      <section className="bg-white p-6 rounded-[32px] border border-slate-50 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-slate-50 rounded-2xl text-[var(--primary)]"><Scale className="w-5 h-5"/></div>
             <div>
               <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Weight Path</p>
               <h3 className="font-black text-lg">{currentWeight} <span className="text-[10px] text-slate-300">kg</span></h3>
             </div>
          </div>
          <form onSubmit={handleWeightSubmit} className="flex gap-1">
             <input 
              type="number" 
              step="0.1" 
              placeholder="Update" 
              value={newWeight}
              onChange={e => setNewWeight(e.target.value)}
              className="w-16 px-3 py-2 bg-slate-50 rounded-xl text-[10px] font-black outline-none border border-transparent focus:border-[var(--primary)]"
             />
             <button type="submit" disabled={isUpdating} className="p-2 bg-[var(--primary)] text-white rounded-xl shadow-md">
               {isUpdating ? <Clock className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
             </button>
          </form>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[7px] font-black uppercase tracking-widest text-slate-400">
            <span>Start ({startWeight}kg)</span>
            <span className="text-[var(--primary)]">{Math.round(progressPercent)}% Success Rate</span>
            <span>Goal ({targetWeight}kg)</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-[1px]">
            <div 
              className="h-full bg-[var(--primary)] rounded-full transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
           {generateWeightGraph() || <div className="h-16 border-2 border-dashed border-slate-50 rounded-2xl opacity-30 flex items-center justify-center text-[7px] font-black uppercase">Weight Trend Pending</div>}
           {generateEnergyGraph() || <div className="h-16 border-2 border-dashed border-slate-50 rounded-2xl opacity-30 flex items-center justify-center text-[7px] font-black uppercase">Caloric Trend Pending</div>}
        </div>

        {/* Weight History List */}
        <div className="space-y-4 pt-6 border-t border-slate-50">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Weight Records</h4>
            <History className="w-3 h-3 text-slate-200" />
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {profile.weightHistory?.slice().reverse().map((record) => (
              <div key={record.date} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl group hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <Calendar className="w-3 h-3 text-slate-300" />
                  <span className="text-[10px] font-black text-slate-900">{new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-slate-600">{record.weight} <span className="text-[8px] text-slate-300">kg</span></span>
                  <button 
                    onClick={() => onDeleteWeight(record.date)}
                    className="p-1.5 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-5 rounded-[24px] border border-slate-50 shadow-sm space-y-1">
          <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Days Logged</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black">{daysSinceStart}</span>
            <span className="text-[8px] font-black text-slate-200">STRK</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[24px] border border-slate-50 shadow-sm space-y-1">
          <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Total Delta</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black">{weightLost.toFixed(1)}</span>
            <span className="text-[8px] font-black text-slate-200">KG LOST</span>
          </div>
        </div>
        <div className="bg-[var(--primary)] text-white p-5 rounded-[24px] shadow-lg space-y-1 col-span-2">
          <p className="text-[7px] font-black text-white/40 uppercase tracking-widest">Protocol Velocity</p>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black capitalize">{profile.goalType.replace('_', ' ')}</span>
            </div>
            <Activity className="w-5 h-5 text-[var(--secondary)]" />
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Metabolic Archive</h3>
          <History className="w-4 h-4 text-slate-200" />
        </div>

        <div className="space-y-3">
          {sortedSummaries.length === 0 ? (
            <div className="py-20 bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 opacity-30">
              <Calendar className="w-8 h-8" />
              <p className="text-[10px] font-black uppercase tracking-widest">No Summarized Data</p>
            </div>
          ) : (
            sortedSummaries.map((day) => (
              <button 
                key={day.date}
                onClick={() => onSelectDate(day.date)}
                className="w-full bg-white p-5 rounded-[28px] border border-slate-50 shadow-sm flex items-center justify-between transition-all hover:scale-[1.01] hover:shadow-md group text-left"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-[18px] bg-slate-50 flex flex-col items-center justify-center">
                    <span className="text-[6px] font-black text-slate-300 uppercase">{new Date(day.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                    <span className="text-lg font-black text-slate-900 leading-none">{new Date(day.date).getDate()}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-900">{day.totalCalories} / {profile.dailyCalorieTarget} kcal</p>
                    <div className="flex gap-2 mt-1">
                       <div className="flex items-center gap-1">
                         <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                         <span className="text-[7px] font-black text-slate-300 uppercase">{day.totalMacros.protein}g</span>
                       </div>
                       <div className="flex items-center gap-1">
                         <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                         <span className="text-[7px] font-black text-slate-300 uppercase">{day.totalMacros.carbs}g</span>
                       </div>
                       <div className="flex items-center gap-1">
                         <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                         <span className="text-[7px] font-black text-slate-300 uppercase">{day.totalMacros.fat}g</span>
                       </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {day.isLocked && <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />}
                  <div className="p-2 bg-slate-50 rounded-full group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </section>

      <div className="p-6 bg-slate-50 rounded-[28px] border border-slate-100 flex items-start gap-4">
        <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Biological Analysis</p>
          <p className="text-[10px] font-bold text-slate-600 leading-relaxed">Your energy velocity indicates a stable {profile.goalType === 'fat_loss' ? 'deficit' : 'surplus'}. Sealing your windows before 8 PM is recommended for optimal metabolic reset.</p>
        </div>
      </div>
    </div>
  );
};
