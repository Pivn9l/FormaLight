"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Icon } from "./Icon";
import { outline, outlinePoints } from "./mirrorShapes";
import { getMirrorShape, subscribeMirrorShape, type MirrorShape } from "@/lib/mirrorShape";

const CAMERA_Z = 6.8;
const GLOW_Z = -2.2;
const GLOW_SIZE = 7.35;
const STANDOFF_SCALE = 0.86; // подложка с лентой меньше зеркала

/** Две палитры сцены: тёплая (светлая тема) и холодная (тёмная тема) */
const PALETTES = {
  warm: {
    room: ["#fffaf2", "#f1e7d7", "#d9cab2", "#b9a88e"],
    window: new THREE.Color(1, 0.98, 0.94),
    lamp: new THREE.Color(1, 0.78, 0.5),
    wall: [0x6a7282, 0x7a8291],
    wood: 0xc8b79c,
    glow: ["rgba(255, 214, 150, 0.3)", "rgba(255, 196, 115, 0.75)", "rgba(255, 190, 105, 1)"],
  },
  cold: {
    room: ["#3a4a62", "#1f2a3b", "#141c29", "#0a0f17"],
    window: new THREE.Color(0.84, 0.93, 1),
    lamp: new THREE.Color(0.55, 0.8, 1),
    wall: [0x0f1724, 0x162132],
    wood: 0x3b4a60,
    glow: ["rgba(150, 205, 255, 0.28)", "rgba(110, 185, 255, 0.75)", "rgba(125, 200, 255, 1)"],
  },
};
type Palette = (typeof PALETTES)["warm"];

/** Интерьер, который отражается в зеркале: стены, окна, лампа и тёмные акценты */
function makeEnvironmentScene(palette: Palette): THREE.Scene {
  const env = new THREE.Scene();

  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, palette.room[0]);
  g.addColorStop(0.45, palette.room[1]);
  g.addColorStop(0.55, palette.room[2]);
  g.addColorStop(1, palette.room[3]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 16, 256);
  const roomTexture = new THREE.CanvasTexture(canvas);
  roomTexture.colorSpace = THREE.SRGBColorSpace;

  env.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(20, 32, 16),
      new THREE.MeshBasicMaterial({ map: roomTexture, side: THREE.BackSide }),
    ),
  );

  // Панель на окружности вокруг зеркала; azimuth в градусах от оси +Z (к камере)
  const panel = (azimuth: number, y: number, w: number, h: number, color: THREE.Color) => {
    const a = (azimuth * Math.PI) / 180;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
    );
    mesh.position.set(12 * Math.sin(a), y, 12 * Math.cos(a));
    mesh.lookAt(0, y, 0);
    env.add(mesh);
  };

  // Стартовый ракурс отражает сектор примерно от -75° до -15°; справа — детали для других ракурсов
  const white = (k: number) => palette.window.clone().multiplyScalar(k);
  panel(-64, 1, 3, 11, white(3)); // окно
  panel(-49, 0, 1.8, 16, new THREE.Color(palette.wall[0])); // стена
  panel(-34, 1, 2.4, 11, white(2.5)); // второе окно
  panel(-18, -1, 3.5, 16, new THREE.Color(palette.wood)); // шкаф
  panel(-82, -1.5, 2, 2, palette.lamp.clone().multiplyScalar(3)); // лампа
  panel(20, 0, 2.2, 16, new THREE.Color(palette.wall[1])); // стена
  panel(42, 1, 3, 11, white(3)); // окно
  panel(70, -1, 3.5, 16, new THREE.Color(palette.wood)); // шкаф

  return env;
}

