import * as THREE from 'three';
import { appConfig } from '../config';

export type SceneTheme = keyof typeof appConfig.lighting;

export type SceneBundle = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  onResize: () => void;
};

export function createSceneBundle(container: HTMLElement, theme: SceneTheme = 'night'): SceneBundle {
  const scene = new THREE.Scene();
  const lightingPreset = appConfig.lighting[theme];
  scene.fog = new THREE.Fog(
    lightingPreset.fog.color,
    lightingPreset.fog.near,
    lightingPreset.fog.far,
  );

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
  renderer.setClearColor(lightingPreset.renderer.clearColor);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const hemiLight = new THREE.HemisphereLight(
    lightingPreset.hemisphere.skyColor,
    lightingPreset.hemisphere.groundColor,
    lightingPreset.hemisphere.intensity,
  );

  const moonLight = new THREE.DirectionalLight(lightingPreset.moon.color, lightingPreset.moon.intensity);
  moonLight.position.copy(lightingPreset.moon.position);

  const ambientLight = new THREE.AmbientLight(
    lightingPreset.ambient.color,
    lightingPreset.ambient.intensity,
  );

  scene.add(hemiLight, moonLight, ambientLight);

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, appConfig.renderer.maxPixelRatio));
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  return { scene, camera, renderer, onResize };
}
