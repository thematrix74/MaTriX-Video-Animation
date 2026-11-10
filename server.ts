import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Initialize GoogleGenAI client (server-side only)
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ---------------------------------------------------------------------
// API ROUTE: /api/generate-blueprint
// Adapts any custom voiceover / audio or script into a structured visual scene blueprint
// ---------------------------------------------------------------------
app.post('/api/generate-blueprint', async (req: Request, res: Response) => {
  try {
    const { 
      scriptText, 
      audioBase64, 
      mimeType, 
      preferredStyle = 'cross-section', 
      language = 'ar' 
    } = req.body;

    if (!scriptText && !audioBase64) {
      return res.status(400).json({ 
        error: 'Please provide either scriptText or audioBase64 to generate visual scenes.' 
      });
    }

    // If Gemini client is configured, call Gemini 2.5 Flash / 3.8 Flash
    if (aiClient) {
      try {
        const parts: any[] = [];

        // If audio is attached, add inline audio data
        if (audioBase64 && mimeType) {
          parts.push({
            inlineData: {
              mimeType: mimeType.startsWith('audio/') ? mimeType : 'audio/mp3',
              data: audioBase64.replace(/^data:audio\/\w+;base64,/, ''),
            },
          });
        }

        const promptText = `
You are the Creative Director and Motion Graphics Architect for an adaptive AI Animation Studio.
Your mission: Analyze this voiceover audio / script and generate a complete, synchronized visual animation scene blueprint.

USER PREFERRED STYLE: ${preferredStyle}
Options for style are:
1. 'cross-section' (3D and 2.5D scientific cutaways like Zack D. Films & Phumdi)
2. 'colosseum-2d' (2D vector cartoon cutout, thick dark outlines, spring physics)
3. 'isometric' (3D architectural diagrams, technical flows, schematics)
4. 'night-file' (Dark mystery, spotlight, redacted noir, case-files)

INPUT SCRIPT:
${scriptText || 'Analyze the attached voiceover audio content.'}

LANGUAGE TARGET: ${language} (Ensure Arabic narration and labels are natural and accurate if target is Arabic).

Generate a structured array of 4 to 8 sequential scenes covering the entire voiceover.
Every scene must have:
- id: sequential integer (1, 2, 3...)
- timeStart: number in seconds (e.g. 0.0)
- timeEnd: number in seconds (e.g. 6.5)
- title: short English title
- titleAr: short Arabic title
- narrationAr: Arabic spoken transcription / voiceover sentence
- narrationEn: English translation of spoken line
- visualAction: precise action that moves on screen (living characters, moving fluids, expanding diagrams, mechanics)
- cameraMode: one of 'cross-section', 'surface', 'underwater-macro', 'satellite', 'monsoon'
- visualMetaphor: core conceptual analogy
- graphicStyle: '${preferredStyle}'
- labels: 1 to 3 educational pointer tags on screen ({ text: English, textAr: Arabic, x: percentage 0-100, y: percentage 0-100 })
- captionWords: array of 4-8 kinetic punchy words with time in seconds and highlight boolean
- sfxCues: array of sound effects (e.g. 'whoosh', 'bubble_pop', 'water_splash', 'radar_ping', 'ticking', 'thud')
- mechanics: description of the 3-layer motion principles applied.
`;
        parts.push({ text: promptText });

        // Call Gemini 2.5 Flash or 3.8 Flash
        const response = await aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                projectTitle: { type: Type.STRING },
                projectTitleAr: { type: Type.STRING },
                estimatedDuration: { type: Type.NUMBER },
                styleChosen: { type: Type.STRING },
                scenes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.INTEGER },
                      timeStart: { type: Type.NUMBER },
                      timeEnd: { type: Type.NUMBER },
                      title: { type: Type.STRING },
                      titleAr: { type: Type.STRING },
                      narrationAr: { type: Type.STRING },
                      narrationEn: { type: Type.STRING },
                      visualAction: { type: Type.STRING },
                      cameraMode: { type: Type.STRING },
                      visualMetaphor: { type: Type.STRING },
                      graphicStyle: { type: Type.STRING },
                      mechanics: { type: Type.STRING },
                      labels: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            text: { type: Type.STRING },
                            textAr: { type: Type.STRING },
                            x: { type: Type.NUMBER },
                            y: { type: Type.NUMBER },
                          },
                          required: ['text', 'textAr', 'x', 'y'],
                        },
                      },
                      captionWords: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            text: { type: Type.STRING },
                            time: { type: Type.NUMBER },
                            highlight: { type: Type.BOOLEAN },
                          },
                          required: ['text', 'time', 'highlight'],
                        },
                      },
                      sfxCues: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                    },
                    required: [
                      'id',
                      'timeStart',
                      'timeEnd',
                      'title',
                      'titleAr',
                      'narrationAr',
                      'visualAction',
                      'cameraMode',
                      'labels',
                      'captionWords',
                      'sfxCues',
                    ],
                  },
                },
              },
              required: ['projectTitle', 'projectTitleAr', 'estimatedDuration', 'scenes'],
            },
          },
        });

        const blueprintJson = JSON.parse(response.text || '{}');
        return res.json({
          source: 'gemini-2.5-flash',
          blueprint: blueprintJson,
        });
      } catch (geminiError: any) {
        console.warn('Gemini 2.5 Flash call fallback notice:', geminiError?.message || geminiError);
        // Fallback to offline procedural generator if API quota or key issues
      }
    }

    // Adaptive Offline Procedural Blueprint Generator (Guarantees zero-failure operation)
    const fallbackBlueprint = generateAdaptiveOfflineBlueprint(scriptText || 'التعليق الصوتي المخصص', preferredStyle, language);
    return res.json({
      source: 'adaptive-engine',
      blueprint: fallbackBlueprint,
      notice: !apiKey ? 'Set GEMINI_API_KEY in Settings > Secrets for full AI neural voiceover blueprinting.' : undefined,
    });
  } catch (error: any) {
    console.error('API /api/generate-blueprint Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error processing audio blueprint' });
  }
});

