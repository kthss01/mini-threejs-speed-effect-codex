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

const mapKmhToWorldSpeed = (kmh: number) => {
  const ratio = kmh / appConfig.speed.maxKmh;
  return ratio * appConfig.speed.maxWorldSpeed;
};

const speedHud = createSpeedHud({
  container,
  minKmh: appConfig.speed.minKmh,
  maxKmh: appConfig.speed.maxKmh,
  initialKmh: appConfig.speed.initialKmh,
  onSpeedChange(kmh) {
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
  environment.update(delta, speedController.getWorldSpeed());
  debug.update();
});

loop.start();
