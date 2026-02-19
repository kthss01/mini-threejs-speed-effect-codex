export type SpeedHudOptions = {
  container: HTMLElement;
  minKmh: number;
  maxKmh: number;
  initialKmh: number;
  onSpeedChange: (kmh: number) => void;
};

export type SpeedHud = {
  dispose: () => void;
};

export function createSpeedHud(options: SpeedHudOptions): SpeedHud {
  const { container, minKmh, maxKmh, initialKmh, onSpeedChange } = options;
  const clampedInitial = Math.min(maxKmh, Math.max(minKmh, initialKmh));

  const hud = document.createElement('section');
  hud.className = 'speed-hud';

  const title = document.createElement('h2');
  title.className = 'speed-hud__title';
  title.textContent = 'Speed Control';

  const gauge = document.createElement('div');
  gauge.className = 'speedometer';

  const needle = document.createElement('div');
  needle.className = 'speedometer__needle';

  const speedValue = document.createElement('p');
  speedValue.className = 'speedometer__value';

  gauge.append(needle, speedValue);

  const slider = document.createElement('input');
  slider.className = 'speed-hud__slider';
  slider.type = 'range';
  slider.min = String(minKmh);
  slider.max = String(maxKmh);
  slider.step = '1';
  slider.value = String(clampedInitial);

  const scale = document.createElement('div');
  scale.className = 'speed-hud__scale';
  scale.innerHTML = `<span>${minKmh} km/h</span><span>${maxKmh} km/h</span>`;

  hud.append(title, gauge, slider, scale);
  container.append(hud);

  const setValue = (kmh: number) => {
    const ratio = (kmh - minKmh) / (maxKmh - minKmh || 1);
    const needleDeg = -120 + ratio * 240;

    speedValue.textContent = `${Math.round(kmh)} km/h`;
    needle.style.transform = `translateX(-50%) rotate(${needleDeg}deg)`;
    onSpeedChange(kmh);
  };

  const handleInput = () => {
    const kmh = Number(slider.value);
    setValue(kmh);
  };

  slider.addEventListener('input', handleInput);
  setValue(clampedInitial);

  return {
    dispose() {
      slider.removeEventListener('input', handleInput);
      hud.remove();
    },
  };
}