/** Свечение на стене, повторяющее контур зеркала */
function makeGlowTexture(shape: MirrorShape, palette: Palette): THREE.CanvasTexture {
  const size = 512;
  const half = size / 2;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Стена дальше зеркала, поэтому контур увеличиваем по перспективе
  const perspective = (CAMERA_Z - GLOW_Z) / CAMERA_Z;
  const px = (size * perspective) / GLOW_SIZE;
  const points = outlinePoints(shape, 200);

  // Рисуем контур за пределами холста и оставляем на холсте только его размытую тень
  const OFFSET = size * 4;
  const glowPass = (color: string, blur: number, lineWidth: number, fill: boolean) => {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = OFFSET;
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = half + p.x * px - OFFSET;
      const y = half - p.y * px;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle = "#000";
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = "round";
    if (fill) ctx.fill();
    else ctx.stroke();
    ctx.restore();
  };
  glowPass(palette.glow[0], 40, 0, true);
  glowPass(palette.glow[1], 70, 30, false);
  glowPass(palette.glow[2], 30, 22, false);

  // Плавно гасим края, чтобы свечение не упиралось в границу холста
  ctx.globalCompositeOperation = "destination-in";
  const mask = ctx.createRadialGradient(half, half, 0, half, half, half);
  mask.addColorStop(0, "#000");
  mask.addColorStop(0.6, "#000");
  mask.addColorStop(0.7, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

type ShapeGeometries = {
  glass: THREE.BufferGeometry;
  back: THREE.BufferGeometry;
  bevel: THREE.BufferGeometry;
  standoff: THREE.BufferGeometry;
  led: THREE.BufferGeometry;
};

function buildGeometries(shape: MirrorShape): ShapeGeometries {
  const contour = outline(shape);

  // Стекло: лицевая сторона и торец (группы 0 и 1 у ExtrudeGeometry)
  const glass = new THREE.ExtrudeGeometry(contour, {
    depth: 0.1,
    bevelEnabled: false,
    curveSegments: 96,
  });
  glass.translate(0, 0, -0.05);

  // Тыльная сторона (амальгама) — отдельно, чтобы при повороте была тёмной
  const back = new THREE.ShapeGeometry(contour, 96);
  back.rotateY(Math.PI);
  back.translate(0, 0, -0.051);

  // Фацет — полоска по краю лицевой стороны
  const ring = outline(shape);
  ring.holes.push(outline(shape, 0.09));
  const bevel = new THREE.ShapeGeometry(ring, 96);
  bevel.translate(0, 0, 0.051);

  // Подложка, отодвигающая зеркало от стены
  const standoff = new THREE.ExtrudeGeometry(contour, {
    depth: 0.22,
    bevelEnabled: false,
    curveSegments: 64,
  });
  standoff.scale(STANDOFF_SCALE, STANDOFF_SCALE, 1);
  standoff.translate(0, 0, -0.255);

  // LED-лента по контуру подложки
  const ledPath = new THREE.CatmullRomCurve3(
    outlinePoints(shape).map(
      (p) => new THREE.Vector3(p.x * STANDOFF_SCALE, p.y * STANDOFF_SCALE, -0.2),
    ),
    true,
    "centripetal",
  );
  const led = new THREE.TubeGeometry(ledPath, 400, 0.03, 12, true);

  return { glass, back, bevel, standoff, led };
}

export function Mirror3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const lightTarget = useRef(1);
  const [lightOn, setLightOn] = useState(true);
  const [brightness, setBrightness] = useState(100); // яркость ленты, %
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    lightTarget.current = lightOn ? brightness / 100 : 0;
  }, [lightOn, brightness]);

  function changeBrightness(value: number) {
    setBrightness(value);
    setLightOn(true); // регулировка яркости включает выключенную подсветку
  }

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(0, 0, CAMERA_Z);

    // Окружение для реалистичных отражений в зеркале
    const pmrem = new THREE.PMREMGenerator(renderer);
    const bakeEnvironment = (palette: Palette) => {
      const envScene = makeEnvironmentScene(palette);
      const texture = pmrem.fromScene(envScene, 0.02).texture;
      envScene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          (obj.material as THREE.MeshBasicMaterial).map?.dispose();
          (obj.material as THREE.Material).dispose();
        }
      });
      return texture;
    };
    const envWarm = bakeEnvironment(PALETTES.warm);
    const envCold = bakeEnvironment(PALETTES.cold);

    // Тема сайта: светлая — тёплая подсветка, тёмная — холодная
    const isDark = () => document.documentElement.dataset.theme === "dark";
    let coldTarget = isDark() ? 1 : 0;
    let cold = coldTarget;
    const themeObserver = new MutationObserver(() => {
      coldTarget = isDark() ? 1 : 0;
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    scene.environment = cold > 0.5 ? envCold : envWarm;

    const hemi = new THREE.HemisphereLight(0xfffaf0, 0xe6d8c0, 1.2);
    scene.add(hemi);
    const hemiSky = { warm: new THREE.Color(0xfffaf0), cold: new THREE.Color(0xdbe8f7) };
    const hemiGround = { warm: new THREE.Color(0xe6d8c0), cold: new THREE.Color(0x1a2433) };
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(3, 4, 5);
    scene.add(key);

    // Материалы
    const mirrorMat = new THREE.MeshPhysicalMaterial({
      color: 0xf7f4ee,
      metalness: 1,
      roughness: 0.02,
      envMapIntensity: 1,
    });
    const edgeMat = new THREE.MeshPhysicalMaterial({
      color: 0xbcd5ca,
      metalness: 0.1,
      roughness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
    });
    const backMat = new THREE.MeshStandardMaterial({ color: 0x4a4744, roughness: 0.85 });
    const bevelMat = new THREE.MeshPhysicalMaterial({
      color: 0xe2ece7,
      metalness: 0.85,
      roughness: 0.06,
    });
    const standoffMat = new THREE.MeshStandardMaterial({ color: 0xd9d2c6, roughness: 0.7 });
    const mix = {
      mirror: { warm: new THREE.Color(0xf7f4ee), cold: new THREE.Color(0xeef4fa) },
      standoff: { warm: new THREE.Color(0xd9d2c6), cold: new THREE.Color(0x2a3445) },
      ledOn: { warm: new THREE.Color(1, 0.87, 0.62), cold: new THREE.Color(0.72, 0.9, 1) },
      ledOff: { warm: new THREE.Color(0x8d857a), cold: new THREE.Color(0x4a5566) },
      backLight: { warm: new THREE.Color(0xffc27a), cold: new THREE.Color(0x8ccaff) },
    };
    const ledOn = new THREE.Color();
    const ledOff = new THREE.Color();
    const ledMat = new THREE.MeshBasicMaterial({ toneMapped: false });
    const glowMatWarm = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    const glowMatCold = glowMatWarm.clone();

    // Свечение на стене — плоскость отодвинута, чтобы повёрнутое зеркало её не пересекало.
    // Тёплый и холодный слои плавно сменяют друг друга при переключении темы
    const glowGeometry = new THREE.PlaneGeometry(GLOW_SIZE, GLOW_SIZE);
    const glow = new THREE.Group();
    glow.add(new THREE.Mesh(glowGeometry, glowMatWarm), new THREE.Mesh(glowGeometry, glowMatCold));
    glow.position.z = GLOW_Z;
    scene.add(glow);

    // Зеркало: меши создаются один раз, при смене формы меняется только геометрия
    const mirror = new THREE.Group();
    scene.add(mirror);
    const empty = new THREE.BufferGeometry();
    const glass = new THREE.Mesh(empty, [mirrorMat, edgeMat]);
    const back = new THREE.Mesh(empty, backMat);
    const bevel = new THREE.Mesh(empty, bevelMat);
    const standoff = new THREE.Mesh(empty, standoffMat);
    const led = new THREE.Mesh(empty, ledMat);
    mirror.add(glass, back, bevel, standoff, led);

    const backLight = new THREE.PointLight(0xffc27a, 6, 4, 1.5);
    backLight.position.z = -0.45;
    mirror.add(backLight);

    let shownShape = getMirrorShape();
    const applyShape = (shape: MirrorShape) => {
      const next = buildGeometries(shape);
      for (const [mesh, geometry] of [
        [glass, next.glass],
        [back, next.back],
        [bevel, next.bevel],
        [standoff, next.standoff],
        [led, next.led],
      ] as const) {
        if (mesh.geometry !== empty) mesh.geometry.dispose();
        mesh.geometry = geometry;
      }
      for (const [mat, palette] of [
        [glowMatWarm, PALETTES.warm],
        [glowMatCold, PALETTES.cold],
      ] as const) {
        mat.map?.dispose();
        mat.map = makeGlowTexture(shape, palette);
        mat.needsUpdate = true;
      }
      shownShape = shape;
    };
    applyShape(shownShape);

    // Размер
    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    // Вращение перетаскиванием: по горизонтали — полный оборот, по вертикали — наклон
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const MAX_TILT = 0.7;
    const clampTilt = (v: number) => Math.max(-MAX_TILT, Math.min(MAX_TILT, v));

    const BASE_X = 0.1;
    const BASE_Y = -0.4;
    mirror.rotation.order = "YXZ";
    mirror.rotation.set(BASE_X, BASE_Y, 0);
    let homing = false; // плавный возврат к исходному ракурсу после смены формы

    const drag = { active: false, id: -1, x: 0, y: 0 };
    const velocity = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      drag.active = true;
      drag.id = e.pointerId;
      drag.x = e.clientX;
      drag.y = e.clientY;
      velocity.x = velocity.y = 0;
      homing = false;
      mount.setPointerCapture(e.pointerId);
      mount.classList.add("is-dragging");
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!drag.active || e.pointerId !== drag.id) return;
      velocity.y = (e.clientX - drag.x) * 0.008;
      velocity.x = (e.clientY - drag.y) * 0.006;
      drag.x = e.clientX;
      drag.y = e.clientY;
      mirror.rotation.y += velocity.y;
      mirror.rotation.x = clampTilt(mirror.rotation.x + velocity.x);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== drag.id) return;
      drag.active = false;
      if (reduceMotion) velocity.x = velocity.y = 0;
      mount.classList.remove("is-dragging");
    };
    mount.addEventListener("pointerdown", onPointerDown);
    mount.addEventListener("pointermove", onPointerMove);
    mount.addEventListener("pointerup", onPointerUp);
    mount.addEventListener("pointercancel", onPointerUp);

    // Смена формы: зеркало сжимается, меняет геометрию и разворачивается обратно
    let pendingShape: MirrorShape | null = null;
    let scale = 1;
    const unsubscribe = subscribeMirrorShape((shape) => {
      if (shape === shownShape && !pendingShape) return;
      pendingShape = shape;
      if (reduceMotion) {
        applyShape(shape);
        pendingShape = null;
      }
    });

    const clock = new THREE.Clock();
    let light = lightTarget.current;
    let frame = 0;

    // Сглаживание по реальному времени, чтобы скорость не зависела от частоты кадров
    const ease = (speed: number, dt: number) => 1 - Math.exp(-speed * dt);

    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.1);
      const t = clock.elapsedTime;
      const motion = reduceMotion ? 0 : 1;

      if (pendingShape) {
        scale += (0 - scale) * ease(16, dt);
        if (scale < 0.03) {
          applyShape(pendingShape);
          pendingShape = null;
          // Новая форма появляется с небольшим доворотом в исходный ракурс
          if (!drag.active) {
            velocity.x = velocity.y = 0;
            const turns = Math.round((mirror.rotation.y - BASE_Y) / (Math.PI * 2));
            mirror.rotation.y = BASE_Y + turns * Math.PI * 2 + 0.7;
            homing = true;
          }
        }
      } else if (scale < 0.999) {
        scale += (1 - scale) * ease(9, dt);
      }
      const s = Math.max(scale, 0.001);
      mirror.scale.setScalar(s);
      glow.scale.setScalar(s);

      if (homing && !drag.active) {
        const turns = Math.round((mirror.rotation.y - BASE_Y) / (Math.PI * 2));
        const targetY = BASE_Y + turns * Math.PI * 2;
        const k = ease(5, dt);
        mirror.rotation.y += (targetY - mirror.rotation.y) * k;
        mirror.rotation.x += (BASE_X - mirror.rotation.x) * k;
        if (Math.abs(targetY - mirror.rotation.y) < 0.002) homing = false;
      }

      // Инерция после того, как стекло отпустили
      if (!drag.active &&(Math.abs(velocity.x) > 1e-4 || Math.abs(velocity.y) > 1e-4)) {
        mirror.rotation.y += velocity.y;
        mirror.rotation.x = clampTilt(mirror.rotation.x + velocity.x);
        velocity.x *= 0.94;
        velocity.y *= 0.94;
      }

      // Переход между тёплой и холодной подсветкой
      cold += (coldTarget - cold) * (reduceMotion ? 1 : ease(4, dt));
      const env = cold > 0.5 ? envCold : envWarm;
      if (scene.environment !== env) scene.environment = env;
      mirrorMat.color.lerpColors(mix.mirror.warm, mix.mirror.cold, cold);
      standoffMat.color.lerpColors(mix.standoff.warm, mix.standoff.cold, cold);
      hemi.color.lerpColors(hemiSky.warm, hemiSky.cold, cold);
      hemi.groundColor.lerpColors(hemiGround.warm, hemiGround.cold, cold);
      hemi.intensity = 1.2 - cold * 0.4;
      ledOn.lerpColors(mix.ledOn.warm, mix.ledOn.cold, cold);
      ledOff.lerpColors(mix.ledOff.warm, mix.ledOff.cold, cold);
      backLight.color.lerpColors(mix.backLight.warm, mix.backLight.cold, cold);

      light += (lightTarget.current - light) * ease(5, dt);
      const pulse = 1 - motion * (0.06 - Math.sin(t * 1.2) * 0.06);
      const glowOpacity = light * pulse * scale;
      glowMatWarm.opacity = glowOpacity * (1 - cold);
      glowMatCold.opacity = glowOpacity * cold;
      ledMat.color.copy(ledOff).lerp(ledOn, light);
      backLight.intensity = 6 * light;

      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(frame);
      unsubscribe();
      mount.removeEventListener("pointerdown", onPointerDown);
      mount.removeEventListener("pointermove", onPointerMove);
      mount.removeEventListener("pointerup", onPointerUp);
      mount.removeEventListener("pointercancel", onPointerUp);
      observer.disconnect();
      themeObserver.disconnect();
      glowMatWarm.map?.dispose();
      glowMatCold.map?.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => m.dispose());
        }
      });
      empty.dispose();
      envWarm.dispose();
      envCold.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="mirror3d">
      <div ref={mountRef} className="mirror3d-canvas" aria-hidden="true" />

      {failed && (
        <div className="mirror" aria-hidden="true">
          <div className="mirror-glass" />
        </div>
      )}

      <span className="callout callout-glass">
        <i />
        Зеркальное стекло
      </span>
      <span className="callout callout-led">
        <i />
        LED-лента по контуру
      </span>

      <div
        className={`brightness ${lightOn ? "" : "is-off"}`}
        style={{ "--level": `${((brightness - 10) / 90) * 100}%` } as React.CSSProperties}
      >
        <Icon name="brightness_high" className="brightness-icon" />
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={brightness}
          onChange={(e) => changeBrightness(Number(e.target.value))}
          aria-label="Яркость подсветки"
          aria-valuetext={`${brightness}%`}
        />
        <Icon name="brightness_low" className="brightness-icon brightness-icon-low" />
        <span className="brightness-value">{lightOn ? `${brightness}%` : "выкл"}</span>
      </div>

      <div className="mirror3d-controls">
        <button
          type="button"
          className="light-toggle"
          aria-pressed={lightOn}
          onClick={() => setLightOn((v) => !v)}
        >
          <Icon name="lightbulb" filled={lightOn} />
          {lightOn ? "Подсветка включена" : "Подсветка выключена"}
        </button>
        {!failed && (
          <span className="drag-hint">
            <Icon name="360" />
            Потяните, чтобы повернуть
          </span>
        )}
      </div>
    </div>
  );
}
