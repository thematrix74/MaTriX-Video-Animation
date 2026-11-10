import React, { useState } from 'react';
import { 
  Terminal, Code2, Copy, Check, Sparkles, FolderArchive, 
  ExternalLink, Download, Cpu, PlayCircle
} from 'lucide-react';

interface CodeVaultAndExportProps {
  language: 'ar' | 'hi' | 'en';
}

export const CodeVaultAndExport: React.FC<CodeVaultAndExportProps> = ({ language }) => {
  const [activeSnippetTab, setActiveSnippetTab] = useState<'hyperframes' | 'threejs' | 'cli' | 'ffmpeg'>('hyperframes');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyCode = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const hyperframesCode = `// HyperFrames Deterministic Animation Timeline (30 FPS, 9:16)
// Project: Loktak Lake Phumdi 3D Explainer
import { gsap } from 'gsap';

export function createTimeline(container, masterAudioDuration = 76.45) {
  const tl = gsap.timeline({ paused: true });

  // Scene 1: Floating Island Hook (0 - 5s)
  tl.fromTo('.island-mesh', 
    { y: 30, opacity: 0 }, 
    { y: 0, opacity: 1, duration: 2.2, ease: 'power2.out' }, 0
  );
  tl.to('.deer-herd', { x: 180, duration: 5, ease: 'none' }, 0);

  // Scene 3: Gas Buoyancy Explosion (13 - 24s)
  tl.to('.gas-bubble', { 
    scale: 1.35, 
    stagger: 0.08, 
    repeat: -1, 
    yoyo: true, 
    duration: 0.8 
  }, 13);
  tl.to('.floating-mat', { y: -25, duration: 4, ease: 'sine.inOut' }, 18);

  // Scene 5: Iceberg 80% Reveal (31 - 38s)
  tl.fromTo('.depth-bracket', { height: 0 }, { height: 190, duration: 1.8 }, 31);

  // Scene 8: Satellite Zoom Out (52 - 59s)
  tl.to('.camera-viewport', { 
    scale: 0.15, 
    rotationX: 90, 
    duration: 3.5, 
    ease: 'power3.inOut' 
  }, 52);

  // Scene 9: Population Counter (59 - 72s)
  const counterObj = { year: 1975, count: 14 };
  tl.to(counterObj, {
    year: 2016,
    count: 260,
    duration: 5,
    roundProps: 'year,count',
    onUpdate: () => {
      document.querySelector('.counter-text').innerText = \`\${counterObj.year}: \${counterObj.count}\`;
    }
  }, 61);

  return tl;
}`;

  const threejsCode = `// Three.js Procedural Cross-Section Shader & Roots Mat
import * as THREE from 'three';

export function createPhumdiCrossSectionScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c241f);

  // 1. Water Plane with Subsurface Caustic Scattering
  const waterGeo = new THREE.PlaneGeometry(10, 8, 64, 64);
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a5349,
    transparent: true,
    opacity: 0.85,
    roughness: 0.1,
    transmission: 0.6,
    thickness: 2.0
  });
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  scene.add(waterMesh);

  // 2. Entangled Root Mesh (Instanced Fibers)
  const rootCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-4, -0.5, 0),
    new THREE.Vector3(-1, -1.8, 0.4),
    new THREE.Vector3(2, -1.2, -0.2),
    new THREE.Vector3(4, -0.4, 0)
  ]);
  const rootGeo = new THREE.TubeGeometry(rootCurve, 64, 0.12, 8, false);
  const rootMat = new THREE.MeshStandardMaterial({ color: 0x694726, roughness: 0.9 });
  const rootMesh = new THREE.Mesh(rootGeo, rootMat);
  scene.add(rootMesh);

  // 3. Trapped Gas Bubbles (Instanced Glowing Spheres)
  const bubbleGeo = new THREE.SphereGeometry(0.08, 16, 16);
  const bubbleMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
  const bubbleInst = new THREE.InstancedMesh(bubbleGeo, bubbleMat, 50);
  
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 50; i++) {
    dummy.position.set((Math.random() - 0.5) * 7, -0.6 - Math.random() * 1.5, (Math.random() - 0.5) * 2);
    dummy.updateMatrix();
    bubbleInst.setMatrixAt(i, dummy.matrix);
  }
  scene.add(bubbleInst);

  return { scene };
}`;

  const cliCode = `# تشغيل خط الإنتاج فائق السرعة عبر أدوات cartoon-studio و faceless-shorts
# 1. إنشاء مشروع جديد
node skills_extracted/cartoon-studio/cli/studio.mjs new \\
  --name loktak-phumdi \\
  --style colosseum-reels-style \\
  --duration 76 \\
  --aspect 9:16

# 2. رندرة مباشرة وحقن الإطارات في الذاكرة (Turbo Render)
node skills_extracted/cartoon-studio/cli/turbo-render.mjs \\
  --project projects/loktak-phumdi \\
  --fps 30

# 3. فحص الجودة وتصحيح الأخطاء الذاتي
node skills_extracted/cartoon-studio/cli/qa-healer.mjs \\
  --project projects/loktak-phumdi

# 4. توليد الصورة المصغرة والعناوين الفيروسية للشورتس
node skills_extracted/cartoon-studio/cli/title-thumbnail-gen.mjs \\
  --project projects/loktak-phumdi`;

  const ffmpegCode = `# FFmpeg Lossless Video Assembly & Audio Master Mux
# دمج الصوت الأصلي بدقة متناهية دون فقدان فريم واحد
ffmpeg -y \\
  -framerate 30 \\
  -i renders/frames/frame_%04d.png \\
  -i public/assets/aistudio/reference_audio.mp3 \\
  -c:v libx264 \\
  -preset slow \\
  -crf 18 \\
  -pix_fmt yuv420p \\
  -c:a aac \\
  -b:a 192k \\
  -shortest \\
  out/final_phumdi_reel_1080p.mp4`;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FolderArchive className="w-5 h-5 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">
              {language === 'ar' ? "خزنة الأكواد وأدوات استخراج الإنتاج (Code Vault & Pipeline)" : "Code Vault & Production Pipeline"}
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            {language === 'ar'
              ? "استدعاء أكواد المشاريع الجاهزة ودمج مهارات Cartoon Studio و Faceless Shorts للرندرة والتصدير."
              : "Ready-to-use production scripts, shaders, CLI workflows, and headless rendering commands."}
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-800 rounded-2xl border border-slate-700/60 self-start sm:self-auto">
          {[
            { id: 'hyperframes', name: 'HyperFrames' },
            { id: 'threejs', name: 'Three.js 3D' },
            { id: 'cli', name: 'CLI Tools' },
            { id: 'ffmpeg', name: 'FFmpeg Mux' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSnippetTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeSnippetTab === tab.id
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Code Viewer */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
            <span className="text-slate-300 ml-2">
              {activeSnippetTab === 'hyperframes' && 'timeline.js'}
              {activeSnippetTab === 'threejs' && 'crossSection3D.js'}
              {activeSnippetTab === 'cli' && 'pipeline.sh'}
              {activeSnippetTab === 'ffmpeg' && 'render-mux.sh'}
            </span>
          </div>

          <button
            onClick={() => {
              const codeMap = {
                hyperframes: hyperframesCode,
                threejs: threejsCode,
                cli: cliCode,
                ffmpeg: ffmpegCode
              };
              copyCode(activeSnippetTab, codeMap[activeSnippetTab]);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors text-xs"
          >
            {copiedKey === activeSnippetTab ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">تم النسخ</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ الكود</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto max-h-[380px]">
          <code>
            {activeSnippetTab === 'hyperframes' && hyperframesCode}
            {activeSnippetTab === 'threejs' && threejsCode}
            {activeSnippetTab === 'cli' && cliCode}
            {activeSnippetTab === 'ffmpeg' && ffmpegCode}
          </code>
        </pre>
      </div>
    </div>
  );
};
