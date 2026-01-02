import { MessageCircle, X, Send, Mic, Sparkles, User, Loader2, Zap, Globe, Brain, Volume2, VolumeX } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, UserProfile, FoodEntry } from '../types';
import { createCoachingChat, speakText, decodeAudio } from '../services/geminiService';
import { Chat } from '@google/genai';

interface ChatAssistantProps {
  profile: UserProfile;
  entries: FoodEntry[];
  totals: any;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ profile, entries, totals }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (isOpen) {
      chatRef.current = createCoachingChat(profile, entries, totals, useThinking);
      if (messages.length === 0) {
        setMessages([{
          role: 'model',
          text: `Hey ${profile.name}! Your metabolic coach is ready. How can I help with your ${profile.goalType} protocol today?`,
          timestamp: Date.now()
        }]);
      }
    } else {
      stopAudio();
    }
  }, [isOpen, useThinking]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const stopAudio = () => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (e) {}
      currentSourceRef.current = null;
    }
    setIsSpeaking(false);
  };

  const handleSpeak = async (text: string) => {
    stopAudio();
    setIsSpeaking(true);
    try {
      const audioBase64 = await speakText(text);
      if (audioBase64) {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = audioContextRef.current;
        const pcmData = decodeAudio(audioBase64);
        const int16 = new Int16Array(pcmData.buffer);
        const float32 = new Float32Array(int16.length);
        for(let i=0; i<int16.length; i++) float32[i] = int16[i] / 32768;
        
        const buffer = ctx.createBuffer(1, float32.length, 24000);
        buffer.getChannelData(0).set(float32);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => setIsSpeaking(false);
        currentSourceRef.current = source;
        source.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (e) {
      console.error("TTS failed:", e);
      setIsSpeaking(false);
    }
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || !chatRef.current) return;
    
    // Check for "stop" commands
    const lowerText = text.toLowerCase();
    if (lowerText.match(/\b(stop|quiet|hush|shut up|be quiet|no more talking)\b/)) {
      stopAudio();
    }

    const userMsg = { role: 'user' as const, text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chatRef.current.sendMessage({ message: text });
      const modelText = result.text || "...";
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: modelText, 
        timestamp: Date.now() 
      }]);

      handleSpeak(modelText);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: "My neural link is flickering. Please re-state your query.", 
        timestamp: Date.now() 
      }]);
    } finally { setIsLoading(false); }
  };

  const toggleVoice = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return alert("Speech recognition not supported in this browser.");
    const recognition = new SpeechRec();
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (e: any) => handleSend(e.results[0][0].transcript);
    recognition.start();
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-12 right-12 w-20 h-20 rounded-[28px] bg-[var(--primary)] text-white flex items-center justify-center shadow-3xl transition-all z-50 hover:scale-110 active:scale-95 ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <Sparkles className="w-8 h-8" />
      </button>

      {isOpen && (
        <div className="fixed bottom-0 right-0 sm:bottom-12 sm:right-12 w-full sm:max-w-sm h-[100vh] sm:h-[650px] bg-white rounded-none sm:rounded-[48px] shadow-3xl z-[100] border flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
          <div className="p-8 bg-[var(--primary)] text-white flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                <Brain className={`w-6 h-6 ${useThinking ? 'text-purple-400' : 'text-emerald-400'}`} />
              </div>
              <div>
                <h3 className="font-black text-lg">Metabolic Coach</h3>
                <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest flex items-center gap-1">
                  <Globe className="w-2.5 h-2.5" /> Pro Intelligence
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isSpeaking && (
                <button onClick={stopAudio} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                  <VolumeX className="w-5 h-5" />
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-5 rounded-[32px] text-sm font-bold ${m.role === 'user' ? 'bg-[var(--primary)] text-white rounded-tr-none' : 'bg-white border text-slate-800 rounded-tl-none shadow-sm'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start gap-1 p-4">
                 {[0, 0.2, 0.4].map(d => <div key={d} className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: `${d}s`}} />)}
              </div>
            )}
          </div>

          <div className="p-6 bg-white border-t space-y-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setUseThinking(!useThinking)}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${useThinking ? 'text-purple-600' : 'text-slate-400'}`}
              >
                <Brain className="w-4 h-4" /> {useThinking ? 'Deep Thinking Engaged' : 'Switch to Deep Thinking'}
              </button>
              {isSpeaking && (
                <span className="text-[8px] font-black uppercase text-[var(--secondary)] animate-pulse tracking-widest">AI Briefing...</span>
              )}
            </div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Talk to coach..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                className="w-full pl-6 pr-24 py-5 bg-slate-50 border-none rounded-[32px] font-black outline-none focus:ring-4 focus:ring-slate-100 transition-all shadow-inner"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button onClick={toggleVoice} className={`p-3 rounded-full transition-all ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-white text-slate-400 shadow-sm hover:text-[var(--primary)]'}`}><Mic className="w-5 h-5"/></button>
                <button onClick={() => handleSend()} className="p-3 bg-[var(--primary)] text-white rounded-full hover:scale-105 active:scale-95 transition-all"><Send className="w-5 h-5"/></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};