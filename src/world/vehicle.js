import * as THREE from 'three';

export function createVehicle(scene) {
  const vehicle = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.42, 2.7),
    new THREE.MeshStandardMaterial({ color: 0xef3e66, roughness: 0.5, metalness: 0.35 })
  );
  body.position.y = 0.46;

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.35, 1.2),
    new THREE.MeshStandardMaterial({ color: 0xc7d8ff, roughness: 0.2, metalness: 0.75 })
  );
  cabin.position.set(0, 0.78, -0.15);

  const wheelGeometry = new THREE.CylinderGeometry(0.24, 0.24, 0.25, 14);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x191c24, roughness: 0.85 });
  const wheelOffsets = [
    [-0.65, 0.24, 0.82],
    [0.65, 0.24, 0.82],
    [-0.65, 0.24, -0.82],
    [0.65, 0.24, -0.82]
  ];

  const wheels = wheelOffsets.map((offset) => {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(offset[0], offset[1], offset[2]);
    vehicle.add(wheel);
    return wheel;
  });

  vehicle.add(body, cabin);
  scene.add(vehicle);

  return { vehicle, wheels };
}
