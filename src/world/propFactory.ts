import * as THREE from 'three';
import type { LayerId } from './parallax-layers';

export type PropType = 'building' | 'tree' | 'streetLight' | 'sign';

export type PropMaterialFactory = (baseColor: THREE.ColorRepresentation) => THREE.MeshStandardMaterial;

export type PropMeshInstance = {
  object: THREE.Object3D;
  type: PropType;
  tintMaterials: THREE.MeshStandardMaterial[];
};

function createMesh(
  geometry: THREE.BufferGeometry,
  color: THREE.ColorRepresentation,
  materialFactory: PropMaterialFactory,
  tintMaterials: THREE.MeshStandardMaterial[],
): THREE.Mesh {
  const material = materialFactory(color);
  tintMaterials.push(material);
  return new THREE.Mesh(geometry, material);
}

function createBuilding(materialFactory: PropMaterialFactory, tintMaterials: THREE.MeshStandardMaterial[]): THREE.Object3D {
  const root = new THREE.Group();

  const width = THREE.MathUtils.randFloat(0.75, 1.1);
  const depth = THREE.MathUtils.randFloat(0.7, 1.05);
  const height = THREE.MathUtils.randFloat(3.8, 6.6);

  const body = createMesh(new THREE.BoxGeometry(width, height, depth), 0x5f6e86, materialFactory, tintMaterials);
  body.position.y = height / 2;
  root.add(body);

  const emissiveMaterial = materialFactory(0x9fc4ff);
  emissiveMaterial.emissive.setHex(0xa7d5ff);
  emissiveMaterial.emissiveIntensity = THREE.MathUtils.randFloat(0.12, 0.35);
  tintMaterials.push(emissiveMaterial);

  const windowRows = Math.max(3, Math.floor(height * 1.1));
  const windowCols = 2;
  for (let row = 0; row < windowRows; row += 1) {
    for (let col = 0; col < windowCols; col += 1) {
      if (Math.random() < 0.45) {
        continue;
      }
      const windowPane = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.02), emissiveMaterial);
      const x = (col === 0 ? -1 : 1) * width * 0.24;
      const y = 0.35 + row * (height - 0.7) / windowRows;
      const z = depth / 2 + 0.005;
      windowPane.position.set(x, y, z);
      root.add(windowPane);
    }
  }

  return root;
}

function createTree(materialFactory: PropMaterialFactory, tintMaterials: THREE.MeshStandardMaterial[]): THREE.Object3D {
  const root = new THREE.Group();

  const trunkHeight = THREE.MathUtils.randFloat(0.8, 1.2);
  const trunk = createMesh(new THREE.CylinderGeometry(0.08, 0.11, trunkHeight, 8), 0x4f3928, materialFactory, tintMaterials);
  trunk.position.y = trunkHeight / 2;
  root.add(trunk);

  const foliageIsCone = Math.random() > 0.45;
  const foliageGeometry = foliageIsCone
    ? new THREE.ConeGeometry(0.45, THREE.MathUtils.randFloat(0.8, 1.25), 10)
    : new THREE.SphereGeometry(0.45, 10, 8);
  const foliage = createMesh(foliageGeometry, 0x2d7c49, materialFactory, tintMaterials);
  foliage.position.y = trunkHeight + (foliageIsCone ? 0.48 : 0.4);
  root.add(foliage);

  return root;
}

function createStreetLight(materialFactory: PropMaterialFactory, tintMaterials: THREE.MeshStandardMaterial[]): THREE.Object3D {
  const root = new THREE.Group();

  const poleHeight = THREE.MathUtils.randFloat(1.9, 2.6);
  const pole = createMesh(new THREE.CylinderGeometry(0.04, 0.05, poleHeight, 8), 0x8f98a6, materialFactory, tintMaterials);
  pole.position.y = poleHeight / 2;
  root.add(pole);

  const arm = createMesh(new THREE.BoxGeometry(0.45, 0.05, 0.05), 0x97a3b5, materialFactory, tintMaterials);
  arm.position.set(0.2, poleHeight - 0.1, 0);
  root.add(arm);

  const bulb = createMesh(new THREE.SphereGeometry(0.07, 8, 6), 0xf8e2aa, materialFactory, tintMaterials);
  bulb.position.set(0.42, poleHeight - 0.16, 0);
  bulb.material.emissive.setHex(0xffd88a);
  bulb.material.emissiveIntensity = THREE.MathUtils.randFloat(0.28, 0.6);
  root.add(bulb);

  return root;
}

function createSign(materialFactory: PropMaterialFactory, tintMaterials: THREE.MeshStandardMaterial[]): THREE.Object3D {
  const root = new THREE.Group();

  const poleHeight = THREE.MathUtils.randFloat(1.0, 1.6);
  const pole = createMesh(new THREE.CylinderGeometry(0.035, 0.04, poleHeight, 8), 0x7f8794, materialFactory, tintMaterials);
  pole.position.y = poleHeight / 2;
  root.add(pole);

  const panelWidth = THREE.MathUtils.randFloat(0.55, 0.95);
  const panel = createMesh(new THREE.BoxGeometry(panelWidth, 0.35, 0.08), 0x397bc6, materialFactory, tintMaterials);
  panel.position.set(0, poleHeight + 0.25, 0);
  root.add(panel);

  return root;
}

export function createPropMesh(type: PropType, _layerId: LayerId, materialFactory: PropMaterialFactory): PropMeshInstance {
  const tintMaterials: THREE.MeshStandardMaterial[] = [];

  const object =
    type === 'building'
      ? createBuilding(materialFactory, tintMaterials)
      : type === 'tree'
        ? createTree(materialFactory, tintMaterials)
        : type === 'streetLight'
          ? createStreetLight(materialFactory, tintMaterials)
          : createSign(materialFactory, tintMaterials);

  return {
    object,
    type,
    tintMaterials,
  };
}
