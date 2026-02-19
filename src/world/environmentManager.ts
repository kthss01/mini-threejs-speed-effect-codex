import * as THREE from 'three';
import { createGroundPool } from './groundPool';
import { createParallaxLayers, type ParallaxLayersOptions } from './parallax-layers';

export type EnvironmentManager = {
  group: THREE.Group;
  update: (delta: number, worldSpeed: number) => void;
};

export function createEnvironmentManager(options: ParallaxLayersOptions = {}): EnvironmentManager {
  const group = new THREE.Group();
  const groundPool = createGroundPool();
  const parallax = createParallaxLayers(options);

  group.add(groundPool.group, parallax.group);

  return {
    group,
    update(delta: number, worldSpeed: number) {
      groundPool.update(delta, worldSpeed);
      parallax.update(delta, worldSpeed);
    },
  };
}
