export type SpeedControllerOptions = {
  min?: number;
  max?: number;
  initial?: number;
  accelRate?: number;
  brakeRate?: number;
  baseWorldSpeed?: number;
  inputStep?: number;
};

export class SpeedController {
  current: number;
  target: number;
  min: number;
  max: number;
  accelRate: number;
  brakeRate: number;
  baseWorldSpeed: number;
  inputStep: number;

  constructor(options?: SpeedControllerOptions);
  setTargetNormalized(v: number): void;
  addInput(delta: number): void;
  update(dt: number): void;
  getNormalizedSpeed(): number;
  getWorldSpeed(): number;
}
