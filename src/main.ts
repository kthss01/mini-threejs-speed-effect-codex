import './style.css';
import { createSceneBundle } from './core/scene';
import { createGroundPool } from './world/groundPool';
import { createRenderLoop } from './core/loop';
import { setupDebugControls } from './input/debugToggle';
import { createSpeedController } from './core/speedController';
import { createEnvironmentManager } from './world/environmentManager';

const container = document.querySelector<HTMLElement>('#app');
if (!container) throw new Error('Missing #app container');

const { scene, camera, renderer, onResize } = createSceneBundle(container);
const speedController = createSpeedController();
const groundPool = createGroundPool();
const environmentManager = createEnvironmentManager();

scene.add(groundPool.group);
scene.add(environmentManager.group);

const debug = setupDebugControls(camera, renderer.domElement, scene);

window.addEventListener('resize', onResize);

const loop = createRenderLoop(renderer, scene, camera, (delta, elapsed) => {
  speedController.update(delta, elapsed);
  const speed = speedController.getSpeed();

  groundPool.update(delta, speed);
  environmentManager.update(delta, speed);
  speedController.applyCameraEffects(camera, delta);

  debug.update();
});

loop.start();
