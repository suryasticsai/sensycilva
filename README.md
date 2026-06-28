# 🎙 SensyCilva Radio

> **Frequencies from another dimension — AI host, real vibes.**

SensyCilva Radio is a fully client-side, AI-powered radio experience with a live host named **Sensy**. She broadcasts anime news, recommendations, and trivia in three languages — and you can talk back to her in real time. No servers, no backend, no login required.

📻 https://suryasticsai.github.io/sensycilva/

---

## ✨ What It Does

Sensy is your personal anime radio host. Hit **GO ON AIR** and she:

- Generates a fresh broadcast script using AI (Google Gemini 2.5 Flash via Puter.js)
- Reads it aloud with animated lip-sync and a live oscilloscope waveform
- Pauses the broadcast the moment you speak or type to her
- Responds to your message, then resumes the show automatically
- Plays music from YouTube on voice command
- Shifts the entire visual theme based on mood and what she's talking about

---

## 🌐 Three Language Channels

Each channel has its own frequency, personality, colour theme, and opening tagline.

| Channel | Frequency | Theme | Tagline |
|---------|-----------|-------|---------|
| 🇬🇧 English | FM 92.4 | Electric Pink · Cyan | *Frequencies from another dimension — AI host, real vibes* |
| 🇮🇳 Hindi | FM 94.0 | Saffron · Gold · Deep Purple | *हर धुन एक कहानी — AI होस्ट, असली जोश* |
| 🇮🇳 Telugu | FM 96.2 | Teal · Emerald · Deep Navy | *ప్రతి beat లో anime జీవితం — AI host, నిజమైన energy* |

Switching channels changes the colour palette, oscilloscope colour, Sensy's language, and her opening greeting.

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────┐
│                  Browser (HTML)                  │
│                                                  │
│  ┌──────────┐   ┌──────────┐   ┌─────────────┐  │
│  │  Puter.js │   │  Web TTS │   │  YouTube    │  │
│  │  (Gemini) │   │  SpeechSy│   │  IFrame API │  │
│  └────┬─────┘   └────┬─────┘   └──────┬──────┘  │
│       │              │                │           │
│       ▼              ▼                ▼           │
│  AI Script      Sensy speaks    Music plays       │
│  generation     with lip-sync   in the embed      │
└─────────────────────────────────────────────────-┘
                          │
                          │ /api/youtube/search
                          ▼
          ┌───────────────────────────────┐
          │   Cloudflare Worker           │
          │   sensycilva.workers.dev      │
          │                               │
          │   Proxies to YouTube Data     │
          │   API v3 — key stored as      │
          │   encrypted env secret        │
          └───────────────────────────────┘
```

**No traditional backend.** Everything runs in the browser except the YouTube search proxy, which lives in a Cloudflare Worker.

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML · CSS · JavaScript (single file) |
| AI (script + chat) | [Puter.js](https://puter.com) → Google Gemini 2.5 Flash |
| Text-to-speech | Web Speech API (`window.speechSynthesis`) |
| Speech recognition | Web Speech API (`SpeechRecognition`) |
| Music search proxy | Cloudflare Workers |
| Music playback | YouTube IFrame Player API |
| Deployment | Any static host (Cloudflare Pages, GitHub Pages, Netlify…) |

---

## 🚀 Setup & Deployment

### 1. Deploy the Cloudflare Worker

The Worker proxies music search so your YouTube API key is never exposed in the browser.

```
sensycilva.suryasticsai.workers.dev/api/youtube/search?q=Naruto+OST&max=5
```

**Steps:**

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create Worker**
2. Paste the contents of `worker.js` and click **Deploy**
3. Go to **Settings → Variables → Secrets** and add:
   - Name: `YOUTUBE_API_KEY`
   - Value: your key from [console.cloud.google.com](https://console.cloud.google.com) (enable **YouTube Data API v3**)
4. Save and redeploy

The key is stored encrypted by Cloudflare and never appears in your source code or browser network tab.

### 2. Deploy the Frontend

`sensycilva.html` is a single self-contained file. Drop it anywhere:

```bash
# Cloudflare Pages
npx wrangler pages deploy . --project-name sensycilva

