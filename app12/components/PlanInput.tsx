import React from 'react';
import { MarketingPlan } from '../types';

interface PlanInputProps {
  plan: MarketingPlan;
  onChange: (field: keyof MarketingPlan, value: string) => void;
}

export const PlanInput: React.FC<PlanInputProps> = ({ plan, onChange }) => {
  return (
    <div className="space-y-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">
        海报文案策划
      </h3>
      
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">主标题</label>
          <input
            type="text"
            value={plan.headline}
            onChange={(e) => onChange('headline', e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            placeholder="例如：智汇未来"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">副标题 / 宣传语</label>
          <textarea
            value={plan.tagline}
            onChange={(e) => onChange('tagline', e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none h-20"
            placeholder="例如：沉浸式体验，静享世界之声。"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">行动号召按钮</label>
            <input
              type="text"
              value={plan.cta}
              onChange={(e) => onChange('cta', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              placeholder="例如：立即购买"
            />
          </div>
           <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">文字主题色</label>
            <div className="flex items-center space-x-2">
                <input
                    type="color"
                    value={plan.colorTheme}
                    onChange={(e) => onChange('colorTheme', e.target.value)}
                    className="h-9 w-9 p-0 bg-transparent border-none cursor-pointer rounded overflow-hidden"
                />
                <input
                type="text"
                value={plan.colorTheme}
                onChange={(e) => onChange('colorTheme', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};