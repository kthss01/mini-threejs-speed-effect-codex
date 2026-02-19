import * as THREE from 'three';
import { CAMERA_PRESETS, type CameraPresetName, type CameraRigPresetConfig } from './cameraPresets';

/**
 * Camera tracking input.
 * Must include at least: { position, forward, rotation|quaternion(optional) }.
 */
export type CameraTargetTransform = {
  position: THREE.Vector3;
  rotation?: THREE.Euler;
  quaternion?: THREE.Quaternion;
  forward: THREE.Vector3;
};

type CameraRigPreset = {
  offset: THREE.Vector3;
  lookAtOffset: THREE.Vector3;
  lookAhead: number;
  springStrength: number;
  damping: number;
  fovRange: {
    base: number;
    max: number;
    speedForMax: number;
    response: number;
  };
  shakeScale: number;
  shakeFrequency: number;
};

export type CameraRigFovDebugState = {
  speed: number;
  normalizedSpeed: number;
  targetFov: number;
  actualFov: number;
};

type CameraRigPresetInput = CameraPresetName | Partial<CameraRigPresetConfig>;

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const ORIGIN = new THREE.Vector3(0, 0, 0);
const DEFAULT_FORWARD = new THREE.Vector3(0, 0, -1);

export class CinematicCameraRig {
  private readonly camera: THREE.PerspectiveCamera;
  private preset: CameraRigPreset;

  private readonly currentPosition = new THREE.Vector3();
  private readonly positionVelocity = new THREE.Vector3();
  private readonly currentLookAt = new THREE.Vector3();
  private readonly currentQuaternion = new THREE.Quaternion();
  private readonly desiredQuaternion = new THREE.Quaternion();
  private readonly cameraLookMatrix = new THREE.Matrix4();
  private readonly lookAtPosition = new THREE.Vector3();
  private readonly desiredPosition = new THREE.Vector3();
  private readonly workingForward = new THREE.Vector3();
  private readonly workingQuaternion = new THREE.Quaternion();
  private readonly workingEuler = new THREE.Euler();
  private readonly rotatedOffset = new THREE.Vector3();
  private readonly shakeOffset = new THREE.Vector3();
  private readonly fovDebugState: CameraRigFovDebugState = {
    speed: 0,
    normalizedSpeed: 0,
    targetFov: 60,
    actualFov: 60,
  };

  private elapsedTime = 0;

  constructor(camera: THREE.PerspectiveCamera, options?: CameraRigPresetInput) {
    this.camera = camera;
    this.preset = this.resolvePreset(options ?? 'fallback');
    this.reset();
  }

  setPreset(presetNameOrConfig: CameraRigPresetInput): void {
    this.preset = this.resolvePreset(presetNameOrConfig);
  }

  update(dt: number, speed: number, targetTransform: CameraTargetTransform): void {
    if (dt <= 0) return;

    this.elapsedTime += dt;
    this.updateFollowSpring(dt, targetTransform);
    this.updateFov(dt, speed);
    this.updateShake(speed);
    this.applyCameraPose(dt, targetTransform);
  }

  reset(optionalTransform?: Partial<CameraTargetTransform>): void {
    const fallbackPosition = optionalTransform?.position ?? ORIGIN;
    const fallbackForward = optionalTransform?.forward ?? DEFAULT_FORWARD;

    this.currentPosition.copy(fallbackPosition).add(this.preset.offset);
    this.positionVelocity.set(0, 0, 0);

    this.lookAtPosition.copy(fallbackPosition)
      .add(this.preset.lookAtOffset)
      .addScaledVector(fallbackForward, this.preset.lookAhead);
    this.currentLookAt.copy(this.lookAtPosition);
    this.cameraLookMatrix.lookAt(this.currentPosition, this.currentLookAt, WORLD_UP);
    this.currentQuaternion.setFromRotationMatrix(this.cameraLookMatrix);

    this.camera.position.copy(this.currentPosition);
    this.camera.quaternion.copy(this.currentQuaternion);
    this.camera.fov = this.preset.fovRange.base;
    this.camera.updateProjectionMatrix();
    this.elapsedTime = 0;
    this.shakeOffset.set(0, 0, 0);
    this.fovDebugState.speed = 0;
    this.fovDebugState.normalizedSpeed = 0;
    this.fovDebugState.targetFov = this.preset.fovRange.base;
    this.fovDebugState.actualFov = this.camera.fov;
  }

  getFovDebugState(): CameraRigFovDebugState {
    return { ...this.fovDebugState };
  }

  private updateFollowSpring(dt: number, targetTransform: CameraTargetTransform): void {
    this.resolveTargetOrientation(targetTransform);

    this.rotatedOffset.copy(this.preset.offset).applyQuaternion(this.workingQuaternion);
    this.desiredPosition.copy(targetTransform.position).add(this.rotatedOffset);
    this.smoothDampVector(this.currentPosition, this.desiredPosition, this.positionVelocity, this.preset.springStrength, this.preset.damping, dt);

    this.workingForward.copy(targetTransform.forward).normalize();
    this.lookAtPosition.copy(targetTransform.position)
      .add(this.preset.lookAtOffset)
      .addScaledVector(this.workingForward, this.preset.lookAhead);
    this.currentLookAt.lerp(this.lookAtPosition, 1 - Math.exp(-this.preset.springStrength * dt));
  }

