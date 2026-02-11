# ⚡ StudyFlow AI

## *Master any subject in Minutes, not Hours.*

An AI-powered study companion that transforms your course materials into interactive, personalized study plans — instantly.

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Gemini](https://img.shields.io/badge/Gemini_AI-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-0.182-000000?style=for-the-badge&logo=threedotjs&logoColor=white)](https://threejs.org/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Usage Guide](#-usage-guide)
- [Project Structure](#-project-structure)
- [AI Integration](#-ai-integration)
- [Performance Optimizations](#-performance-optimizations)
- [Team](#-team)
- [License](#-license)

---

## 🌟 Overview

**StudyFlow AI** is a fully client-side React web application that leverages Google's **Gemini AI** to process study materials (PDFs, images, notes, YouTube videos) and generate comprehensive, interactive study plans. It features real-time AI streaming, interactive quizzes, concept mapping, study scheduling, progress tracking, and a Pomodoro timer — all wrapped in a premium dark-themed UI with 3D particle effects.

> **No backend required.** Everything runs in the browser. Your data never leaves your device — API calls go directly from your browser to Google's Gemini API.

---

## ✨ Features

### 📥 Multi-Format Input

| Input Type | Description |
| --- | --- |
| **📄 PDF Upload** | Upload single or multiple PDFs. Text is extracted client-side using `pdf.js`. Multi-PDF files are sent as base64 inline data to Gemini for vision-based analysis. |
| **🖼️ Image Upload** | Upload lecture slides, whiteboard photos, or handwritten notes (PNG, JPG, WEBP). Images are processed via Gemini's multimodal vision capabilities. |
| **📝 Paste Notes** | Paste raw text, lecture transcripts, or code snippets directly. Processed through intelligent text chunking. |
| **🎬 YouTube Video** | Paste a YouTube URL. The app uses Google Search grounding to analyze the video's content and generate a study plan. |

### 📊 AI-Powered Dashboard

Once content is processed, you get a full **study dashboard** with:

- **📋 Executive Summary** — A structured overview with an "In Simple Terms" ELI5 explanation and colorful Key Takeaway cards.
- **🧠 Knowledge Map** — An interactive D3-powered concept graph showing relationships between topics. Nodes are resizable, draggable, and collapsible.
- **📖 Deep Dive Notes** — Detailed, topic-by-topic study material with markdown rendering, key points, and real-world examples.
- **🎯 Interactive Quiz** — Timed quiz mode with multiple difficulty levels, scoring, streak tracking, and performance analytics per topic.
- **📅 Study Schedule** — AI-generated study calendar with day-by-day plans. Drag-and-drop rescheduling. Integrates days-until-exam and hours-per-day inputs.
- **📊 Progress Dashboard** — Visual analytics with charts (Recharts) showing quiz performance trends, topic mastery, and study streaks.
- **🔥 Flashcards** — Review key concepts in a flashcard format with flip animations.

### 💬 AI Chat Tutor

- **Streaming Responses** — Real-time token-by-token AI responses using Server-Sent Events (SSE).
- **Context-Aware** — The chatbot has full knowledge of your uploaded study material and can answer questions about it.
- **Multimodal Support** — If you uploaded images or multi-PDF files, the chat tutor can reference them.

### ⏱️ Pomodoro Timer

- Customizable work/break intervals (25/5 default, Pomodoro technique).
- Session counter with visual progress ring.
- Settings for short breaks, long breaks, and session goals.
- Floating widget that stays accessible across the dashboard.

### 🔗 Shareable Study Plans

- Share your generated study plans via URL hash encoding.
- Recipients can view the full plan without needing an API key.

### 📂 Study History

- All generated study sessions are saved to `localStorage` with timestamps.
- Searchable sidebar with topic filtering.
- Click any past session to reload the full dashboard.

### 🎨 Premium UI/UX

- **Dark/Light Theme** — Toggle via the navbar sun/moon icon. Persists across sessions.
- **3D Particle Background** — Animated star field using Three.js with performance-adaptive particle counts.
- **Glassmorphism Design** — Frosted glass panels, gradients, and subtle neon glows.
- **Smooth Animations** — Page transitions, micro-interactions, and hover effects via Framer Motion and GSAP.
- **Responsive Layout** — Works across desktop and tablet viewports.

### 🤖 AI Model Management

- **Model Selector** — Choose between Gemini 2.0 Flash, 2.5 Flash Lite, or 2.5 Flash.
- **Auto-Fallback** — If one model is rate-limited (429), the system automatically tries the next model.
- **API Key Rotation** — Support for multiple API keys with round-robin rotation.
- **Health Check** — Background service pings all models on app load to show live availability status.

---

## 🛠️ Tech Stack

### Core

| Technology | Purpose |
| --- | --- |
| **React 19** | UI framework with hooks and functional components |
| **Vite 7** | Build tool with Hot Module Replacement (HMR) and SWC |
| **Zustand 5** | Lightweight state management with `persist` middleware (localStorage) |
| **Tailwind CSS 4** | Utility-first CSS with custom dark/light theme tokens |

### AI and Data

| Technology | Purpose |
| --- | --- |
| **Google Gemini API** | AI text generation, multimodal analysis, streaming responses |
| **pdf.js** | Client-side PDF text extraction |
| **react-markdown** | Markdown rendering for AI-generated content |

### Visualization

| Technology | Purpose |
| --- | --- |
| **Three.js + React Three Fiber** | 3D particle background with performance optimization |
| **react-d3-tree** | Interactive concept graph / knowledge map |
| **Recharts** | Charts and analytics for progress tracking |
| **Framer Motion** | Page transitions, layout animations, micro-interactions |
| **GSAP** | Advanced timeline animations and scroll effects |

### Utilities

| Technology | Purpose |
| --- | --- |
| **Lucide React** | Modern, consistent icon library |
| **date-fns** | Date formatting and manipulation |
| **react-day-picker** | Calendar UI component for study scheduling |
| **maath** | Math utilities for random point distribution in 3D space |

---

## 🏗️ Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                        Browser (Client)                      │
│                                                              │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────────────┐ │
│  │ InputHub │──▶│ Processing   │──▶│ AI Service           │ │
│  │ (4 tabs) │   │ Service      │   │ (Gemini API)         │ │
│  └──────────┘   │ • PDF.js     │   │ • Key rotation       │ │
│                 │ • Text chunk │   │ • Model fallback     │ │
│                 │ • Video proc │   │ • Streaming (SSE)    │ │
│                 └──────────────┘   │ • Health checks      │ │
│                                    └──────┬───────────────┘ │
│                                           │                  │
│  ┌────────────────────────────────────────▼───────────────┐ │
│  │                 Zustand Store                           │ │
│  │  State: content, summary, topics, quiz, chat, history  │ │
│  │  Persisted to localStorage                              │ │
│  └────────────────────────────────────────┬───────────────┘ │
│                                           │                  │
│  ┌────────────────────────────────────────▼───────────────┐ │
│  │              Dashboard Layout                           │ │
│  │  ┌─────────┬──────────┬───────┬────────┬─────────────┐ │ │
│  │  │Summary  │Knowledge │Quiz   │Schedule│ Progress    │ │ │
│  │  │         │Map (D3)  │       │        │ Dashboard   │ │ │
│  │  │         │          │       │        │ (Recharts)  │ │ │
│  │  └─────────┴──────────┴───────┴────────┴─────────────┘ │ │
│  │  + ChatPanel (Streaming) + PomodoroTimer + History      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Background3D (Three.js) — Adaptive particle star field │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **npm** v9+
- A **Google Gemini API Key** ([Get one free](https://aistudio.google.com/apikey))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/rishab11250/qBit-Coders.git
cd qBit-Coders

# 2. Install dependencies
npm install

# 3. Create environment file
# Create a .env file in the root directory (see Environment Variables below)

# 4. Start the development server
npm run dev
```

The app will be running at `http://localhost:5173`.

### Build for Production

```bash
npm run build
npm run preview   # Preview the production build locally
```

---

## 🔑 Environment Variables

Create a `.env` file in the project root:

```env
# Required: At least one Gemini API key
VITE_GEMINI_API_KEY=your_primary_api_key_here

# Optional: Additional keys for rotation (comma-separated)
VITE_GEMINI_API_KEY_2=your_second_key
VITE_GEMINI_API_KEY_3=your_third_key
```

> **Note:** API keys are used client-side. For production deployments, consider proxying through a backend to protect your keys.

### Getting an API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Create API Key"
3. Copy the key and paste it into your `.env` file

---

## 📖 Usage Guide

### 1. Upload Your Material

Choose from 4 input methods:

- **PDF** — Drag and drop or click to upload (supports multiple files)
- **Images** — Upload lecture slides, photos, or screenshots
- **Notes** — Paste text content directly
- **YouTube** — Enter a video URL

### 2. Select AI Model

Use the model selector to pick your preferred Gemini model. The health indicator shows real-time availability:

- 🟢 Available
- 🟡 Rate Limited (auto-fallback active)
- 🔴 Unavailable

### 3. Generate Study Plan

Click **"Generate Study Plan"** and watch the premium loading animation while the AI processes your content.

### 4. Explore Your Dashboard

Navigate between sections using the sidebar:

- 📋 **Summary** — Overview with key takeaways
- 🧠 **Knowledge Map** — Interactive concept graph
- 📖 **Deep Dive** — Detailed topic notes
- 🎯 **Quiz** — Test your knowledge
- 📅 **Calendar** — Study schedule
- 📊 **Progress** — Performance analytics

### 5. Chat with AI Tutor

Click the floating chat button (bottom-right) to ask questions about your material. Responses stream in real-time.

### 6. Focus with Pomodoro

Use the Pomodoro timer (bottom-left) for focused study sessions with timed work/break intervals.

---

## 📁 Project Structure

```text
qBit-Coders/
├── public/                    # Static assets
├── src/
│   ├── main.jsx              # React entry point
│   ├── App.jsx               # Root component and routing logic
│   ├── index.css             # Global styles and theme tokens
│   │
│   ├── store/
│   │   └── useStudyStore.js  # Zustand state management (persist to localStorage)
│   │
│   ├── services/
│   │   ├── aiService.js      # Gemini API integration (streaming, fallback, health)
│   │   ├── processingService.js  # Input processing router
│   │   └── processing/
│   │       ├── textProcessor.js   # Text chunking and cleanup
│   │       └── videoProcessor.js  # YouTube URL handling
│   │
│   └── components/
│       ├── InputHub.jsx           # Multi-tab input interface
│       ├── ConceptGraph.jsx       # D3 knowledge map
│       ├── QuizInteractive.jsx    # Timed quiz with scoring
│       ├── DashboardLayout.jsx    # Main dashboard container
│       │
│       ├── features/
│       │   ├── ChatPanel.jsx          # AI chat with streaming
│       │   ├── DashboardLayout.jsx    # Dashboard sections and sidebar
│       │   ├── HistorySidebar.jsx     # Past study sessions
│       │   ├── PomodoroTimer.jsx      # Focus timer widget
│       │   ├── ProgressDashboard.jsx  # Analytics and charts
│       │   ├── StudyMaterial.jsx      # Deep dive notes viewer
│       │   └── StudySchedule.jsx      # Calendar and scheduling
│       │
│       ├── layout/
│       │   ├── Navbar.jsx         # Top navigation bar
│       │   └── SidebarNav.jsx     # Dashboard sidebar navigation
│       │
│       └── ui/
│           ├── Background3D.jsx       # Three.js particle starfield
│           ├── Button.jsx             # Reusable button component
│           ├── ErrorMessage.jsx       # Error display component
│           ├── Loader.jsx             # Loading spinner
│           ├── Modal.jsx              # Modal dialog
│           ├── ModelSelector.jsx      # AI model picker and health status
│           └── PremiumLoadingState.jsx # Animated loading overlay
│
├── .env                       # API keys (not committed)
├── index.html                 # HTML entry point
├── package.json               # Dependencies and scripts
├── vite.config.js             # Vite configuration
├── tailwind.config.js         # Tailwind theme configuration
└── eslint.config.js           # ESLint rules
```

---

## 🤖 AI Integration

### Gemini API Features Used

| Feature | Implementation |
| --- | --- |
| **Text Generation** | `generateContent` endpoint for study plan generation |
| **Streaming** | `streamGenerateContent` with SSE (`alt=sse`) for real-time chat |
| **Multimodal Vision** | `inlineData` with base64 images/PDFs for visual content analysis |
| **Google Search Grounding** | `tools: [{ google_search: {} }]` for YouTube video content retrieval |

### Key AI Functions

| Function | File | Description |
| --- | --- | --- |
| `generateStudyContent()` | `aiService.js` | Main study plan generation from text/images |
| `generateStudyContentWithSearch()` | `aiService.js` | YouTube content via Google Search grounding |
| `streamChatMessage()` | `aiService.js` | Streaming chat with SSE parsing |
| `sendChatMessage()` | `aiService.js` | Legacy non-streaming chat (fallback) |
| `generateQuizOnly()` | `aiService.js` | On-demand quiz regeneration |
| `generateSchedule()` | `aiService.js` | AI-powered study schedule generation |
| `runHealthCheck()` | `aiService.js` | Background model availability check |

### Resilience Features

- **API Key Rotation** — Multiple keys rotated on 429 errors
- **Model Fallback** — Automatic switch: `2.5 Flash → 2.0 Flash → 2.5 Flash Lite`
- **Health Monitoring** — Background pings on app load with visual status indicators
- **Retry Logic** — `fetchWithRetry` with exponential backoff

---

## ⚡ Performance Optimizations

| Optimization | Details |
| --- | --- |
| **Adaptive Particles** | 3D background uses 2,000 particles (800 on low-end devices, was 6,000) |
| **Reduced Motion** | Respects `prefers-reduced-motion` OS setting — disables particle animation |
| **DPR Capping** | Canvas pixel ratio capped at 1.5x (prevents 3x rendering on Retina) |
| **Low-Power GPU** | Three.js requests `powerPreference: 'low-power'` |
| **Device Detection** | Checks `navigator.hardwareConcurrency` and `navigator.deviceMemory` |
| **Lazy State** | Zustand with `persist` — only serializes necessary state |
| **SWC Compiler** | Vite uses SWC instead of Babel for faster builds |
| **Code Splitting** | Dynamic imports for heavy components |
| **Effects Kill Switch** | `reducedEffects` setting to fully disable 3D background |

---

## 👥 Team

**qBit Coders** — Built with ❤️ by:

| Member | Role |
| --- | --- |
| **Rishab** | AI Integration + Logic |
| **Daksh** | File Processing + DataFlow |
| **Harshit** | UI/UX |

---

## 📄 License

This project is built for educational purposes as part of the qBit-Coders team project.

---

**⚡ StudyFlow AI** — *Turning information overload into structured knowledge.*

Made with React, Gemini AI, and a lot of caffeine ☕
