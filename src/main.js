import './style.css';
import * as THREE from 'three';
import { createEngine } from './core/engine.js';
import { createHighway, createParallaxObjects } from './world/highway.js';
import { createVehicle } from './world/vehicle.js';
import { createSpeedLines, createSlipstreamParticles } from './effects/speed-lines.js';
import { clamp, lerp } from './utils/math.js';

const container = document.querySelector('#app');
const { scene, camera, renderer } = createEngine(container);

const hud = document.createElement('div');
hud.className = 'hud';
container.appendChild(hud);
const highway = createHighway(scene);
const parallax = createParallaxObjects(scene);
const { vehicle, wheels } = createVehicle(scene);
const speedLines = createSpeedLines(scene);
const slipstream = createSlipstreamParticles(scene);

const stars = new THREE.Mesh(
  new THREE.SphereGeometry(180, 24, 24),
  new THREE.MeshBasicMaterial({ color: 0x0b1225, side: THREE.BackSide })
);
scene.add(stars);

let currentSpeed = 0.25;
let targetSpeed = 0.25;
const keys = new Set();

window.addEventListener('keydown', (event) => keys.add(event.code));
window.addEventListener('keyup', (event) => keys.delete(event.code));

const clock = new THREE.Clock();

function updateInputs(delta) {
  const acceleration = (keys.has('ArrowUp') || keys.has('KeyW')) ? 0.7 : 0;
  const brake = (keys.has('ArrowDown') || keys.has('KeyS')) ? 1.2 : 0;
  const drag = targetSpeed > 0.2 ? 0.16 : 0.08;

  targetSpeed += acceleration * delta;
  targetSpeed -= brake * delta;
  targetSpeed -= drag * delta;
  targetSpeed = clamp(targetSpeed, 0.08, 1);
}

function updateRoad(speed, delta) {
  const travel = delta * (32 + speed * 80);
  for (const lane of highway.laneStrips) {
    lane.position.z += travel;
    if (lane.position.z > 12) lane.position.z -= highway.laneStrips.length * highway.laneSpacing;
  }
}

function updateParallax(speed, delta) {
  const nearVelocity = 35 + speed * 160;
  const farVelocity = 24 + speed * 110;
  for (const item of parallax.objects) {
    const velocity = lerp(farVelocity, nearVelocity, item.nearFactor);
    item.mesh.position.z += velocity * delta;
    if (item.mesh.position.z > 18) item.mesh.position.z -= parallax.depth + Math.random() * 40;
  }
}

function updateSpeedLines(delta, speed) {
  const positions = speedLines.points.geometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i + 2] += delta * (25 + speed * 160);
    if (positions[i + 2] > 10) {
      positions[i + 2] = -180;
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i + 1] = Math.random() * 6 + 0.2;
    }
  }

  speedLines.points.material.opacity = lerp(0.15, 0.9, speed);
  speedLines.points.geometry.attributes.position.needsUpdate = true;
}

function updateSlipstream(delta, speed) {
  const positions = slipstream.points.geometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i + 2] += delta * (18 + speed * 120);
    if (positions[i + 2] > 8) {
      positions[i + 2] = -8 - Math.random() * 10;
      positions[i] = (Math.random() - 0.5) * 2.8;
      positions[i + 1] = 0.15 + Math.random() * 1.4;
    }
  }

  slipstream.points.position.z = 2;
  slipstream.points.material.opacity = lerp(0.05, 0.65, speed);
  slipstream.points.geometry.attributes.position.needsUpdate = true;
}

function updateVehicle(delta, speed) {
  const roll = speed * 25 * delta;
  for (const wheel of wheels) wheel.rotation.x -= roll;

  vehicle.position.y = 0.02 + Math.sin(clock.elapsedTime * 16) * speed * 0.015;
  vehicle.rotation.z = Math.sin(clock.elapsedTime * 22) * speed * 0.01;
  vehicle.rotation.x = -speed * 0.03;
}

function updateCamera(delta, speed) {
  const fovTarget = lerp(60, 84, speed);
  const shake = speed * 0.005;
  camera.fov = lerp(camera.fov, fovTarget, 0.07);
  camera.position.x = Math.sin(clock.elapsedTime * 26) * shake;
  camera.position.y = lerp(camera.position.y, 2.1 + speed * 0.4, 0.08);
  camera.position.z = lerp(camera.position.z, 8.2 - speed * 1.8, 0.08);
  camera.lookAt(0, 0.7, -6);
  camera.rotation.z = Math.sin(clock.elapsedTime * 24) * speed * 0.002;
  camera.updateProjectionMatrix();

  const hue = 220 - speed * 14;
  renderer.domElement.style.filter = `saturate(${1 + speed * 0.5}) contrast(${1 + speed * 0.22}) hue-rotate(${hue - 220}deg)`;

  if (delta > 0.03) {
    speedLines.points.material.opacity *= 0.9;
  }
}

function animate() {
  const delta = clock.getDelta();

  updateInputs(delta);
  currentSpeed = lerp(currentSpeed, targetSpeed, 0.08);

  updateRoad(currentSpeed, delta);
  updateParallax(currentSpeed, delta);
  updateSpeedLines(delta, currentSpeed);
  updateSlipstream(delta, currentSpeed);
  updateVehicle(delta, currentSpeed);
  updateCamera(delta, currentSpeed);

  hud.textContent = `SPEED ${(currentSpeed * 320).toFixed(0)} km/h`;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
