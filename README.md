# Lina AI

Lina AI is a frontend-only chatbot Progressive Web App built with React, Vite, TypeScript, Tailwind CSS, Zustand, Dexie, and the Groq API.

## Features

- AI chat interface with streaming Groq responses
- Onboarding with model selection, voice controls, temperature, max tokens, and theme options
- Local conversation persistence using IndexedDB
- Settings persistence and secure API key storage in the browser
- Voice responses via browser speech synthesis
- Dark/light theme support and PWA-ready install experience
- Export/import data and manage multiple chat sessions

## Project Structure

- `src/` — application source files
- `src/components/` — UI and layout components
- `src/services/` — Groq API integration, encryption, and tool helpers
- `src/store/` — Zustand state management for chat and settings
- `src/db/` — local persistence via Dexie

## Prerequisites

- Node.js 18 or newer
- npm
- Groq API key

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Open the local URL shown by Vite, for example `http://localhost:4176/`.

## Build

```bash
npm run build
```

## Preview

```bash
npm run preview
```

## Notes

- Add your Groq API key during onboarding or in Settings.
- The app is frontend-only and stores chat data locally in the browser.
- The app includes model fallback support and avoids deprecated Groq models.
- Use the browser install prompt to enable PWA behavior.

## License

MIT
