
import React from 'react';

interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  color: string;
}

export const MacroBar: React.FC<MacroBarProps> = ({ label, current, target, color }) => {
  const percentage = Math.min((current / target) * 100, 100);
  
  return (
    <div className="flex-1 min-w-[120px] group">
      <div className="flex justify-between items-baseline text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">
        <span className="group-hover:text-[var(--primary)] transition-colors">{label}</span>
        <span className="text-slate-900">{current}<span className="text-slate-200">/</span>{target}g</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner p-[1px]">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1)`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
