import * as THREE from 'three';
import { appConfig } from '../config';

export type SceneBundle = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  onResize: () => void;
};

export function createSceneBundle(container: HTMLElement): SceneBundle {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(appConfig.fog.color, appConfig.fog.near, appConfig.fog.far);

  const camera = new THREE.PerspectiveCamera(
    appConfig.camera.fov,
    window.innerWidth / window.innerHeight,
    appConfig.camera.near,
    appConfig.camera.far,
  );
  camera.position.copy(appConfig.camera.position);
  camera.lookAt(0, 0, -10);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, appConfig.renderer.maxPixelRatio));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(appConfig.renderer.clearColor);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const hemiLight = new THREE.HemisphereLight(0xdbe9ff, 0x203350, 0.65);
  const directional = new THREE.DirectionalLight(0xffffff, 1.05);
  directional.position.set(8, 14, 6);
  scene.add(hemiLight, directional);

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, appConfig.renderer.maxPixelRatio));
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  return { scene, camera, renderer, onResize };
}
