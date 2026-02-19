import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';

export function setupDebugControls(camera: THREE.Camera, domElement: HTMLCanvasElement, scene: THREE.Scene) {
  const controls = new OrbitControls(camera, domElement);
  controls.enabled = false;
  controls.enableDamping = true;

  const gridHelper = new THREE.GridHelper(60, 30, 0x5f739c, 0x2b3447);
  gridHelper.visible = false;
  scene.add(gridHelper);

  const keydownHandler = (event: KeyboardEvent) => {
    if (event.code === 'KeyO') controls.enabled = !controls.enabled;
    if (event.code === 'KeyG') gridHelper.visible = !gridHelper.visible;
  };

  window.addEventListener('keydown', keydownHandler);

  return {
    update() {
      if (controls.enabled) controls.update();
    },
    dispose() {
      window.removeEventListener('keydown', keydownHandler);
      controls.dispose();
      scene.remove(gridHelper);
    },
  };
}
