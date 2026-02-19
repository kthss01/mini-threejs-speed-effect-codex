import * as THREE from 'three';

export function createHighway(scene, laneCount = 70) {
  const group = new THREE.Group();

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 420),
    new THREE.MeshStandardMaterial({ color: 0x11151f, roughness: 0.9, metalness: 0.05 })
  );
  road.rotation.x = -Math.PI / 2;
  road.position.z = -180;
  group.add(road);

  const laneMaterial = new THREE.MeshBasicMaterial({ color: 0xfff8dc });
  const laneStrips = [];
  for (let i = 0; i < laneCount; i += 1) {
    const lane = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 1.8), laneMaterial);
    lane.rotation.x = -Math.PI / 2;
    lane.position.set(0, 0.01, -i * 6);
    laneStrips.push(lane);
    group.add(lane);
  }

  scene.add(group);
  return { group, laneStrips, laneSpacing: 6 };
}

export function createParallaxObjects(scene, count = 90) {
  const group = new THREE.Group();
  const objects = [];

  for (let i = 0; i < count; i += 1) {
    const isLamp = i % 3 === 0;
    const nearRoad = i % 4 !== 0;
    const x = (nearRoad ? 5.5 : 10 + Math.random() * 8) * (i % 2 === 0 ? -1 : 1);
    const z = -Math.random() * 420;

    const mesh = isLamp
      ? new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.08, 5.5, 8),
          new THREE.MeshStandardMaterial({ color: 0x7a869b, roughness: 0.5, metalness: 0.4 })
        )
      : new THREE.Mesh(
          new THREE.BoxGeometry(1.4 + Math.random() * 2.2, 1 + Math.random() * 3, 1.4 + Math.random() * 2),
          new THREE.MeshStandardMaterial({ color: nearRoad ? 0x22304a : 0x1a2638, roughness: 0.7, metalness: 0.1 })
        );

    mesh.position.set(x, isLamp ? 2.7 : 0.8 + Math.random() * 1.8, z);
    group.add(mesh);
    objects.push({ mesh, nearFactor: nearRoad ? 1 : 0.55 });
  }

  scene.add(group);
  return { group, objects, depth: 420 };
}
