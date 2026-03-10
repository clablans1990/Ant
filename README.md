# Ant vs Giant Finger (Phaser Mobile Game)

A cartoon 2D vertical platform survival game built with **HTML5 + JavaScript + Phaser 3**.

## Features
- Mobile-friendly portrait layout (540x960 virtual resolution).
- Touch controls (left, right, jump).
- Cartoon ant movement and jump with squash-and-stretch.
- Giant finger attack with anticipation, slam, dust, and screen shake.
- Death sequence with squish + splat particles + laugh SFX.
- Score system (survival + crumb pickups).
- Increasing difficulty over time (faster slams, more fingers, extra obstacles).

## Run locally
Because browsers block some local file loading behavior, serve with a local HTTP server.

### Option 1: Python
```bash
python -m http.server 8000
```
Then open: `http://localhost:8000`

### Option 2: Node
```bash
npx serve .
```
Then open the printed local URL.

## Run on mobile
1. Start one of the local servers above.
2. Ensure your phone is on the same Wi-Fi.
3. Open `http://<your-computer-lan-ip>:8000` on your phone browser.

## Run on Replit
1. Create a new **HTML/CSS/JS** repl.
2. Upload these files/folders:
   - `index.html`
   - `styles.css`
   - `game.js`
3. Click **Run** and open the web preview on mobile.

## Audio
Sound effects (slam, splat, laugh) are synthesized in `game.js` using WebAudio so the repo stays text-only and push-friendly on hosts that reject binary files.
