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
  },
  ground: {
    tileCount: 12,
    tileLength: 20,
    width: 18,
    speed: 28,
    recycleZ: 12,
    color: 0x1a2235,
  },
  debug: {
    debugParallax: false,
  },
  renderer: {
    clearColor: 0x070b14,
    maxPixelRatio: 2,
  },
} as const;
