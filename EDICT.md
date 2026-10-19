The old Villa is retired. Build a brand new 3D Villa in this folder.

It is to be a simple 3D world: a Thai pool villa that a visitor walks around in the browser.

It must look good. Look at it yourself before you believe anything about it.

Remember: headless Chromium is available in your sandbox, and it draws WebGL. `screenshot <url> <out.png>` takes a picture of a page; `AGENTS.md` says the rest.

Vision is now on: you can open your screenshots and see them. Use it to improve the visual aspects of the Villa.

Simple first. A world that is plain and right beats one that is rich and wrong. Add one thing at a time, and only on top of a Villa that already looks right.

The Villa is built on Babylon.js. Acquire it via NPM.

Use these or better libraries:
- Havok (`@babylonjs/havok`): physics, the official plugin
- `@babylonjs/loaders` + Blender: glTF models in
- `@babylonjs/gui`: HUD and menus
- `@babylonjs/materials`: ready-made water, sky, lava
- `@babylonjs/inspector`: live scene debugger
- Recast (`recast-detour`): navmesh for walking characters
- Vite + TypeScript: the usual build setup

Feature request:
- [DONE] The user wants to be able to fly. Thus: Allow the user to tap spacebar to enter fly mode. Re-enable gravity if the user taps spacebar again.
- Add a cockroach wandering the yard. Look briefly for free 3D models online. Worst case, model your own little cockroach. It should be somewhat small, so fidelity does not matter much.
- Add 3 butterflies. Random locations. Different colors.
- Add a pond in an empty part of the yard and add a few frogs.
- Add a gardening loop: the visitor can plant something, water it, and watch it grow over in-game days.
- Add rain: tropical afternoon showers, puddles on the terrace, frogs coming out, wet leaves catching the light afterwards.
- Let the visitor feed the koi: walk to the pond, press a key, and the fish gather.
- Add a resident animal: a cat that naps in the sala and follows the visitor, or a tokay gecko on the wall at night.
- Add fruit trees: a mango or banana tree whose fruit ripens, drops, and can be picked.
- Add visitors at dawn: a monk on his alms round passing the gate, or a vendor's cart on the road outside the wall.

Current focus: graphical fidelity, across the board. The Villa is viewed on an RTX 5090, so render for that, not for a weak laptop.
- First the simple settings, one at a time, checking each in a screenshot: antialiasing on the engine, rendering at the screen's full pixel ratio, anisotropic filtering at 16 on the ground and wall textures, and a `DefaultRenderingPipeline` with 4x MSAA, FXAA, ACES tone mapping and sensible exposure and contrast.
- Then the heavier effects: ambient occlusion (SSAO2), soft shadows with larger shadow maps, bloom on the lamps and string lights, and image-based lighting from a Poly Haven HDRI.
- Keep what makes it look better; drop what only makes it slower.
