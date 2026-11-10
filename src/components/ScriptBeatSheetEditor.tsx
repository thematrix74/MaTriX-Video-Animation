import React, { useState } from 'react';
import { VideoScene, ScriptTemplate } from '../types';
import { ADDITIONAL_PROJECT_TEMPLATES, REFERENCE_SCENES } from '../data/referenceAnalysis';
import { 
  FileText, Plus, Sparkles, Download, Edit3, Check, 
  Trash2, Copy, Film, Compass, Languages, ChevronDown
} from 'lucide-react';

interface ScriptBeatSheetEditorProps {
  currentScenes: VideoScene[];
  onUpdateScenes: (scenes: VideoScene[]) => void;
  onSelectScene: (scene: VideoScene) => void;
  activeSceneId: number;
  language: 'ar' | 'hi' | 'en';
}

export const ScriptBeatSheetEditor: React.FC<ScriptBeatSheetEditorProps> = ({
  currentScenes,
  onUpdateScenes,
  onSelectScene,
  activeSceneId,
  language
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('phumdi-loktak');
  const [editingSceneId, setEditingSceneId] = useState<number | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Load a preset template
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = ADDITIONAL_PROJECT_TEMPLATES.find((t) => t.id === templateId);
    if (template && template.scenes.length > 0) {
      onUpdateScenes(template.scenes);
    }
  };

  // Export as SRT subtitles
  const exportSRT = () => {
    let srtContent = '';
    currentScenes.forEach((scene, index) => {
      const startMs = scene.timeStart * 1000;
      const endMs = scene.timeEnd * 1000;
      const startFormatted = formatSrtTime(startMs);
      const endFormatted = formatSrtTime(endMs);
      const text = language === 'ar' ? scene.narrationAr : scene.narrationHindi;

      srtContent += `${index + 1}\n${startFormatted} --> ${endFormatted}\n${text}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `explainer-captions-${language}.srt`;
    a.click();
  };

  // Export as Full Production JSON
  const exportJSON = () => {
    const data = {
      project: "Explainer Cartoon Animation Studio",
      exportedAt: new Date().toISOString(),
      language,
      scenes: currentScenes
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project-beat-sheet.json';
    a.click();
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">
              {language === 'ar' ? "محرر السيناريو وجدول اللقطات (Beat Sheet & Script)" : "Script & Beat Sheet Director"}
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            {language === 'ar'
              ? "تحويل كل فكرة إلى استعارة بصرية حية، مع ربط النصوص المتزامنة بالمؤثرات وحركة الكاميرا."
              : "Direct every narration cut, camera move, kinetic word highlights, and sound cues."}
          </p>
        </div>

        {/* Template Quick Select & Export buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedTemplateId}
            onChange={(e) => handleTemplateSelect(e.target.value)}
            className="px-3 py-2 bg-slate-800 text-xs text-white rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 font-semibold"
          >
            {ADDITIONAL_PROJECT_TEMPLATES.map((tmpl) => (
              <option key={tmpl.id} value={tmpl.id}>
                {language === 'ar' ? tmpl.titleAr : tmpl.title}
              </option>
            ))}
          </select>

          <button
            onClick={exportSRT}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>تصدير SRT</span>
          </button>

          <button
            onClick={exportJSON}
            className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير كود المشروع (JSON)</span>
          </button>
        </div>
      </div>

      {/* Beat Sheet Interactive Table */}
      <div className="overflow-x-auto">
        <div className="space-y-3 min-w-[700px]">
          {currentScenes.map((scene) => {
            const isSelected = scene.id === activeSceneId;
            const isEditing = editingSceneId === scene.id;

            return (
              <div
                key={scene.id}
                onClick={() => onSelectScene(scene)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-emerald-500/80 ring-1 ring-emerald-500/40 shadow-xl'
                    : 'bg-slate-800/40 border-slate-700/40 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/40">
                      #{scene.id}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-white">
                        {language === 'ar' ? scene.titleAr : scene.title}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-400">
                        {scene.timeStart.toFixed(1)}s → {scene.timeEnd.toFixed(1)}s (مدة: {(scene.timeEnd - scene.timeStart).toFixed(1)} ثانية)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-emerald-300 font-mono">
                      📷 {scene.cameraMode}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSceneId(isEditing ? null : scene.id);
                      }}
                      className="p-1.5 rounded-lg bg-slate-700 text-slate-300 hover:text-white hover:bg-slate-600 transition-colors"
                      title="تعديل نص المشهد"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Narration script field */}
                {isEditing ? (
                  <div className="space-y-2 mt-2" onClick={(e) => e.stopPropagation()}>
                    <textarea
                      value={scene.narrationAr}
                      onChange={(e) => {
                        const updated = currentScenes.map((s) =>
                          s.id === scene.id ? { ...s, narrationAr: e.target.value } : s
                        );
                        onUpdateScenes(updated);
                      }}
                      className="w-full p-3 bg-slate-900 text-white text-xs rounded-xl border border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      rows={2}
                      dir="rtl"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingSceneId(null)}
                        className="px-3 py-1 bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        حفظ
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 leading-relaxed font-medium bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 mb-2.5">
                    {language === 'ar' ? scene.narrationAr : scene.narrationHindi}
                  </p>
                )}

                {/* Visual Action & Kinetic Words Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 bg-slate-900/40 rounded-xl border border-slate-800 text-slate-300">
                    <span className="text-slate-500 block mb-0.5">🎬 الحدث البصري (Action):</span>
                    <span>{scene.visualAction}</span>
                  </div>

                  <div className="p-2.5 bg-slate-900/40 rounded-xl border border-slate-800 text-slate-300">
                    <span className="text-slate-500 block mb-0.5">💬 الكلمات الحركية (Kinetic Captions):</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {scene.captionWords.map((word, wIdx) => (
                        <span
                          key={wIdx}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            word.highlight
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {word.text}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function formatSrtTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = Math.floor(ms % 1000);

  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)},${pad(milliseconds, 3)}`;
}

function pad(num: number, size: number): string {
  let s = num + '';
  while (s.length < size) s = '0' + s;
  return s;
}
