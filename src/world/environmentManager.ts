import * as THREE from 'three';
import { appConfig } from '../config';

type EnvironmentManager = {
  group: THREE.Group;
  update: (delta: number, speed: number) => void;
};

type LayerConfig = {
  name: string;
  count: number;
  width: number;
  depthSpacing: number;
  xSpread: number;
  minScale: number;
  maxScale: number;
  color: number;
  speedMultiplier: number;
};

type PooledLayer = {
  config: LayerConfig;
  meshes: THREE.Mesh[];
  recycleDepth: number;
};

function createLayer(config: LayerConfig): PooledLayer {
  const geometry = new THREE.BoxGeometry(config.width, config.width * 2.2, config.width);
  const material = new THREE.MeshStandardMaterial({ color: config.color, roughness: 0.9, metalness: 0.05 });
  const meshes: THREE.Mesh[] = [];

  for (let i = 0; i < config.count; i += 1) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -i * config.depthSpacing - Math.random() * config.depthSpacing;
    mesh.position.x = (Math.random() - 0.5) * config.xSpread;
    mesh.position.y = config.width;

    const scale = THREE.MathUtils.lerp(config.minScale, config.maxScale, Math.random());
    mesh.scale.setScalar(scale);
    meshes.push(mesh);
  }

  return {
    config,
    meshes,
    recycleDepth: config.count * config.depthSpacing,
  };
}

export function createEnvironmentManager(): EnvironmentManager {
  const group = new THREE.Group();

  const layers = appConfig.environment.layers.map(createLayer);
  for (const layer of layers) {
    for (const mesh of layer.meshes) {
      group.add(mesh);
    }
  }

  return {
    group,
    update(delta, speed) {
      for (const layer of layers) {
        const layerSpeed = speed * layer.config.speedMultiplier;

        for (const mesh of layer.meshes) {
          mesh.position.z += layerSpeed * delta;
          if (mesh.position.z > appConfig.environment.recycleZ) {
            mesh.position.z -= layer.recycleDepth;
            mesh.position.x = (Math.random() - 0.5) * layer.config.xSpread;
          }
        }
      }
    },
  };
}
