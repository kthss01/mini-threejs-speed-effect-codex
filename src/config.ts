import * as THREE from 'three';

export const appConfig = {
  fog: {
    color: 0x0a1020,
    near: 20,
    far: 180,
  },
  camera: {
    fov: 60,
    near: 0.1,
    far: 500,
    position: new THREE.Vector3(0, 5, 14),
    speedFovBoost: 12,
  },
  speed: {
    min: 0,
    max: 1,
    initial: 0.45,
    accelRate: 5,
    brakeRate: 8,
    baseWorldSpeed: 12,
    inputStep: 0.08,
  },
  environment: {
    distanceScale: 1,
    fogFarBase: 180,
    fogFarBoost: 16,
  },
  ground: {
    tileCount: 12,
    tileLength: 20,
    width: 18,
    speed: 12,
    recycleZ: 12,
    color: 0x1a2235,
  },
  renderer: {
    clearColor: 0x070b14,
    maxPixelRatio: 2,
  },
} as const;
