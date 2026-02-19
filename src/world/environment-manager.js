export class EnvironmentManager {
  constructor(scene, speedLines, config = {}) {
    this.scene = scene;
    this.speedLines = speedLines;
    this.config = config;
  }

  init() {
    // Placeholder for environment effects initialization.
  }

  update(cameraProgress, delta, worldSpeed) {
    void delta;

    if (this.speedLines && typeof this.speedLines.update === 'function') {
      this.speedLines.update(worldSpeed);
    }

    const distanceScale = this.config?.distanceScale ?? 1;
    return cameraProgress + worldSpeed * delta * distanceScale;
  }
}
