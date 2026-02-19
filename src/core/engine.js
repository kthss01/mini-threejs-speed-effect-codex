import * as THREE from 'three';

export function createEngine(container) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x060914, 18, 132);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 2.2, 8);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xbdd2ff, 0.4);
  const directional = new THREE.DirectionalLight(0xc4d8ff, 1.2);
  directional.position.set(5, 8, 4);
  const rim = new THREE.DirectionalLight(0x4269d0, 0.5);
  rim.position.set(-6, 2, -8);
  scene.add(ambient, directional, rim);

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  window.addEventListener('resize', onResize);

  return {
    scene,
    camera,
    renderer,
    dispose() {
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    }
  };
}
