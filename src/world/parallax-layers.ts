import * as THREE from 'three';
import { createPropMesh, type PropMeshInstance, type PropType } from './propFactory';

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
  prop: PropMeshInstance;
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

const layerTypeWeights: Record<LayerId, Array<{ type: PropType; weight: number }>> = {
  near: [
    { type: 'sign', weight: 0.43 },
    { type: 'streetLight', weight: 0.35 },
    { type: 'tree', weight: 0.15 },
    { type: 'building', weight: 0.07 },
  ],
  mid: [
    { type: 'tree', weight: 0.45 },
    { type: 'streetLight', weight: 0.33 },
    { type: 'sign', weight: 0.14 },
    { type: 'building', weight: 0.08 },
  ],
  far: [
    { type: 'building', weight: 0.66 },
    { type: 'tree', weight: 0.18 },
    { type: 'streetLight', weight: 0.1 },
    { type: 'sign', weight: 0.06 },
  ],
};

function choosePropType(layerId: LayerId): PropType {
  const candidates = layerTypeWeights[layerId];
  let threshold = Math.random();
  for (const candidate of candidates) {
    threshold -= candidate.weight;
    if (threshold <= 0) {
      return candidate.type;
    }
  }
  return candidates[candidates.length - 1].type;
}

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

function applyPropVariation(object: SpawnedParallaxObject): void {
  const layer = parallaxLayerConfig[object.layerId];
  const { prop } = object;

  const scaleRangeByType: Record<PropType, [number, number]> = {
    building: [0.95, 1.45],
    tree: [0.85, 1.28],
    streetLight: [0.88, 1.15],
    sign: [0.82, 1.2],
  };

  const rotationRangeByType: Record<PropType, number> = {
    building: 0.18,
    tree: 0.45,
    streetLight: 0.24,
    sign: 0.6,
  };

  const hueShiftByType: Record<PropType, number> = {
    building: 0.02,
    tree: 0.08,
    streetLight: 0.04,
    sign: 0.12,
  };

  const [minScale, maxScale] = scaleRangeByType[prop.type];
  const fogBlend = object.layerId === 'far' ? 0.78 : object.layerId === 'mid' ? 0.9 : 1;
  const scale = THREE.MathUtils.randFloat(minScale, maxScale) * layer.scale * fogBlend;
  prop.object.scale.setScalar(scale);
  prop.object.rotation.y = THREE.MathUtils.randFloatSpread(rotationRangeByType[prop.type]);

  for (const material of prop.tintMaterials) {
    const hsl = { h: 0, s: 0, l: 0 };
    material.color.getHSL(hsl);
    const hueShift = THREE.MathUtils.randFloatSpread(hueShiftByType[prop.type]);
    material.color.setHSL((hsl.h + hueShift + 1) % 1, hsl.s, hsl.l);
  }
}

export function createParallaxLayers(options: ParallaxLayersOptions = {}): ParallaxLayers {
  const { debugParallax = false } = options;
  const group = new THREE.Group();

  const objects: SpawnedParallaxObject[] = [];
  const laneDefinitions: Array<{ layerId: LayerId; x: number }> = [
    { layerId: 'near', x: -8.2 },
    { layerId: 'near', x: 8.2 },
    { layerId: 'mid', x: -11.5 },
    { layerId: 'mid', x: 11.5 },
    { layerId: 'far', x: -15 },
    { layerId: 'far', x: 15 },
  ];

  const baseDepth = 280;
  const spawnStart = 25;

  for (const lane of laneDefinitions) {
    const layer = parallaxLayerConfig[lane.layerId];
    const count = Math.ceil(baseDepth / layer.spacing);

    for (let index = 0; index < count; index += 1) {
      const propType = choosePropType(lane.layerId);
      const prop = createPropMesh(propType, lane.layerId, (baseColor) => buildMaterial(baseColor, lane.layerId, debugParallax));

      prop.object.position.set(lane.x + THREE.MathUtils.randFloatSpread(1.1), 0, spawnStart - index * layer.spacing);
      prop.object.userData.layerId = lane.layerId;
      prop.object.userData.propType = propType;

      const spawnedObject: SpawnedParallaxObject = {
        prop,
        layerId: lane.layerId,
        laneX: lane.x,
        recycleDepth: count * layer.spacing,
        baseSpeed: 1,
      };

      applyPropVariation(spawnedObject);
      objects.push(spawnedObject);
      group.add(prop.object);
    }
  }

  return {
    group,
    update(delta: number, worldSpeed: number) {
      for (const object of objects) {
        const layer = parallaxLayerConfig[object.layerId];
        const effectiveSpeed = object.baseSpeed * worldSpeed * layer.multiplier;

        object.prop.object.position.z += effectiveSpeed * delta;
        if (object.prop.object.position.z > 26) {
          object.prop.object.position.z -= object.recycleDepth;
          object.prop.object.position.x = object.laneX + THREE.MathUtils.randFloatSpread(1.4 * layer.scale);
          applyPropVariation(object);
        }
      }
    },
  };
}

export { parallaxLayerConfig };
