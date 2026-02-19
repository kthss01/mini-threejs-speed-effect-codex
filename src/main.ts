import './style.css';
import { createSceneBundle } from './core/scene';
import { createGroundPool } from './world/groundPool';
import { createRenderLoop } from './core/loop';
import { setupDebugControls } from './input/debugToggle';
import { EnvironmentManager } from './world/environment-manager.js';
import { appConfig } from './config';

const container = document.querySelector<HTMLElement>('#app');
if (!container) throw new Error('Missing #app container');

const { scene, camera, renderer, onResize } = createSceneBundle(container);
const groundPool = createGroundPool();
scene.add(groundPool.group);

const envManager = new EnvironmentManager(scene, undefined, appConfig.environment);
envManager.init();
let cameraProgress = 0;

const debug = setupDebugControls(camera, renderer.domElement, scene);

window.addEventListener('resize', onResize);

const handleBeforeUnload = () => {
  envManager.dispose();
};

window.addEventListener('beforeunload', handleBeforeUnload);

const loop = createRenderLoop(renderer, scene, camera, (delta) => {
  groundPool.update(delta);
  cameraProgress = envManager.update(cameraProgress, delta, appConfig.ground.speed);
  debug.update();
});

loop.start();
