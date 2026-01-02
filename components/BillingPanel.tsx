
import React, { useState } from 'react';
import { CreditCard, ShieldCheck, Sparkles, GraduationCap, Check, Download, ArrowRight, Loader2, Landmark, Apple, Info, Lock, ChevronLeft, Wallet } from 'lucide-react';
import { UserProfile, Invoice } from '../types';

interface BillingPanelProps {
  profile: UserProfile;
  onSubscribe: (tier: 'monthly' | 'annual' | 'student', paymentDetails: any) => Promise<void>;
  onPortal: () => Promise<void>;
  onBack: () => void;
}

export const BillingPanel: React.FC<BillingPanelProps> = ({ profile, onSubscribe, onPortal, onBack }) => {
  const [selectedTier, setSelectedTier] = useState<'monthly' | 'annual' | 'student' | null>(null);
  const [step, setStep] = useState<'selection' | 'checkout' | 'success'>('selection');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [universityEmail, setUniversityEmail] = useState('');

  const plans = [
    { 
      id: 'monthly', 
      name: 'Monthly Pro', 
      price: 12.99, 
      period: 'mo',
      perks: ['Unlimited AI Scans', 'Voice Feed Logging', 'Deep Thinking AI', 'Custom UI Aura']
    },
    { 
      id: 'annual', 
      name: 'Annual Elite', 
      price: 99.99, 
      period: 'yr', 
      savings: 'Save 35%',
      perks: ['Everything in Pro', '7-Day Free Trial', 'Priority API Access', 'Elite Progress Analytics']
    },
    { 
      id: 'student', 
      name: 'Student Offer', 
      price: 5.99, 
      period: 'mo', 
      badge: '50% OFF',
      perks: ['Full Pro Intelligence', 'Academic Pricing', 'Metabolic Science Support']
    }
  ];

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTier) return;
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise(r => setTimeout(r, 2500));
    const last4 = cardNumber.slice(-4);
    await onSubscribe(selectedTier, { cardName, cardNumber, last4 });
    setIsProcessing(false);
    setStep('success');
  };

  const generatePDF = (invoice: Invoice) => {
    const content = `
CALGEMINI METABOLIC INTELLIGENCE - OFFICIAL RECEIPT
--------------------------------------------------
Invoice ID: ${invoice.id}
Date:       ${invoice.date}
Customer:   ${profile.name}
Email:      ${profile.email}

SUBSCRIPTION DETAILS
Plan:       ${invoice.tier.toUpperCase()}
Status:     PAID (Card ending in ${invoice.cardLast4 || '4242'})
Amount:     $${invoice.amount.toFixed(2)}

PRO FEATURES UNLOCKED
- Unlimited Daily AI Scans
- Real-time Voice Feed Synchronization
- Google Search Grounded Coaching
- Cross-platform Metabolic Path

Thank you for choosing CalGemini.
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CalGemini_Invoice_${invoice.id}.txt`;
    a.click();
  };

  if (profile.isPro && step !== 'success') {
    return (
      <div className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-xl space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-[24px] flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-2xl font-black">Pro Status Active.</h2>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">{profile.subscriptionTier} tier enabled</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-50 p-6 rounded-[28px] space-y-4">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Recent Invoices</h3>
            {profile.invoices && profile.invoices.length > 0 ? (
              <div className="space-y-2">
                {profile.invoices.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                    <div>
                      <p className="font-black text-xs">{inv.id}</p>
                      <p className="text-[8px] text-slate-400 uppercase font-black">{inv.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black">${inv.amount}</span>
                      <button onClick={() => generatePDF(inv)} className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-900 hover:text-white transition-all">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] font-bold text-slate-300 italic">No historical data found</p>
            )}
          </div>

          <button 
            onClick={onPortal}
            className="w-full py-4 bg-slate-900 text-white rounded-[20px] font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 hover:scale-[1.01] transition-all"
          >
            <Wallet className="w-4 h-4" /> Manage Subscription
          </button>
          
          <button 
            onClick={onBack}
            className="w-full py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-900 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    const latestInv = profile.invoices?.[profile.invoices.length - 1];
    return (
      <div className="text-center space-y-8 py-12 animate-in zoom-in-95 duration-700">
        <div className="w-24 h-24 bg-emerald-500 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl rotate-6">
          <Sparkles className="w-12 h-12 text-white fill-white" />
        </div>
        <div className="space-y-2">
          <h2 className="text-4xl font-black">Intelligence Active.</h2>
          <p className="text-slate-500 font-bold text-sm max-w-xs mx-auto leading-relaxed">Your metabolic protocol has been upgraded. Voice feed and unlimited scans are now operational.</p>
        </div>
        <div className="pt-4 flex flex-col items-center gap-3">
          <button 
            onClick={() => latestInv && generatePDF(latestInv)}
            className="flex items-center gap-2 px-10 py-5 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
          >
            <Download className="w-4 h-4" /> Download Official Receipt (PDF)
          </button>
          <button 
            onClick={onBack}
            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors mt-4 p-2"
          >
            Return to Protocol
          </button>
        </div>
      </div>
    );
  }

  if (step === 'checkout') {
    const plan = plans.find(p => p.id === selectedTier);
    return (
      <div className="bg-white p-8 rounded-[48px] border shadow-2xl space-y-8 animate-in slide-in-from-right-10 duration-500">
        <button onClick={() => setStep('selection')} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors"><ChevronLeft className="w-4 h-4"/> Back to Plans</button>
        
        <div className="bg-slate-900 text-white p-8 rounded-[36px] flex items-center justify-between shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><ShieldCheck className="w-24 h-24" /></div>
           <div className="relative z-10">
             <p className="text-[9px] font-black uppercase opacity-40 mb-1 tracking-widest">Selected Tier</p>
             <h3 className="text-2xl font-black leading-none">{plan?.name}</h3>
           </div>
           <div className="text-right relative z-10">
             <p className="text-3xl font-black leading-none">${plan?.price}</p>
             <p className="text-[10px] opacity-40 font-black uppercase">billed {plan?.id === 'annual' ? 'yearly' : 'monthly'}</p>
           </div>
        </div>

        <div className="bg-amber-50 p-5 rounded-[24px] border border-amber-200 flex items-start gap-4">
          <Info className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-left">
            <p className="text-[10px] font-black uppercase text-amber-700 tracking-widest mb-1">Stripe Test Mode</p>
            <p className="text-[11px] font-bold text-amber-600 leading-relaxed">
              Use card number <code className="bg-amber-100 px-1.5 rounded text-amber-900">4242 4242 4242 4242</code> for local testing. Any valid expiry and CVC will be accepted.
            </p>
          </div>
        </div>

        <form onSubmit={handleProcessPayment} className="space-y-6 text-left">
           {selectedTier === 'student' && (
             <div className="space-y-3 bg-indigo-50 p-6 rounded-[28px] border border-indigo-100 animate-in fade-in slide-in-from-top-4">
               <label className="text-[9px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2"><GraduationCap className="w-4 h-4"/> Academic Verification</label>
               <input 
                type="email" 
                required
                placeholder="university-email@edu.com"
                value={universityEmail}
                onChange={e => setUniversityEmail(e.target.value)}
                className="w-full p-4 bg-white border border-indigo-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 transition-all placeholder:text-indigo-200"
               />
               <p className="text-[8px] font-bold text-indigo-400 uppercase leading-relaxed">Verification results will be emailed to your academic address upon confirmation.</p>
             </div>
           )}

           <div className="space-y-5">
             <div className="space-y-2">
               <label className="text-[9px] font-black uppercase text-slate-400 px-1 tracking-[0.2em]">Secure Payment Details</label>
               <div className="grid grid-cols-3 gap-2">
                 <button type="button" className="p-4 bg-white border-2 border-[var(--primary)] rounded-2xl flex items-center justify-center text-[var(--primary)] shadow-sm"><CreditCard className="w-6 h-6"/></button>
                 <button type="button" disabled className="p-4 bg-slate-50 border rounded-2xl flex items-center justify-center text-slate-200 cursor-not-allowed"><Apple className="w-6 h-6"/></button>
                 <button type="button" disabled className="p-4 bg-slate-50 border rounded-2xl flex items-center justify-center text-slate-200 cursor-not-allowed"><Landmark className="w-6 h-6"/></button>
               </div>
             </div>

             <div className="space-y-4">
               <div className="space-y-1">
                 <label className="text-[8px] font-black uppercase text-slate-300 px-1">Full Name on Card</label>
                 <input 
                  type="text" 
                  required
                  placeholder="e.g. Satoshi Nakamoto"
                  value={cardName}
                  onChange={e => setCardName(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-slate-200 transition-all"
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-[8px] font-black uppercase text-slate-300 px-1">Card Number</label>
                 <div className="relative">
                   <input 
                    type="text" 
                    required
                    maxLength={19}
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={e => {
                        const val = e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
                        setCardNumber(val);
                    }}
                    className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-slate-200 transition-all"
                   />
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1.5 items-center">
                     <img src="https://img.icons8.com/color/48/000000/visa.png" className="w-8 opacity-60" alt="Visa" />
                     <Lock className="w-3.5 h-3.5 text-slate-200" />
                   </div>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-[8px] font-black uppercase text-slate-300 px-1">Expiry Date</label>
                   <input 
                    type="text" 
                    required 
                    maxLength={5}
                    placeholder="MM / YY" 
                    value={expiry}
                    onChange={e => setExpiry(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-slate-200 transition-all" 
                   />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[8px] font-black uppercase text-slate-300 px-1">Security Code</label>
                   <input 
                    type="text" 
                    required 
                    maxLength={4}
                    placeholder="CVC" 
                    value={cvc}
                    onChange={e => setCvc(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-slate-200 transition-all" 
                   />
                 </div>
               </div>
             </div>
           </div>

           <button 
            disabled={isProcessing}
            className="w-full py-5 bg-[var(--primary)] text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 group"
           >
             {isProcessing ? <Loader2 className="w-5 h-5 animate-spin"/> : <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform"/>}
             Finalize Metabolic Access
           </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-4xl mx-auto px-4">
      <div className="space-y-3 text-center">
        <h1 className="text-5xl font-black tracking-tightest leading-none">Go Pro.</h1>
        <p className="text-slate-500 font-bold text-sm max-w-sm mx-auto leading-relaxed">Select the protocol that fits your performance level. Unlock Gemini-3 Metabolic Science.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <button 
            key={plan.id}
            onClick={() => setSelectedTier(plan.id as any)}
            className={`p-8 rounded-[40px] border-2 transition-all text-left relative flex flex-col justify-between h-full group ${selectedTier === plan.id ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-2xl scale-[1.05]' : 'bg-white border-slate-50 hover:border-slate-200 shadow-lg'}`}
          >
            {plan.savings && <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-emerald-500 text-white text-[8px] font-black uppercase rounded-full shadow-xl">{plan.savings}</span>}
            {plan.badge && <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-indigo-500 text-white text-[8px] font-black uppercase rounded-full shadow-xl">{plan.badge}</span>}
            
            <div className="space-y-8">
              <div>
                <h3 className={`font-black text-xl ${selectedTier === plan.id ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-4xl font-black">${plan.price}</span>
                  <span className={`text-[11px] font-bold ${selectedTier === plan.id ? 'opacity-40' : 'text-slate-300'}`}>/{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-4">
                {plan.perks.map((perk, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className={`w-4 h-4 mt-0.5 shrink-0 ${selectedTier === plan.id ? 'text-emerald-400' : 'text-emerald-500'}`} />
                    <span className={`text-[10px] font-bold leading-tight ${selectedTier === plan.id ? 'text-white/80' : 'text-slate-500'}`}>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {selectedTier === plan.id && (
              <div className="mt-8 flex justify-center">
                 <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center animate-bounce">
                    <Check className="w-4 h-4 text-white" />
                 </div>
              </div>
            )}
          </button>
        ))}
      </div>

      <button 
        disabled={!selectedTier}
        onClick={() => setStep('checkout')}
        className={`w-full py-6 rounded-[28px] font-black text-sm uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all ${selectedTier ? 'bg-[var(--primary)] text-white hover:scale-[1.02] active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
      >
        Initialize Secure Billing <ArrowRight className="w-5 h-5" />
      </button>

      <div className="flex flex-wrap items-center justify-center gap-8 text-[9px] font-black text-slate-300 uppercase tracking-widest">
        <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> 256-bit SSL</span>
        <span className="flex items-center gap-2"><CreditCard className="w-4 h-4"/> Trusted by Stripe</span>
        <span className="flex items-center gap-2"><GraduationCap className="w-4 h-4"/> Academic Pricing</span>
      </div>
    </div>
  );
};
