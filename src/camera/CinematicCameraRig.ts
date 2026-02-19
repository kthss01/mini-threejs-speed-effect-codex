import * as THREE from 'three';

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
  followOffset: THREE.Vector3;
  lookAheadDistance: number;
  followStiffness: number;
  fovBase: number;
  fovBoostAtMaxSpeed: number;
  maxSpeedForFov: number;
  fovLerpSpeed: number;
  shakeAmount: number;
  shakeFrequency: number;
};

type CameraRigPresetInput = keyof typeof CINEMATIC_CAMERA_PRESETS | Partial<CameraRigPreset>;

const CINEMATIC_CAMERA_PRESETS = {
  default: {
    followOffset: new THREE.Vector3(0, 5, 14),
    lookAheadDistance: 10,
    followStiffness: 7,
    fovBase: 60,
    fovBoostAtMaxSpeed: 16,
    maxSpeedForFov: 10,
    fovLerpSpeed: 5,
    shakeAmount: 0.14,
    shakeFrequency: 17,
  },
  action: {
    followOffset: new THREE.Vector3(0, 4.6, 10.5),
    lookAheadDistance: 13,
    followStiffness: 9,
    fovBase: 62,
    fovBoostAtMaxSpeed: 20,
    maxSpeedForFov: 12,
    fovLerpSpeed: 6,
    shakeAmount: 0.22,
    shakeFrequency: 22,
  },
} as const;

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const ORIGIN = new THREE.Vector3(0, 0, 0);
const DEFAULT_FORWARD = new THREE.Vector3(0, 0, -1);

export class CinematicCameraRig {
  private readonly camera: THREE.PerspectiveCamera;
  private preset: CameraRigPreset;

  private readonly followPosition = new THREE.Vector3();
  private readonly lookAtPosition = new THREE.Vector3();
  private readonly desiredPosition = new THREE.Vector3();
  private readonly workingForward = new THREE.Vector3();
  private readonly workingQuaternion = new THREE.Quaternion();
  private readonly workingEuler = new THREE.Euler();
  private readonly rotatedOffset = new THREE.Vector3();
  private readonly shakeOffset = new THREE.Vector3();

  private elapsedTime = 0;

  constructor(camera: THREE.PerspectiveCamera, options?: CameraRigPresetInput) {
    this.camera = camera;
    this.preset = this.resolvePreset(options ?? 'default');
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
    this.applyCameraPose(targetTransform);
  }

  reset(optionalTransform?: Partial<CameraTargetTransform>): void {
    const fallbackPosition = optionalTransform?.position ?? ORIGIN;
    const fallbackForward = optionalTransform?.forward ?? DEFAULT_FORWARD;

    this.followPosition.copy(fallbackPosition).add(this.preset.followOffset);
    this.lookAtPosition.copy(fallbackPosition).addScaledVector(fallbackForward, this.preset.lookAheadDistance);
    this.camera.position.copy(this.followPosition);
    this.camera.lookAt(this.lookAtPosition);
    this.camera.fov = this.preset.fovBase;
    this.camera.updateProjectionMatrix();
    this.elapsedTime = 0;
    this.shakeOffset.set(0, 0, 0);
  }

  private updateFollowSpring(dt: number, targetTransform: CameraTargetTransform): void {
    this.resolveTargetOrientation(targetTransform);

    this.rotatedOffset.copy(this.preset.followOffset).applyQuaternion(this.workingQuaternion);
    this.desiredPosition.copy(targetTransform.position).add(this.rotatedOffset);

    const blend = 1 - Math.exp(-this.preset.followStiffness * dt);
    this.followPosition.lerp(this.desiredPosition, blend);

    this.workingForward.copy(targetTransform.forward).normalize();
    this.lookAtPosition.copy(targetTransform.position).addScaledVector(this.workingForward, this.preset.lookAheadDistance);
  }

  private updateFov(dt: number, speed: number): void {
    const speedRatio = THREE.MathUtils.clamp(speed / this.preset.maxSpeedForFov, 0, 1);
    const targetFov = this.preset.fovBase + speedRatio * this.preset.fovBoostAtMaxSpeed;
    const blend = Math.min(1, dt * this.preset.fovLerpSpeed);

    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, blend);
    this.camera.updateProjectionMatrix();
  }

  private updateShake(speed: number): void {
    const intensity = THREE.MathUtils.clamp(speed / this.preset.maxSpeedForFov, 0, 1) * this.preset.shakeAmount;
    const t = this.elapsedTime * this.preset.shakeFrequency;

    this.shakeOffset.set(Math.sin(t) * intensity, Math.cos(t * 1.37) * intensity * 0.5, 0);
  }

  private applyCameraPose(targetTransform: CameraTargetTransform): void {
    this.camera.position.copy(this.followPosition).add(this.shakeOffset);
    this.camera.up.copy(WORLD_UP);

    this.workingForward.copy(targetTransform.forward).normalize();
    this.lookAtPosition.copy(targetTransform.position).addScaledVector(this.workingForward, this.preset.lookAheadDistance);
    this.camera.lookAt(this.lookAtPosition);
  }

  private resolvePreset(input: CameraRigPresetInput): CameraRigPreset {
    const base = typeof input === 'string' ? CINEMATIC_CAMERA_PRESETS[input] ?? CINEMATIC_CAMERA_PRESETS.default : CINEMATIC_CAMERA_PRESETS.default;
    const override = typeof input === 'string' ? {} : input;

    return {
      followOffset: (override.followOffset ?? base.followOffset).clone(),
      lookAheadDistance: override.lookAheadDistance ?? base.lookAheadDistance,
      followStiffness: override.followStiffness ?? base.followStiffness,
      fovBase: override.fovBase ?? base.fovBase,
      fovBoostAtMaxSpeed: override.fovBoostAtMaxSpeed ?? base.fovBoostAtMaxSpeed,
      maxSpeedForFov: override.maxSpeedForFov ?? base.maxSpeedForFov,
      fovLerpSpeed: override.fovLerpSpeed ?? base.fovLerpSpeed,
      shakeAmount: override.shakeAmount ?? base.shakeAmount,
      shakeFrequency: override.shakeFrequency ?? base.shakeFrequency,
    };
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
