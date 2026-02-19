import { createParticleSystem } from './particle-system';
import { createSpeedLinesSystem } from './speed-lines';

const QUALITY_LEVELS = ['low', 'medium', 'high'];
const PROFILE_MODES = ['dust', 'rain', 'snow'];

const QUALITY_PRESETS = {
  low: {
    speedLines: {
      count: 1600,
      noise: 0,
      glow: 0,
    },
    particles: {
      count: 6500,
      noise: 0,
      glow: 0,
    },
  },
  medium: {
    speedLines: {
      count: 3000,
      noise: 0.2,
      glow: 0.25,
    },
    particles: {
      count: 10000,
      noise: 0.15,
      glow: 0.22,
    },
  },
  high: {
    speedLines: {
      count: 4600,
      noise: 0.45,
      glow: 0.5,
    },
    particles: {
      count: 14500,
      noise: 0.35,
      glow: 0.4,
    },
  },
};

const resolveQuality = (quality) => (QUALITY_PRESETS[quality] ? quality : 'medium');
const resolveProfile = (profile) => (PROFILE_MODES.includes(profile) ? profile : 'dust');

export function createEffectsController(scene, camera, config = {}) {
  const speedLinesBase = {
    color: 0xa6d6ff,
    minLength: 1.5,
    maxLength: 9,
    spreadX: 34,
    spreadY: 18,
    nearDistance: 4,
    farDistance: 260,
    speedScale: 1.4,
    ...config.speedLines,
  };

  const particlesBase = {
    profile: 'car',
    nearDistance: 3,
    farDistance: 220,
    ...config.particles,
  };

  let quality = resolveQuality(config.quality);
  let profile = resolveProfile(config.profile);

  let speedLinesSystem;
  let particleSystem;

  const mountSystems = () => {
    const preset = QUALITY_PRESETS[quality];
    speedLinesSystem = createSpeedLinesSystem(scene, camera, {
      ...speedLinesBase,
      ...preset.speedLines,
    });

    particleSystem = createParticleSystem(scene, camera, {
      ...particlesBase,
      ...preset.particles,
      mode: profile,
    });
  };

  const remountSystems = () => {
    speedLinesSystem?.dispose();
    particleSystem?.dispose();
    mountSystems();
  };

  mountSystems();

  return {
    update(delta, speed) {
      speedLinesSystem.update(delta, speed, camera);
      particleSystem.update(delta, speed, camera);
    },
    setQuality(nextQuality) {
      const resolved = resolveQuality(nextQuality);
      if (resolved === quality) return quality;
      quality = resolved;
      remountSystems();
      return quality;
    },
    setProfile(nextProfile) {
      profile = resolveProfile(nextProfile);
      particleSystem.setMode(profile);
      return profile;
    },
    cycleProfile() {
      const currentIndex = PROFILE_MODES.indexOf(profile);
      const nextProfile = PROFILE_MODES[(currentIndex + 1) % PROFILE_MODES.length];
      return this.setProfile(nextProfile);
    },
    getState() {
      return { quality, profile };
    },
    dispose() {
      speedLinesSystem?.dispose();
      particleSystem?.dispose();
    },
  };
}
