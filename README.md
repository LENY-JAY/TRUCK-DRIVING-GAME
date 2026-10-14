# TRUCK-DRIVING-GAME — Stage 1 prototype

This branch contains a Stage-1 playable web prototype: a basic 3D driving scene with one controllable monster truck, physics, camera follow, simple HUD, and reset functionality.

Run locally

1. Clone the repo and checkout the branch `stage-1-prototype`:
   git clone https://github.com/LENY-JAY/TRUCK-DRIVING-GAME.git
   cd TRUCK-DRIVING-GAME
   git checkout stage-1-prototype

2. Serve the folder with a simple HTTP server (many options):
   - Python 3: `python -m http.server 8000`
   - Node (http-server): `npx http-server -c-1`

3. Open http://localhost:8000 in a modern browser (Chrome/Edge/Firefox).

Controls (default mappings — rebinding not yet implemented in UI)
- W / ArrowUp: Throttle / accelerate
- S / ArrowDown: Brake / reverse
- A / ArrowLeft: Steer left
- D / ArrowRight: Steer right
- Space: Handbrake
- R: Reset vehicle orientation
- C: Toggle camera mode (third / free)

What this prototype includes
- Three.js renderer, scene, PBR-like materials (basic) and sky
- cannon-es physics world with gravity
- A simple monster-truck composed of a chassis box and four wheels using physics constraints
- Basic tire friction and engine force applied to rear wheels
- Third-person follow camera with smoothing and collision avoidance
- Simple HUD with speed and gear indicators

Next recommended steps
- Improve vehicle suspension with raycast vehicle or more advanced wheel colliders
- Add a garage, UI, and multiple trucks as prefabs
- Implement terrain and road network assets
- Add audio, damage visuals, and optimization for mobile

Note: This prototype targets the Stage 1 deliverable (playable prototype). It deliberately keeps assets and code minimal so you can run immediately in the browser. Later stages will replace the placeholder geometry with high-quality PBR models and add more systems.
