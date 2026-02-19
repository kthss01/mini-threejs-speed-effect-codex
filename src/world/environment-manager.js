export class EnvironmentManager {
  constructor(scene, speedLines, config = {}) {
    this.scene = scene;
    this.speedLines = speedLines;
    this.config = config;
  }

  init() {
    // Placeholder for environment effects initialization.
  }

  update(cameraProgress, delta, worldSpeed) {
    void delta;

    if (this.speedLines && typeof this.speedLines.update === 'function') {
      this.speedLines.update(worldSpeed);
    }

    const distanceScale = this.config?.distanceScale ?? 1;
    return cameraProgress + worldSpeed * delta * distanceScale;
import * as THREE from 'three';

const DEFAULT_CONFIG = {
  seed: 1337,
  initRange: { near: 40, far: 220 },
  recycleThreshold: 10,
  layers: {
    near: {
      types: ['guardrail', 'sign'],
      laneOffset: [5, 7],
      spacingRange: [8, 14],
      yRange: [0.5, 1.8],
    },
    mid: {
      types: ['tree', 'pole'],
      laneOffset: [8, 11],
      spacingRange: [14, 24],
      yRange: [0.5, 3],
    },
    far: {
      types: ['silhouette'],
      laneOffset: [12, 18],
      spacingRange: [24, 40],
      yRange: [0.5, 4.5],
    },
  },
};

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function mergeConfig(config = {}) {
  const merged = structuredClone(DEFAULT_CONFIG);
  if (!config) return merged;

  if (config.seed !== undefined) merged.seed = config.seed;
  if (config.initRange) merged.initRange = { ...merged.initRange, ...config.initRange };
  if (config.recycleThreshold !== undefined) merged.recycleThreshold = config.recycleThreshold;

  if (config.layers) {
    for (const key of Object.keys(merged.layers)) {
      if (config.layers[key]) {
        merged.layers[key] = { ...merged.layers[key], ...config.layers[key] };
      }
    }
  }

  return merged;
}

export class EnvironmentManager {
  constructor(scene, rngSeed, config = {}) {
    this.scene = scene;
    this.config = mergeConfig(config);
    this.lanes = { left: [], right: [] };
    this.pool = new Map();
    this.active = new Set();
    this.lastSpawnZ = {};
    this._factories = this.createFactories();

    const seed = rngSeed ?? this.config.seed;
    this._rng = mulberry32(seed);
  }

  createFactories() {
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2218, roughness: 0.9 });
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x1f4d33, roughness: 1.0 });
    const steelMaterial = new THREE.MeshStandardMaterial({ color: 0x79849a, roughness: 0.65, metalness: 0.35 });
    const signMaterial = new THREE.MeshStandardMaterial({ color: 0xe6edf7, roughness: 0.55, metalness: 0.2 });
    const farMaterial = new THREE.MeshStandardMaterial({ color: 0x1b2940, roughness: 1.0 });

    return {
      guardrail: () => new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.35, 0.25), steelMaterial),
      sign: () => new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.2), signMaterial),
      pole: () => new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 2.6, 8), steelMaterial),
      tree: () => {
        const group = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.4, 8), trunkMaterial);
        trunk.position.y = 0.7;
        const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.8, 10), foliageMaterial);
        leaves.position.y = 1.9;
        group.add(trunk, leaves);
        return group;
      },
      silhouette: () => new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.6, 0.4), farMaterial),
    };
  }

  init() {
    const rangeNear = this.config.initRange.near;
    const rangeFar = this.config.initRange.far;

    for (const [layer, layerConfig] of Object.entries(this.config.layers)) {
      this.lastSpawnZ[layer] = { left: rangeNear, right: rangeNear };

      for (const side of ['left', 'right']) {
        let nextZ = rangeNear;
        while (nextZ <= rangeFar) {
          this.spawnNext(layer, side, nextZ);
          const [minSpacing, maxSpacing] = layerConfig.spacingRange;
          nextZ += this.randomBetween(minSpacing, maxSpacing);
        }
      }
    }
  }

  update(cameraZ, delta, baseSpeed) {
    const nextCameraZ = cameraZ + delta * baseSpeed;

    for (const item of this.active) {
      const relativeZ = -(item.trackZ - nextCameraZ);
      item.mesh.position.z = relativeZ;

      if (relativeZ > this.config.recycleThreshold) {
        const recycledLayer = item.layer;
        const recycledSide = item.side;
        this.recycle(item);
        this.spawnNext(recycledLayer, recycledSide);
      }
    }

    return nextCameraZ;
  }

  spawnNext(layer, side, forcedTrackZ) {
    const layerConfig = this.config.layers[layer];
    if (!layerConfig) return null;

    const [minSpacing, maxSpacing] = layerConfig.spacingRange;
    const spacing = this.randomBetween(minSpacing, maxSpacing);
    const baseZ = this.lastSpawnZ[layer][side];
    const trackZ = forcedTrackZ ?? baseZ + spacing;
    this.lastSpawnZ[layer][side] = trackZ;

    const type = layerConfig.types[Math.floor(this.randomBetween(0, layerConfig.types.length))] ?? layerConfig.types[0];
    const mesh = this.acquireFromPool(type);

    const [minOffset, maxOffset] = layerConfig.laneOffset;
    const laneOffset = this.randomBetween(minOffset, maxOffset);
    const [minY, maxY] = layerConfig.yRange;

    mesh.position.x = side === 'left' ? -laneOffset : laneOffset;
    mesh.position.y = this.randomBetween(minY, maxY);
    mesh.position.z = -trackZ;
    mesh.visible = true;

    const item = { mesh, type, layer, side, trackZ };
    mesh.userData.envItem = item;

    this.scene.add(mesh);
    this.active.add(item);
    this.lanes[side].push(item);

    return item;
  }

  recycle(item) {
    if (!this.active.has(item)) return;

    this.active.delete(item);
    this.lanes[item.side] = this.lanes[item.side].filter((laneItem) => laneItem !== item);
    this.releaseToPool(item);
  }

  acquireFromPool(type) {
    const bucket = this.pool.get(type);
    if (bucket && bucket.length > 0) {
      return bucket.pop();
    }

    const factory = this._factories[type];
    if (!factory) throw new Error(`Unknown environment type: ${type}`);
    return factory();
  }

  releaseToPool(obj) {
    const { mesh, type } = obj;
    this.scene.remove(mesh);
    mesh.visible = false;
    delete mesh.userData.envItem;

    if (!this.pool.has(type)) {
      this.pool.set(type, []);
    }
    this.pool.get(type).push(mesh);
  }

  dispose() {
    for (const item of Array.from(this.active)) {
      this.releaseToPool(item);
    }
    this.active.clear();
    this.lanes.left = [];
    this.lanes.right = [];

    for (const bucket of this.pool.values()) {
      for (const mesh of bucket) {
        this.scene.remove(mesh);
      }
      bucket.length = 0;
    }

    this.pool.clear();
    this.lastSpawnZ = {};
    this.scene = null;
  }

  randomBetween(min, max) {
    return min + (max - min) * this._rng();
  }
}
