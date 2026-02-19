import * as THREE from 'three';

const SIDES = ['left', 'right'];

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

function cloneRange(range) {
  return [range[0], range[1]];
}

function mergeConfig(config = {}) {
  const merged = {
    seed: DEFAULT_CONFIG.seed,
    initRange: { ...DEFAULT_CONFIG.initRange },
    recycleThreshold: DEFAULT_CONFIG.recycleThreshold,
    layers: {
      near: {
        ...DEFAULT_CONFIG.layers.near,
        laneOffset: cloneRange(DEFAULT_CONFIG.layers.near.laneOffset),
        spacingRange: cloneRange(DEFAULT_CONFIG.layers.near.spacingRange),
        yRange: cloneRange(DEFAULT_CONFIG.layers.near.yRange),
        types: [...DEFAULT_CONFIG.layers.near.types],
      },
      mid: {
        ...DEFAULT_CONFIG.layers.mid,
        laneOffset: cloneRange(DEFAULT_CONFIG.layers.mid.laneOffset),
        spacingRange: cloneRange(DEFAULT_CONFIG.layers.mid.spacingRange),
        yRange: cloneRange(DEFAULT_CONFIG.layers.mid.yRange),
        types: [...DEFAULT_CONFIG.layers.mid.types],
      },
      far: {
        ...DEFAULT_CONFIG.layers.far,
        laneOffset: cloneRange(DEFAULT_CONFIG.layers.far.laneOffset),
        spacingRange: cloneRange(DEFAULT_CONFIG.layers.far.spacingRange),
        yRange: cloneRange(DEFAULT_CONFIG.layers.far.yRange),
        types: [...DEFAULT_CONFIG.layers.far.types],
      },
    },
  };

  if (config.seed !== undefined) merged.seed = config.seed;
  if (config.initRange) merged.initRange = { ...merged.initRange, ...config.initRange };
  if (config.recycleThreshold !== undefined) merged.recycleThreshold = config.recycleThreshold;

  if (config.layers) {
    for (const layerName of Object.keys(merged.layers)) {
      const override = config.layers[layerName];
      if (!override) continue;

      merged.layers[layerName] = {
        ...merged.layers[layerName],
        ...override,
        types: override.types ? [...override.types] : merged.layers[layerName].types,
        laneOffset: override.laneOffset ? cloneRange(override.laneOffset) : merged.layers[layerName].laneOffset,
        spacingRange: override.spacingRange ? cloneRange(override.spacingRange) : merged.layers[layerName].spacingRange,
        yRange: override.yRange ? cloneRange(override.yRange) : merged.layers[layerName].yRange,
      };
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

    const seed = rngSeed ?? this.config.seed;
    this._rng = mulberry32(seed);
    this._assets = this.createSharedAssets();
    this._factories = this.createFactories();
  }

  createSharedAssets() {
    return {
      geometry: {
        guardrail: new THREE.BoxGeometry(2.2, 0.35, 0.25),
        sign: new THREE.BoxGeometry(0.9, 0.8, 0.2),
        pole: new THREE.CylinderGeometry(0.08, 0.12, 2.6, 8),
        treeTrunk: new THREE.CylinderGeometry(0.12, 0.16, 1.4, 8),
        treeLeaves: new THREE.ConeGeometry(0.8, 1.8, 10),
        silhouette: new THREE.BoxGeometry(3.2, 2.6, 0.4),
      },
      material: {
        trunk: new THREE.MeshStandardMaterial({ color: 0x2a2218, roughness: 0.9 }),
        foliage: new THREE.MeshStandardMaterial({ color: 0x1f4d33, roughness: 1.0 }),
        steel: new THREE.MeshStandardMaterial({ color: 0x79849a, roughness: 0.65, metalness: 0.35 }),
        sign: new THREE.MeshStandardMaterial({ color: 0xe6edf7, roughness: 0.55, metalness: 0.2 }),
        far: new THREE.MeshStandardMaterial({ color: 0x1b2940, roughness: 1.0 }),
      },
    };
  }

  createFactories() {
    const { geometry, material } = this._assets;

    return {
      guardrail: () => new THREE.Mesh(geometry.guardrail, material.steel),
      sign: () => new THREE.Mesh(geometry.sign, material.sign),
      pole: () => new THREE.Mesh(geometry.pole, material.steel),
      tree: () => {
        const group = new THREE.Group();
        const trunk = new THREE.Mesh(geometry.treeTrunk, material.trunk);
        trunk.position.y = 0.7;
        const leaves = new THREE.Mesh(geometry.treeLeaves, material.foliage);
        leaves.position.y = 1.9;
        group.add(trunk, leaves);
        return group;
      },
      silhouette: () => new THREE.Mesh(geometry.silhouette, material.far),
    };
  }

  init() {
    const { near, far } = this.config.initRange;

    for (const [layerName, layerConfig] of Object.entries(this.config.layers)) {
      this.lastSpawnZ[layerName] = { left: near, right: near };

      for (const side of SIDES) {
        let spawnTrackZ = near;
        while (spawnTrackZ <= far) {
          this.spawnNext(layerName, side, spawnTrackZ);
          spawnTrackZ += this.randomBetween(layerConfig.spacingRange[0], layerConfig.spacingRange[1]);
        }
      }
    }
  }

  update(cameraZ, delta, baseSpeed) {
    const nextCameraZ = cameraZ + delta * baseSpeed;

    for (const item of Array.from(this.active)) {
      const relativeZ = -(item.trackZ - nextCameraZ);
      item.mesh.position.z = relativeZ;

      if (relativeZ > this.config.recycleThreshold) {
        this.recycle(item);
        this.spawnNext(item.layer, item.side);
      }
    }

    return nextCameraZ;
  }

  spawnNext(layerName, side, forcedTrackZ) {
    const layerConfig = this.config.layers[layerName];
    if (!layerConfig || !this.lastSpawnZ[layerName]) return null;

    const spacing = forcedTrackZ === undefined
      ? this.randomBetween(layerConfig.spacingRange[0], layerConfig.spacingRange[1])
      : 0;

    const trackZ = forcedTrackZ ?? this.lastSpawnZ[layerName][side] + spacing;
    this.lastSpawnZ[layerName][side] = trackZ;

    const randomTypeIndex = Math.floor(this.randomBetween(0, layerConfig.types.length));
    const type = layerConfig.types[randomTypeIndex] ?? layerConfig.types[0];
    const mesh = this.acquireFromPool(type);

    const laneOffset = this.randomBetween(layerConfig.laneOffset[0], layerConfig.laneOffset[1]);
    mesh.position.x = side === 'left' ? -laneOffset : laneOffset;
    mesh.position.y = this.randomBetween(layerConfig.yRange[0], layerConfig.yRange[1]);
    mesh.position.z = -trackZ;
    mesh.visible = true;

    const item = { mesh, type, layer: layerName, side, trackZ };
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
    if (!factory) {
      throw new Error(`Unknown environment type: ${type}`);
    }

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

    for (const geometry of Object.values(this._assets.geometry)) {
      geometry.dispose();
    }

    for (const material of Object.values(this._assets.material)) {
      material.dispose();
    }

    this._factories = {};
    this._assets = null;
    this.scene = null;
  }

  randomBetween(min, max) {
    return min + (max - min) * this._rng();
  }
}
