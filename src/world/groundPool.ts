import * as THREE from 'three';
import { appConfig } from '../config';

type GroundPool = {
  group: THREE.Group;
  update: (delta: number, worldSpeed: number) => void;
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

  return {
    group,
    update(delta: number, worldSpeed: number) {
      const effectiveSpeed = appConfig.ground.speed * worldSpeed;
      for (const tile of tiles) {
        tile.position.z += effectiveSpeed * delta;
        if (tile.position.z > recycleZ) {
          const furthestBackZ = tiles.reduce((minZ, currentTile) => {
            return Math.min(minZ, currentTile.position.z);
          }, Infinity);
          tile.position.z = furthestBackZ - tileLength;
        }
      }
    },
  };
}
