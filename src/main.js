import './style.css';
import * as THREE from 'three';
import { createEngine } from './core/engine.js';
import { createHighway } from './world/highway.js';
import { createSpeedLines } from './effects/speed-lines.js';
import { clamp, lerp } from './utils/math.js';

const container = document.querySelector('#app');
const { scene, camera, renderer } = createEngine(container);
createHighway(scene);
const speedLines = createSpeedLines(scene);

const stars = new THREE.Mesh(
  new THREE.SphereGeometry(160, 24, 24),
  new THREE.MeshBasicMaterial({ color: 0x0c1224, side: THREE.BackSide })
);
scene.add(stars);

let currentSpeed = 0.25;
let targetSpeed = 0.25;

window.addEventListener('keydown', (event) => {
  if (event.code === 'ArrowUp' || event.code === 'KeyW') targetSpeed += 0.08;
  if (event.code === 'ArrowDown' || event.code === 'KeyS') targetSpeed -= 0.08;
  targetSpeed = clamp(targetSpeed, 0, 1);
});

const clock = new THREE.Clock();

function updateSpeedLines(delta, speed) {
  const positions = speedLines.points.geometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i + 2] += delta * (25 + speed * 95);
    if (positions[i + 2] > 6) {
      positions[i + 2] = -160;
      positions[i] = (Math.random() - 0.5) * 18;
      positions[i + 1] = Math.random() * 6 - 1;
    }
  }
  speedLines.points.geometry.attributes.position.needsUpdate = true;
}

function animate() {
  const delta = clock.getDelta();
  currentSpeed = lerp(currentSpeed, targetSpeed, 0.06);

  const forwardDistance = delta * (10 + currentSpeed * 42);
  camera.position.z -= forwardDistance;

  const fovTarget = lerp(60, 85, currentSpeed);
  camera.fov = lerp(camera.fov, fovTarget, 0.08);
  camera.rotation.z = Math.sin(clock.elapsedTime * 24) * currentSpeed * 0.003;
  camera.updateProjectionMatrix();

  updateSpeedLines(delta, currentSpeed);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
