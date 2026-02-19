export class SpeedController {
  constructor({
    min = 0,
    max = 1,
    initial = 0,
    accelRate = 6,
    brakeRate = 10,
    baseWorldSpeed = 12,
    inputStep = 0.08,
  } = {}) {
    this.min = min;
    this.max = max;
    this.current = this.#clamp(initial);
    this.target = this.current;
    this.accelRate = accelRate;
    this.brakeRate = brakeRate;
    this.baseWorldSpeed = baseWorldSpeed;
    this.inputStep = inputStep;
  }

  setTargetNormalized(v) {
    this.target = this.#clamp(v);
  }

  addInput(delta) {
    this.setTargetNormalized(this.target + delta * this.inputStep);
  }

  update(dt) {
    const difference = this.target - this.current;
    if (Math.abs(difference) < 1e-5) {
      this.current = this.target;
      return;
    }

    const rate = difference > 0 ? this.accelRate : this.brakeRate;
    const smoothing = 1 - Math.exp(-rate * dt);
    this.current += difference * smoothing;
  }

  getNormalizedSpeed() {
    return this.#clamp(this.current);
  }

  getWorldSpeed() {
    const normalized = this.getNormalizedSpeed();
    return this.baseWorldSpeed * (0.4 + normalized * 1.6);
  }

  #clamp(value) {
    return Math.min(this.max, Math.max(this.min, value));
  }
}
