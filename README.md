# Vidyra AI — Your Adaptive AI Teacher
**Google AI Innovation Hackathon 2026**

Vidyra AI is an adaptive, multimodal AI educator that breaks down complex science and engineering concepts into structured, tangible teaching scenes. Powered by Google Gemini and D-ID V3 Pro neural video avatars, Vidyra dynamically balances pedagogical depth, subject-aware interactive visualizations, and synchronized spoken lectures.

---

## Key Features

1. **Gemini Adaptive Teaching Planner**
   - Structures lessons into bite-sized, coherent teaching moments tailored to learner level and available time.
   - Generates multi-layered pedagogy: core intuition, physical mechanisms, worked examples, real-world engineering applications, and common misconception traps.

2. **Subject-Aware Visual Engine**
   - Dynamic renderers that match concept physics and logic:
     - `waveform` (Duty cycle, voltage levels, PWM frequency modulation)
     - `algorithm` (Pointer-based binary search and complexity tracking)
     - `radiation` (Black body radiation curves and Wien's law)
     - `physics` (Gravitational potential, escape velocity vectors)
     - `equation` (LaTeX/formula parsing with variable inspectors)
     - `graph`, `flowchart`, `timeline`, `biologyProcess`, `comparison`, and more.

3. **D-ID V3 Pro AI Teacher Video Pipeline**
   - High-fidelity neural teacher avatar delivering synchronized verbal lectures.
   - Strictly user-triggered video generation preserving API quotas.
   - Resilient state machine (`IDLE` → `PREPARING` → `GENERATING` → `READY` / `ERROR` with retry).
   - Session caching across React renders and page reloads.

4. **Active Recall & Formative Evaluation**
   - Evaluates open-ended student answers with targeted diagnostic feedback, confidence scoring, and adaptive remediation.

---

## Project Structure

```
├── backend/
│   ├── api/
│   │   └── index.js              # Vercel serverless entrypoint
│   ├── server.js                 # Express backend & Gemini/D-ID orchestrator
│   ├── vercel.json               # Backend Vercel serverless configuration
│   ├── .env.example              # Environment variables template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/           # TeachingStudioVideo, SubjectVisual, etc.
│   │   ├── lib/                  # api.ts, models.ts
│   │   └── App.tsx               # Main teaching orchestrator
│   ├── vercel.json               # Frontend Vercel SPA rewrite configuration
│   ├── .env.example              # Frontend environment variables template
│   ├── index.html
│   └── package.json
├── .gitignore
└── README.md
```

---

## Local Development

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```
Populate `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key
DID_API_KEY=your_did_api_key
VIDEO_GENERATION_LIVE=false
PORT=5000
```
Run backend:
```bash
npm start
```
The backend starts on `http://localhost:5000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend starts on `http://localhost:5173`.

---

## Vercel Deployment

### Backend (Vercel Serverless Express)
1. Deploy the `backend/` directory to Vercel (Root Directory: `backend`).
2. Add Environment Variables in Vercel:
   - `GEMINI_API_KEY`: Your Gemini API Key.
   - `DID_API_KEY`: Your D-ID API Key.
   - `VIDEO_GENERATION_LIVE`: `true` (enables live D-ID video generation for the demo).
   - `FRONTEND_URL`: `https://<your-frontend-app>.vercel.app`

### Frontend (Vercel Vite / React)
1. Deploy the `frontend/` directory to Vercel (Root Directory: `frontend`).
2. Build Settings:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Environment Variables:
   - `VITE_API_BASE_URL`: `https://<your-backend-app>.vercel.app`
