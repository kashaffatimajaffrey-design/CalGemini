
import React, { useState } from 'react';
import { Palette, Sparkles, Loader2, Check, RotateCcw, Layout, RefreshCw, X, Trash2 } from 'lucide-react';
import { ThemeConfig, UIStyle } from '../types';
import { suggestTheme } from '../services/geminiService';

interface ThemeCustomizerProps {
  currentTheme: ThemeConfig;
  onThemeChange: (theme: ThemeConfig) => void;
  onSave: (theme: ThemeConfig) => Promise<void>;
}

const STYLE_CATEGORIES = [
  { group: 'General Styles', items: [
    { id: 'minimalism', label: 'Minimalism' },
    { id: 'bold_modern', label: 'Bold Modern' },
    { id: 'vintage_retro', label: 'Vintage / Retro' }
  ]},
  { group: 'Artistic & Expressive', items: [
    { id: 'organic_natural', label: 'Organic' },
    { id: 'neon', label: 'Neon Glow' },
    { id: 'pastel', label: 'Soft Pastel' },
    { id: 'cartoon', label: 'Playful Cartoon' }
  ]}
];

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ currentTheme, onThemeChange, onSave }) => {
  const [favColors, setFavColors] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<UIStyle>(currentTheme.style);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tempTheme, setTempTheme] = useState<ThemeConfig | null>(null);
  const [previousTheme] = useState<ThemeConfig>(currentTheme);

  const handleGenerate = async () => {
    if (!favColors.trim()) return;
    setIsGenerating(true);
    try {
      const newTheme = await suggestTheme(favColors, selectedStyle);
      setTempTheme(newTheme);
      // Apply temporarily for live site preview
      onThemeChange(newTheme);
    } catch (error) {
      alert("Theme generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = async () => {
    if (!tempTheme) return;
    setIsSaving(true);
    try {
      await onSave(tempTheme);
      setTempTheme(null);
      setFavColors('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setTempTheme(null);
    onThemeChange(previousTheme); // Revert to previous theme
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[32px] p-6 sm:p-8 shadow-sm space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[var(--primary)]">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight">Interface Aura</h3>
            <p className="text-[8px] font-black uppercase text-slate-300 tracking-widest">Metabolic UI Calibration</p>
          </div>
        </div>
        {tempTheme && (
          <button 
            onClick={handleDiscard} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-500 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-rose-100 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5"/> Discard
          </button>
        )}
      </div>

      {!tempTheme ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Color Inspiration</label>
            <input 
              type="text" 
              placeholder="e.g. Lavender, Cyberpunk, Desert Sunset..." 
              value={favColors}
              onChange={(e) => setFavColors(e.target.value)}
              className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-slate-100 transition-all"
            />
          </div>

          <div className="space-y-4">
            {STYLE_CATEGORIES.map(cat => (
              <div key={cat.group} className="space-y-2">
                <p className="text-[8px] font-black uppercase text-slate-300 px-1 tracking-widest">{cat.group}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {cat.items.map(item => (
                    <button 
                      key={item.id}
                      onClick={() => setSelectedStyle(item.id as UIStyle)}
                      className={`px-3 py-2.5 rounded-xl text-[8px] font-black uppercase border transition-all ${selectedStyle === item.id ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]' : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-100'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !favColors.trim()}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-xl hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Render Protocol
          </button>
        </div>
      ) : (
        <div className="p-6 bg-slate-50 rounded-[28px] border-2 border-dashed border-slate-100 animate-in zoom-in-95 duration-300">
          <p className="text-[8px] font-black uppercase text-slate-400 text-center mb-4 tracking-widest">Protocol Visualization Ready</p>
          <div className="flex justify-center gap-4 mb-8">
            {[tempTheme.primary, tempTheme.secondary, tempTheme.accent, tempTheme.background].map((c, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center overflow-hidden" style={{ backgroundColor: c }}>
                   <div className="text-[6px] font-black mix-blend-difference text-white uppercase opacity-40">{c}</div>
                </div>
                <span className="text-[6px] font-black text-slate-300 uppercase tracking-tighter">
                  {['Primary', 'Action', 'Accent', 'Back'][i]}
                </span>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col gap-2">
            <button 
              onClick={handleApply}
              disabled={isSaving}
              className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-all"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Apply Aura
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="py-4 bg-white text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-100 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Regenerate
              </button>
              <button 
                onClick={handleDiscard}
                className="py-4 bg-white text-rose-400 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-100 flex items-center justify-center gap-2 hover:bg-rose-50 transition-all"
              >
                <X className="w-4 h-4" /> Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
