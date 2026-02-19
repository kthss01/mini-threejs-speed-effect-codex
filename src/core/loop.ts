import * as THREE from 'three';

type Updater = (delta: number, elapsed: number) => void;

export function createRenderLoop(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, update: Updater) {
  const clock = new THREE.Clock();
  let rafId = 0;

  const tick = () => {
    const delta = clock.getDelta();
    const elapsed = clock.elapsedTime;
    update(delta, elapsed);
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  };

  return {
    start() {
      if (!rafId) {
        rafId = requestAnimationFrame(tick);
      }
    },
    stop() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    },
  };
}