# Or just drag the file into the Cloudflare Pages dashboard
# Or upload to Netlify / GitHub Pages / any static host
```

No build step. No `npm install`. No dependencies to manage.

### 3. Done

Open the file in a browser. Hit **GO ON AIR**.

---

## 📁 File Structure

```
sensycilva/
├── sensycilva.html     # Entire frontend — one file
├── worker.js           # Cloudflare Worker — YouTube API proxy
├── logo.png            # Your logo (pink square, used everywhere)
└── README.md           # This file
```

---

## 🎤 Things You Can Say to Sensy

### Music
| What you say | What happens |
|---|---|
| *"play Naruto OST"* | Searches YouTube and queues the top result |
| *"next song"* / *"skip"* | Advances to the next track in the queue |
| *"pause music"* | Pauses playback, broadcast resumes |
| *"stop music"* | Stops playback and clears the player |

### Anime
| What you say | What happens |
|---|---|
| *"recommend me a romance anime"* | Sensy gives a personalised pick |
| *"what is One Piece about?"* | She explains the series |
| *"latest anime news"* | She shares what she knows |
| *"quiz me on anime"* | She fires a trivia question at you |

### Chat
| What you say | What happens |
|---|---|
| *"where are you from?"* | She asks you back — and remembers your answer |
| *"tell me a fun fact"* | Random anime trivia |
| Anything, really | She pauses the broadcast and chats with you |

> First message of the session: Sensy will always ask where you're calling from and what you're watching. She remembers your location for the rest of the conversation.

---

## 🎵 Music Player

- **Voice-activated** — just say "play [song name]"
- **Collapsible video** — audio plays by default; click *Show Video Player* to expand the embed
- **Fun facts ticker** — rotating anime music trivia displays while a song plays, changes every 8 seconds
- **Auto-queue** — when a song ends, Sensy loads the next one automatically
- **Broadcast sync** — broadcast auto-pauses when music starts, resumes when music pauses or stops

---

## 🎨 Visual Features

- **Live oscilloscope** — waveform animates in real time as Sensy speaks, colour-coded per channel
- **Mood system** — detects keywords in the script (action, fantasy, comedy, romance) and shifts the gradient strip and oscilloscope colour
- **Lip-sync bars** — 8 animated bars pulse while Sensy is speaking
- **Channel transitions** — switching language triggers a flash animation and full theme swap
- **Starfield background** — 120 drifting stars, colour-tinted per channel
- **Grid overlay** — subtle perspective grid for depth

---

## 🔖 Clip Saver

While Sensy is speaking, click **🔖 Clip** to save the current line. Clips are stored in `localStorage` and persist between sessions. Click any saved clip to replay it.

---

## 📊 Session Stats

Tracked live during the broadcast:

- **Words spoken** by Sensy
- **Songs played**
- **Lines read** from the script
- **Chat messages** exchanged
- **Session time** elapsed

---

## 🔒 Privacy & Security

- No user data is collected or sent anywhere
- The YouTube API key lives only in Cloudflare's encrypted environment — never in the HTML or visible in the browser
- `localStorage` is used only for volume preference, selected language, and saved clips — all stored locally in your browser
- Puter.js AI calls go directly from your browser to Puter's servers; no data passes through any SensyCilva infrastructure

---

## 🚧 Coming Soon

- **Live Anime News Feed** — auto-fetch from Crunchyroll & ANN before each broadcast
- **Character Voices** — switch Sensy's personality: cheerful, tsundere, calm sage
- **Scheduled Broadcasts** — set a time, Sensy auto-starts
- **Smart Playlist** — AI picks songs that match the current anime topic being discussed

---

## 🐛 Known Limitations

| Issue | Notes |
|---|---|
| TTS voice quality varies | Depends entirely on voices installed in the user's OS/browser. Google Chrome on desktop has the best selection. |
| Speech recognition | Chrome only on most platforms. Firefox and Safari have limited or no support. |
| YouTube embed restrictions | Some videos disable embedding. The player auto-skips to the next track when this happens. |
| AI offline fallback | If Puter.js is unavailable, Sensy uses a built-in fallback script so the show still goes on. |

---

## 🤝 Contributing

This is a personal passion project but PRs and ideas are welcome. If you build something cool on top of it, tag [@suryasticsai](https://instagram.com/suryasticsai) — would love to see it.

---

## 📜 License

MIT — free to use, remix, and build on. Credit appreciated but not required.

---

## 💛 Credits

---

### 🎙 Created by

**Surya** · [@suryasticsai](https://instagram.com/suryasticsai)

> Built with ❤️ and Passion. SensyCilva started as an experiment in making AI feel warm, alive, and conversational — like a late-night radio host you actually want to listen to. It became something much more fun than expected.

| Platform | Link |
|----------|------|
| Instagram | [@suryasticsai](https://instagram.com/suryasticsai) |
| LinkedIn | [suryasticsai](https://linkedin.com/in/suryasticsai) |
| GitHub | [suryasticsai](https://github.com/suryasticsai) |
| HuggingFace | [suryasticsai](https://huggingface.co/suryasticsai) |

---

### 🤖 AI & APIs

| Tool | What it powers | Credit |
|------|---------------|--------|
| [Puter.js](https://puter.com) | Script generation, live chat with Sensy | Puter Technologies |
| Google Gemini 2.5 Flash | The AI model behind Sensy's brain | Google DeepMind |
| YouTube Data API v3 | Music search | Google LLC |
| YouTube IFrame Player API | Music playback embed | Google LLC |

---

### ☁️ Infrastructure

| Service | What it does | Credit |
|---------|-------------|--------|
| [Cloudflare Workers](https://workers.cloudflare.com) | YouTube API proxy, key security | Cloudflare Inc. |
| Web Speech API | Sensy's voice (TTS + mic input) | W3C / Browser vendors |

---

### 🎨 Design & Fonts

| Element | Credit |
|---------|--------|
| Typography | Inter (default system stack) |
| Monospace | JetBrains Mono / SF Mono / Fira Code (system fallback chain) |
| Icons | SVG hand-coded inline — no icon library dependency |
| Oscilloscope animation | Original canvas implementation |
| Starfield | Original canvas implementation |

---

### 💡 Inspiration

- Late-night FM radio hosts who made you feel like they were talking only to you
- Anime soundtracks that hit harder than they have any right to
- The idea that AI doesn't have to feel cold or robotic — it can have personality, warmth, and a sense of humour

---

*SensyCilva Radio — where every frequency tells a story.* 📻