// Helper for adaptive offline generation
function generateAdaptiveOfflineBlueprint(text: string, style: string, lang: string) {
  const sentences = text
    .split(/[.!?،؛\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);

  const sceneCount = Math.max(4, Math.min(8, sentences.length || 5));
  const sceneDuration = 5.5;
  const scenes: any[] = [];

  for (let i = 0; i < sceneCount; i++) {
    const rawSentence = sentences[i] || `المرحلة ${i + 1}: تفصيل وتحريك الفكرة بدقة`;
    const tStart = i * sceneDuration;
    const tEnd = (i + 1) * sceneDuration;
    const words = rawSentence.split(/\s+/).slice(0, 6);

    scenes.push({
      id: i + 1,
      timeStart: tStart,
      timeEnd: tEnd,
      title: `Scene ${i + 1}: Key Concept Dynamics`,
      titleAr: `المشهد ${i + 1}: تجسيد الفكرة والتحريك`,
      narrationAr: rawSentence,
      narrationHindi: rawSentence,
      narrationEn: rawSentence,
      visualAction: `تحريك العناصر الحية والتفاعلات المتوافقة مع نمط ${style}`,
      cameraMode: i === 0 ? 'cross-section' : i === 1 ? 'underwater-macro' : i === 2 ? 'surface' : i === 3 ? 'monsoon' : 'satellite',
      visualMetaphor: 'تجسيد بصري ديناميكي ثلاثي الطبقات',
      graphicStyle: style,
      mechanics: 'حركة العنصر الأساسي + بارالاكس الكاميرا + المؤثرات الحيوية المحيطة',
      labels: [
        { text: `Concept ${i + 1}`, textAr: `عنصر ${i + 1}`, x: 50, y: 20 },
      ],
      captionWords: words.map((w, wIdx) => ({
        text: w,
        time: tStart + wIdx * 0.8,
        highlight: wIdx % 2 === 1,
      })),
      sfxCues: ['whoosh', 'bubble_pop', 'radar_ping'],
    });
  }

  return {
    projectTitle: 'Voiceover Animation Project',
    projectTitleAr: 'مشروع رسوميات التعليق الصوتي المخصص',
    estimatedDuration: sceneCount * sceneDuration,
    styleChosen: style,
    scenes,
  };
}

// ---------------------------------------------------------------------
// API ROUTE: /api/export-repo
// Prepares git repository information and export files
// ---------------------------------------------------------------------
app.get('/api/export-repo-info', (req: Request, res: Response) => {
  res.json({
    repoName: 'adaptive-voiceover-animation-studio',
    branch: 'main',
    description: 'AI-Powered Adaptive Voiceover-to-Animation Video Generator supporting 3D Cross-Sections, Colosseum 2D, Isometric Cutaways, and Night File Noir.',
    instructions: {
      step1: 'git init',
      step2: 'git add .',
      step3: 'git commit -m "feat: initial adaptive voiceover animation studio release"',
      step4: 'git branch -M main',
      step5: 'git remote add origin https://github.com/<your-username>/<your-repo-name>.git',
      step6: 'git push -u origin main',
    },
    techStack: ['Node.js 22+', 'TypeScript', 'React 19', 'Tailwind CSS v4', 'Three.js', 'Express', '@google/genai (Gemini 2.5 Flash)', 'FFmpeg'],
  });
});

// Vite Dev Server Integration
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production serve dist
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Full-stack Animation Studio Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
