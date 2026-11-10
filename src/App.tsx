import React, { useState, useEffect, useMemo } from 'react';
import { PhumdiRenderer } from './components/PhumdiRenderer';
import { VideoDeconstruction } from './components/VideoDeconstruction';
import { ScriptBeatSheetEditor } from './components/ScriptBeatSheetEditor';
import { AudioMixerStudio } from './components/AudioMixerStudio';
import { QAChecker } from './components/QAChecker';
import { CodeVaultAndExport } from './components/CodeVaultAndExport';
import { VoiceoverStudio } from './components/VoiceoverStudio';
import { REFERENCE_SCENES, REFERENCE_VIDEO_METADATA } from './data/referenceAnalysis';
import { VideoScene, GraphicStyle } from './types';
import { 
  Sparkles, Film, FileText, Waves, ShieldCheck, 
  FolderArchive, Play, Pause, Languages, Video, 
  CheckCircle, ChevronRight, Layers, Sliders, ExternalLink, Wand2
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'voiceover' | 'renderer' | 'deconstruct' | 'script' | 'audio' | 'qa' | 'vault'>('voiceover');
  const [currentStyle, setCurrentStyle] = useState<GraphicStyle>('cross-section');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [language, setLanguage] = useState<'ar' | 'hi' | 'en'>('ar');
  const [scenes, setScenes] = useState<VideoScene[]>(REFERENCE_SCENES);
  const [showOriginalVideoModal, setShowOriginalVideoModal] = useState<boolean>(false);

  // Compute duration dynamically based on current scenes
  const duration = useMemo(() => {
    if (scenes && scenes.length > 0) {
      const maxEnd = Math.max(...scenes.map((s) => s.timeEnd));
      return maxEnd > 0 ? maxEnd : REFERENCE_VIDEO_METADATA.duration;
    }
    return REFERENCE_VIDEO_METADATA.duration;
  }, [scenes]);

  // Active scene based on currentTime
  const activeScene = useMemo(() => {
    return scenes.find(
      (s) => currentTime >= s.timeStart && currentTime < s.timeEnd
    ) || scenes[scenes.length - 1];
  }, [currentTime, scenes]);

  // Master clock interval timer
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return Math.min(duration, prev + 0.05);
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleJumpToTime = (time: number) => {
    setCurrentTime(time);
  };

  const handleSelectScene = (scene: VideoScene) => {
    setCurrentTime(scene.timeStart);
  };

  const handleApplyGeneratedScenes = (newScenes: VideoScene[], audioUrl?: string, style?: GraphicStyle) => {
    setScenes(newScenes);
    if (style) setCurrentStyle(style);
    setCurrentTime(0);
    setCurrentTab('renderer');
    setIsPlaying(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Studio Navbar */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black text-xl">
              🎬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg text-white tracking-tight flex items-center gap-1.5">
                  <span>استوديو أنيميشن الفيديوهات التوضيحية</span>
                  <span className="text-emerald-400 font-mono text-xs font-normal">v4.0 Pro</span>
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Phumdi & Explainer Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                مشروع إنتاج فيديوهات بأسلوب القطاعات العرضية ثلاثية الأبعاد والكارتون للشورتس والريلز
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5">
            {/* View Original Video Toggle */}
            <button
              onClick={() => setShowOriginalVideoModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
              title="مشاهدة الفيديو المرجعي الأصلي المرفوع"
            >
              <Video className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">الفيديو الأصلي المرفوع</span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center p-1 bg-slate-800/90 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setLanguage('ar')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  language === 'ar' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                عربي
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  language === 'en' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  language === 'hi' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                हिंदी
              </button>
            </div>
          </div>
        </div>

        {/* Studio Sub-Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/60">
          {[
            { id: 'voiceover', labelAr: '✨ توليد من التعليق الصوتي (AI Voiceover)', icon: Wand2 },
            { id: 'renderer', labelAr: 'المحرك والمحاكي المباشر (3D Engine)', icon: Sparkles },
            { id: 'deconstruct', labelAr: 'تفكيك الفيديو وتحليل المشاهد (Deconstruction)', icon: Film },
            { id: 'script', labelAr: 'محرر السيناريو واللقطات (Beat Sheet)', icon: FileText },
            { id: 'audio', labelAr: 'هندسة الصوت والمؤثرات (Audio & SFX)', icon: Waves },
            { id: 'qa', labelAr: 'بوابة الجودة والاعتماد (QA Healer)', icon: ShieldCheck },
            { id: 'vault', labelAr: 'خزنة الأكواد ونشر GitHub (Git Ready)', icon: FolderArchive },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{tab.labelAr}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {currentTab === 'voiceover' && (
          <VoiceoverStudio
            onApplyGeneratedScenes={handleApplyGeneratedScenes}
            language={language}
          />
        )}

        {currentTab === 'renderer' && (
          <PhumdiRenderer
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            onTimeUpdate={handleJumpToTime}
            onTogglePlay={handleTogglePlay}
            activeScene={activeScene}
            language={language}
            graphicStyle={currentStyle}
            onStyleChange={setCurrentStyle}
          />
        )}

        {currentTab === 'deconstruct' && (
          <VideoDeconstruction
            onSelectScene={handleSelectScene}
            activeSceneId={activeScene?.id || 1}
            onJumpToTime={handleJumpToTime}
            language={language}
          />
        )}

        {currentTab === 'script' && (
          <ScriptBeatSheetEditor
            currentScenes={scenes}
            onUpdateScenes={setScenes}
            onSelectScene={handleSelectScene}
            activeSceneId={activeScene?.id || 1}
            language={language}
          />
        )}

        {currentTab === 'audio' && (
          <AudioMixerStudio
            currentTime={currentTime}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onTimeUpdate={handleJumpToTime}
            language={language}
          />
        )}

        {currentTab === 'qa' && (
          <QAChecker language={language} />
        )}

        {currentTab === 'vault' && (
          <CodeVaultAndExport language={language} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-4 px-6 text-center text-xs text-slate-500">
        استوديو إنتاج الأنيميشن الذاتي • متوافق مع معايير HyperFrames و Three.js و GreenSock و FFmpeg للريلز والشورتس 9:16
      </footer>

      {/* Original Video Modal (Compare with Reference Video) */}
      {showOriginalVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-md w-full shadow-2xl relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">الفيديو المرجعي الأصلي المرفوع</h3>
              </div>
              <button
                onClick={() => setShowOriginalVideoModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-inner border border-slate-800">
              <video
                src={REFERENCE_VIDEO_METADATA.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="mt-3 text-[11px] text-slate-400 space-y-1">
              <div><strong>العنوان:</strong> جزر فومدي العائمة وبحيرة لوكتاك</div>
              <div><strong>الأبعاد:</strong> 720 × 1280 (نسبة 9:16) • المدة: 76.45 ثانية • 30 FPS</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
