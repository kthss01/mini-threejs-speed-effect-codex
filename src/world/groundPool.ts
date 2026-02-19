import * as THREE from 'three';
import { appConfig } from '../config';

type GroundPool = {
  group: THREE.Group;
  update: (delta: number, speed: number) => void;
};

export function createGroundPool(): GroundPool {
  const { tileCount, tileLength, width, recycleZ, color } = appConfig.ground;

  const group = new THREE.Group();
  const tileGeometry = new THREE.PlaneGeometry(width, tileLength, 1, 8);
  const tileMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0.03 });

  const tiles = Array.from({ length: tileCount }, (_, index) => {
    const tile = new THREE.Mesh(tileGeometry, tileMaterial);
    tile.rotation.x = -Math.PI / 2;
    tile.position.set(0, 0, -index * tileLength);
    group.add(tile);
    return tile;
  });

  const halfLoopDepth = tileCount * tileLength;

  return {
    group,
    update(delta: number, speed: number) {
      for (const tile of tiles) {
        tile.position.z += speed * delta;
        if (tile.position.z > recycleZ) {
          tile.position.z -= halfLoopDepth;
        }
      }
    },
  };
}
