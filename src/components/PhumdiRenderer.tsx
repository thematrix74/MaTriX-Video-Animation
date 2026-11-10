import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CameraViewMode, VideoScene } from '../types';
import { 
  Play, Pause, RotateCcw, Camera, Download, Layers, 
  Volume2, VolumeX, Eye, Maximize2, Shield, Sparkles, RefreshCw,
  Wand2, Film, ArrowLeftRight
} from 'lucide-react';

import { GraphicStyle } from '../types';

export type TransitionType = 'dissolve' | 'light-leak' | 'iris' | 'black-dip' | 'motion-glide' | 'none';

interface PhumdiRendererProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onTogglePlay: () => void;
  activeScene?: VideoScene;
  language: 'ar' | 'hi' | 'en';
  graphicStyle?: GraphicStyle;
  onStyleChange?: (style: GraphicStyle) => void;
}

export const PhumdiRenderer: React.FC<PhumdiRendererProps> = ({
  currentTime,
  duration,
  isPlaying,
  onTimeUpdate,
  onTogglePlay,
  activeScene,
  language,
  graphicStyle,
  onStyleChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // View & Layer state
  const [internalStyle, setInternalStyle] = useState<GraphicStyle>('cross-section');
  const currentStyle: GraphicStyle = activeScene?.graphicStyle || graphicStyle || internalStyle;

  const [cameraMode, setCameraMode] = useState<CameraViewMode>('cross-section');
  const [showSafeZones, setShowSafeZones] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showCaptions, setShowCaptions] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [deerCount, setDeerCount] = useState<number>(3);
  const [manualOverrideCamera, setManualOverrideCamera] = useState<boolean>(false);

  // Selective Scene Transition States (تأثير الانتقال والتلاشي السلس)
  const [transitionType, setTransitionType] = useState<TransitionType>('dissolve');
  const [transitionDuration, setTransitionDuration] = useState<number>(0.65);
  const [enableSmoothTransitions, setEnableSmoothTransitions] = useState<boolean>(true);
  const [showTransitionBadge, setShowTransitionBadge] = useState<boolean>(true);
  const [previewTransitionTrigger, setPreviewTransitionTrigger] = useState<number>(0);

  // Auto-switch camera mode based on active scene if not manually overridden
  useEffect(() => {
    if (!manualOverrideCamera && activeScene?.cameraMode) {
      setCameraMode(activeScene.cameraMode);
    }
  }, [activeScene, manualOverrideCamera]);

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const width = 720;
    const height = 1280;
    canvas.width = width;
    canvas.height = height;

    const render = () => {
      const t = currentTime;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // 1. Calculate Transition Progress & Smooth Factor
      let transitionFactor = 0; // 0 = normal, 1 = peak transition
      if (enableSmoothTransitions && transitionType !== 'none' && activeScene) {
        const halfWindow = transitionDuration * 0.5;
        const timeIntoScene = t - activeScene.timeStart;
        const timeUntilSceneEnd = activeScene.timeEnd - t;

        if (timeIntoScene < halfWindow && activeScene.id > 1) {
          // Fading IN from previous scene
          const progress = timeIntoScene / halfWindow; // 0 to 1
          transitionFactor = 0.5 + 0.5 * Math.cos(progress * Math.PI);
        } else if (timeUntilSceneEnd < halfWindow) {
          // Fading OUT to next scene
          const progress = timeUntilSceneEnd / halfWindow; // 1 to 0
          transitionFactor = 0.5 + 0.5 * Math.cos((1 - progress) * Math.PI);
        }
      }

      // Check manual preview trigger
      if (previewTransitionTrigger > 0) {
        const elapsed = (Date.now() - previewTransitionTrigger) / 1000;
        if (elapsed < transitionDuration) {
          const p = elapsed / transitionDuration;
          transitionFactor = Math.sin(p * Math.PI);
        }
      }

      // 2. Determine target camera offset based on cameraMode
      let targetCamY = 0;
      let targetCamScale = 1;
      let isSatellite = cameraMode === 'satellite';
      let isMonsoon = cameraMode === 'monsoon' || (t >= 44 && t <= 52);

      if (cameraMode === 'underwater-macro') {
        targetCamY = -180;
        targetCamScale = 1.25;
      } else if (cameraMode === 'surface') {
        targetCamY = 140;
        targetCamScale = 1.15;
      } else if (cameraMode === 'cross-section') {
        targetCamY = 0;
        targetCamScale = 1.0;
      }

      // Smooth camera interpolation on scene start
      let camY = targetCamY;
      let camScale = targetCamScale;
      if (enableSmoothTransitions && activeScene && (t - activeScene.timeStart) < transitionDuration) {
        const enterRatio = Math.min(1, Math.max(0, (t - activeScene.timeStart) / transitionDuration));
        // Cubic ease in-out
        const ease = enterRatio * enterRatio * (3 - 2 * enterRatio);
        camY = targetCamY * ease + (targetCamY * 0.85) * (1 - ease);
        camScale = targetCamScale * ease + (targetCamScale * 0.95) * (1 - ease);
      }

      ctx.save();

      // Multi-Style Graphic Engine Dispatch
      if (isSatellite) {
        renderSatelliteView(ctx, width, height, t, language);
      } else if (currentStyle === 'colosseum-2d') {
        renderColosseum2DScene(ctx, width, height, t, language, camScale, camY);
      } else if (currentStyle === 'isometric') {
        renderIsometricScene(ctx, width, height, t, language, camScale, camY);
      } else if (currentStyle === 'night-file') {
        renderNightFileScene(ctx, width, height, t, language, camScale, camY);
      } else {
        // STANDARD 2D/3D CUTAWAY RENDERER (Cross-Section Phumdi / Zack D. Films style)
        ctx.translate(width / 2, height / 2);
        ctx.scale(camScale, camScale);
        ctx.translate(-width / 2, -height / 2 + camY);

        // 1. Sky & Atmosphere
        renderAtmosphere(ctx, width, height, t, isMonsoon);

        // 2. Background Mountains & Trees
        renderBackgroundLandscape(ctx, width, height, t);

        // 3. Water Surface & Underwater Column
        renderWaterColumn(ctx, width, height, t, isMonsoon);

        // 4. The Floating Island (Phumdi) Root Structure
        renderPhumdiRoots(ctx, width, height, t, isMonsoon);

        // 5. Trapped Air & Gas Bubbles
        renderAirBubbles(ctx, width, height, t);

        // 6. Island Surface Reeds & Grass
        renderGrassAndVegetation(ctx, width, height, t);

        // 7. Fishermen Huts & Canoes
        renderHutsAndBoats(ctx, width, height, t);

        // 8. Sangai Deer Herd
        renderDeerHerd(ctx, width, height, t);

        // 9. Rain & Weather FX if Monsoon
        if (isMonsoon) {
          renderRainStorm(ctx, width, height, t);
        }

        // 10. Indicators & Measurements (~2m, 80% submerged, Counter)
        renderScientificIndicators(ctx, width, height, t, language);
      }

      ctx.restore();

      // 10.5. Selective Scene Transition Layer (تأثير الانتقال والتلاشي السينمائي)
      if (enableSmoothTransitions && transitionFactor > 0.005) {
        renderSceneTransitionEffect(
          ctx,
          width,
          height,
          transitionFactor,
          transitionType,
          t,
          activeScene,
          language,
          showTransitionBadge
        );
      }

      // 11. Kinetic Captions Layer (rendered in screen coordinates)
      if (showCaptions) {
        renderKineticCaptions(ctx, width, height, t, activeScene, language);
      }

      // 12. Floating Topic Labels
      if (showLabels && activeScene?.labels && !isSatellite) {
        renderFloatingLabels(ctx, width, height, activeScene, language, t);
      }

      // 13. Safe Zone Overlay (Shorts/Reels 9:16 safe margins)
      if (showSafeZones) {
        renderSafeZones(ctx, width, height);
      }

      // Request next frame if playing or previewing
      if (isPlaying || previewTransitionTrigger > 0) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    currentTime, 
    isPlaying, 
    cameraMode, 
    showSafeZones, 
    showLabels, 
    showCaptions, 
    language, 
    activeScene, 
    deerCount,
    transitionType,
    transitionDuration,
    enableSmoothTransitions,
    showTransitionBadge,
    previewTransitionTrigger,
    currentStyle
  ]);

  // Video Recording from Canvas
  const startRecording = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    recordedChunksRef.current = [];
    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedVideoUrl(url);
      setIsRecording(false);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
      {/* 9:16 Canvas Phone Preview Frame */}
      <div className="relative flex-shrink-0 mx-auto xl:mx-0 w-full max-w-[360px] sm:max-w-[400px]">
        {/* Device Bezel */}
        <div className="relative bg-slate-900 p-3 sm:p-4 rounded-[40px] shadow-2xl border-4 border-slate-700/80 ring-1 ring-emerald-500/30">
          {/* Speaker / Notch bar */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-800 rounded-full flex items-center justify-center gap-2 z-30">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700"></div>
            <div className="w-10 h-1.5 rounded-full bg-slate-700"></div>
          </div>

          {/* Aspect Ratio 9:16 Container */}
          <div className="relative w-full aspect-[9/16] rounded-[28px] overflow-hidden bg-black shadow-inner">
            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain cursor-pointer"
              onClick={onTogglePlay}
            />

            {/* Play Overlay if Paused */}
            {!isPlaying && (
              <div 
                onClick={onTogglePlay}
                className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center cursor-pointer transition-opacity hover:bg-black/20"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/90 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/40 hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 fill-current ml-1" />
                </div>
              </div>
            )}

            {/* Floating Live Badge & Resolution */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-[11px] font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              9:16 • 720x1280 (30 FPS)
            </div>

            {/* Time Stamp overlay */}
            <div className="absolute top-4 right-4 z-20 px-2 py-0.5 rounded-md bg-black/60 font-mono text-[11px] text-white/90">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            {/* Active Scene Chip */}
            {activeScene && (
              <div className="absolute top-12 left-4 right-4 z-20">
                <div className="bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/40 text-center shadow-lg">
                  <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">
                    {language === 'ar' ? `المشهد ${activeScene.id} من 10` : `Scene ${activeScene.id} of 10`}
                  </span>
                  <span className="text-xs font-semibold text-white truncate block">
                    {language === 'ar' ? activeScene.titleAr : activeScene.title}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Playback Bar under phone screen */}
          <div className="mt-3 flex items-center justify-between gap-2 px-1">
            <button
              onClick={onTogglePlay}
              className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-md font-bold"
              title={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => onTimeUpdate(0)}
              className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="إعادة للبداية"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="flex-1 px-1">
              <input
                type="range"
                min="0"
                max={duration}
                step="0.05"
                value={currentTime}
                onChange={(e) => onTimeUpdate(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {isRecording ? (
              <button
                onClick={stopRecording}
                className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 animate-pulse shadow-md"
              >
                <span className="w-2 h-2 rounded-full bg-white"></span>
                إيقاف التسجيل
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                title="تسجيل مقطع فيديو مباشر من الكانفاس"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>تسجيل فيديو</span>
              </button>
            )}
          </div>
        </div>

        {/* Download Link if recorded */}
        {recordedVideoUrl && (
          <div className="mt-3 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-xs text-emerald-200">
            <span>تم استخراج الفيديو بنجاح!</span>
            <a
              href={recordedVideoUrl}
              download="phumdi-explainer-reel.webm"
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              تحميل الفيديو
            </a>
          </div>
        )}
      </div>

      {/* Control Panel & Engine Inspector */}
      <div className="flex-1 w-full space-y-5">
        {/* Multi-Style Graphic Switcher */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">
                {language === 'ar' ? "أسلوب الرسوميات المتحركة (Animation Graphic Style)" : "Animation Graphic Style"}
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              {currentStyle}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'cross-section', nameAr: 'قطاع عرضي 3D', nameEn: '3D Cross-Section', icon: '🔬' },
              { id: 'colosseum-2d', nameAr: 'كرتون كولوسيوم 2D', nameEn: '2D Colosseum Cutout', icon: '🏛️' },
              { id: 'isometric', nameAr: 'رسوم آيزومترية', nameEn: 'Isometric Diagram', icon: '📐' },
              { id: 'night-file', nameAr: 'ملفات غامضة نوار', nameEn: 'Night File Noir', icon: '🕵️‍♂️' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  setInternalStyle(st.id as GraphicStyle);
                  if (onStyleChange) onStyleChange(st.id as GraphicStyle);
                }}
                className={`p-2.5 rounded-2xl text-center transition-all border flex items-center justify-center gap-2 ${
                  currentStyle === st.id
                    ? 'bg-emerald-500/20 border-emerald-500/80 text-white shadow-md font-bold ring-1 ring-emerald-500/40'
                    : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{st.icon}</span>
                <span className="text-xs">{language === 'ar' ? st.nameAr : st.nameEn}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Camera Views Selector */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">
                {language === 'ar' ? "أوضاع الكاميرا والمنظور الثلاثي الأبعاد" : "3D Camera Viewports & Angles"}
              </h3>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={manualOverrideCamera}
                onChange={(e) => setManualOverrideCamera(e.target.checked)}
                className="rounded accent-emerald-500"
              />
              <span>{language === 'ar' ? "تثبيت الكاميرا يدوياً" : "Lock Manual Camera"}</span>
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              { id: 'cross-section', nameAr: 'قطاع عرضي (Cutaway)', nameEn: 'Cross-Section', desc: 'الماء والجذور وسطح الجزيرة' },
              { id: 'underwater-macro', nameAr: 'غوص الجذور (Macro)', nameEn: 'Underwater Macro', desc: 'تكبير على فقاعات الهواء' },
              { id: 'surface', nameAr: 'منظور السطح (Surface)', nameEn: 'Surface Horizon', desc: 'الأكواخ وزورق الصيادين' },
              { id: 'monsoon', nameAr: 'عاصفة الأمطار (Rain)', nameEn: 'Monsoon Cycle', desc: 'الأمطار وارتفاع منسوب الماء' },
              { id: 'satellite', nameAr: 'قمر صناعي (Satellite)', nameEn: 'Satellite Top', desc: '40 كم² الحديقة الوطنية' },
            ].map((cam) => (
              <button
                key={cam.id}
                onClick={() => {
                  setCameraMode(cam.id as CameraViewMode);
                  setManualOverrideCamera(true);
                }}
                className={`p-3 rounded-2xl text-start transition-all border ${
                  cameraMode === cam.id
                    ? 'bg-emerald-500/15 border-emerald-500/80 text-white shadow-lg ring-1 ring-emerald-500/40'
                    : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-xs mb-1 text-emerald-300">
                  {language === 'ar' ? cam.nameAr : cam.nameEn}
                </div>
                <div className="text-[11px] text-slate-400 leading-tight">
                  {cam.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Visual Layer Toggles & Shorts Safe Zones */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">
              {language === 'ar' ? "طبقات المحرك وقواعد الإنتاج (Layers & QA)" : "Engine Layers & Quality Rules"}
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className="flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-2xl border border-slate-700/60 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={showCaptions}
                onChange={(e) => setShowCaptions(e.target.checked)}
                className="rounded accent-emerald-500 w-4 h-4"
              />
              <div className="text-xs">
                <span className="font-semibold text-white block">النصوص المتزامنة</span>
                <span className="text-[10px] text-slate-400">Kinetic Captions</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-2xl border border-slate-700/60 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                className="rounded accent-emerald-500 w-4 h-4"
              />
              <div className="text-xs">
                <span className="font-semibold text-white block">الملصقات العلمية</span>
                <span className="text-[10px] text-slate-400">Educational Labels</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-2xl border border-slate-700/60 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={showSafeZones}
                onChange={(e) => setShowSafeZones(e.target.checked)}
                className="rounded accent-emerald-500 w-4 h-4"
              />
              <div className="text-xs">
                <span className="font-semibold text-white block">إطار الأمان للريلز</span>
                <span className="text-[10px] text-slate-400">9:16 Safe Zones</span>
              </div>
            </label>

            <div className="p-3 bg-slate-800/50 rounded-2xl border border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-white">قطيع الغزلان:</span>
                <span className="text-emerald-400 font-bold">{deerCount}</span>
              </div>
              <input
                type="range"
                min="1"
                max="6"
                value={deerCount}
                onChange={(e) => setDeerCount(parseInt(e.target.value))}
                className="accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Scene Transition & Cinematic Dissolve Controls (تأثير الانتقال والتلاشي السلس بين المشاهد) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">
                {language === 'ar' ? "تأثير الانتقال والتلاشي السلس بين المشاهد" : "Scene Transition & Cinematic Dissolve"}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Smooth Dissolve
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewTransitionTrigger(Date.now())}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                title="معاينة تأثير التلاشي السلس في اللحظة الحالية"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'ar' ? "معاينة التأثير الآن" : "Preview Transition"}</span>
              </button>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-1.5 px-2 bg-slate-800/80 rounded-xl border border-slate-700">
                <input
                  type="checkbox"
                  checked={enableSmoothTransitions}
                  onChange={(e) => setEnableSmoothTransitions(e.target.checked)}
                  className="rounded accent-emerald-500 w-3.5 h-3.5"
                />
                <span className="font-medium">{language === 'ar' ? "تفعيل التلاشي" : "Active"}</span>
              </label>
            </div>
          </div>

          {/* Transition Style Selector Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-4">
            {[
              { id: 'dissolve', nameAr: 'تلاشي سينمائي (Dissolve)', nameEn: 'Film Dissolve', desc: 'تلاشٍ سلس ناعم مع تدرج إضاءة هادئ' },
              { id: 'light-leak', nameAr: 'توهج ضوئي (Light Leak)', nameEn: 'Optical Flare', desc: 'شعاع شمسي دافئ وأنامورفيك' },
              { id: 'iris', nameAr: 'مسح بؤري (Iris Wipe)', nameEn: 'Aperture Iris', desc: 'انقباض وانفتاح دائري كلاسيكي' },
              { id: 'black-dip', nameAr: 'تلاشٍ أسود (Black Dip)', nameEn: 'Black Dip', desc: 'تعتيم سينمائي هادئ وعميق' },
              { id: 'motion-glide', nameAr: 'انزلاق ديناميكي (Motion)', nameEn: 'Motion Glide', desc: 'حركة بارالاكس مع خطوط سرعة' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setTransitionType(item.id as TransitionType);
                  setEnableSmoothTransitions(true);
                  setPreviewTransitionTrigger(Date.now());
                }}
                className={`p-3 rounded-2xl text-start transition-all border ${
                  transitionType === item.id && enableSmoothTransitions
                    ? 'bg-emerald-500/15 border-emerald-500/80 text-white shadow-lg ring-1 ring-emerald-500/40'
                    : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-xs mb-1 text-emerald-300">
                  {language === 'ar' ? item.nameAr : item.nameEn}
                </div>
                <div className="text-[11px] text-slate-400 leading-tight">
                  {item.desc}
                </div>
              </button>
            ))}
          </div>

          {/* Sub-controls: Duration & Badge */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 bg-slate-800/40 rounded-2xl border border-slate-700/50 text-xs">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-slate-300 font-semibold whitespace-nowrap">
                {language === 'ar' ? "سرعة التلاشي الانتقالي:" : "Transition Duration:"}
              </span>
              <div className="flex items-center gap-2 flex-1 sm:w-48">
                <input
                  type="range"
                  min="0.3"
                  max="1.2"
                  step="0.05"
                  value={transitionDuration}
                  onChange={(e) => setTransitionDuration(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                />
                <span className="font-mono text-emerald-400 font-bold min-w-[36px]">
                  {transitionDuration.toFixed(2)}s
                </span>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer self-start sm:self-auto text-slate-300">
              <input
                type="checkbox"
                checked={showTransitionBadge}
                onChange={(e) => setShowTransitionBadge(e.target.checked)}
                className="rounded accent-emerald-500 w-4 h-4"
              />
              <span>{language === 'ar' ? "إظهار شارة اسم المشهد أثناء التلاشي" : "Show Scene Badge During Dissolve"}</span>
            </label>
          </div>
        </div>

        {/* Real-time Scene Inspector & Scientific Mechanics */}
        {activeScene && (
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/40">
                    {language === 'ar' ? `المشهد ${activeScene.id}` : `Scene ${activeScene.id}`}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {activeScene.timeStart.toFixed(1)}s → {activeScene.timeEnd.toFixed(1)}s ({(activeScene.timeEnd - activeScene.timeStart).toFixed(1)}s)
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white">
                  {language === 'ar' ? activeScene.titleAr : activeScene.title}
                </h4>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 rounded-xl text-xs text-slate-300 border border-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{language === 'ar' ? "قاعدة الحركة: 3 طبقات حية" : "3-Layer Living Motion"}</span>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/40 p-3.5 rounded-2xl border border-slate-700/50 mb-3 font-medium">
              {language === 'ar' ? activeScene.narrationAr : activeScene.narrationHindi}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-700/40">
                <span className="text-slate-400 font-semibold block mb-1">
                  {language === 'ar' ? "الفيزياء والميكانيكا البصرية:" : "Visual Physics & Mechanics:"}
                </span>
                <span className="text-slate-200">{activeScene.mechanics}</span>
              </div>
              <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-700/40">
                <span className="text-slate-400 font-semibold block mb-1">
                  {language === 'ar' ? "حركة الكاميرا والاستعارة:" : "Camera & Metaphor:"}
                </span>
                <span className="text-slate-200">{activeScene.cameraMotion} • {activeScene.visualMetaphor}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// PROCEDURAL CANVAS RENDERER FUNCTIONS
// ==========================================

function renderAtmosphere(ctx: CanvasRenderingContext2D, width: number, height: number, t: number, isMonsoon: boolean) {
  // Atmospheric Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.45);
  if (isMonsoon) {
    skyGrad.addColorStop(0, '#3a444c');
    skyGrad.addColorStop(0.6, '#56646f');
    skyGrad.addColorStop(1, '#8193a0');
  } else {
    skyGrad.addColorStop(0, '#88a89c');
    skyGrad.addColorStop(0.35, '#c5d8ce');
    skyGrad.addColorStop(0.7, '#e4eee7');
    skyGrad.addColorStop(1, '#f1f6f3');
  }

  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height * 0.45);

  // Gentle morning mist/sun haze
  if (!isMonsoon) {
    const sunGrad = ctx.createRadialGradient(width * 0.7, 120, 10, width * 0.7, 120, 280);
    sunGrad.addColorStop(0, 'rgba(255, 255, 235, 0.4)');
    sunGrad.addColorStop(0.5, 'rgba(255, 250, 210, 0.15)');
    sunGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, width, height * 0.45);
  }
}

function renderBackgroundLandscape(ctx: CanvasRenderingContext2D, width: number, height: number, t: number) {
  const horizonY = height * 0.42;

  // Far distant mountain ridge (Parallax layer 1)
  ctx.fillStyle = 'rgba(120, 150, 138, 0.35)';
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  for (let x = 0; x <= width; x += 30) {
    const y = horizonY - 45 - Math.sin(x * 0.008 + 1) * 25 - Math.cos(x * 0.015) * 15;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, horizonY);
  ctx.closePath();
  ctx.fill();

  // Midground Trees / Foliage Row (Parallax layer 2)
  const treeCount = 14;
  for (let i = 0; i < treeCount; i++) {
    const tx = (i / (treeCount - 1)) * (width + 60) - 30;
    const ty = horizonY - 15;
    const treeScale = 0.8 + ((i % 3) * 0.15);
    const sway = Math.sin(t * 1.5 + i) * 3;

    // Tree trunk
    ctx.strokeStyle = '#5a6b61';
    ctx.lineWidth = 4 * treeScale;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + sway * 0.5, ty - 40 * treeScale, tx + sway, ty - 80 * treeScale);
    ctx.stroke();

    // Tree crown canopy
    ctx.fillStyle = 'rgba(110, 142, 122, 0.75)';
    ctx.beginPath();
    ctx.arc(tx + sway, ty - 85 * treeScale, 32 * treeScale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(135, 168, 148, 0.6)';
    ctx.beginPath();
    ctx.arc(tx + sway - 8, ty - 92 * treeScale, 20 * treeScale, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderWaterColumn(ctx: CanvasRenderingContext2D, width: number, height: number, t: number, isMonsoon: boolean) {
  const waterSurfaceY = height * 0.42;

  // Water Depth Gradient (Emerald/Navy/Dark Depths)
  const waterGrad = ctx.createLinearGradient(0, waterSurfaceY, 0, height);
  if (isMonsoon) {
    waterGrad.addColorStop(0, '#1c423d');
    waterGrad.addColorStop(0.3, '#10302b');
    waterGrad.addColorStop(0.7, '#091c19');
    waterGrad.addColorStop(1, '#040d0c');
  } else {
    waterGrad.addColorStop(0, '#266158');
    waterGrad.addColorStop(0.25, '#174740');
    waterGrad.addColorStop(0.65, '#0d2d28');
    waterGrad.addColorStop(1, '#071714');
  }

  ctx.fillStyle = waterGrad;
  ctx.fillRect(0, waterSurfaceY, width, height - waterSurfaceY);

  // Sunlight caustics beams filtering down through water
  ctx.save();
  ctx.globalAlpha = isMonsoon ? 0.08 : 0.18;
  for (let i = 0; i < 6; i++) {
    const rx = (i / 5) * width + Math.sin(t * 0.8 + i) * 40;
    const rayGrad = ctx.createLinearGradient(rx, waterSurfaceY, rx + 80, height * 0.85);
    rayGrad.addColorStop(0, 'rgba(210, 255, 230, 0.8)');
    rayGrad.addColorStop(0.6, 'rgba(140, 220, 190, 0.2)');
    rayGrad.addColorStop(1, 'rgba(20, 60, 50, 0)');
    ctx.fillStyle = rayGrad;
    ctx.beginPath();
    ctx.moveTo(rx - 25, waterSurfaceY);
    ctx.lineTo(rx + 45, waterSurfaceY);
    ctx.lineTo(rx + 110, height * 0.85);
    ctx.lineTo(rx + 10, height * 0.85);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Lake Bottom Silt / Mud Bed
  const bedY = height * 0.88;
  const bedGrad = ctx.createLinearGradient(0, bedY, 0, height);
  bedGrad.addColorStop(0, '#352718');
  bedGrad.addColorStop(0.4, '#241a10');
  bedGrad.addColorStop(1, '#150f08');
  ctx.fillStyle = bedGrad;
  ctx.beginPath();
  ctx.moveTo(0, bedY);
  for (let x = 0; x <= width; x += 25) {
    const by = bedY + Math.sin(x * 0.012) * 8 + Math.cos(x * 0.03) * 4;
    ctx.lineTo(x, by);
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // Bed stones / shells
  ctx.fillStyle = '#4a3b2b';
  for (let i = 0; i < 5; i++) {
    const sx = 80 + i * 140;
    const sy = bedY + 18 + (i % 2) * 12;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 22, 10, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Water surface boundary wave line
  ctx.strokeStyle = 'rgba(220, 255, 245, 0.7)';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(0, waterSurfaceY);
  for (let x = 0; x <= width; x += 15) {
    const wy = waterSurfaceY + Math.sin(x * 0.03 + t * 3) * 3;
    ctx.lineTo(x, wy);
  }
  ctx.stroke();
}

function renderPhumdiRoots(ctx: CanvasRenderingContext2D, width: number, height: number, t: number, isMonsoon: boolean) {
  const waterSurfaceY = height * 0.42;

  // Island dimensions and buoyant gentle rocking
  const islandLeft = 40;
  const islandRight = width - 40;
  const islandWidth = islandRight - islandLeft;
  const matThickness = 190; // Approx 2 meters in scale
  
  // Dynamic floating vertical bobbing
  let floatOffset = Math.sin(t * 1.8) * 5;
  if (isMonsoon) {
    floatOffset = Math.sin(t * 2.5) * 8 - 15; // Floats higher in monsoon
  } else if (t >= 44 && t <= 48) {
    floatOffset = 45; // Sinks to touch lakebed in dry season!
  }

  const matTopY = waterSurfaceY - 38 + floatOffset;
  const matBottomY = matTopY + matThickness;

  // 1. Root Mat Base Body (Dark fibrous peat mass)
  const peatGrad = ctx.createLinearGradient(0, matTopY, 0, matBottomY);
  peatGrad.addColorStop(0, '#543b24');
  peatGrad.addColorStop(0.3, '#3e2815');
  peatGrad.addColorStop(0.7, '#2b1a0d');
  peatGrad.addColorStop(1, '#1d1108');

  ctx.fillStyle = peatGrad;
  ctx.beginPath();
  ctx.moveTo(islandLeft, matTopY + 15);
  ctx.quadraticCurveTo(width / 2, matTopY, islandRight, matTopY + 15);
  ctx.lineTo(islandRight - 10, matBottomY - 15);
  ctx.quadraticCurveTo(width / 2, matBottomY + 20, islandLeft + 10, matBottomY - 15);
  ctx.closePath();
  ctx.fill();

  // 2. Intertwined Root Strands (The organic biological woven net)
  ctx.save();
  ctx.strokeStyle = '#855d36';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  const rootLayers = 7;
  for (let l = 0; l < rootLayers; l++) {
    const yAnchor = matTopY + 25 + l * 24;
    ctx.strokeStyle = l % 2 === 0 ? '#996c3f' : '#694726';
    ctx.lineWidth = 3 + (l % 3);

    ctx.beginPath();
    ctx.moveTo(islandLeft + 15, yAnchor);
    for (let x = islandLeft + 20; x <= islandRight - 15; x += 40) {
      const freq = 0.02 + l * 0.005;
      const ry = yAnchor + Math.sin(x * freq + t * 0.8 + l) * 12 + Math.cos(x * 0.04) * 6;
      ctx.lineTo(x, ry);
    }
    ctx.stroke();
  }

  // Cross-crossing diagonal root fibers
  ctx.strokeStyle = 'rgba(150, 105, 60, 0.45)';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 20; i++) {
    const startX = islandLeft + 30 + i * 28;
    const endX = startX + (i % 2 === 0 ? 55 : -55);
    ctx.beginPath();
    ctx.moveTo(startX, matTopY + 15);
    ctx.quadraticCurveTo((startX + endX) / 2, matTopY + matThickness * 0.5, endX, matBottomY - 10);
    ctx.stroke();
  }

  // 3. Hanging Submerged Roots dangling into deep water
  const hangingCount = 28;
  for (let i = 0; i < hangingCount; i++) {
    const hx = islandLeft + 35 + (i / hangingCount) * (islandWidth - 70);
    const hangLen = 35 + ((i * 17) % 85);
    const hangSway = Math.sin(t * 1.5 + i * 0.7) * 8;

    ctx.strokeStyle = '#4e331c';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(hx, matBottomY - 5);
    ctx.quadraticCurveTo(hx + hangSway * 0.5, matBottomY + hangLen * 0.5, hx + hangSway, matBottomY + hangLen);
    ctx.stroke();
  }

  ctx.restore();
}

function renderAirBubbles(ctx: CanvasRenderingContext2D, width: number, height: number, t: number) {
  const waterSurfaceY = height * 0.42;
  const floatOffset = Math.sin(t * 1.8) * 5;
  const matTopY = waterSurfaceY - 38 + floatOffset;
  const matThickness = 190;

  // 45 trapped gas spheres (Oxygen, Methane, atmospheric air trapped inside root mesh)
  const bubbleCount = 42;
  for (let i = 0; i < bubbleCount; i++) {
    // Seeded pseudo-positions
    const rxRatio = ((i * 37) % 100) / 100;
    const ryRatio = ((i * 61) % 100) / 100;
    const bx = 80 + rxRatio * (width - 160);
    const by = matTopY + 28 + ryRatio * (matThickness - 55);

    // Subtle breathing pulse and micro-wobble
    const pulse = 1 + Math.sin(t * 3.5 + i) * 0.15;
    const radius = (5 + (i % 5) * 2.5) * pulse;

    // Glowing pearl/gas bubble gradient
    const bGrad = ctx.createRadialGradient(bx - radius * 0.3, by - radius * 0.3, radius * 0.2, bx, by, radius);
    bGrad.addColorStop(0, '#ffffff');
    bGrad.addColorStop(0.5, '#e6f7ff');
    bGrad.addColorStop(0.85, '#a5d8ea');
    bGrad.addColorStop(1, 'rgba(80, 160, 180, 0.4)');

    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.arc(bx, by, radius, 0, Math.PI * 2);
    ctx.fill();

    // Outer soft glow
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // Occasional escaped floating bubble rising to surface
  for (let i = 0; i < 4; i++) {
    const bubbleLife = (t * 25 + i * 35) % 150;
    const ex = 140 + i * 120 + Math.sin(bubbleLife * 0.1) * 12;
    const ey = matTopY - bubbleLife * 0.3;
    if (ey > waterSurfaceY) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(ex, ey, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function renderGrassAndVegetation(ctx: CanvasRenderingContext2D, width: number, height: number, t: number) {
  const waterSurfaceY = height * 0.42;
  const floatOffset = Math.sin(t * 1.8) * 5;
  const matTopY = waterSurfaceY - 38 + floatOffset;

  // Island Top Sward Soil Strip
  ctx.fillStyle = '#2f4f22';
  ctx.beginPath();
  ctx.ellipse(width / 2, matTopY + 6, width * 0.43, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dense waving green grass tufts on top of the island
  const bladeCount = 95;
  for (let i = 0; i < bladeCount; i++) {
    const gx = 65 + (i / bladeCount) * (width - 130);
    const gy = matTopY + 8 + Math.sin(i * 0.5) * 4;
    const bladeHeight = 35 + ((i * 13) % 40);
    const windSway = Math.sin(t * 2.2 + i * 0.3) * 12;

    const bladeGrad = ctx.createLinearGradient(gx, gy, gx + windSway, gy - bladeHeight);
    bladeGrad.addColorStop(0, '#2d5a27');
    bladeGrad.addColorStop(0.5, '#4e8a38');
    bladeGrad.addColorStop(1, '#82c94a');

    ctx.strokeStyle = bladeGrad;
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.quadraticCurveTo(gx + windSway * 0.4, gy - bladeHeight * 0.6, gx + windSway, gy - bladeHeight);
    ctx.stroke();
  }
}

function renderHutsAndBoats(ctx: CanvasRenderingContext2D, width: number, height: number, t: number) {
  const waterSurfaceY = height * 0.42;
  const floatOffset = Math.sin(t * 1.8) * 5;
  const matTopY = waterSurfaceY - 38 + floatOffset;

  // Two Traditional Thatched Fisherman Huts on the island
  const huts = [
    { x: 170, scale: 0.95 },
    { x: 530, scale: 0.85 },
  ];

  huts.forEach((hut) => {
    const hx = hut.x;
    const hy = matTopY - 4;
    const s = hut.scale;

    // Hut wall (Bamboo / clay)
    ctx.fillStyle = '#9b7b56';
    ctx.strokeStyle = '#5a422d';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.rect(hx - 36 * s, hy - 40 * s, 72 * s, 40 * s);
    ctx.fill();
    ctx.stroke();

    // Wooden door
    ctx.fillStyle = '#402a18';
    ctx.fillRect(hx - 10 * s, hy - 30 * s, 20 * s, 30 * s);

    // Thatched triangular roof (Straw / reeds)
    ctx.fillStyle = '#c89d58';
    ctx.strokeStyle = '#694d22';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(hx, hy - 85 * s);
    ctx.lineTo(hx + 48 * s, hy - 38 * s);
    ctx.lineTo(hx - 48 * s, hy - 38 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Thatch roof texture lines
    ctx.strokeStyle = '#9e7535';
    ctx.lineWidth = 1.8;
    for (let r = 0; r < 4; r++) {
      const ry = hy - 45 * s - r * 10 * s;
      ctx.beginPath();
      ctx.moveTo(hx - (38 - r * 8) * s, ry);
      ctx.lineTo(hx + (38 - r * 8) * s, ry);
      ctx.stroke();
    }
  });

  // Fisherman in wooden canoe boat (Scene 4: Flip test or regular patrol)
  const isFlipScene = t >= 24 && t <= 31;
  const canoeX = width * 0.76;
  let canoeY = waterSurfaceY - 8;
  let canoeAngle = Math.sin(t * 2) * 0.05;
  let fishermanOffset = 0;

  if (isFlipScene) {
    const flipProgress = (t - 24) / 7;
    if (flipProgress > 0.4 && flipProgress < 0.85) {
      // Fisherman falls into water!
      canoeAngle = 0.5;
      fishermanOffset = (flipProgress - 0.4) * 140;
    }
  }

  ctx.save();
  ctx.translate(canoeX, canoeY);
  ctx.rotate(canoeAngle);

  // Wooden Canoe
  ctx.fillStyle = '#5c3a21';
  ctx.strokeStyle = '#382010';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-60, 6);
  ctx.quadraticCurveTo(0, 22, 60, 6);
  ctx.quadraticCurveTo(0, 10, -60, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Fisherman Figure
  if (fishermanOffset < 60) {
    // Body & conical hat in boat
    const fx = 0;
    const fy = -18 + fishermanOffset;

    // Conical Straw Hat
    ctx.fillStyle = '#dab579';
    ctx.strokeStyle = '#85632e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fx, fy - 36);
    ctx.lineTo(fx + 22, fy - 22);
    ctx.lineTo(fx - 22, fy - 22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Torso (Blue tunic)
    ctx.fillStyle = '#2b5876';
    ctx.fillRect(fx - 8, fy - 20, 16, 20);

    // Paddle pole
    ctx.strokeStyle = '#8c6239';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fx - 15, fy - 25);
    ctx.lineTo(fx + 25, fy + 22);
    ctx.stroke();
  } else {
    // Splash particles if fallen
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (let p = 0; p < 8; p++) {
      ctx.beginPath();
      ctx.arc(p * 8 - 30, 15 + Math.sin(t * 15 + p) * 12, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function renderDeerHerd(ctx: CanvasRenderingContext2D, width: number, height: number, t: number) {
  const waterSurfaceY = height * 0.42;
  const floatOffset = Math.sin(t * 1.8) * 5;
  const matTopY = waterSurfaceY - 38 + floatOffset;

  // 3 Sangai Deer with natural walk cycle
  const deers = [
    { x: 260, y: matTopY - 2, scale: 0.95, isBuck: true },
    { x: 350, y: matTopY - 4, scale: 0.88, isBuck: true },
    { x: 430, y: matTopY, scale: 0.82, isBuck: false },
  ];

  deers.forEach((deer, idx) => {
    // Natural horizontal stroll across the island
    const walkSpeed = 18;
    const deerX = ((deer.x + t * walkSpeed + idx * 70) % (width - 240)) + 120;
    const deerY = deer.y;
    const s = deer.scale;

    // Walk cycle phase
    const walkPhase = t * 6 + idx * 1.5;
    const legFront1 = Math.sin(walkPhase) * 16 * s;
    const legFront2 = Math.sin(walkPhase + Math.PI) * 16 * s;
    const legBack1 = Math.sin(walkPhase + 0.8) * 14 * s;
    const legBack2 = Math.sin(walkPhase + Math.PI + 0.8) * 14 * s;
    const headBob = Math.sin(t * 3 + idx) * 3 * s;

    ctx.save();
    ctx.translate(deerX, deerY);

    // Deer Shadow on grass
    ctx.fillStyle = 'rgba(20, 45, 15, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 32 * s, 8 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Back Legs
    ctx.strokeStyle = '#6b4324';
    ctx.lineWidth = 4.5 * s;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(18 * s, -28 * s);
    ctx.lineTo(24 * s + legBack2, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-18 * s, -28 * s);
    ctx.lineTo(-14 * s + legFront2, 0);
    ctx.stroke();

    // Deer Body (Warm golden brown)
    ctx.fillStyle = '#8f572a';
    ctx.strokeStyle = '#4e2d14';
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath();
    ctx.ellipse(0, -32 * s, 30 * s, 16 * s, -0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Tail
    const tailWag = Math.sin(t * 8 + idx) * 4;
    ctx.beginPath();
    ctx.moveTo(-28 * s, -35 * s);
    ctx.lineTo(-38 * s, -42 * s + tailWag);
    ctx.stroke();

    // Front Legs
    ctx.strokeStyle = '#7c4820';
    ctx.lineWidth = 4.5 * s;

    ctx.beginPath();
    ctx.moveTo(18 * s, -28 * s);
    ctx.lineTo(20 * s + legBack1, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-16 * s, -28 * s);
    ctx.lineTo(-20 * s + legFront1, 0);
    ctx.stroke();

    // Neck & Head
    ctx.fillStyle = '#8f572a';
    ctx.beginPath();
    ctx.moveTo(16 * s, -38 * s);
    ctx.lineTo(32 * s, -58 * s + headBob);
    ctx.lineTo(24 * s, -62 * s + headBob);
    ctx.lineTo(10 * s, -38 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Head muzzle
    ctx.beginPath();
    ctx.ellipse(32 * s, -60 * s + headBob, 10 * s, 7 * s, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eye
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(32 * s, -62 * s + headBob, 2 * s, 0, Math.PI * 2);
    ctx.fill();

    // Distinctive Sangai Antlers (Brow-antlered deer - curved forward & crowned)
    if (deer.isBuck) {
      ctx.strokeStyle = '#e2c8a2';
      ctx.lineWidth = 3 * s;
      ctx.lineCap = 'round';

      // Left antler main beam
      ctx.beginPath();
      ctx.moveTo(27 * s, -66 * s + headBob);
      ctx.quadraticCurveTo(18 * s, -85 * s + headBob, 25 * s, -100 * s + headBob);
      ctx.stroke();

      // Brow tine (pointing forward over forehead)
      ctx.beginPath();
      ctx.moveTo(27 * s, -66 * s + headBob);
      ctx.quadraticCurveTo(38 * s, -72 * s + headBob, 46 * s, -70 * s + headBob);
      ctx.stroke();

      // Crown forks
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.moveTo(24 * s, -95 * s + headBob);
      ctx.lineTo(34 * s, -108 * s + headBob);
      ctx.stroke();
    }

    ctx.restore();
  });
}

function renderRainStorm(ctx: CanvasRenderingContext2D, width: number, height: number, t: number) {
  // Heavy Monsoon Rain Streaks
  ctx.strokeStyle = 'rgba(210, 235, 255, 0.45)';
  ctx.lineWidth = 1.8;
  const drops = 90;

  for (let i = 0; i < drops; i++) {
    const rx = ((i * 47 + t * 450) % (width + 60)) - 30;
    const ry = (i * 31 + t * 900) % height;
    const len = 28 + (i % 15);

    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 8, ry + len);
    ctx.stroke();
  }

  // Water surface rain splash rings
  const waterSurfaceY = height * 0.42;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1.2;
  for (let r = 0; r < 6; r++) {
    const sx = 60 + ((r * 110 + t * 80) % (width - 120));
    const sy = waterSurfaceY + ((r * 40) % 25);
    const ringR = (t * 20 + r * 5) % 18;
    ctx.beginPath();
    ctx.ellipse(sx, sy, ringR, ringR * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function renderScientificIndicators(
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number, 
  t: number, 
  language: 'ar' | 'hi' | 'en'
) {
  const waterSurfaceY = height * 0.42;

  // Scene 5: Iceberg & 2m Depth Indicator (31s - 38s)
  if (t >= 31 && t <= 38) {
    const rulerX = width - 85;
    const topY = waterSurfaceY - 35;
    const botY = topY + 190;

    // Measurement Bracket
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rulerX - 15, topY);
    ctx.lineTo(rulerX, topY);
    ctx.lineTo(rulerX, botY);
    ctx.lineTo(rulerX - 15, botY);
    ctx.stroke();

    // 2-Meter Badge
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.roundRect(rulerX - 55, (topY + botY) / 2 - 16, 75, 32, 8);
    ctx.fill();

    ctx.fillStyle = '#111';
    ctx.font = 'bold 15px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('~2m', rulerX - 18, (topY + botY) / 2);

    // 80% submerged indicator
    ctx.fillStyle = 'rgba(255, 209, 102, 0.2)';
    ctx.fillRect(80, waterSurfaceY, width - 200, 150);
    ctx.strokeStyle = '#ffd166';
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(80, waterSurfaceY, width - 200, 150);
    ctx.setLineDash([]);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Cairo, sans-serif';
    ctx.fillText(
      language === 'ar' ? '80% من الجزيرة غاطس كالجبل الجليدي' : '80% Submerged like an iceberg',
      width / 2 - 20,
      waterSurfaceY + 75
    );
  }

  // Scene 9: Sangai Population Counter (59s - 72s)
  if (t >= 59 && t <= 72) {
    const counterProgress = Math.min(1, Math.max(0, (t - 61) / 5));
    const currentYear = Math.floor(1975 + counterProgress * (2016 - 1975));
    const currentCount = Math.floor(14 + counterProgress * (260 - 14));

    ctx.save();
    ctx.translate(width / 2, 180);

    // HUD Counter Box
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-150, -45, 300, 90, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 14px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      language === 'ar' ? 'تعداد غزلان السانغاي المهددة بالانقراض' : 'Endangered Sangai Deer Count',
      0,
      -18
    );

    // Glowing Number
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 36px Lalezar, Cairo, monospace';
    ctx.fillText(`${currentYear}: ${currentCount}`, 0, 22);

    ctx.restore();
  }
}

function renderSatelliteView(
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number, 
  t: number,
  language: 'ar' | 'hi' | 'en'
) {
  // Aerial lake background (dark deep emerald satellite view)
  const satGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width * 0.8);
  satGrad.addColorStop(0, '#1a4b41');
  satGrad.addColorStop(0.5, '#133a32');
  satGrad.addColorStop(1, '#0c241f');
  ctx.fillStyle = satGrad;
  ctx.fillRect(0, 0, width, height);

  // Water ripple texture
  ctx.strokeStyle = 'rgba(120, 200, 175, 0.15)';
  ctx.lineWidth = 1.5;
  for (let r = 0; r < 12; r++) {
    ctx.beginPath();
    ctx.arc(width / 2 + Math.sin(r) * 100, height / 2 + Math.cos(r) * 120, 80 + r * 35, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Giant Main Floating National Park Island (40 sq km)
  ctx.save();
  ctx.translate(width / 2, height * 0.42);

  // Main Phumdi Ring
  ctx.fillStyle = '#3a6c38';
  ctx.strokeStyle = '#5a9b57';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 180, 140, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Interior Lagoon & Vegetation textures
  ctx.fillStyle = '#224f21';
  ctx.beginPath();
  ctx.ellipse(-20, -10, 120, 85, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Circular Traditional Phumdi Rings (Athaphum)
  const rings = [
    { x: -160, y: -220, r: 42 },
    { x: 170, y: -200, r: 50 },
    { x: -180, y: 190, r: 55 },
    { x: 160, y: 210, r: 46 },
    { x: 0, y: 260, r: 60 },
  ];

  rings.forEach((ring) => {
    ctx.strokeStyle = '#62ab5f';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(34, 79, 33, 0.5)';
    ctx.fill();
  });

  // Satellite HUD Crosshair & Targeting Reticle
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.85)';
  ctx.lineWidth = 2.5;

  // Bracket Corners
  const bw = 150;
  const bh = 110;
  // Top Left
  ctx.beginPath();
  ctx.moveTo(-bw, -bh + 30);
  ctx.lineTo(-bw, -bh);
  ctx.lineTo(-bw + 30, -bh);
  ctx.stroke();
  // Top Right
  ctx.beginPath();
  ctx.moveTo(bw, -bh + 30);
  ctx.lineTo(bw, -bh);
  ctx.lineTo(bw - 30, -bh);
  ctx.stroke();
  // Bottom Left
  ctx.beginPath();
  ctx.moveTo(-bw, bh - 30);
  ctx.lineTo(-bw, bh);
  ctx.lineTo(-bw + 30, bh);
  ctx.stroke();
  // Bottom Right
  ctx.beginPath();
  ctx.moveTo(bw, bh - 30);
  ctx.lineTo(bw, bh);
  ctx.lineTo(bw - 30, bh);
  ctx.stroke();

  // 40 km² Metric Label
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.beginPath();
  ctx.roundRect(-100, -bh - 40, 200, 48, 12);
  ctx.fill();
  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#4ade80';
  ctx.font = '900 24px Lalezar, Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(language === 'ar' ? '~40 كم² مساحة' : '~40 km² Area', 0, -bh - 16);

  ctx.restore();

  // Satellite Metadata Overlay
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'bold 14px Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    language === 'ar' ? 'الحديقة الوطنية العائمة الوحيدة في كوكب الأرض' : 'World\'s Only Floating National Park',
    width / 2,
    height * 0.76
  );
  ctx.font = '12px monospace';
  ctx.fillStyle = '#a7f3d0';
  ctx.fillText('LOC: 24.5000° N, 93.8333° E • KEIBUL LAMJAO', width / 2, height * 0.79);
}

function renderKineticCaptions(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  t: number,
  activeScene?: VideoScene,
  language?: 'ar' | 'hi' | 'en'
) {
  if (!activeScene || !activeScene.captionWords || activeScene.captionWords.length === 0) return;

  const captionY = height * 0.77;

  // Find active word based on time
  const words = activeScene.captionWords;
  const sceneT = t - activeScene.timeStart;
  const wordDuration = (activeScene.timeEnd - activeScene.timeStart) / words.length;
  const currentWordIndex = Math.min(words.length - 1, Math.floor(sceneT / wordDuration));
  const activeWord = words[currentWordIndex];

  if (!activeWord) return;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Text Shadow & Glow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  // Active word font: bold, impact, dynamic pop
  ctx.font = '900 52px Lalezar, Cairo, sans-serif';

  // Outline stroke
  ctx.strokeStyle = '#051b14';
  ctx.lineWidth = 8;
  ctx.lineJoin = 'round';
  ctx.strokeText(activeWord.text, width / 2, captionY);

  // Fill: bright yellow-gold or glowing cyan
  ctx.fillStyle = activeWord.highlight ? '#ffd166' : '#ffffff';
  ctx.fillText(activeWord.text, width / 2, captionY);

  ctx.restore();
}

function renderFloatingLabels(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  activeScene: VideoScene,
  language: 'ar' | 'hi' | 'en',
  t: number
) {
  activeScene.labels.forEach((label) => {
    const lx = (label.x / 100) * width;
    const ly = (label.y / 100) * height + Math.sin(t * 3) * 3;
    const text = language === 'ar' ? label.textAr : label.text;

    ctx.save();
    ctx.font = 'bold 15px Cairo, Tajawal, sans-serif';
    const textMetrics = ctx.measureText(text);
    const boxW = textMetrics.width + 24;
    const boxH = 34;

    // Pill background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(lx - boxW / 2, ly - boxH / 2, boxW, boxH, 17);
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, lx, ly);

    ctx.restore();
  });
}

function renderSafeZones(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  // Safe margins for 9:16 Shorts/Reels/TikTok
  // Safe zone: x: 60 - 660, y: 140 - 1050
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);

  // Safe area border
  ctx.strokeRect(40, 120, width - 80, height - 260);

  // Platform UI obstruction guides (Top & Bottom & Right Sidebar)
  ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
  // Top notch/bar
  ctx.fillRect(0, 0, width, 120);
  // Bottom caption & sound title area
  ctx.fillRect(0, height - 160, width, 160);
  // Right action buttons (Like, Comment, Share)
  ctx.fillRect(width - 90, height * 0.45, 90, height * 0.4);

  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('9:16 SHORTS SAFE AREA', 50, 140);
  ctx.fillText('REELS UI BUTTONS', width - 85, height * 0.48);

  ctx.restore();
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function renderSceneTransitionEffect(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  factor: number,
  type: TransitionType,
  t: number,
  activeScene?: VideoScene,
  language?: 'ar' | 'hi' | 'en',
  showBadge?: boolean
) {
  if (factor <= 0.005 || type === 'none') return;

  ctx.save();

  if (type === 'dissolve') {
    // 1. Smooth Cinematic Film Dissolve
    // Soft atmospheric gradient vignette with luminance feathering
    const alpha = Math.min(0.92, factor * 0.95);
    const grad = ctx.createRadialGradient(
      width / 2, height / 2, width * 0.15,
      width / 2, height / 2, width * 0.9
    );
    grad.addColorStop(0, `rgba(5, 27, 20, ${alpha * 0.85})`);
    grad.addColorStop(0.5, `rgba(8, 22, 18, ${alpha * 0.92})`);
    grad.addColorStop(1, `rgba(2, 10, 8, ${alpha * 0.98})`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle golden/emerald micro-sheen across center
    ctx.fillStyle = `rgba(216, 243, 220, ${factor * 0.16})`;
    ctx.fillRect(0, height * 0.35, width, height * 0.3);

  } else if (type === 'light-leak') {
    // 2. Optical Lens Flare / Light Leak
    ctx.globalCompositeOperation = 'screen';
    const streakProgress = (Math.sin(t * 8) + 1) * 0.5;
    const streakX = width * (0.2 + streakProgress * 0.6);

    // Warm golden amber anamorphic horizontal flare
    const flareGrad = ctx.createLinearGradient(0, height * 0.35, width, height * 0.65);
    flareGrad.addColorStop(0, `rgba(255, 180, 50, ${factor * 0.7})`);
    flareGrad.addColorStop(0.4, `rgba(255, 225, 120, ${factor * 0.9})`);
    flareGrad.addColorStop(0.7, `rgba(74, 222, 128, ${factor * 0.6})`);
    flareGrad.addColorStop(1, `rgba(56, 189, 248, ${factor * 0.4})`);

    ctx.fillStyle = flareGrad;
    ctx.fillRect(0, 0, width, height);

    // Radial center beam
    const beam = ctx.createRadialGradient(streakX, height * 0.45, 10, streakX, height * 0.45, width * 0.7);
    beam.addColorStop(0, `rgba(255, 255, 240, ${factor * 0.85})`);
    beam.addColorStop(0.3, `rgba(255, 210, 100, ${factor * 0.5})`);
    beam.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = beam;
    ctx.fillRect(0, 0, width, height);

  } else if (type === 'iris') {
    // 3. Film Iris / Circular Aperture Wipe
    const maxRadius = Math.sqrt(width * width + height * height) * 0.55;
    const currentRadius = maxRadius * (1 - factor * 0.85);

    ctx.fillStyle = 'rgba(2, 9, 7, 0.94)';
    ctx.beginPath();
    // Inverted circle mask using evenodd rule
    ctx.rect(0, 0, width, height);
    ctx.arc(width / 2, height / 2, Math.max(0, currentRadius), 0, Math.PI * 2, true);
    ctx.fill();

    // Iris soft glowing border ring
    ctx.strokeStyle = `rgba(16, 185, 129, ${factor * 0.8})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, Math.max(0, currentRadius), 0, Math.PI * 2);
    ctx.stroke();

  } else if (type === 'black-dip') {
    // 4. Classic Film Black Dip
    const dipAlpha = Math.min(0.96, Math.pow(factor, 1.2) * 0.96);
    ctx.fillStyle = `rgba(3, 7, 6, ${dipAlpha})`;
    ctx.fillRect(0, 0, width, height);

  } else if (type === 'motion-glide') {
    // 5. Motion Parallax Glide with Directional Blur Lines
    ctx.fillStyle = `rgba(5, 20, 16, ${factor * 0.65})`;
    ctx.fillRect(0, 0, width, height);

    // Directional speed lines
    ctx.strokeStyle = `rgba(167, 243, 208, ${factor * 0.45})`;
    ctx.lineWidth = 2.5;
    const lineCount = 18;
    for (let i = 0; i < lineCount; i++) {
      const ly = (i / lineCount) * height + Math.sin(t * 12 + i) * 15;
      const lx = (i % 2 === 0 ? 0 : width * 0.3);
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + width * 0.7, ly - 4);
      ctx.stroke();
    }
  }

  // Elegant On-Screen Scene Transition Badge at peak of transition
  if (showBadge && factor > 0.4 && activeScene) {
    const badgeY = height * 0.48;
    const badgeText = language === 'ar' 
      ? `المشهد ${activeScene.id} • ${activeScene.titleAr}`
      : `Scene ${activeScene.id} • ${activeScene.title}`;

    ctx.font = 'bold 22px Cairo, sans-serif';
    const textWidth = ctx.measureText(badgeText).width;
    const boxWidth = textWidth + 48;
    const boxHeight = 52;

    ctx.save();
    ctx.translate(width / 2, badgeY);
    ctx.scale(0.9 + factor * 0.1, 0.9 + factor * 0.1);

    // Pill badge background with emerald glow
    ctx.shadowColor = 'rgba(16, 185, 129, 0.4)';
    ctx.shadowBlur = 18;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, 26);
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, 0, 0);

    ctx.restore();
  }

  ctx.restore();
}

// ==========================================
// 1. COLOSSEUM 2D VECTOR CUTOUT STYLE (from cartoon-studio)
// ==========================================
function renderColosseum2DScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  t: number,
  language: 'ar' | 'hi' | 'en',
  camScale: number,
  camY: number
) {
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(camScale, camScale);
  ctx.translate(-width / 2, -height / 2 + camY);

  // Background: Deep Roman Vault Chamber with Torchlight Vignette
  const bgGrad = ctx.createRadialGradient(
    width / 2, height * 0.45, 80,
    width / 2, height * 0.45, width * 0.85
  );
  const flicker = Math.sin(t * 12) * 0.05 + Math.cos(t * 18) * 0.03;
  bgGrad.addColorStop(0, '#5a3018');
  bgGrad.addColorStop(0.4, '#381c0e');
  bgGrad.addColorStop(0.85, '#1e0f07');
  bgGrad.addColorStop(1, '#0e0603');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Upper Colosseum Arena Sand Floor Strip
  const sandY = height * 0.32;
  ctx.fillStyle = '#caa368';
  ctx.fillRect(0, sandY - 25, width, 25);
  ctx.strokeStyle = '#1e130c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, sandY);
  ctx.lineTo(width, sandY);
  ctx.stroke();

  // Arena Pillars & Arches
  ctx.fillStyle = '#2b160b';
  for (let i = 0; i < 4; i++) {
    const ax = 50 + i * 190;
    ctx.fillRect(ax - 20, sandY, 40, height * 0.45);
    // Arch curve
    ctx.beginPath();
    ctx.arc(ax + 75, sandY + 40, 55, Math.PI, 0);
    ctx.strokeStyle = '#4a2814';
    ctx.lineWidth = 6;
    ctx.stroke();
  }

  // Torches on pillars with animated flame particles
  for (let i = 0; i < 3; i++) {
    const tx = 140 + i * 220;
    const ty = sandY + 110;
    // Sconce bracket
    ctx.fillStyle = '#111';
    ctx.fillRect(tx - 6, ty, 12, 28);
    // Torch Flame
    const flameH = 30 + Math.sin(t * 16 + i) * 6;
    const flameGrad = ctx.createRadialGradient(tx, ty - 10, 2, tx, ty - 10, 22);
    flareGradColor(flameGrad, flicker);
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.ellipse(tx, ty - 12, 14, flameH * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Animated Roman Clay Jars (VINVM, ACETVM, SANGVIS) with spring-pop
  const jars = [
    { x: 180, label: 'VINVM', color: '#c46835', bounce: Math.sin(t * 4) * 6 },
    { x: 360, label: 'SANGVIS', color: '#8b261e', bounce: Math.sin(t * 4 + 1.2) * 7 },
    { x: 540, label: 'ACETVM', color: '#a6723e', bounce: Math.sin(t * 4 + 2.4) * 6 },
  ];

  jars.forEach((jar) => {
    const jy = height * 0.68 + jar.bounce;
    ctx.save();
    ctx.translate(jar.x, jy);

    // Jar body
    ctx.fillStyle = jar.color;
    ctx.strokeStyle = '#1e130c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Neck and handles
    ctx.fillRect(-16, -55, 32, 18);
    ctx.strokeRect(-16, -55, 32, 18);

    // Label
    ctx.fillStyle = '#fcefd2';
    ctx.font = '900 13px Lalezar, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(jar.label, 0, 2);

    ctx.restore();
  });

  // 2D Vector Cutout Roman Character (Doctor / Gladiator)
  const charX = width / 2 + Math.sin(t * 2) * 25;
  const charY = height * 0.54;
  const breath = Math.sin(t * 5) * 3;

  ctx.save();
  ctx.translate(charX, charY);

  // Character shadow
  ctx.fillStyle = 'rgba(10, 5, 2, 0.5)';
  ctx.beginPath();
  ctx.ellipse(0, 75, 45, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Character Tunic Body
  ctx.fillStyle = '#b83b28';
  ctx.strokeStyle = '#1e130c';
  ctx.lineWidth = 4.5;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-32, -10 + breath);
  ctx.lineTo(32, -10 + breath);
  ctx.lineTo(42, 60);
  ctx.lineTo(-42, 60);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Roman Laurel / Head
  ctx.fillStyle = '#e8bc8d';
  ctx.beginPath();
  ctx.arc(0, -42 + breath, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Eyes and expression
  ctx.fillStyle = '#1e130c';
  ctx.beginPath();
  ctx.arc(-9, -44 + breath, 3.5, 0, Math.PI * 2);
  ctx.arc(9, -44 + breath, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Golden Laurel wreath
  ctx.strokeStyle = '#e0a924';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(0, -52 + breath, 24, Math.PI * 0.8, Math.PI * 2.2);
  ctx.stroke();

  ctx.restore();

  // Shock radial rays if peak moment
  if (Math.sin(t * 2) > 0.6) {
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 4;
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2 + t;
      ctx.beginPath();
      ctx.moveTo(width / 2, height * 0.5);
      ctx.lineTo(width / 2 + Math.cos(angle) * width, height * 0.5 + Math.sin(angle) * width);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
}

function flareGradColor(grad: CanvasGradient, flicker: number) {
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.3, '#ffcc00');
  grad.addColorStop(0.7, '#ff5500');
  grad.addColorStop(1, 'rgba(150, 20, 0, 0)');
}

// ==========================================
// 2. ISOMETRIC DIAGRAMS & CUTAWAYS
// ==========================================
function renderIsometricScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  t: number,
  language: 'ar' | 'hi' | 'en',
  camScale: number,
  camY: number
) {
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(camScale, camScale);
  ctx.translate(-width / 2, -height / 2 + camY);

  // Dark Blueprint Technical Grid Background
  ctx.fillStyle = '#0a192f';
  ctx.fillRect(0, 0, width, height);

  // Isometric Grid Lines (30-degree angles)
  ctx.strokeStyle = 'rgba(20, 184, 166, 0.12)';
  ctx.lineWidth = 1;
  const step = 45;
  for (let x = -width; x < width * 2; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + height * 0.577, height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - height * 0.577, height);
    ctx.stroke();
  }

  // 3D Isometric Server / Undersea Node Blocks
  const nodes = [
    { x: width * 0.28, y: height * 0.55, size: 75, label: 'NODE-A (SUEZ)' },
    { x: width * 0.72, y: height * 0.45, size: 85, label: 'NODE-B (SINGAPORE)' },
    { x: width * 0.5, y: height * 0.68, size: 95, label: 'CORE REPEATER' },
  ];

  // Draw connecting fiber optic laser pulses
  ctx.save();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(nodes[0].x, nodes[0].y);
  ctx.quadraticCurveTo(width * 0.45, height * 0.48, nodes[1].x, nodes[1].y);
  ctx.lineTo(nodes[2].x, nodes[2].y);
  ctx.closePath();
  ctx.stroke();

  // Pulsing laser light packets traveling on line
  const pulsePos = (t * 1.5) % 1;
  const pX = nodes[0].x + (nodes[1].x - nodes[0].x) * pulsePos;
  const pY = nodes[0].y + (nodes[1].y - nodes[0].y) * pulsePos;
  ctx.fillStyle = '#4ade80';
  ctx.shadowColor = '#4ade80';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(pX, pY, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Draw Isometric Cubes
  nodes.forEach((node, nIdx) => {
    drawIsometricCube(ctx, node.x, node.y + Math.sin(t * 2 + nIdx) * 6, node.size, node.label);
  });

  // HUD Tech Telemetry overlay
  ctx.fillStyle = '#64748b';
  ctx.font = '11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('PROTOCOL: UNDERSEA FIBER OPTIC DWDM', 40, 160);
  ctx.fillText(`LATENCY: ${(12.4 + Math.sin(t * 5) * 1.2).toFixed(1)}ms • BANDWIDTH: 144 Tbps`, 40, 180);

  ctx.restore();
}

function drawIsometricCube(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, label: string) {
  const dx = s * 0.866;
  const dy = s * 0.5;

  // Top Face
  ctx.fillStyle = '#1e3a5f';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.lineTo(cx + dx, cy - s + dy);
  ctx.lineTo(cx, cy - s + dy * 2);
  ctx.lineTo(cx - dx, cy - s + dy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Left Face
  ctx.fillStyle = '#0f2744';
  ctx.beginPath();
  ctx.moveTo(cx - dx, cy - s + dy);
  ctx.lineTo(cx, cy - s + dy * 2);
  ctx.lineTo(cx, cy + dy);
  ctx.lineTo(cx - dx, cy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right Face
  ctx.fillStyle = '#143152';
  ctx.beginPath();
  ctx.moveTo(cx, cy - s + dy * 2);
  ctx.lineTo(cx + dx, cy - s + dy);
  ctx.lineTo(cx + dx, cy);
  ctx.lineTo(cx, cy + dy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Tech label
  ctx.fillStyle = '#a5f3fc';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, cx, cy + dy + 22);
}

// ==========================================
// 3. DARK MYSTERY & NIGHT FILE NOIR
// ==========================================
function renderNightFileScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  t: number,
  language: 'ar' | 'hi' | 'en',
  camScale: number,
  camY: number
) {
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(camScale, camScale);
  ctx.translate(-width / 2, -height / 2 + camY);

  // Pure Dark Noir Vignette Background
  ctx.fillStyle = '#05070a';
  ctx.fillRect(0, 0, width, height);

  // Swinging Overhead Spotlight Cone
  const spotAngle = Math.sin(t * 1.2) * 0.15;
  const spotX = width / 2 + Math.sin(t * 1.2) * 80;
  const spotY = height * 0.58;

  ctx.save();
  ctx.translate(width / 2, 40);
  ctx.rotate(spotAngle);

  // Spotlight cone beam
  const coneGrad = ctx.createRadialGradient(0, spotY - 40, 20, 0, spotY - 40, 340);
  coneGrad.addColorStop(0, 'rgba(255, 255, 230, 0.45)');
  coneGrad.addColorStop(0.5, 'rgba(240, 230, 200, 0.15)');
  coneGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = coneGrad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-240, height);
  ctx.lineTo(240, height);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Classified Evidence Case File Folder
  ctx.save();
  ctx.translate(width / 2, height * 0.58);

  // Folder cardboard
  ctx.fillStyle = '#8a7155';
  ctx.strokeStyle = '#423423';
  ctx.lineWidth = 3;
  ctx.fillRect(-140, -90, 280, 180);
  ctx.strokeRect(-140, -90, 280, 180);

  // Redacted paper document
  ctx.fillStyle = '#f5f0e6';
  ctx.fillRect(-120, -75, 240, 150);

  // Black redacted text bars
  ctx.fillStyle = '#111';
  for (let r = 0; r < 5; r++) {
    const barW = 120 + ((r * 37) % 80);
    ctx.fillRect(-105, -55 + r * 22, barW, 9);
  }

  // Glowing Crimson Stamp: "CLASSIFIED / سري للغاية"
  ctx.save();
  ctx.rotate(-0.2);
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 4;
  ctx.strokeRect(-90, -15, 180, 42);

  ctx.fillStyle = '#ef4444';
  ctx.font = '900 20px Lalezar, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(language === 'ar' ? 'سري للغاية • غير محلول' : 'TOP SECRET • UNRESOLVED', 0, 8);
  ctx.restore();

  ctx.restore();

  // Typewriter Date HUD overlay at top
  ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CASE FILE: FLANNAN ISLES • 1900-12-15 • 04:00 AM', width / 2, 170);

  ctx.restore();
}
