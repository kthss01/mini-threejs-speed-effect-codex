import './style.css';
import { createSceneBundle } from './core/scene';
import { createRenderLoop } from './core/loop';
import { setupDebugControls } from './input/debugToggle';
import { createEnvironmentManager } from './world/environmentManager';
import { createSpeedController } from './core/speedController';
import { EnvironmentManager } from './world/environment-manager.js';
import { appConfig } from './config';

const container = document.querySelector<HTMLElement>('#app');
if (!container) throw new Error('Missing #app container');

const { scene, camera, renderer, onResize } = createSceneBundle(container);
const speedController = createSpeedController(1);
const parallax = createEnvironmentManager({ debugParallax: appConfig.debug.debugParallax });
scene.add(parallax.group);

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
  parallax.update(delta, speedController.getWorldSpeed());
  groundPool.update(delta);
  cameraProgress = envManager.update(cameraProgress, delta, appConfig.ground.speed);
  debug.update();
});

loop.start();