  private updateFov(dt: number, speed: number): void {
    const speedRatio = THREE.MathUtils.clamp(speed / this.preset.fovRange.speedForMax, 0, 1);
    const easedSpeed = speedRatio * speedRatio * (3 - 2 * speedRatio);
    const targetFov = THREE.MathUtils.lerp(this.preset.fovRange.base, this.preset.fovRange.max, easedSpeed);
    const blend = 1 - Math.exp(-this.preset.fovRange.response * dt);

    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, blend);
    this.camera.updateProjectionMatrix();

    this.fovDebugState.speed = speed;
    this.fovDebugState.normalizedSpeed = speedRatio;
    this.fovDebugState.targetFov = targetFov;
    this.fovDebugState.actualFov = this.camera.fov;
  }

  private updateShake(speed: number): void {
    const intensity = THREE.MathUtils.clamp(speed / this.preset.fovRange.speedForMax, 0, 1) * this.preset.shakeScale;
    const t = this.elapsedTime * this.preset.shakeFrequency;

    this.shakeOffset.set(Math.sin(t) * intensity, Math.cos(t * 1.37) * intensity * 0.5, 0);
  }

  private applyCameraPose(dt: number, targetTransform: CameraTargetTransform): void {
    const clippedPosition = this.applyCameraCollisionCorrection(this.currentPosition, this.currentLookAt, targetTransform);

    this.camera.position.copy(clippedPosition).add(this.shakeOffset);
    this.camera.up.copy(WORLD_UP);

    this.cameraLookMatrix.lookAt(this.camera.position, this.currentLookAt, WORLD_UP);
    this.desiredQuaternion.setFromRotationMatrix(this.cameraLookMatrix);
    this.currentQuaternion.slerp(this.desiredQuaternion, 1 - Math.exp(-this.preset.springStrength * dt));
    this.camera.quaternion.copy(this.currentQuaternion);
  }

  private resolvePreset(input: CameraRigPresetInput): CameraRigPreset {
    const base = typeof input === 'string' ? CAMERA_PRESETS[input] ?? CAMERA_PRESETS.fallback : CAMERA_PRESETS.fallback;
    const override = typeof input === 'string' ? {} : input;

    return {
      offset: (override.offset ?? base.offset).clone(),
      lookAtOffset: (override.lookAtOffset ?? base.lookAtOffset).clone(),
      lookAhead: override.lookAhead ?? base.lookAhead,
      springStrength: override.springStrength ?? base.springStrength,
      damping: override.damping ?? base.damping,
      fovRange: {
        base: override.fovRange?.base ?? base.fovRange.base,
        max: override.fovRange?.max ?? base.fovRange.max,
        speedForMax: override.fovRange?.speedForMax ?? base.fovRange.speedForMax,
        response: override.fovRange?.response ?? base.fovRange.response,
      },
      shakeScale: override.shakeScale ?? base.shakeScale,
      shakeFrequency: override.shakeFrequency ?? base.shakeFrequency,
    };
  }

  private smoothDampVector(
    current: THREE.Vector3,
    target: THREE.Vector3,
    velocity: THREE.Vector3,
    springStrength: number,
    damping: number,
    dt: number,
  ): void {
    const smoothTime = Math.max(0.01, 1 / Math.max(springStrength, 0.0001));
    const omega = 2 / smoothTime;
    const x = omega * dt;
    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);

    const deltaX = current.x - target.x;
    const deltaY = current.y - target.y;
    const deltaZ = current.z - target.z;

    const tempX = (velocity.x + omega * deltaX) * dt;
    const tempY = (velocity.y + omega * deltaY) * dt;
    const tempZ = (velocity.z + omega * deltaZ) * dt;

    velocity.x = (velocity.x - omega * tempX) * exp;
    velocity.y = (velocity.y - omega * tempY) * exp;
    velocity.z = (velocity.z - omega * tempZ) * exp;

    const dampingFactor = Math.exp(-Math.max(damping, 0) * dt);
    velocity.multiplyScalar(dampingFactor);

    current.x = target.x + (deltaX + tempX) * exp;
    current.y = target.y + (deltaY + tempY) * exp;
    current.z = target.z + (deltaZ + tempZ) * exp;
  }

  private applyCameraCollisionCorrection(
    desiredCameraPosition: THREE.Vector3,
    _lookAt: THREE.Vector3,
    _targetTransform: CameraTargetTransform,
  ): THREE.Vector3 {
    // Hook point for future world-geometry clipping/collision correction.
    return desiredCameraPosition;
  }

  private resolveTargetOrientation(targetTransform: CameraTargetTransform): void {
    if (targetTransform.quaternion) {
      this.workingQuaternion.copy(targetTransform.quaternion);
      return;
    }

    if (targetTransform.rotation) {
      this.workingEuler.copy(targetTransform.rotation);
      this.workingQuaternion.setFromEuler(this.workingEuler);
      return;
    }

    this.workingForward.copy(targetTransform.forward).normalize();
    this.workingQuaternion.setFromUnitVectors(DEFAULT_FORWARD, this.workingForward);
  }
}
