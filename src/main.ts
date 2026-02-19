import './style.css';
import { createSceneBundle } from './core/scene';
import { createGroundPool } from './world/groundPool';
import { createRenderLoop } from './core/loop';
import { setupDebugControls } from './input/debugToggle';

const container = document.querySelector<HTMLElement>('#app');
if (!container) throw new Error('Missing #app container');

const { scene, camera, renderer, onResize } = createSceneBundle(container);
const groundPool = createGroundPool();
scene.add(groundPool.group);

const debug = setupDebugControls(camera, renderer.domElement, scene);

window.addEventListener('resize', onResize);

const loop = createRenderLoop(renderer, scene, camera, (delta) => {
  groundPool.update(delta);
  debug.update();
});

loop.start();
