import React, { useState } from 'react';
import { REFERENCE_SCENES, REFERENCE_VIDEO_METADATA } from '../data/referenceAnalysis';
import { VideoScene } from '../types';
import { 
  Film, Layers, Sparkles, CheckCircle2, Play, Eye, 
  Compass, ShieldCheck, Palette, Cpu, ChevronRight, BookOpen
} from 'lucide-react';

interface VideoDeconstructionProps {
  onSelectScene: (scene: VideoScene) => void;
  activeSceneId: number;
  onJumpToTime: (time: number) => void;
  language: 'ar' | 'hi' | 'en';
}

export const VideoDeconstruction: React.FC<VideoDeconstructionProps> = ({
  onSelectScene,
  activeSceneId,
  onJumpToTime,
  language
}) => {
  const [activeTab, setActiveTab] = useState<'scenes' | 'frames' | 'stylebible' | 'physics'>('scenes');
  const [selectedFrame, setSelectedFrame] = useState<number>(1);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Header and Reference Intro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Film className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">
              {language === 'ar' ? "تحليل وتفكيك الفيديو المرجعي الأصلي" : "Reference Video Architecture & Deconstruction"}
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            {language === 'ar' 
              ? "تحليل شامل للفيديو المرفوع (76.4 ثانية - 30 إطار/ثانية) وقواعد إعادة إنتاجه برمجياً بأعلى جودة."
              : "Deep reverse-engineering of the uploaded reference video (76.4s - 30 FPS) for code-driven animated production."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-800/80 rounded-2xl border border-slate-700/60 self-start md:self-auto">
          {[
            { id: 'scenes', labelAr: 'المشاهد الـ 10', labelEn: '10 Scenes' },
            { id: 'frames', labelAr: 'شريط الإطارات (Frames)', labelEn: 'Contact Sheet' },
            { id: 'stylebible', labelAr: 'دليل الأسلوب (Style Bible)', labelEn: 'Style Bible' },
            { id: 'physics', labelAr: 'الفيزياء والميكانيكا', labelEn: 'Physics & Math' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {language === 'ar' ? tab.labelAr : tab.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: 10 SCENES BREAKDOWN */}
      {activeTab === 'scenes' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {REFERENCE_SCENES.map((scene) => {
              const isActive = scene.id === activeSceneId;
              return (
                <div
                  key={scene.id}
                  onClick={() => {
                    onSelectScene(scene);
                    onJumpToTime(scene.timeStart);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-start relative overflow-hidden ${
                    isActive
                      ? 'bg-emerald-950/40 border-emerald-500/80 ring-1 ring-emerald-500/50 shadow-xl'
                      : 'bg-slate-800/40 border-slate-700/40 hover:bg-slate-800/80 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                        isActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {scene.id}
                      </span>
                      <h4 className="font-bold text-sm text-white">
                        {language === 'ar' ? scene.titleAr : scene.title}
                      </h4>
                    </div>

                    <span className="text-[11px] font-mono text-emerald-400 bg-slate-900/80 px-2 py-0.5 rounded-md border border-emerald-500/30">
                      {scene.timeStart}s - {scene.timeEnd}s
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-2 leading-relaxed font-medium">
                    {language === 'ar' ? scene.narrationAr : scene.narrationHindi}
                  </p>

                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-700">
                      📷 {scene.cameraMode}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-700">
                      ⚙️ {scene.sfxCues.join(', ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: EXTRACTED FRAMES CONTACT SHEET */}
      {activeTab === 'frames' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{language === 'ar' ? "لقطات فوتوغرافية مستخرجة كل 5 ثوانٍ لفحص الاتساق البصري:" : "Contact sheet frames extracted every 5 seconds for QA consistency:"}</span>
            <span className="text-emerald-400 font-mono">15 Frames Total</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {Array.from({ length: 15 }, (_, i) => i + 1).map((idx) => {
              const frameNum = idx < 10 ? `0${idx}` : `${idx}`;
              const timeApprox = (idx - 1) * 5;
              const isSelected = selectedFrame === idx;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedFrame(idx);
                    onJumpToTime(timeApprox);
                  }}
                  className={`group relative rounded-2xl overflow-hidden border cursor-pointer transition-all aspect-[9/16] ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/60 scale-102 shadow-xl'
                      : 'border-slate-700/60 hover:border-slate-500 hover:scale-101'
                  }`}
                >
                  <img
                    src={`/assets/aistudio/frames/frame_${frameNum}.jpg`}
                    alt={`Frame ${frameNum}`}
                    className="w-full h-full object-cover group-hover:contrast-110 transition-transform"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      {timeApprox}s (Frame #{idx})
                    </span>
                    <span className="text-[9px] text-white/80 truncate">
                      {idx === 1 ? 'جزيرة عائمة' : idx === 8 ? 'اختبار الوزن' : idx === 11 ? 'قمر صناعي' : idx === 13 ? 'عداد السانغاي' : 'قطاع لوكتاك'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: STYLE BIBLE */}
      {activeTab === 'stylebible' && (
        <div className="space-y-5">
          {/* Color Palette Tokens */}
          <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">لوحة الألوان المعتمدة (Color Palette Tokens)</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {[
                { name: 'Water Deep Emerald', hex: '#1B4332', desc: 'أعماق البحيرة' },
                { name: 'Midwater Cyan', hex: '#2D6A4F', desc: 'طبقة الماء الوسطى' },
                { name: 'Fresh Grass Green', hex: '#52B788', desc: 'حشائش سطح الفومدي' },
                { name: 'Sunlight Mist', hex: '#D8F3DC', desc: 'ضباب الصباح والأشعة' },
                { name: 'Root Peat Brown', hex: '#795548', desc: 'جذور الخث المتشابكة' },
                { name: 'Submerged Silt', hex: '#3E2723', desc: 'قاع البحيرة والطمي' },
                { name: 'Gas Bubble Pearl', hex: '#E0F2FE', desc: 'فقاعات الغاز المحبوس' },
                { name: 'Metric Gold Accent', hex: '#FFD166', desc: 'تظليل الكلمات والقياس' },
                { name: 'Sangai Deer Coat', hex: '#8F572A', desc: 'فرو غزال السانغاي' },
                { name: 'Canoe & Hut Timber', hex: '#5C3A21', desc: 'خشب الزورق والأكواخ' },
                { name: 'Satellite Target HUD', hex: '#10B981', desc: 'أقواس القمر الصناعي' },
                { name: 'Deep Space Lake', hex: '#051B14', desc: 'خلفية الشورتس والظلال' },
              ].map((token) => (
                <div key={token.hex} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-1.5">
                  <div className="w-full h-8 rounded-lg shadow-inner border border-white/10" style={{ backgroundColor: token.hex }}></div>
                  <span className="text-[11px] font-bold text-white truncate">{token.name}</span>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{token.hex}</span>
                    <span className="text-[9px] text-emerald-400">{token.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typography Standards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50">
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                قواعد الخطوط العربية (Arabic Typography Discipline)
              </h4>
              <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>خط <strong>Lalezar</strong> للعناوين الضخمة وكلمات الشورتس السريعة (حجم 52-64px).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>خط <strong>Cairo</strong> للبطاقات التوضيحية والملصقات العلمية والبيانات الدقيقة.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>تظليل الكلمات على مستوى الكلمة الكاملة (Word-level highlights) وليس الحرف لتجنب كسر التشكيل.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50">
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                قاعدة الطبقات الحية الثلاث (The 3-Layer Motion Rule)
              </h4>
              <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">1</span>
                  <span><strong>الحركة الأساسية:</strong> ركض الغزلان، سقوط الصياد في الماء، تصاعد الأسهم، نباتات تنمو.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">2</span>
                  <span><strong>حركة الكاميرا والبارالاكس:</strong> غوص رأسي تحت السطح، انزلاق أفقي، وارتفاع للقمر الصناعي.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">3</span>
                  <span><strong>الحياة المحيطة:</strong> تموج الحشائش، نبض فقاعات الهواء، تموجات الماء، قطرات الأمطار.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PHYSICS & HYDRODYNAMICS */}
      {activeTab === 'physics' && (
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              الفيزياء الميكانيكية لتعويم جزر الفومدي (Archimedes & Entanglement Physics)
            </h3>
            <p>
              تعتمد الجزيرة على مبدأ الطفو الهيدروستاتيكي لأرشميدس مع تكوين شبكي نسيجي عضوي:
            </p>
            <div className="p-3 bg-slate-900 rounded-xl font-mono text-emerald-300 text-[11px] border border-emerald-500/20">
              F_buoyancy = ρ_water × V_submerged × g &gt; F_gravity (Peat + Soil + Living Deer + Huts)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60">
                <span className="font-bold text-white block mb-1">1. مصفوفة الجذور المتشابكة:</span>
                جذور نباتات ميتة متداخلة بقوة تمنع التحلل الكامل في الماء قليل الأكسجين (Peat Biomass).
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60">
                <span className="font-bold text-white block mb-1">2. حبس الغازات الحيوية:</span>
                تنتج الميكروبات المائية غاز الميثان والأكسجين المحبوس داخل الفجوات الهوائية لرفع الكثافة الإجمالية.
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60">
                <span className="font-bold text-white block mb-1">3. استقرار الجبل الجليدي (80%):</span>
                غمر 80% من الكتلة تحت الماء يخفض مركز الثقل (Center of Mass) ويمنع انقلاب الجزيرة مهما بلغت حمولتها.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
