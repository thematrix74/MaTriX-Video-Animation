# 🎬 AI Adaptive Voiceover-to-Animation Studio (استوديو تحويل التعليق الصوتي إلى رسوميات متحركة)

محرك واستوديو متكامل يعمل بالذكاء الاصطناعي (**Gemini 2.5 Flash**) لتحويل أي **تعليق صوتي (Voiceover)** أو نص إلى **فيديوهات ورسوميات متحركة ذكية ثلاثية الأبعاد وثنائية الأبعاد (3D/2.5D & 2D Animation Reels & Shorts)** بنسبة 9:16 أو 16:9 مع تزامن صوتي دقيق، وفيزياء حركة طبيعية، وكلمات حركية متوهجة (Kinetic Captions).

---

## 🌟 الميزات الرئيسية (Key Features)

1. **المرونة والتكيف مع أي تعليق صوتي (Adaptive Audio Ingestion)**:
   - دعم رفع الملفات الصوتية بمختلف الصيغ (`MP3`, `WAV`, `M4A`, `AAC`, `WebM`).
   - تسجيل صوتي مباشر عبر الميكروفون مع عداد زمني وتحليل فوري.
   - إدخال نصوص وسيناريوهات برمجية بأي موضوع أو لغة (عربي، إنجليزي، إلخ).

2. **تحليل وبناء المشاهد بالذكاء الاصطناعي (Gemini 2.5 Flash Blueprinting)**:
   - تحليل إيقاع المتحدث وموجات الصوت لاستخراج جدول لقطات ذكي (`Visual Scene Blueprint`).
   - تحديد الاستعارات البصرية (`Visual Metaphors`) والحركات المناسبة للمشهد تلقائياً.
   - موازنة أوقات ظهور الكلمات المتزامنة (`Word-Level Kinetic Timings`) والمؤثرات الصوتية.

3. **4 أنماط رسوميات متحركة متطورة (4 Graphic Animation Styles)**:
   - 🔬 **Scientific 3D Cross-Sections (Zack D. Films & Phumdi style)**: قطاعات عرضية عميقة في المياه، الأعضاء البشرية، السوائل، والظواهر الطبيعية.
   - 🏛️ **2D Vector Cartoon & Colosseum Cutout**: كرتون متجه بخطوط تحديد سميكة، أقواس حجرية، نوابض وفيزياء صدمة، وحركة مفاصل حية.
   - 📐 **Isometric Diagrams & Schematics**: رسوم ثلاثية الأبعاد متساوية القياس (Isometric)، كابلات ألياف ضوئية تحت المحيط، وتدفق حزم البيانات.
   - 🕵️‍♂️ **Dark Mystery & Night File Noir**: ملفات التحقيقات والغموض، إضاءة كاشفة متحركة (Spotlight Cone)، أختام حمراء، وتواريخ آلة كاتبة.

4. **تأثيرات تلاشٍ وانتقال سينمائي سلس (Selective Smooth Transitions)**:
   - تلاشٍ سينمائي متقاطع (`Film Dissolve`)، توهج وانعكاس ضوئي (`Optical Light Leak`)، مسح بؤري دائري (`Iris Wipe`)، وتلاشٍ أسود (`Black Dip`).
   - استيفاء ناعم لحركة الكاميرا ثلاثية الأبعاد بدون اهتزازات مفاجئة (`Cubic Ease Camera Interpolation`).

5. **تصدير ورندرة مباشرة (Direct MP4/WebM Export)**:
   - تسجيل مباشر من الكانفاس بضغطة زر وتنزيل ملف الفيديو فوراً.
   - سكربتات FFmpeg محلية لرندرة الفيديو بدون فقدان جودة ومزامنة الصوت التامة.

---

## 🚀 التثبيت والتشغيل المحلي (Installation & Quickstart)

### المتطلبات الأساسية:
- **Node.js**: الإصدار 22 أو أحدث.
- **npm**
- **FFmpeg** (اختياري للرندرة المحلية عبر موجه الأوامر).

### 1. تثبيت الحزم:
```bash
git clone https://github.com/<your-username>/adaptive-voiceover-animation-studio.git
cd adaptive-voiceover-animation-studio
npm install
```

### 2. إعداد مفتاح الذكاء الاصطناعي (Gemini API Key):
أنشئ ملف `.env` وضع فيه مفتاح Gemini الخاص بك:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### 3. تشغيل خادم التطوير (Full-Stack Dev Server):
```bash
npm run dev
```
افتح المتصفح على: `http://localhost:3000`

---

## 📦 خطوات رفع المشروع إلى حسابك على GitHub

لنشر هذا المشروع كاملاً على حسابك في GitHub، نفّذ الأوامر التالية بالترتيب في الطرفية (Terminal):

```bash
# 1. تهيئة المستودع
git init

# 2. إضافة كافة الملفات
git add .

# 3. حفظ أول Commit
git commit -m "feat: complete adaptive voiceover animation studio with gemini 2.5 flash and 4 graphic styles"

# 4. تعيين الفرع الأساسي main
git branch -M main

# 5. ربط المستودع برابط GitHub الخاص بك (استبدل الرابط برابط مستودعك)
git remote add origin https://github.com/<your-username>/<your-repo-name>.git

# 6. رفع الكود
git push -u origin main
```

---

## 🛠️ بنية المشروع (Project Architecture)

```
├── server.ts                    # خادم Full-Stack Express مع مسارات API لـ Gemini 2.5 Flash
├── src/
│   ├── App.tsx                  # الواجهة الرئيسية واستوديو التحكم
│   ├── types.ts                 # تعريفات البيانات والأنماط الرسومية
│   ├── components/
│   │   ├── VoiceoverStudio.tsx  # استوديو رفع الصوت والتسجيل وتوليد الرسوميات الذكية
│   │   ├── PhumdiRenderer.tsx   # محرك الرسوميات الحية (3D Cross-Section, 2D Cutout, Isometric, Noir)
│   │   ├── AudioMixerStudio.tsx # ميكسر الصوت ومولد المؤثرات WebAudio
│   │   ├── ScriptBeatSheetEditor.tsx # محرر السيناريو وتصدير SRT / JSON
│   │   ├── VideoDeconstruction.tsx  # تفكيك الفيديو المرجعي وشريط الإطارات
│   │   ├── QAChecker.tsx        # بوابة الجودة الـ 10 والفحص الذاتي
│   │   └── CodeVaultAndExport.tsx   # خزنة الأكواد وسكربتات FFmpeg
│   └── data/
│       └── referenceAnalysis.ts # بيانات التحليل المرجعي والهندسي
├── package.json                 # حزم المشروع وإعدادات التشغيل
└── vite.config.ts               # إعدادات Vite مع Tailwind v4 و React 19
```

---

## 📄 الترخيص (License)
Apache-2.0 License. مفتوح المصدر ومعد للاستخدام الشخصي والتجاري في إنتاج محتوى الفيديوهات والشورتس.
