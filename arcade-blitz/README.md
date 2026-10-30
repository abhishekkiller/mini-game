# ⚡ Arcade Blitz - Viral Mini-Games Collection

**Arcade Blitz** is a production-grade, highly addictive, mobile-first web gaming platform engineered for viral loop distribution, rapid session play (15–60s), and seamless social sharing.

Designed with modern Neo-Arcade aesthetics, glassmorphism, responsive tactile physics, and zero external runtime dependencies.

---

## 🎮 The 10 Mini-Games Collection

Every game is fully playable with instant replayability, keyboard shortcuts, and touch controls:

| # | Mini-Game | Category | Target Session | Key Mechanics & Controls |
|---|---|---|---|---|
| **1** | **Tap Speed Challenge** | Fast Reflex | 10s | Rapid tapping with real-time CPS counter, fire combo sparks, and evolving rank titles (`Turtle` ➔ `Cheetah` ➔ `Godlike`). Tap/Click/Space. |
| **2** | **Color Reaction Test** | Fast Reflex | 25s | Extreme Stroop effect blitz! Dynamic instructions match ink color vs word text under time pressure. Combo streaks and error penalties. |
| **3** | **Brain Puzzle Rush** | Brain & Logic | 35s | High-speed mental arithmetic, missing operators, number sequences, and value comparisons. Keys `1, 2, 3, 4` or touch. |
| **4** | **Stack Tower** | Classic Arcade | 30s | Moving 2D blocks slide back and forth. Tap/Space to drop with precision. Overhang slices off with physics! Ascending pentatonic chord combos. |
| **5** | **Number Memory** | Brain & Memory | 40s | Human Benchmark sequence recall. Memorize flashing digits (3 to 14+), then reproduce them on the on-screen or physical numpad. |
| **6** | **Flappy Challenge** | Classic Arcade | 30s | High-fidelity canvas physics, bird jump velocity, pipes with randomized gaps, collectable coins, and night/day skyline transitions. |
| **7** | **Escape the Maze** | Classic Arcade | 30s | Procedural labyrinth generation using Depth-First Search. Touch swipe gestures, tactile 5-way D-pad, and WASD/Arrow keys. Time extension gems! |
| **8** | **The Impossible Quiz** | Brain & Troll | 45s | Hilarious troll questions, wordplay traps, disguised color buttons, and hidden interactive secrets (like the clickable period `.`!). 3 lives. |
| **9** | **Emoji Memory Blitz** | Brain & Memory | 30s | 3D CSS card flipping with smooth rotations, move counter, stopwatch, combo multipliers, and star ratings. |
| **10** | **Reflex Challenge** | Fast Reflex | 20s | Millisecond-precision human reaction time benchmark. False-start detection, 3-trial averaging, and elite percentile tiers. |

---

## 🚀 Viral & Social Features

1. **Dynamic Shareable Score Cards (1080x1080 Canvas)**
   - Custom-rendered high-resolution arcade graphic card with player name, score, game title, new record badge, funny roast quote, and branding.
   - 1-click **Download PNG** or **Native Share / Copy Link** with `navigator.share` fallback.
2. **Challenge-a-Friend URL Encoding**
   - Beat a score and click **"Challenge Friend"**. It generates a unique challenge link:
     ```
     https://yourdomain.com/?challenge=tap_speed&by=Kira&target=88
     ```
   - When opened, a challenge modal appears: *"Kira challenged you to beat 88 taps! Can you do it?"*
3. **Daily Featured Challenge & Streak System**
   - Automatically seeds a new featured game every 24 hours.
   - Playing the Daily Game awards a **2X Coins Bonus**.
   - Consecutive login tracker with escalating daily streak rewards.
4. **Witty Failure & Victory Roasts**
   - Dynamic humorous roasts based on score tiers (e.g. *"My microwave has faster reflexes than you! 🤖"* vs *"NASA called. They want their reaction time back! 🚀"*).
5. **Arcade Achievements System**
   - 13 unlockable achievements with coin rewards and milestone tracking.
6. **Built-in Pure Web Audio Synthesizer**
   - Pure Web Audio API synthesizers (`js/audio.js`) generating retro bleeps, jump whooshes, combo chimes, and victory fanfares with 0ms latency and no missing MP3 404 errors. Includes haptic vibration (`navigator.vibrate`) support.

---

## 💎 Monetization Architecture

The codebase is built ready for instant monetization:

1. **Google AdSense Ready**
   - Dedicated banner ad slots placed above and below the fold (`#top-ad-slot`, `#bottom-ad-slot`).
   - Simply uncomment the AdSense script tag in `index.html` and replace `ca-pub-XXXXXXXXXXXXXXXX` with your publisher ID:
     ```html
     <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_ID" crossorigin="anonymous"></script>
     ```
2. **Rewarded Video Ads System**
   - Players can click *"Free +100 Coins"* in the shop or on banners to trigger a 5-second video ad simulator modal with countdown and progress bar. Upon completion, coins are rewarded.
3. **VIP Ad-Free Pass**
   - Players can toggle the VIP Pass to instantly remove all banners and interstitial ads forever + receive a permanent **2X Coins Multiplier** across all games.
4. **Coin Economy & Theme Shop**
   - Earn coins by playing and completing daily challenges.
   - Spend coins to unlock premium visual arcade themes:
     - 🌆 **Cyberpunk Neon** (Default)
     - 🌴 **Sunset Vaporwave** (200 Coins)
     - 📟 **8-Bit Matrix** (350 Coins)
     - 👑 **Royal Gold VIP** (600 Coins)
     - 🍬 **Candy Pastel** (250 Coins)

---

## 🏆 Online Leaderboards (Supabase / Firebase Pluggable)

Out-of-the-box, Arcade Blitz runs an active simulated global community with top-tier players and local rank highlights.

To connect live online databases:
1. Open the Leaderboard modal (🏆) and click the **Settings (⚙️)** icon.
2. Select **Supabase**.
3. Enter your Supabase Project URL and Anon Public Key.

### Supabase Table Schema
Run this SQL in your Supabase SQL Editor:
```sql
create table leaderboard (
  id bigint generated by default as identity primary key,
  game_id text not null,
  player_name text not null,
  score numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable public read and insert
alter table leaderboard enable row level security;
create policy "Allow public read" on leaderboard for select using (true);
create policy "Allow public insert" on leaderboard for insert with check (true);
```

---

## 💻 How to Run Locally

### Option 1: Zero Build / Direct Browser
Because the application is built with standard ES modules, you can serve it with any local static server:
```bash
# Using Node.js
npx serve .

# Or using Python
python -m http.server 8080
```
Open `http://localhost:8080` in your browser.

### Option 2: Using Vite
```bash
npm install
npm run dev
```

---

## 🌐 How to Deploy to Production

### Deploy to Vercel (1-Click)
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project root.
3. Set output directory to `./` (static). Done!

### Deploy to Netlify
1. Drag and drop the `arcade-blitz` directory directly into the [Netlify Drop](https://app.netlify.com/drop) dashboard.
2. Your site goes live instantly with SSL.

### Deploy to GitHub Pages
1. Push code to a GitHub repository.
2. Go to **Settings ➔ Pages ➔ Source** and select `main` branch `/ (root)`.
3. Save, and your game collection is live at `https://<username>.github.io/<repo>/`!
