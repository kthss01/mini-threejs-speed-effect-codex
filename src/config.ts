import * as THREE from 'three';

const parallaxLayers = {
  near: 1.8,
  mid: 1.1,
  far: 0.65,
} as const;

export const appConfig = {
  fog: {
    color: 0x0a1020,
    near: 20,
    far: 220,
  },
  camera: {
    fov: 60,
    near: 0.1,
    far: 500,
    position: new THREE.Vector3(0, 5, 14),
  },
  speed: {
    baseSpeed: 28,
    minSpeed: 18,
    maxSpeed: 46,
    waveAmplitude: 10,
    waveFrequency: 0.35,
    acceleration: 3,
    deceleration: 4,
  },
  parallaxLayers,
  cameraEffects: {
    baseFov: 60,
    maxFovBoost: 16,
    fovLerp: 3,
    shakeAmplitudeX: 0.08,
    shakeAmplitudeY: 0.04,
    shakeFrequencyX: 19,
    shakeFrequencyY: 14,
  },
  ground: {
    tileCount: 12,
    tileLength: 20,
    width: 18,
    recycleZ: 12,
    color: 0x1a2235,
  },
  environment: {
    recycleZ: 16,
    layers: [
      {
        name: 'near',
        count: 24,
        width: 1.2,
        depthSpacing: 12,
        xSpread: 16,
        minScale: 0.8,
        maxScale: 1.5,
        color: 0x314f8f,
        speedMultiplier: parallaxLayers.near,
      },
      {
        name: 'mid',
        count: 20,
        width: 2.1,
        depthSpacing: 20,
        xSpread: 34,
        minScale: 0.9,
        maxScale: 1.6,
        color: 0x253a68,
        speedMultiplier: parallaxLayers.mid,
      },
      {
        name: 'far',
        count: 14,
        width: 3.4,
        depthSpacing: 34,
        xSpread: 56,
        minScale: 0.95,
        maxScale: 1.7,
        color: 0x1d2c4a,
        speedMultiplier: parallaxLayers.far,
      },
    ],
  },
  renderer: {
    clearColor: 0x070b14,
    maxPixelRatio: 2,
  },
} as const;
