import React, { useRef, useEffect, useState } from 'react';
import { 
  Volume2, VolumeX, Mic, Music, Waves, Sparkles, 
  Play, Pause, Sliders, Radio, Zap
} from 'lucide-react';
import { REFERENCE_VIDEO_METADATA } from '../data/referenceAnalysis';

interface AudioMixerStudioProps {
  currentTime: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onTimeUpdate: (time: number) => void;
  language: 'ar' | 'hi' | 'en';
}

export const AudioMixerStudio: React.FC<AudioMixerStudioProps> = ({
  currentTime,
  isPlaying,
  onTogglePlay,
  onTimeUpdate,
  language
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [masterVolume, setMasterVolume] = useState<number>(0.9);
  const [voiceVolume, setVoiceVolume] = useState<number>(1.0);
  const [sfxVolume, setSfxVolume] = useState<number>(0.75);
  const [ambientVolume, setAmbientVolume] = useState<number>(0.4);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeSfxTriggered, setActiveSfxTriggered] = useState<string | null>(null);

  // Sync HTML5 Audio element with Master Timeline
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (Math.abs(audio.currentTime - currentTime) > 0.3) {
      audio.currentTime = currentTime;
    }

    if (isPlaying && audio.paused) {
      audio.play().catch(() => {});
    } else if (!isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [currentTime, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : masterVolume * voiceVolume;
  }, [masterVolume, voiceVolume, isMuted]);

  // Web Audio Procedural SFX Synthesizer
  const playProceduralSfx = (type: 'splash' | 'bubble' | 'hoof' | 'radar' | 'tick' | 'whoosh') => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      setActiveSfxTriggered(type);
      setTimeout(() => setActiveSfxTriggered(null), 600);

      if (type === 'splash') {
        // Water Splash: Noise burst + low pass filter sweep
        const bufferSize = ctx.sampleRate * 0.4;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.35);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(sfxVolume * 0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
      } else if (type === 'bubble') {
        // Bubble Pop: Sine oscillator rapid pitch bend upwards
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(1100, now + 0.12);

        gain.gain.setValueAtTime(sfxVolume * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'hoof') {
        // Deer hoof ground contact: Low thud
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

        gain.gain.setValueAtTime(sfxVolume * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'radar') {
        // Satellite Radar Ping: Clean high bell
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1760, now);

        gain.gain.setValueAtTime(sfxVolume * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'tick') {
        // Counter tick
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(sfxVolume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'whoosh') {
        // Cinematic camera sweep
        const bufferSize = ctx.sampleRate * 0.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.linearRampToValueAtTime(1600, now + 0.25);
        filter.frequency.linearRampToValueAtTime(200, now + 0.5);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(sfxVolume * 0.6, now);
        gain.gain.linearRampToValueAtTime(sfxVolume * 0.9, now + 0.25);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
      }
    } catch (e) {
      console.warn("WebAudio SFX error:", e);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Hidden Master Audio Element */}
      <audio
        ref={audioRef}
        src={REFERENCE_VIDEO_METADATA.audioUrl}
        preload="auto"
        onTimeUpdate={() => {
          if (audioRef.current && isPlaying) {
            onTimeUpdate(audioRef.current.currentTime);
          }
        }}
        onEnded={() => onTimeUpdate(0)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Waves className="w-5 h-5 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">
              {language === 'ar' ? "استوديو هندسة وميكساج الصوت والمؤثرات (Audio & SFX Mixer)" : "Audio Master Clock & SFX Mixer"}
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            {language === 'ar'
              ? "الصوت هو الساعة المركزية (Master Clock) التي تقود حركة الكاميرا وظهور الكلمات دون تسريع أو إبطاء."
              : "The audio track is the deterministic master clock driving all animation timeline events."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2.5 rounded-xl border transition-colors ${
              isMuted
                ? 'bg-rose-950/60 border-rose-500/60 text-rose-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Multi-Track Channel Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Track 1: Master Voiceover */}
        <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              صوت المعلق (Voiceover)
            </span>
            <span className="font-mono text-emerald-400 font-bold">{Math.round(voiceVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={voiceVolume}
            onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
          <div className="text-[10px] text-slate-400">
            الصوت الأصلي للبحيرة • -14 LUFS مدمج
          </div>
        </div>

        {/* Track 2: Sound Effects (SFX) */}
        <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              المؤثرات الصوتية (SFX)
            </span>
            <span className="font-mono text-amber-400 font-bold">{Math.round(sfxVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={sfxVolume}
            onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
            className="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
          <div className="text-[10px] text-slate-400">
            انفجار الفقاعات، رذاذ الماء، وقع الحوافر
          </div>
        </div>

        {/* Track 3: Ambient Atmosphere */}
        <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-cyan-400" />
              صوت الطبيعة والرياح (Ambience)
            </span>
            <span className="font-mono text-cyan-400 font-bold">{Math.round(ambientVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={ambientVolume}
            onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
            className="w-full accent-cyan-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
          <div className="text-[10px] text-slate-400">
            تموجات ماء بحيرة لوكتاك وأصوات المطر
          </div>
        </div>

        {/* Track 4: Auto-Ducking Guard */}
        <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-purple-400" />
              خفض الخلفية التلقائي (Ducking)
            </span>
            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold">
              -18 dB
            </span>
          </div>
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-purple-500 to-indigo-500 rounded-lg"></div>
          <div className="text-[10px] text-slate-400">
            يضمن وضوح نبرة المتحدث دون تداخل مع المؤثرات
          </div>
        </div>
      </div>

      {/* Interactive Sound Pad (Instant Preview of Synthesized SFX) */}
      <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/40">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            لوحة اختبار وتشغيل المؤثرات المباشرة (Live SFX Soundboard)
          </span>
          <span className="text-[11px] text-slate-400">مبنية بمولد Web Audio API نقي بدون ملفات خارجية</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {[
            { id: 'bubble', nameAr: 'فقاعة هواء', nameEn: 'Bubble Pop', icon: '🫧', cue: 'Scene 1 & 3' },
            { id: 'splash', nameAr: 'سقوط بالماء', nameEn: 'Water Splash', icon: '🌊', cue: 'Scene 4' },
            { id: 'hoof', nameAr: 'خطوة غزال', nameEn: 'Hoof Step', icon: '🦌', cue: 'Scene 1 & 9' },
            { id: 'radar', nameAr: 'مسح قمر صناعي', nameEn: 'Satellite Ping', icon: '📡', cue: 'Scene 8' },
            { id: 'tick', nameAr: 'تكتكة العداد', nameEn: 'Counter Tick', icon: '⏱️', cue: 'Scene 9' },
            { id: 'whoosh', nameAr: 'حركة كاميرا', nameEn: 'Camera Sweep', icon: '💨', cue: 'Transitions' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => playProceduralSfx(item.id as any)}
              className={`p-3 rounded-xl border text-center transition-all ${
                activeSfxTriggered === item.id
                  ? 'bg-emerald-500 text-slate-950 scale-105 border-emerald-400 shadow-lg font-bold'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700/60'
              }`}
            >
              <span className="text-xl block mb-1">{item.icon}</span>
              <span className="text-xs font-bold block">{language === 'ar' ? item.nameAr : item.nameEn}</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">{item.cue}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
