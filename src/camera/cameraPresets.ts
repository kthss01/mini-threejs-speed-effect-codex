import * as THREE from 'three';

export type CameraRigPresetConfig = {
  offset: THREE.Vector3;
  lookAtOffset: THREE.Vector3;
  lookAhead: number;
  springStrength: number;
  damping: number;
  fovRange: {
    base: number;
    max: number;
    speedForMax: number;
    response: number;
  };
  shakeScale: number;
  shakeFrequency: number;
};

export const CAMERA_PRESETS = {
  fallback: {
    offset: new THREE.Vector3(0, 5, 14),
    lookAtOffset: new THREE.Vector3(0, 1.2, 0),
    lookAhead: 10,
    springStrength: 7,
    damping: 5,
    fovRange: {
      base: 60,
      max: 75,
      speedForMax: 10,
      response: 5,
    },
    shakeScale: 0.14,
    shakeFrequency: 17,
  },
  car: {
    offset: new THREE.Vector3(0, 3.4, 9.8),
    lookAtOffset: new THREE.Vector3(0, 1.1, 0),
    lookAhead: 13,
    springStrength: 9,
    damping: 6,
    fovRange: {
      base: 61,
      max: 81,
      speedForMax: 11,
      response: 5.5,
    },
    shakeScale: 0.18,
    shakeFrequency: 20,
  },
  bike: {
    offset: new THREE.Vector3(0, 4.3, 8.4),
    lookAtOffset: new THREE.Vector3(0, 1.35, 0),
    lookAhead: 11,
    springStrength: 10,
    damping: 7,
    fovRange: {
      base: 63,
      max: 84,
      speedForMax: 12,
      response: 6.5,
    },
    shakeScale: 0.2,
    shakeFrequency: 22,
  },
} as const satisfies Record<string, CameraRigPresetConfig>;

export type CameraPresetName = keyof typeof CAMERA_PRESETS;
