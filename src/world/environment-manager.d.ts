import type * as THREE from 'three';

export type EnvironmentConfig = {
  distanceScale?: number;
  fogFarBase?: number;
  fogFarBoost?: number;
};

type SpeedLinesController = {
  update?: (normalizedSpeed: number, worldSpeed: number) => void;
};

export class EnvironmentManager {
  constructor(scene: THREE.Scene, speedLines?: SpeedLinesController, config?: EnvironmentConfig);
  init(): void;
  update(cameraProgress: number, delta: number, normalizedSpeed: number, worldSpeed: number): number;
}
