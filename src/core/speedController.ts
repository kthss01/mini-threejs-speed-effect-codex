export type SpeedController = {
  getWorldSpeed: () => number;
  setWorldSpeed: (nextSpeed: number) => void;
};

export function createSpeedController(initialSpeed = 1): SpeedController {
  let worldSpeed = initialSpeed;

  return {
    getWorldSpeed: () => worldSpeed,
    setWorldSpeed(nextSpeed: number) {
      worldSpeed = Math.max(0, nextSpeed);
    },
  };
}
