import './style.css';
import { createSceneBundle } from './core/scene';
import { createGroundPool } from './world/groundPool';
import { createRenderLoop } from './core/loop';
import { setupDebugControls } from './input/debugToggle';
import { EnvironmentManager } from './world/environment-manager.js';
import { appConfig } from './config';
import { SpeedController } from './core/speed-controller.js';

const container = document.querySelector<HTMLElement>('#app');
if (!container) throw new Error('Missing #app container');

const { scene, camera, renderer, onResize } = createSceneBundle(container);
const groundPool = createGroundPool();
scene.add(groundPool.group);

const speedController = new SpeedController(appConfig.speed);
const envManager = new EnvironmentManager(scene, undefined, appConfig.environment);
envManager.init();

const baseCameraFov = appConfig.camera.fov;
let cameraProgress = 0;

const handleSpeedInput = (event: KeyboardEvent) => {
  if (event.code === 'ArrowUp' || event.code === 'KeyW') {
    speedController.addInput(1);
  }

  if (event.code === 'ArrowDown' || event.code === 'KeyS') {
    speedController.addInput(-1);
  }
};

window.addEventListener('keydown', handleSpeedInput);

const debug = setupDebugControls(camera, renderer.domElement, scene);

window.addEventListener('resize', onResize);

const loop = createRenderLoop(renderer, scene, camera, (delta) => {
  speedController.update(delta);

  const normalizedSpeed = speedController.getNormalizedSpeed();
  const worldSpeed = speedController.getWorldSpeed();

  camera.fov = baseCameraFov + normalizedSpeed * appConfig.camera.speedFovBoost;
  camera.updateProjectionMatrix();

  groundPool.update(delta, worldSpeed);
  cameraProgress = envManager.update(cameraProgress, delta, normalizedSpeed, worldSpeed);

  debug.update();
});

loop.start();
