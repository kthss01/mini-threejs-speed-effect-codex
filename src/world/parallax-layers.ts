import * as THREE from 'three';

export type LayerId = 'near' | 'mid' | 'far';

type LayerConfig = {
  multiplier: number;
  spacing: number;
  scale: number;
  tone: {
    saturation: number;
    lightness: number;
    opacity: number;
  };
  debugColor: number;
};

type LayerConfigMap = Record<LayerId, LayerConfig>;

type SpawnedParallaxObject = {
  mesh: THREE.Mesh;
  layerId: LayerId;
  laneX: number;
  recycleDepth: number;
  baseSpeed: number;
};

const parallaxLayerConfig: LayerConfigMap = {
  near: {
    multiplier: 2.1,
    spacing: 15,
    scale: 1.6,
    tone: { saturation: 1.1, lightness: 1.0, opacity: 1 },
    debugColor: 0xff8a66,
  },
  mid: {
    multiplier: 1.2,
    spacing: 22,
    scale: 1,
    tone: { saturation: 0.85, lightness: 0.9, opacity: 0.92 },
    debugColor: 0xc9d6ff,
  },
  far: {
    multiplier: 0.65,
    spacing: 30,
    scale: 0.75,
    tone: { saturation: 0.45, lightness: 0.75, opacity: 0.72 },
    debugColor: 0x69b7ff,
  },
};

function assertLayerMultiplierRange(config: LayerConfigMap): void {
  const ranges: Record<LayerId, [number, number]> = {
    near: [1.8, 2.4],
    mid: [1.0, 1.4],
    far: [0.45, 0.8],
  };

  (Object.keys(ranges) as LayerId[]).forEach((layerId) => {
    const [min, max] = ranges[layerId];
    const multiplier = config[layerId].multiplier;
    if (multiplier < min || multiplier > max) {
      throw new Error(`Invalid ${layerId} multiplier: ${multiplier}. Expected ${min}~${max}.`);
    }
  });
}

assertLayerMultiplierRange(parallaxLayerConfig);

export type ParallaxLayersOptions = {
  debugParallax?: boolean;
};

export type ParallaxLayers = {
  group: THREE.Group;
  update: (delta: number, worldSpeed: number) => void;
};

function buildMaterial(baseColor: THREE.ColorRepresentation, layerId: LayerId, debugParallax: boolean): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.92,
    metalness: 0.02,
    transparent: true,
  });

  if (debugParallax) {
    material.color.setHex(parallaxLayerConfig[layerId].debugColor);
    material.opacity = 1;
    return material;
  }

  const tone = parallaxLayerConfig[layerId].tone;
  const hsl = { h: 0, s: 0, l: 0 };
  material.color.getHSL(hsl);
  material.color.setHSL(hsl.h, THREE.MathUtils.clamp(hsl.s * tone.saturation, 0, 1), THREE.MathUtils.clamp(hsl.l * tone.lightness, 0, 1));
  material.opacity = tone.opacity;

  return material;
}

export function createParallaxLayers(options: ParallaxLayersOptions = {}): ParallaxLayers {
  const { debugParallax = false } = options;
  const group = new THREE.Group();

  const objects: SpawnedParallaxObject[] = [];
  const laneDefinitions: Array<{ layerId: LayerId; x: number; baseScale: number }> = [
    { layerId: 'near', x: -8.2, baseScale: 1.2 },
    { layerId: 'near', x: 8.2, baseScale: 1.2 },
    { layerId: 'mid', x: -11.5, baseScale: 1.0 },
    { layerId: 'mid', x: 11.5, baseScale: 1.0 },
    { layerId: 'far', x: -15, baseScale: 0.92 },
    { layerId: 'far', x: 15, baseScale: 0.92 },
  ];

  const baseDepth = 280;
  const spawnStart = 25;

  for (const lane of laneDefinitions) {
    const layer = parallaxLayerConfig[lane.layerId];
    const count = Math.ceil(baseDepth / layer.spacing);

    for (let index = 0; index < count; index += 1) {
      const width = THREE.MathUtils.randFloat(0.45, 0.9) * lane.baseScale;
      const height = THREE.MathUtils.randFloat(2.2, 5.6) * layer.scale;
      const geometry = new THREE.BoxGeometry(width, height, width);
      const material = buildMaterial(0x5f6e86, lane.layerId, debugParallax);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(lane.x + THREE.MathUtils.randFloatSpread(1.1), height / 2, spawnStart - index * layer.spacing);
      mesh.userData.layerId = lane.layerId;

      objects.push({
        mesh,
        layerId: lane.layerId,
        laneX: lane.x,
        recycleDepth: count * layer.spacing,
        baseSpeed: 1,
      });
      group.add(mesh);
    }
  }

  return {
    group,
    update(delta: number, worldSpeed: number) {
      for (const object of objects) {
        const layer = parallaxLayerConfig[object.layerId];
        const effectiveSpeed = object.baseSpeed * worldSpeed * layer.multiplier;

        object.mesh.position.z += effectiveSpeed * delta;
        if (object.mesh.position.z > 26) {
          object.mesh.position.z -= object.recycleDepth;
          object.mesh.position.x = object.laneX + THREE.MathUtils.randFloatSpread(1.4 * layer.scale);
          object.mesh.rotation.y = THREE.MathUtils.randFloatSpread(0.65);
          object.mesh.scale.setScalar(THREE.MathUtils.randFloat(0.85, 1.2) * layer.scale);

          const fogBlend = object.layerId === 'far' ? 0.78 : object.layerId === 'mid' ? 0.9 : 1;
          object.mesh.scale.multiplyScalar(fogBlend);
        }
      }
    },
  };
}

export { parallaxLayerConfig };
