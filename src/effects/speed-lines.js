import * as THREE from 'three';

export function createSpeedLines(scene, count = 260) {
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    vertices[i * 3 + 0] = (Math.random() - 0.5) * 20;
    vertices[i * 3 + 1] = Math.random() * 6 + 0.2;
    vertices[i * 3 + 2] = -Math.random() * 180;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: 0xaed0ff,
      size: 0.08,
      transparent: true,
      opacity: 0.82,
      depthWrite: false
    })
  );

  scene.add(points);
  return { points, vertices };
}

export function createSlipstreamParticles(scene, count = 140) {
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    vertices[i * 3 + 0] = (Math.random() - 0.5) * 2.6;
    vertices[i * 3 + 1] = 0.2 + Math.random() * 1.2;
    vertices[i * 3 + 2] = Math.random() * 16;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: 0x85b7ff,
      size: 0.05,
      transparent: true,
      opacity: 0.62,
      depthWrite: false
    })
  );

  scene.add(points);
  return { points, vertices };
}
