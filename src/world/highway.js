import * as THREE from 'three';

export function createHighway(scene) {
  const group = new THREE.Group();

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 300),
    new THREE.MeshStandardMaterial({ color: 0x11151f, roughness: 0.9, metalness: 0.05 })
  );
  road.rotation.x = -Math.PI / 2;
  road.position.z = -120;
  group.add(road);

  const laneMaterial = new THREE.MeshBasicMaterial({ color: 0xfff8dc });
  for (let i = 0; i < 70; i += 1) {
    const lane = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 1.6), laneMaterial);
    lane.rotation.x = -Math.PI / 2;
    lane.position.set(0, 0.01, -i * 4);
    group.add(lane);
  }

  scene.add(group);
  return group;
}
