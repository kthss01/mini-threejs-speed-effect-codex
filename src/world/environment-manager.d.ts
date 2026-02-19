import type * as THREE from 'three';

export type EnvironmentConfig = {
  distanceScale?: number;
};

type SpeedLinesController = {
  update?: (worldSpeed: number) => void;
};

export class EnvironmentManager {
  constructor(scene: THREE.Scene, speedLines?: SpeedLinesController, config?: EnvironmentConfig);
  init(): void;
  update(cameraProgress: number, delta: number, worldSpeed: number): number;
}
