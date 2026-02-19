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
  },
  ground: {
    tileCount: 12,
    tileLength: 20,
    width: 18,
    speed: 12,
    recycleZ: 12,
    color: 0x1a2235,
  },

  environment: {
    seed: 1337,
    initRange: { near: 40, far: 220 },
    recycleThreshold: 10,
    layers: {
      near: {
        types: ['guardrail', 'sign'],
        laneOffset: [5, 7],
        spacingRange: [8, 14],
        yRange: [0.5, 1.8],
      },
      mid: {
        types: ['tree', 'pole'],
        laneOffset: [8, 11],
        spacingRange: [14, 24],
        yRange: [0.5, 3],
      },
      far: {
        types: ['silhouette'],
        laneOffset: [12, 18],
        spacingRange: [24, 40],
        yRange: [0.5, 4.5],
      },
    },
  },
  renderer: {
    clearColor: 0x070b14,
    maxPixelRatio: 2,
  },
} as const;
