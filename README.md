# TRUCK-DRIVING-GAME — Stage 1 prototype

This branch contains a Stage-1 playable web prototype and an in-progress Stage-2 vehicle upgrade: improved suspension and wheel behaviour using cannon-es RaycastVehicle.

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

Notes about Stage 2 changes
- The vehicle physics implementation has been upgraded to use cannon-es RaycastVehicle for more believable suspension, wheel contact, and steering behaviour.
- Tuning values (suspension stiffness, damping, frictionSlip, engine force) are intentionally conservative and should be tuned per truck model.

Next recommended steps
- Tune suspension and friction for each truck archetype.
- Add per-surface friction modifiers (asphalt vs dirt vs mud) and tire temperature effects.
- Implement gearbox, downforce, and weight transfer for more mechanical realism.
- Replace placeholder geometry with production PBR models and normal maps.
