export class EnvironmentManager {
  constructor(scene, speedLines, config = {}) {
    this.scene = scene;
    this.speedLines = speedLines;
    this.config = {
      distanceScale: 1,
      fogFarBase: 180,
      fogFarBoost: 16,
      ...config,
    };
  }

  init() {
    // Environment hooks can be expanded later as visual systems are added.
  }

  update(cameraProgress, delta, normalizedSpeed, worldSpeed) {
    if (this.speedLines && typeof this.speedLines.update === 'function') {
      this.speedLines.update(normalizedSpeed, worldSpeed);
    }

    const nextProgress = cameraProgress + worldSpeed * delta * this.config.distanceScale;
    const fog = this.scene?.fog;
    if (fog && typeof fog.far === 'number') {
      fog.far = this.config.fogFarBase + normalizedSpeed * this.config.fogFarBoost;
    }

    return nextProgress;
  }
}
