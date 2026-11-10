import React, { useState, useRef } from 'react';
import { GraphicStyle, VideoScene } from '../types';
import { 
  Mic, Upload, Sparkles, Wand2, Play, Pause, Square, 
  RotateCcw, Film, CheckCircle2, AlertCircle, ArrowRight,
  Layers, Cpu, Compass, BookOpen, Download, Terminal, Github
} from 'lucide-react';

interface VoiceoverStudioProps {
  onApplyGeneratedScenes: (scenes: VideoScene[], audioUrl?: string, style?: GraphicStyle) => void;
  language: 'ar' | 'hi' | 'en';
}

export const VoiceoverStudio: React.FC<VoiceoverStudioProps> = ({
  onApplyGeneratedScenes,
  language
}) => {
  // Input states
  const [scriptText, setScriptText] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<GraphicStyle>('cross-section');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);

  // Recording states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<any>(null);

  // AI Generation states
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generationResult, setGenerationResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Preset voiceover samples
  const PRESET_SCRIPTS = [
    {
      titleAr: 'كيف يعمل العقل البشري أثناء النوم؟',
      titleEn: 'How the Human Brain Works During Sleep',
      style: 'cross-section' as GraphicStyle,
      text: 'بينما يعتقد الكثيرون أن الدماغ يرتاح أثناء النوم، فإن الحقيقة العلمية مذهلة تماماً. في مرحلة نوم حركة العين السريعة، تشتعل الخلايا العصبية بنشاط فائق لمعالجة ذكريات اليوم، وتنظيف السموم العصبية، وإعادة تنظيم الروابط الدماغية تماماً كما تفعل أنظمة التخزين الرقمية العملاقة.'
    },
    {
      titleAr: 'أسرار مصارعي الكولوسيوم الروماني',
      titleEn: 'Gladiators of the Roman Colosseum',
      style: 'colosseum-2d' as GraphicStyle,
      text: 'تحت رمال حلبة الكولوسيوم في روما القديمة، كان هناك عالم سفلي كامل من الأنفاق والأقفاص والرافعات الميكانيكية. لم يكن المصارعون يقاتلون بالوحشية فقط، بل كان الأطباء الرومان يجرون عمليات جراحية عاجلة تحت الأرض باستخدام أواني الفخار والمشاعل لإنقاذ الأبطال المصابين.'
    },
    {
      titleAr: 'كيف تنتقل البيانات عبر كابلات ألياف الإنترنت البحرية؟',
      titleEn: 'How Data Travels Across Undersea Fiber Optics',
      style: 'isometric' as GraphicStyle,
      text: 'أكثر من تسعين في المائة من حركة الإنترنت العالمية لا تمر عبر الأقمار الصناعية، بل عبر كابلات ألياف ضوئية دقيقة ممدودة في قاع المحيطات. تنبض أشعة الليزر بترددات فائقة داخل زجاج نقي يعادل سماكة شعرة واحدة، ناقلة تريليونات البتات بين القارات بسرعة الضوء تقريباً.'
    },
    {
      titleAr: 'لغز اختفاء المنارة المفقودة في عام 1900',
      titleEn: 'The Mystery of Flannan Isles Lighthouse',
      style: 'night-file' as GraphicStyle,
      text: 'في شتاء عام ألف وتسعمائة، وصل قارب الإمداد إلى جزيرة إيلان مور ليجد المنارة فارغة تماماً. كانت الوجبات نصف مأكولة على الطاولة، والساعات متوقفة، وحراس المنارة الثلاثة قد اختفوا عن وجه الأرض دون أي أثر أو جثة حتى يومنا هذا.'
    }
  ];

  // Handle Audio File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);

    // Read as Base64 for server processing
    const reader = new FileReader();
    reader.onload = () => {
      setAudioBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Live Microphone Recording
  const startRecording = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        const reader = new FileReader();
        reader.onload = () => {
          setAudioBase64(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);

        // Stop media tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setErrorMsg('تعذر الوصول إلى الميكروفون: ' + (err?.message || 'يرجى التأكد من صلاحيات الصوت'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  };

  // Call Server-Side Gemini API
  const handleGenerateAnimation = async () => {
    if (!scriptText.trim() && !audioBase64) {
      setErrorMsg(language === 'ar' ? 'يرجى كتابة نص أو تسجيل/رفع ملف صوتي أولاً' : 'Please provide script text or record/upload audio first');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setGenerationStep(language === 'ar' ? 'جارٍ تحليل التعليق الصوتي واستخراج الفكرة...' : 'Analyzing voiceover audio & narrative structure...');

    try {
      // Step simulation for rich UX feedback
      const timer1 = setTimeout(() => {
        setGenerationStep(language === 'ar' ? 'جارٍ بناء المشاهد والاستعارات البصرية للنمط المختار...' : 'Generating 3-layer visual motion blueprints...');
      }, 1200);

      const timer2 = setTimeout(() => {
        setGenerationStep(language === 'ar' ? 'جارٍ موازنة التوقيتات وتزامن الكلمات الحركية والمؤثرات...' : 'Aligning kinetic typography & sound effect markers...');
      }, 2500);

      const response = await fetch('/api/generate-blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptText: scriptText.trim(),
          audioBase64: audioBase64 || undefined,
          mimeType: audioFile?.type || 'audio/webm',
          preferredStyle: selectedStyle,
          language
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setGenerationResult(data);
    } catch (err: any) {
      setErrorMsg('حدث خطأ أثناء الاتصال بالخادم: ' + (err?.message || err));
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const applyToEngine = () => {
    if (generationResult?.blueprint?.scenes) {
      onApplyGeneratedScenes(
        generationResult.blueprint.scenes,
        audioUrl || undefined,
        selectedStyle
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <Wand2 className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {language === 'ar' ? "توليد الرسوميات المتحركة من أي تعليق صوتي (AI Studio)" : "AI Adaptive Voiceover-to-Animation Studio"}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {language === 'ar'
                ? "ارفع أي تعليق صوتي أو اكتب النص، وسيقوم المحرك (مدعوماً بـ Gemini 2.5 Flash) بتحليل الصوت وإنشاء رسوميات متحركة ثلاثية الطبقات متوافقة تماماً مع إيقاع ومعنى كلامك."
                : "Provide any voiceover audio or script. The Gemini 2.5 Flash engine analyzes speech and synthesizes full 3-layer animation scenes with physics and kinetic captions."}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-emerald-400 font-mono font-bold border border-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Gemini 2.5 Flash
            </span>
          </div>
        </div>
      </div>

      {/* Main Studio Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Voiceover & Audio Ingestion */}
        <div className="lg:col-span-7 space-y-5">
          {/* Audio Input Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">
                  {language === 'ar' ? "1. إدخال التعليق الصوتي أو النص" : "1. Input Audio or Script"}
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                {audioFile ? `ملف: ${audioFile.name}` : isRecording ? 'تسجيل مباشر...' : 'صوت أو نص'}
              </span>
            </div>

            {/* Audio Recording & Upload Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Record Mic */}
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/60 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-emerald-400" />
                    تسجيل صوتي مباشر
                  </span>
                  {isRecording && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono animate-pulse font-bold">
                      {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>

                {isRecording ? (
                  <button
                    onClick={stopRecording}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-colors"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    إيقاف وإنهاء التسجيل
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    بدء التسجيل بالمايك
                  </button>
                )}
              </div>

              {/* Upload File */}
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/60 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    رفع ملف صوتي جاهز
                  </span>
                  <span className="text-[10px] text-slate-400">MP3 / WAV / M4A</span>
                </div>

                <label className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors border border-slate-600">
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{audioFile ? 'تغيير الملف الصوتي' : 'اختيار ملف من الجهاز'}</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Audio Preview Player if available */}
            {audioUrl && (
              <div className="p-3 bg-slate-800/70 rounded-2xl border border-emerald-500/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold truncate">
                  <Play className="w-4 h-4 text-emerald-400 fill-current" />
                  <span>معاينة الصوت المسجل / المرفوع:</span>
                </div>
                <audio src={audioUrl} controls className="h-8 max-w-[240px] accent-emerald-500" />
              </div>
            )}

            {/* Script Text Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-200">
                  {language === 'ar' ? "نص التعليق الصوتي أو الفكرة المطلوبة:" : "Voiceover Script or Topic:"}
                </label>
                <span className="text-[11px] text-slate-400">{scriptText.length} حرف</span>
              </div>
              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                placeholder={
                  language === 'ar'
                    ? "اكتب أو الصق نص التعليق الصوتي هنا... (مثال: كيف تتنفس الحيتان، أسرار الأهرامات، تمدد الزمن في الفيزياء، لغز اختفاء سفينة...)"
                    : "Write or paste voiceover narration script here..."
                }
                rows={4}
                className="w-full p-3.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 leading-relaxed"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>

            {/* Quick Sample Presets */}
            <div className="space-y-2">
              <span className="text-[11px] text-slate-400 block font-semibold">
                {language === 'ar' ? "أو جرّب أحد النصوص الجاهزة السريعة:" : "Or try a pre-made voiceover script:"}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_SCRIPTS.map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => {
                      setScriptText(preset.text);
                      setSelectedStyle(preset.style);
                    }}
                    className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 text-start transition-all"
                  >
                    <div className="text-xs font-bold text-emerald-300 truncate mb-0.5">
                      {preset.titleAr}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      النمط: {preset.style}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Graphic Style Picker */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">
                {language === 'ar' ? "2. اختر أسلوب الرسوميات والأنيميشن (Graphic Style)" : "2. Select Graphic Animation Style"}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: 'cross-section',
                  nameAr: 'قطاع عرضي علمي 3D (Zack D. Films)',
                  nameEn: 'Scientific 3D Cross-Section',
                  desc: 'طبقات مقطوعة، سوائل، أعضاء داخلية، جذور وفقاعات غازية',
                  icon: '🔬',
                  color: 'border-emerald-500/80 bg-emerald-500/10'
                },
                {
                  id: 'colosseum-2d',
                  nameAr: 'كرتون متجه 2D (Colosseum Cutout)',
                  nameEn: '2D Vector Cartoon Cutout',
                  desc: 'خطوط داكنة سميكة، نوابض وفيزياء صدمة، حركة مفاصل ممتعة',
                  icon: '🏛️',
                  color: 'border-amber-500/80 bg-amber-500/10'
                },
                {
                  id: 'isometric',
                  nameAr: 'رسوم آيزومترية ومعمارية (Isometric)',
                  nameEn: 'Isometric Diagram & Cutaways',
                  desc: 'شبكات هندسية متساوية القياس، تدفق بيانات، محركات تقنية',
                  icon: '📐',
                  color: 'border-cyan-500/80 bg-cyan-500/10'
                },
                {
                  id: 'night-file',
                  nameAr: 'ملفات غامضة ونوار (Night File Noir)',
                  nameEn: 'Dark Mystery & True Crime',
                  desc: 'إضاءة موجهة (Spotlight)، أحمر فسفوري، آلة كاتبة ووثائق',
                  icon: '🕵️‍♂️',
                  color: 'border-rose-500/80 bg-rose-500/10'
                },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id as GraphicStyle)}
                  className={`p-3.5 rounded-2xl border text-start transition-all ${
                    selectedStyle === style.id
                      ? `${style.color} ring-1 ring-emerald-500/50 shadow-lg`
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{style.icon}</span>
                    <span className="font-bold text-xs text-white">{style.nameAr}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    {style.desc}
                  </p>
                </button>
              ))}
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              onClick={handleGenerateAnimation}
              disabled={isGenerating}
              className={`w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-xl transition-all ${
                isGenerating
                  ? 'bg-emerald-600/50 text-white cursor-wait animate-pulse'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/25'
              }`}
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>{generationStep || 'جارٍ تحليل الصوت وتوليد الرسوميات الذكية...'}</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>توليد الرسوميات والمشاهد المتحركة تلقائياً (Generate Animation)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: AI Blueprint Results & GitHub Publisher */}
        <div className="lg:col-span-5 space-y-5">
          {/* Blueprint Results Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">
                  {language === 'ar' ? "3. اللقطات والرسوميات المولدة" : "3. Generated Scenes Blueprint"}
                </h3>
              </div>
              {generationResult && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                  {generationResult.source}
                </span>
              )}
            </div>

            {generationResult ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl">
                  <h4 className="font-bold text-sm text-white mb-1">
                    {generationResult.blueprint.projectTitleAr || generationResult.blueprint.projectTitle}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-300">
                    <span>عدد المشاهد: <strong>{generationResult.blueprint.scenes.length}</strong></span>
                    <span>•</span>
                    <span>المدة التقريبية: <strong>{Math.round(generationResult.blueprint.estimatedDuration)} ثانية</strong></span>
                  </div>
                </div>

                {/* Scenes Preview List */}
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {generationResult.blueprint.scenes.map((sc: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-200">
                        <span className="text-emerald-400">المشهد #{sc.id}: {sc.titleAr}</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {sc.timeStart.toFixed(1)}s - {sc.timeEnd.toFixed(1)}s
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">
                        {sc.narrationAr}
                      </p>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-0.5">
                        <span>📷 {sc.cameraMode}</span>
                        <span>•</span>
                        <span>🎨 {sc.visualAction}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Apply Button */}
                <button
                  onClick={applyToEngine}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>تطبيق وتشغيل الرسوميات في المحرك المباشر الآن</span>
                </button>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Sparkles className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs">
                  {language === 'ar'
                    ? "أدخل الصوت أو النص واضغط على زر التوليد لعرض مخطط المشاهد البصري هنا."
                    : "Input voiceover audio or text and click generate to view the animation blueprint here."}
                </p>
              </div>
            )}
          </div>

          {/* GitHub Repository Ready Packaging */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Github className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">
                {language === 'ar' ? "4. نشر المشروع على GitHub (Git Ready)" : "4. Publish Project to GitHub"}
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {language === 'ar'
                ? "المشروع مجهز بالكامل بهيكلية Full-Stack Express وخادم ورندر محلي. لرفعه مباشرة إلى حسابك على GitHub:"
                : "The project is completely organized as a Full-Stack Express repository with local FFmpeg rendering. Follow these quick steps to push to GitHub:"}
            </p>

            <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 font-mono text-[11px] text-emerald-300 space-y-1.5 overflow-x-auto">
              <div># 1. تهيئة المستودع والملفات</div>
              <div className="text-white">git init</div>
              <div className="text-white">git add .</div>
              <div className="text-white">git commit -m "feat: adaptive voiceover animation studio"</div>
              <div># 2. ربط المستودع ورفعه على GitHub</div>
              <div className="text-white">git branch -M main</div>
              <div className="text-white">git remote add origin https://github.com/&lt;your-username&gt;/&lt;repo-name&gt;.git</div>
              <div className="text-white">git push -u origin main</div>
            </div>

            <div className="pt-1">
              <a
                href="/api/export-repo-info"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
              >
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>عرض وثيقة التثبيت والأوامر البرمجية الكاملة</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
