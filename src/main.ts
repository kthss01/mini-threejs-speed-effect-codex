import './style.css';
import { createSceneBundle } from './core/scene';
import { createRenderLoop } from './core/loop';
import { setupDebugControls } from './input/debugToggle';
import { createEnvironmentManager } from './world/environmentManager';
import { createSpeedController } from './core/speedController';
import { appConfig } from './config';
import { createSpeedHud } from './ui/speedHud';

const container = document.querySelector<HTMLElement>('#app');
if (!container) throw new Error('Missing #app container');

const { scene, camera, renderer, onResize } = createSceneBundle(container);
const speedController = createSpeedController(0);
const environment = createEnvironmentManager({ debugParallax: appConfig.debug.debugParallax });
scene.add(environment.group);

const baseCameraFov = camera.fov;
let currentKmh = appConfig.speed.initialKmh;

const mapKmhToWorldSpeed = (kmh: number) => {
  const { referenceKmh, referenceWorldSpeed } = appConfig.speed;
  const normalizedKmh = Math.max(0, kmh);
  return (normalizedKmh / referenceKmh) * referenceWorldSpeed;
};

const speedHud = createSpeedHud({
  container,
  minKmh: appConfig.speed.minKmh,
  maxKmh: appConfig.speed.maxKmh,
  initialKmh: appConfig.speed.initialKmh,
  onSpeedChange(kmh) {
    currentKmh = kmh;
    speedController.setWorldSpeed(mapKmhToWorldSpeed(kmh));
  },
});

const debug = setupDebugControls(camera, renderer.domElement, scene);

window.addEventListener('resize', onResize);

const handleBeforeUnload = () => {
  speedHud.dispose();
  debug.dispose();
  loop.stop();
  window.removeEventListener('resize', onResize);
  window.removeEventListener('beforeunload', handleBeforeUnload);
};

window.addEventListener('beforeunload', handleBeforeUnload);

const loop = createRenderLoop(renderer, scene, camera, (delta) => {
  const fovRatio = currentKmh / appConfig.speed.maxKmh;
  const targetFov = baseCameraFov + fovRatio * appConfig.speed.fovBoostAtMaxKmh;
  camera.fov += (targetFov - camera.fov) * Math.min(1, delta * 5);
  camera.updateProjectionMatrix();

  environment.update(delta, speedController.getWorldSpeed());
  debug.update();
});

loop.start();
