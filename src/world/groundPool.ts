import * as THREE from 'three';
import { appConfig } from '../config';

type GroundPool = {
  group: THREE.Group;
  update: (delta: number, worldSpeed: number) => void;
};

function getRoadRepeat(tileLength: number, repeatLength: number): number {
  return tileLength / Math.max(0.1, repeatLength);
}

function createRoadTexture(width: number, length: number): THREE.CanvasTexture {
  const {
    laneWidth,
    laneGap,
    laneMarkWidth,
    laneMarkColor,
    centerLineWidth,
    centerLineDashLength,
    centerLineGapLength,
    centerLineColor,
    repeatLength,
  } = appConfig.ground.roadStyle;

  const canvasSize = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('2D canvas context is not available.');
  }

  const asphaltColor = new THREE.Color(appConfig.ground.color);
  context.fillStyle = `#${asphaltColor.getHexString()}`;
  context.fillRect(0, 0, canvasSize, canvasSize);

  for (let i = 0; i < 18000; i += 1) {
    const brightness = 24 + Math.floor(Math.random() * 34);
    context.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, ${0.03 + Math.random() * 0.07})`;
    context.fillRect(
      Math.random() * canvasSize,
      Math.random() * canvasSize,
      1 + Math.random() * 2.2,
      1 + Math.random() * 2.2,
    );
  }

  const metersToPixels = canvasSize / width;

  const laneMarkColorHex = new THREE.Color(laneMarkColor).getHexString();
  context.fillStyle = `#${laneMarkColorHex}`;

  const laneBoundaryOffset = laneWidth / 2 + laneGap / 2;
  const laneMarkLeftX = canvasSize / 2 + (-laneBoundaryOffset - laneMarkWidth / 2) * metersToPixels;
  const laneMarkRightX = canvasSize / 2 + (laneBoundaryOffset - laneMarkWidth / 2) * metersToPixels;
  const laneMarkPixelWidth = laneMarkWidth * metersToPixels;

  context.fillRect(laneMarkLeftX, 0, laneMarkPixelWidth, canvasSize);
  context.fillRect(laneMarkRightX, 0, laneMarkPixelWidth, canvasSize);

  const centerLineColorHex = new THREE.Color(centerLineColor).getHexString();
  context.fillStyle = `#${centerLineColorHex}`;

  const centerLinePixelWidth = centerLineWidth * metersToPixels;
  const centerLineX = canvasSize / 2 - centerLinePixelWidth / 2;
  const dashCycleLength = centerLineDashLength + centerLineGapLength;
  const dashCount = Math.ceil(length / dashCycleLength);

  for (let index = 0; index < dashCount; index += 1) {
    const dashStartMeters = index * dashCycleLength;
    const dashEndMeters = Math.min(dashStartMeters + centerLineDashLength, length);
    const top = (dashStartMeters / length) * canvasSize;
    const height = ((dashEndMeters - dashStartMeters) / length) * canvasSize;
    context.fillRect(centerLineX, top, centerLinePixelWidth, height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, Math.max(1, getRoadRepeat(length, repeatLength)));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  return texture;
}

function createGroundMaterial(width: number, length: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: createRoadTexture(width, length),
    roughness: 0.94,
    metalness: 0.04,
  });
}

function createShoulderGroup(width: number, length: number): THREE.Group {
  const { laneWidth, laneGap, shoulderWidth, shoulderColor } = appConfig.ground.roadStyle;
  const laneSpan = laneWidth * 2 + laneGap;
  const shoulderBandWidth = Math.max((width - laneSpan) / 2, shoulderWidth);

  const group = new THREE.Group();
  const shoulderGeometry = new THREE.PlaneGeometry(shoulderBandWidth, length, 1, 1);
  const shoulderMaterial = new THREE.MeshStandardMaterial({
    color: shoulderColor,
    roughness: 0.9,
    metalness: 0.02,
  });

  const leftShoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
  leftShoulder.rotation.x = -Math.PI / 2;
  leftShoulder.position.set(-(laneSpan / 2 + shoulderBandWidth / 2), 0.003, 0);

  const rightShoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
  rightShoulder.rotation.x = -Math.PI / 2;
  rightShoulder.position.set(laneSpan / 2 + shoulderBandWidth / 2, 0.003, 0);

  group.add(leftShoulder, rightShoulder);
  return group;
}

export function createGroundPool(): GroundPool {
  const { tileCount, tileLength, width, recycleZ } = appConfig.ground;
  const tileOverlap = 1;
  const tileStride = tileLength - tileOverlap;

  const group = new THREE.Group();
  const tileGeometry = new THREE.PlaneGeometry(width, tileLength, 1, 8);
  const tileMaterial = createGroundMaterial(width, tileLength);

  const tiles = Array.from({ length: tileCount }, (_, index) => {
    const tile = new THREE.Mesh(tileGeometry, tileMaterial);
    tile.rotation.x = -Math.PI / 2;
    tile.position.set(0, 0, -index * tileStride);
    tile.add(createShoulderGroup(width, tileLength));
    group.add(tile);
    return tile;
  });

  return {
    group,
    update(delta: number, worldSpeed: number) {
      const effectiveSpeed = appConfig.ground.speed * worldSpeed;

      let furthestBackZ = tiles.reduce((minZ, currentTile) => {
        return Math.min(minZ, currentTile.position.z);
      }, Infinity);

      for (const tile of tiles) {
        tile.position.z += effectiveSpeed * delta;
        if (tile.position.z >= recycleZ) {
          tile.position.z = furthestBackZ - tileStride;
          furthestBackZ = tile.position.z;
        }
      }
    },
  };
}
