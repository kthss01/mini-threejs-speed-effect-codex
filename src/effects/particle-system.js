import * as THREE from 'three';

const DEFAULT_OPTIONS = {
  count: 9000,
  color: 0xd5ecff,
  baseSize: 7,
  sizeJitter: 8,
  minLife: 0.5,
  maxLife: 1.8,
  minBrightness: 0.25,
  maxBrightness: 1,
  spreadX: 36,
  spreadY: 18,
  nearDistance: 3,
  farDistance: 260,
  speedScale: 0.8,
  blending: 'normal',
  profile: 'bike',
  mode: 'dust',
  frustumCulled: false,
  noise: 0,
  glow: 0,
};

const MODE_MAP = {
  dust: 0,
  rain: 1,
  snow: 2,
};

const PROFILE_PRESETS = {
  car: {
    mode: 'dust',
    count: 14000,
    spreadX: 28,
    spreadY: 10,
    minBrightness: 0.22,
    maxBrightness: 0.8,
    baseSize: 9,
    sizeJitter: 10,
    blending: 'normal',
    speedScale: 1,
  },
  bike: {
    mode: 'rain',
    count: 9000,
    spreadX: 34,
    spreadY: 16,
    minBrightness: 0.35,
    maxBrightness: 1,
    baseSize: 6,
    sizeJitter: 8,
    blending: 'additive',
    speedScale: 0.78,
  },
};

const randomRange = (min, max) => min + Math.random() * (max - min);

export function createParticleSystem(scene, camera, options = {}) {
  const profileOptions = PROFILE_PRESETS[options.profile] ?? PROFILE_PRESETS.bike;
  const settings = { ...DEFAULT_OPTIONS, ...profileOptions, ...options };
  const count = Math.max(5000, Math.min(20000, Math.floor(settings.count)));

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const life = new Float32Array(count);
  const size = new Float32Array(count);
  const brightness = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;
    positions[i3] = randomRange(-settings.spreadX, settings.spreadX);
    positions[i3 + 1] = randomRange(-settings.spreadY, settings.spreadY);
    positions[i3 + 2] = randomRange(-settings.farDistance, -settings.nearDistance);
    seeds[i] = Math.random();
    life[i] = randomRange(settings.minLife, settings.maxLife);
    size[i] = settings.baseSize + Math.random() * settings.sizeJitter;
    brightness[i] = randomRange(settings.minBrightness, settings.maxBrightness);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute('aLife', new THREE.BufferAttribute(life, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geometry.setAttribute('aBrightness', new THREE.BufferAttribute(brightness, 1));

  const uniforms = {
    uTime: { value: 0 },
    uSpeed: { value: 0 },
    uMode: { value: MODE_MAP[settings.mode] ?? MODE_MAP.dust },
    uNear: { value: settings.nearDistance },
    uFar: { value: settings.farDistance },
    uColor: { value: new THREE.Color(settings.color) },
    uNoise: { value: Math.max(0, settings.noise ?? 0) },
    uGlow: { value: Math.max(0, settings.glow ?? 0) },
  };

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: settings.blending === 'additive' ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms,
    vertexShader: `
      uniform float uTime;
      uniform float uSpeed;
      uniform float uMode;
      uniform float uNear;
      uniform float uFar;
      attribute float aSeed;
      attribute float aLife;
      attribute float aSize;
      attribute float aBrightness;
      varying float vBrightness;
      varying float vFade;

      void main() {
        vec3 p = position;
        float speed = max(uSpeed, 0.0);
        float distanceRange = max(uFar - uNear, 1.0);
        float timeFactor = uTime * speed * (0.65 + aSeed * 0.9) / max(aLife, 0.05);

        vec3 moveDir = vec3(0.0, 0.0, 1.0);
        if (uMode > 0.5 && uMode < 1.5) {
          moveDir = normalize(vec3(0.0, -0.12, 1.0));
        } else if (uMode >= 1.5) {
          moveDir = normalize(vec3(sin(aSeed * 16.0) * 0.1, -0.24, 0.82));
        }

        p += moveDir * (timeFactor * distanceRange);

        float cameraSpaceZ = -p.z;
        float wrappedDepth = mod(cameraSpaceZ + uNear, distanceRange) + uNear;
        p.z = -wrappedDepth;

        float alphaFade = 1.0 - smoothstep(uNear, uFar, wrappedDepth);
        float speedFade = smoothstep(0.2, 2.5, speed);
        vFade = alphaFade * speedFade;
        vBrightness = aBrightness;

        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = aSize * (250.0 / -mvPosition.z) * (1.0 + speed * 0.07);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uNoise;
      uniform float uGlow;
      uniform float uTime;
      varying float vBrightness;
      varying float vFade;

      void main() {
        vec2 uv = gl_PointCoord * 2.0 - 1.0;
        float radial = 1.0 - dot(uv, uv);
        if (radial <= 0.0) discard;
        float noise = (fract(sin((gl_PointCoord.x + gl_PointCoord.y + uTime) * 91.7) * 43758.5453) - 0.5) * uNoise;
        float lit = max(0.0, vBrightness + noise);
        float alpha = pow(radial, 1.6) * vFade * (1.0 + uGlow * 0.35);
        gl_FragColor = vec4(uColor * lit * (1.0 + uGlow), alpha);
      }
    `,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = Boolean(settings.frustumCulled);
  scene.add(points);

  const respawnParticle = (index) => {
    const i3 = index * 3;
    positions[i3] = randomRange(-settings.spreadX, settings.spreadX);
    positions[i3 + 1] = randomRange(-settings.spreadY, settings.spreadY);
    positions[i3 + 2] = -settings.farDistance - Math.random() * 8;
    seeds[index] = Math.random();
    life[index] = randomRange(settings.minLife, settings.maxLife);
    size[index] = settings.baseSize + Math.random() * settings.sizeJitter;
    brightness[index] = randomRange(settings.minBrightness, settings.maxBrightness);
  };

  return {
    points,
    setMode(modeName) {
      uniforms.uMode.value = MODE_MAP[modeName] ?? MODE_MAP.dust;
    },
    setProfile(profileName) {
      const preset = PROFILE_PRESETS[profileName];
      if (!preset) return;
      uniforms.uMode.value = MODE_MAP[preset.mode] ?? MODE_MAP.dust;
    },
    update(delta, speed, activeCamera = camera) {
      uniforms.uTime.value += delta;
      uniforms.uSpeed.value = Math.max(0, speed) * settings.speedScale;

      const cameraZ = activeCamera.position.z;
      const frontThreshold = cameraZ - settings.nearDistance * 0.5;
      const backThreshold = cameraZ - settings.farDistance * 1.1;
      let dirty = false;
      for (let i = 0; i < count; i += 1) {
        const z = positions[i * 3 + 2];
        if (z > frontThreshold || z < backThreshold) {
          respawnParticle(i);
          dirty = true;
        }
      }

      if (dirty) {
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.aSeed.needsUpdate = true;
        geometry.attributes.aLife.needsUpdate = true;
        geometry.attributes.aSize.needsUpdate = true;
        geometry.attributes.aBrightness.needsUpdate = true;
      }
    },
    dispose() {
      scene.remove(points);
      geometry.dispose();
      material.dispose();
    },
  };
}
