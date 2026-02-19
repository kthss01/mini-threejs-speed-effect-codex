import * as THREE from 'three';

export const appConfig = {
  lighting: {
    night: {
      hemisphere: {
        skyColor: 0x91a8d6,
        groundColor: 0x111a2d,
        intensity: 0.32,
      },
      moon: {
        color: 0xc8d8ff,
        intensity: 0.48,
        position: new THREE.Vector3(6, 8, 14),
      },
      ambient: {
        color: 0x7f96c2,
        intensity: 0.08,
      },
      fog: {
        color: 0x060b16,
        near: 18,
        far: 150,
      },
      renderer: {
        clearColor: 0x03060f,
      },
    },
  },
  camera: {
    fov: 60,
    near: 0.1,
    far: 500,
    position: new THREE.Vector3(0, 5, 14),
    speedFovBoost: 12,
  },
  speed: {
    minKmh: 0,
    maxKmh: 240,
    initialKmh: 30,
    referenceKmh: 30,
    referenceWorldSpeed: 1.25,
    fovBoostAtMaxKmh: 16,
  },
  ground: {
    tileCount: 12,
    tileLength: 20,
    width: 18,
    speed: 12,
    recycleZ: 24,
    color: 0x1a2235,
    roadStyle: {
      laneWidth: 3.2,
      laneGap: 0.18,
      laneMarkWidth: 0.14,
      laneMarkColor: 0x97a5bf,
      shoulderWidth: 1.3,
      shoulderColor: 0x101827,
      centerLineWidth: 0.24,
      centerLineDashLength: 1.8,
      centerLineGapLength: 1.1,
      centerLineColor: 0xe5ebf8,
      repeatLength: 3,
    },
  },
  debug: {
    debugParallax: false,
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
    maxPixelRatio: 2,
  },
} as const;
