import * as THREE from 'three';

export type VehicleLights = {
  group: THREE.Group;
  update: (camera: THREE.Camera) => void;
};

const FORWARD = new THREE.Vector3();
const RIGHT = new THREE.Vector3();
const BASE_POSITION = new THREE.Vector3();
const TARGET_POSITION = new THREE.Vector3();

function createHeadlight(): THREE.SpotLight {
  const light = new THREE.SpotLight(0xdde8ff, 8, 95, Math.PI / 8, 0.45, 1.7);
  light.castShadow = false;
  return light;
}

export function createVehicleLights(): VehicleLights {
  const group = new THREE.Group();
  group.name = 'vehicle-lights';

  const leftHeadlight = createHeadlight();
  const rightHeadlight = createHeadlight();

  const leftTarget = new THREE.Object3D();
  const rightTarget = new THREE.Object3D();

  leftHeadlight.target = leftTarget;
  rightHeadlight.target = rightTarget;

  const roadGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(5.5, 16),
    new THREE.MeshBasicMaterial({
      color: 0x8ab8ff,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  roadGlow.rotation.x = -Math.PI / 2;

  group.add(leftHeadlight, rightHeadlight, leftTarget, rightTarget, roadGlow);

  return {
    group,
    update(camera) {
      FORWARD.set(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
      RIGHT.set(1, 0, 0).applyQuaternion(camera.quaternion).normalize();
      BASE_POSITION.copy(camera.position).addScaledVector(FORWARD, 0.65);

      const placeLight = (light: THREE.SpotLight, target: THREE.Object3D, side: number) => {
        light.position.copy(BASE_POSITION).addScaledVector(RIGHT, side * 0.34);
        light.position.y -= 0.16;

        TARGET_POSITION.copy(light.position).addScaledVector(FORWARD, 26);
        TARGET_POSITION.y -= 0.32;
        target.position.copy(TARGET_POSITION);
      };

      placeLight(leftHeadlight, leftTarget, -1);
      placeLight(rightHeadlight, rightTarget, 1);

      roadGlow.position.copy(camera.position).addScaledVector(FORWARD, 7.5);
      roadGlow.position.y = 0.03;
    },
  };
}
