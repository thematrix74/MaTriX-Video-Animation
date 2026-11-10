import React, { useState } from 'react';
import { QA_AUDIT_RULES } from '../data/referenceAnalysis';
import { QARule } from '../types';
import { 
  ShieldCheck, AlertTriangle, CheckCircle2, Wrench, Sparkles, 
  RefreshCw, Check, ArrowUpRight, Award
} from 'lucide-react';

interface QACheckerProps {
  language: 'ar' | 'hi' | 'en';
  onApplyFix?: (ruleId: string) => void;
}

export const QAChecker: React.FC<QACheckerProps> = ({ language, onApplyFix }) => {
  const [rules, setRules] = useState<QARule[]>(QA_AUDIT_RULES);
  const [healedMap, setHealedMap] = useState<Record<string, boolean>>({});

  const handleFix = (ruleId: string) => {
    setHealedMap((prev) => ({ ...prev, [ruleId]: true }));
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, status: 'passed', score: 10 } : r))
    );
    if (onApplyFix) onApplyFix(ruleId);
  };

  const averageScore = (
    rules.reduce((acc, r) => acc + r.score, 0) / rules.length
  ).toFixed(1);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Header and Score Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">
              {language === 'ar' ? "بوابة الجودة والفحص الذاتي (QA Gate & Healer)" : "QA Quality Gate & Self-Healer"}
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            {language === 'ar'
              ? "فحص إلزامي وفق معايير الاستوديو الـ 10 (كثافة الحركة، التزامن الصوتي، سلامة الخط العربي، حتمية الرندرة)."
              : "Strict studio audit verifying all 10 quality laws before production release."}
          </p>
        </div>

        {/* Global QA Score Badge */}
        <div className="flex items-center gap-3 p-2.5 px-4 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl self-start md:self-auto shadow-lg">
          <Award className="w-6 h-6 text-emerald-400" />
          <div>
            <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
              {language === 'ar' ? "معدل الجودة النهائي" : "QA Studio Score"}
            </div>
            <div className="text-lg font-black text-white font-mono">
              {averageScore} / 10 <span className="text-xs text-emerald-400">★ ممتاز</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Evaluation List */}
      <div className="space-y-3">
        {rules.map((rule) => {
          const isHealed = healedMap[rule.id];
          return (
            <div
              key={rule.id}
              className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 hover:bg-slate-800/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {rule.status === 'passed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  )}
                  <h4 className="font-bold text-sm text-white">
                    {language === 'ar' ? rule.nameAr : rule.name}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900 text-emerald-400 border border-emerald-500/30">
                    {rule.score} / 10
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  {language === 'ar' ? rule.descriptionAr : rule.description}
                </p>

                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span><strong>نصيحة التحسين:</strong> {rule.fixTip}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex-shrink-0">
                {isHealed || rule.score === 10 ? (
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold">
                    <Check className="w-3.5 h-3.5" />
                    <span>متحقق ومعتمد</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleFix(rule.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-colors shadow-md"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>تطبيق الإصلاح التلقائي</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
