import * as THREE from 'three';
import { appConfig } from '../config';

export type SceneTheme = keyof typeof appConfig.lighting;

export type SceneBundle = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  updateAtmosphere: (elapsed: number, worldSpeed: number) => void;
  onResize: () => void;
};



function createStarfield() {
  const starsConfig = appConfig.atmosphere.stars;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(starsConfig.count * 3);

  for (let index = 0; index < starsConfig.count; index += 1) {
    const stride = index * 3;
    const angle = Math.random() * Math.PI * 2;
    const distance = THREE.MathUtils.randFloat(35, starsConfig.radius);
    const x = Math.cos(angle) * distance;
    const z = -Math.abs(Math.sin(angle) * distance) - 30;
    const y = THREE.MathUtils.randFloat(starsConfig.minY, starsConfig.maxY);

    positions[stride] = x;
    positions[stride + 1] = y;
    positions[stride + 2] = z;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: starsConfig.color,
    size: starsConfig.size,
    sizeAttenuation: true,
    transparent: true,
    opacity: starsConfig.opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const stars = new THREE.Points(geometry, material);
  stars.frustumCulled = false;
  return stars;
}

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

  const starfield = createStarfield();
  scene.add(hemiLight, moonLight, ambientLight, starfield);

  const baseFogNear = lightingPreset.fog.near;
  const baseFogFar = lightingPreset.fog.far;
  const speedFogConfig = appConfig.atmosphere.speedFog;
  const fogColor = new THREE.Color(speedFogConfig.color);
  const fogColorMixStrength = 0.5;

  const updateAtmosphere = (elapsed: number, worldSpeed: number) => {
    const speedProgress = THREE.MathUtils.clamp((worldSpeed - 1) / 8, 0, 1);
    const targetNear = Math.max(2, baseFogNear - speedProgress * speedFogConfig.nearDrop);
    const targetFar = Math.max(targetNear + 30, baseFogFar - speedProgress * speedFogConfig.farDrop);
    const lerpAlpha = 1 - Math.exp(-speedFogConfig.smoothing * (1 / 60));

    if (scene.fog instanceof THREE.Fog) {
      scene.fog.near = THREE.MathUtils.lerp(scene.fog.near, targetNear, lerpAlpha);
      scene.fog.far = THREE.MathUtils.lerp(scene.fog.far, targetFar, lerpAlpha);
      scene.fog.color
        .setHex(lightingPreset.fog.color)
        .lerp(fogColor, speedProgress * fogColorMixStrength);
    }

    const starsMaterial = starfield.material as THREE.PointsMaterial;
    const twinkle = 0.85 + Math.sin(elapsed * 0.5) * 0.08;
    starsMaterial.opacity = THREE.MathUtils.clamp(appConfig.atmosphere.stars.opacity * twinkle, 0.65, 1);
  };

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, appConfig.renderer.maxPixelRatio));
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  return { scene, camera, renderer, updateAtmosphere, onResize };
}
