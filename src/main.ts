import './style.css';
import * as THREE from 'three';
import { CinematicCameraRig } from './camera/CinematicCameraRig';
import { appConfig } from './config';
import { createRenderLoop } from './core/loop';
import { createSceneBundle } from './core/scene';
import { createSpeedController } from './core/speedController';
import { createParticleSystem } from './effects/particle-system';
import { createSpeedLinesSystem } from './effects/speed-lines';
import { setupDebugControls } from './input/debugToggle';
import { createSpeedHud } from './ui/speedHud';
import { createEnvironmentManager } from './world/environmentManager';

const container = document.querySelector<HTMLElement>('#app');
if (!container) throw new Error('Missing #app container');

const { scene, camera, renderer, onResize } = createSceneBundle(container);

const mapKmhToWorldSpeed = (kmh: number) => {
  const { referenceKmh, referenceWorldSpeed } = appConfig.speed;
  const normalizedKmh = Math.max(0, kmh);
  return (normalizedKmh / referenceKmh) * referenceWorldSpeed;
};

const speedController = createSpeedController(mapKmhToWorldSpeed(appConfig.speed.initialKmh));
const environment = createEnvironmentManager({ debugParallax: appConfig.debug.debugParallax });
scene.add(environment.group);
const speedLinesSystem = createSpeedLinesSystem(scene, camera, {
  count: 3600,
  color: 0xa6d6ff,
  minLength: 1.5,
  maxLength: 9,
  spreadX: 34,
  spreadY: 18,
  nearDistance: 4,
  farDistance: 260,
  speedScale: 1.4,
});
const particleSystem = createParticleSystem(scene, camera, {
  profile: 'car',
  mode: 'dust',
  nearDistance: 3,
  farDistance: 220,
  count: 12000,
});

const rig = new CinematicCameraRig(camera, 'car');

const applyVehiclePreset = (type: 'car' | 'bike') => {
  rig.setPreset(type);
  particleSystem.setProfile(type);
  particleSystem.setMode(type === 'car' ? 'dust' : 'rain');
};

applyVehiclePreset('car');

const targetTransform = {
  position: new THREE.Vector3(0, 0, 0),
  forward: new THREE.Vector3(0, 0, -1),
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

const debug = setupDebugControls(camera, renderer.domElement, scene, {
  getSpeed: () => speedController.getWorldSpeed(),
  getFovDebugState: () => rig.getFovDebugState(),
});

const handleKeydown = (event: KeyboardEvent) => {
  if (event.code === 'Digit1') applyVehiclePreset('car');
  if (event.code === 'Digit2') applyVehiclePreset('bike');
};

window.addEventListener('keydown', handleKeydown);
window.addEventListener('resize', onResize);

const handleBeforeUnload = () => {
  speedHud.dispose();
  debug.dispose();
  speedLinesSystem.dispose();
  particleSystem.dispose();
  loop.stop();
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('resize', onResize);
  window.removeEventListener('beforeunload', handleBeforeUnload);
};

window.addEventListener('beforeunload', handleBeforeUnload);

const loop = createRenderLoop(renderer, scene, camera, (delta) => {
  const worldSpeed = speedController.getWorldSpeed();
  const streakBoost = Math.min(3.5, 1 + worldSpeed * 0.08);
  rig.update(delta, worldSpeed, targetTransform);
  environment.update(delta, worldSpeed);
  speedLinesSystem.update(delta, worldSpeed * streakBoost, camera);
  particleSystem.update(delta, worldSpeed * streakBoost, camera);
  debug.update();
});

loop.start();
