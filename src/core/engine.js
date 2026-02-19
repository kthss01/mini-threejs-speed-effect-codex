import * as THREE from 'three';

export function createEngine(container) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x05070d, 15, 120);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 2, 8);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  const directional = new THREE.DirectionalLight(0xb5d3ff, 1.2);
  directional.position.set(5, 8, 4);
  scene.add(ambient, directional);

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
