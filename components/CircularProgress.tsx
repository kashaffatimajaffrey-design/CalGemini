
import React from 'react';

interface CircularProgressProps {
  current: number;
  total: number;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({ current, total }) => {
  const percentage = Math.min((current / total) * 100, 100);
  const radius = 70;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle stroke="#f1f5f9" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
        <circle
          stroke="var(--secondary)"
          fill="transparent"
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeWidth={stroke}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-700 ease-in-out"
        />
      </svg>
      <div className="absolute text-center flex flex-col items-center">
        <span className="text-3xl font-black text-slate-900 leading-none">{current}</span>
        <div className="text-[8px] text-slate-300 uppercase font-black tracking-widest mt-1">Logged</div>
      </div>
    </div>
  );
};
