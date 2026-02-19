import * as THREE from 'three';
import { appConfig } from '../config';

type SpeedController = {
  update: (delta: number, elapsed: number) => void;
  getSpeed: () => number;
  getNormalizedSpeed: () => number;
  applyCameraEffects: (camera: THREE.PerspectiveCamera, delta: number) => void;
};

export function createSpeedController(): SpeedController {
  const { baseSpeed, minSpeed, maxSpeed, waveAmplitude, waveFrequency, acceleration, deceleration } = appConfig.speed;
  const { baseFov, maxFovBoost, fovLerp, shakeAmplitudeX, shakeAmplitudeY, shakeFrequencyX, shakeFrequencyY } = appConfig.cameraEffects;

  let currentSpeed = baseSpeed;
  let targetSpeed = baseSpeed;

  return {
    update(delta, elapsed) {
      targetSpeed = THREE.MathUtils.clamp(baseSpeed + Math.sin(elapsed * waveFrequency) * waveAmplitude, minSpeed, maxSpeed);

      const response = targetSpeed >= currentSpeed ? acceleration : deceleration;
      currentSpeed = THREE.MathUtils.lerp(currentSpeed, targetSpeed, 1 - Math.exp(-response * delta));
    },
    getSpeed() {
      return currentSpeed;
    },
    getNormalizedSpeed() {
      return THREE.MathUtils.inverseLerp(minSpeed, maxSpeed, currentSpeed);
    },
    applyCameraEffects(camera, delta) {
      const normalized = THREE.MathUtils.inverseLerp(minSpeed, maxSpeed, currentSpeed);
      const targetFov = baseFov + normalized * maxFovBoost;
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 1 - Math.exp(-fovLerp * delta));

      const shakeScale = normalized * normalized;
      camera.position.x = Math.sin(performance.now() * 0.001 * shakeFrequencyX) * shakeAmplitudeX * shakeScale;
      camera.position.y = appConfig.camera.position.y + Math.sin(performance.now() * 0.001 * shakeFrequencyY) * shakeAmplitudeY * shakeScale;
      camera.updateProjectionMatrix();
    },
  };
}
