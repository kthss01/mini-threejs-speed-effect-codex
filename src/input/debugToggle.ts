import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';
import type { CameraRigFovDebugState } from '../camera/CinematicCameraRig';

type DebugControlsOptions = {
  getSpeed?: () => number;
  getFovDebugState?: () => CameraRigFovDebugState;
};

export function setupDebugControls(camera: THREE.Camera, domElement: HTMLCanvasElement, scene: THREE.Scene, options: DebugControlsOptions = {}) {
  const controls = new OrbitControls(camera, domElement);
  controls.enabled = false;
  controls.enableDamping = true;

  const gridHelper = new THREE.GridHelper(60, 30, 0x5f739c, 0x2b3447);
  gridHelper.visible = false;
  scene.add(gridHelper);

  const fovOverlay = document.createElement('pre');
  fovOverlay.style.position = 'fixed';
  fovOverlay.style.left = '12px';
  fovOverlay.style.bottom = '12px';
  fovOverlay.style.padding = '8px 10px';
  fovOverlay.style.margin = '0';
  fovOverlay.style.background = 'rgba(5, 8, 16, 0.78)';
  fovOverlay.style.border = '1px solid rgba(120, 150, 230, 0.4)';
  fovOverlay.style.borderRadius = '8px';
  fovOverlay.style.color = '#c6d3ff';
  fovOverlay.style.font = '12px/1.4 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
  fovOverlay.style.zIndex = '40';
  fovOverlay.style.pointerEvents = 'none';
  fovOverlay.style.display = 'none';
  fovOverlay.textContent = 'FOV Debug: hidden';
  document.body.append(fovOverlay);

  let fovOverlayVisible = false;

  const keydownHandler = (event: KeyboardEvent) => {
    if (event.code === 'KeyO') controls.enabled = !controls.enabled;
    if (event.code === 'KeyG') gridHelper.visible = !gridHelper.visible;
    if (event.code === 'KeyF') {
      fovOverlayVisible = !fovOverlayVisible;
      fovOverlay.style.display = fovOverlayVisible ? 'block' : 'none';
      if (fovOverlayVisible) console.info('[debug] FOV overlay enabled (toggle with F key)');
    }
  };

  window.addEventListener('keydown', keydownHandler);

  return {
    update() {
      if (controls.enabled) controls.update();

      if (!fovOverlayVisible) return;

      const rigFov = options.getFovDebugState?.();
      const currentSpeed = options.getSpeed?.() ?? rigFov?.speed ?? 0;
      fovOverlay.textContent = [
        '[FOV Debug (F to hide)]',
        `speed: ${currentSpeed.toFixed(2)}`,
        `targetFov: ${(rigFov?.targetFov ?? 0).toFixed(2)}`,
        `actualFov: ${(rigFov?.actualFov ?? 0).toFixed(2)}`,
      ].join('\n');
    },
    dispose() {
      window.removeEventListener('keydown', keydownHandler);
      controls.dispose();
      scene.remove(gridHelper);
      fovOverlay.remove();
    },
  };
}
