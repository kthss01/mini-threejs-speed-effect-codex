import * as THREE from 'three';

const DEFAULT_OPTIONS = {
  count: 3200,
  color: 0xaed8ff,
  width: 0.012,
  minLength: 1.5,
  maxLength: 8,
  minBrightness: 0.3,
  maxBrightness: 1,
  spreadX: 28,
  spreadY: 14,
  nearDistance: 6,
  farDistance: 220,
  speedScale: 1,
};

export function createSpeedLinesSystem(scene, camera, options = {}) {
  const settings = { ...DEFAULT_OPTIONS, ...options };
  const span = Math.max(1, settings.farDistance - settings.nearDistance);

  const geometry = new THREE.CylinderGeometry(settings.width, settings.width, 1, 6, 1, true);
  geometry.rotateX(Math.PI / 2);

  const seedArray = new Float32Array(settings.count);
  const offsetArray = new Float32Array(settings.count);
  const xyArray = new Float32Array(settings.count * 2);
  const lengthArray = new Float32Array(settings.count);
  const brightnessArray = new Float32Array(settings.count);

  const randomRange = (min, max) => min + Math.random() * (max - min);

  for (let i = 0; i < settings.count; i += 1) {
    const i2 = i * 2;
    seedArray[i] = Math.random();
    offsetArray[i] = Math.random() * span;
    xyArray[i2] = randomRange(-settings.spreadX, settings.spreadX);
    xyArray[i2 + 1] = randomRange(-settings.spreadY, settings.spreadY);
    lengthArray[i] = randomRange(settings.minLength, settings.maxLength);
    brightnessArray[i] = randomRange(settings.minBrightness, settings.maxBrightness);
  }

  geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seedArray, 1));
  geometry.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsetArray, 1));
  geometry.setAttribute('aXY', new THREE.InstancedBufferAttribute(xyArray, 2));
  geometry.setAttribute('aLength', new THREE.InstancedBufferAttribute(lengthArray, 1));
  geometry.setAttribute('aBrightness', new THREE.InstancedBufferAttribute(brightnessArray, 1));

  const uniforms = {
    uTime: { value: 0 },
    uSpeed: { value: 1 },
    uCameraZ: { value: camera.position.z },
    uNear: { value: settings.nearDistance },
    uSpan: { value: span },
  };

  const material = new THREE.MeshBasicMaterial({
    color: settings.color,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uSpeed = uniforms.uSpeed;
    shader.uniforms.uCameraZ = uniforms.uCameraZ;
    shader.uniforms.uNear = uniforms.uNear;
    shader.uniforms.uSpan = uniforms.uSpan;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
attribute float aSeed;
attribute float aOffset;
attribute vec2 aXY;
attribute float aLength;
attribute float aBrightness;
varying float vBrightness;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
float travel = uTime * uSpeed * (1.0 + aSeed * 0.35);
float wrapped = mod(aOffset + travel, uSpan);
float streamZ = uCameraZ - uNear - wrapped;
transformed.z *= aLength;
transformed.x += aXY.x;
transformed.y += aXY.y;
transformed.z += streamZ;
vBrightness = aBrightness;`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying float vBrightness;`
      )
      .replace(
        'vec4 diffuseColor = vec4( diffuse, opacity );',
        'vec4 diffuseColor = vec4(diffuse * vBrightness, opacity * vBrightness);'
      );
  };

  const mesh = new THREE.InstancedMesh(geometry, material, settings.count);
  mesh.frustumCulled = false;

  const identity = new THREE.Matrix4();
  for (let i = 0; i < settings.count; i += 1) mesh.setMatrixAt(i, identity);

  scene.add(mesh);

  return {
    mesh,
    update(delta, speed, activeCamera = camera) {
      uniforms.uTime.value += delta;
      uniforms.uSpeed.value = Math.max(0, speed) * settings.speedScale;
      uniforms.uCameraZ.value = activeCamera.position.z;
    },
    dispose() {
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
    },
  };
}
