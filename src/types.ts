export type AspectRatio = '9:16' | '16:9' | '1:1';

export type CameraViewMode = 
  | 'cross-section' 
  | 'surface' 
  | 'underwater-macro' 
  | 'satellite' 
  | 'monsoon';

export type GraphicStyle = 
  | 'cross-section' 
  | 'colosseum-2d' 
  | 'isometric' 
  | 'night-file';

export interface VideoScene {
  id: number;
  timeStart: number;
  timeEnd: number;
  title: string;
  titleAr: string;
  narrationHindi?: string;
  narrationAr: string;
  narrationEn?: string;
  cameraMotion: string;
  cameraMode: CameraViewMode;
  visualAction: string;
  visualMetaphor: string;
  graphicStyle?: GraphicStyle;
  captionWords: { text: string; time: number; highlight?: boolean }[];
  labels: { text: string; textAr: string; x: number; y: number }[];
  sfxCues: string[];
  mechanics: string;
}

export interface VoiceoverGenerationResponse {
  source: string;
  blueprint: {
    projectTitle: string;
    projectTitleAr: string;
    estimatedDuration: number;
    styleChosen: GraphicStyle;
    scenes: VideoScene[];
  };
  notice?: string;
}

export interface ScriptTemplate {
  id: string;
  title: string;
  titleAr: string;
  category: string;
  categoryAr: string;
  style: string;
  aspect: AspectRatio;
  duration: number;
  descriptionAr: string;
  scenes: VideoScene[];
}

export interface QARule {
  id: string;
  name: string;
  nameAr: string;
  category: 'motion' | 'visual' | 'arabic' | 'audio' | 'technical';
  description: string;
  descriptionAr: string;
  status: 'passed' | 'warning' | 'failed';
  score: number; // 0 - 10
  fixTip: string;
}

export interface SoundEffectTrigger {
  id: string;
  name: string;
  nameAr: string;
  time: number;
  type: 'water' | 'bubble' | 'footstep' | 'rain' | 'whoosh' | 'pop' | 'tick' | 'alert';
}
