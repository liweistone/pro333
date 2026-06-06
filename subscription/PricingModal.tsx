
import React from 'react';
import { X, Crown, ShieldCheck } from 'lucide-react';
import { PlanCard } from './PlanCard';
import { SUBSCRIPTION_PLANS } from './planConfig';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-2xl overflow-y-auto animate-in fade-in duration-300">
      <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
        
        {/* Header */}
        <div className="w-full max-w-6xl flex justify-between items-start mb-12 animate-in slide-in-from-top-10 duration-700">
           <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                 <Crown className="w-4 h-4" /> Premium Access
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
                升级您的 <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600">创作引擎</span>
              </h1>
              <p className="text-slate-400 text-sm md:text-base max-w-xl leading-relaxed font-medium">
                解锁 超清分辨率、批量生图，极速 GPU 通道与企业级商用授权。<br/>
                选择最适合您的生产力方案，释放无限创意潜能。
              </p>
           </div>
           <button 
             onClick={onClose}
             className="p-4 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all group border border-white/5 hover:rotate-90 active:scale-90"
           >
             <X className="w-6 h-6" />
           </button>
        </div>

        {/* Plans Grid */}
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-center pb-12">
           {SUBSCRIPTION_PLANS.map((plan, idx) => (
             <div key={plan.id} className={`animate-in fade-in zoom-in-95 duration-700 fill-mode-forwards`} style={{ animationDelay: `${idx * 150}ms` }}>
                <PlanCard plan={plan} />
             </div>
           ))}
        </div>

        {/* Footer */}
        <div className="mt-auto py-8 text-center space-y-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500 border-t border-white/5 w-full max-w-4xl">
           <div className="flex items-center justify-center gap-6 text-slate-500">
              <span className="flex items-center gap-1.5 text-xs font-bold"><ShieldCheck className="w-4 h-4" /> 7天无理由退款保障</span>
              <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
              <span className="flex items-center gap-1.5 text-xs font-bold">🔒 SSL 安全支付</span>
              <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
              <span className="text-xs font-bold">对公转账/发票支持</span>
           </div>
           <p className="text-[10px] text-slate-600 uppercase tracking-widest pt-2">
             POWERED BY BATCHMASTER PRO · ENTERPRISE PAYMENT GATEWAY
           </p>
        </div>

      </div>
    </div>
  );
};
