import './style.css';
import { createSceneBundle } from './core/scene';
import { createRenderLoop } from './core/loop';
import { setupDebugControls } from './input/debugToggle';
import { createEnvironmentManager } from './world/environmentManager';
import { createSpeedController } from './core/speedController';
import { appConfig } from './config';

const container = document.querySelector<HTMLElement>('#app');
if (!container) throw new Error('Missing #app container');

const { scene, camera, renderer, onResize } = createSceneBundle(container);
const speedController = createSpeedController(1);
const parallax = createEnvironmentManager({ debugParallax: appConfig.debug.debugParallax });
scene.add(parallax.group);

const debug = setupDebugControls(camera, renderer.domElement, scene);

window.addEventListener('resize', onResize);

const loop = createRenderLoop(renderer, scene, camera, (delta) => {
  parallax.update(delta, speedController.getWorldSpeed());
  debug.update();
});

loop.start();
