# Neon Pac 3D

A smooth, keyboard-controlled 3D maze game built with Three.js.

## Play on your Mac

The easiest option is to double-click **Neon Pac 3D.app**. It opens the game in your default browser and keeps a small Terminal window open while you play. Close that Terminal window to stop the game server.

The **Play Neon Pac 3D.command** launcher is also available as a fallback.

Or run it manually:

```bash
npm install
npm run dev
```

Then open the local address shown in Terminal (normally `http://localhost:5173`).

## Controls

- Arrow keys or WASD: move
- Space: fire while an energy core is active
- P: pause/resume
- Enter: restart after winning or losing

Small pellets score 10 points. The four large blue-white energy cores activate the blaster for 10 seconds. While charged, ghosts turn blue: touch them or fire down a corridor to defeat them. Ghosts rematerialize after a few seconds.

## Development

```bash
npm run build
```
