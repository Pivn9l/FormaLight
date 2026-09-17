import * as THREE from "three";
import type { MirrorShape } from "@/lib/mirrorShape";

// Размеры в единицах сцены. Самая дальняя точка любой формы — не дальше ~1.8 от центра,
// чтобы зеркало и свечение помещались в кадр
const CORNER = 0.12;

function roundedRect(w: number, h: number, r: number): THREE.Shape {
  const x = -w / 2;
  const y = -h / 2;
  const s = new THREE.Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function ellipse(rx: number, ry: number): THREE.Shape {
  const s = new THREE.Shape();
  s.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
  return s;
}

/** Контур зеркала; inset — отступ внутрь (для фацета) */
export function outline(shape: MirrorShape, inset = 0): THREE.Shape {
  const r = Math.max(CORNER - inset, 0.02);
  switch (shape) {
    case "circle":
      return ellipse(1.5 - inset, 1.5 - inset);
    case "oval":
      return ellipse(1.05 - inset, 1.6 - inset);
    case "square":
      return roundedRect(2.5 - inset * 2, 2.5 - inset * 2, r);
    case "rectV":
      return roundedRect(1.8 - inset * 2, 2.9 - inset * 2, r);
    case "rectH":
      return roundedRect(2.9 - inset * 2, 1.8 - inset * 2, r);
    case "rhombus": {
      const a = 1.25;
      const b = 1.65;
      const k = Math.hypot(a, b);
      const a2 = a - (inset * k) / b;
      const b2 = b - (inset * k) / a;
      const s = new THREE.Shape();
      s.moveTo(0, b2);
      s.lineTo(a2, 0);
      s.lineTo(0, -b2);
      s.lineTo(-a2, 0);
      s.closePath();
      return s;
    }
  }
}

/** Равномерно расставленные точки контура без повтора первой точки в конце */
export function outlinePoints(shape: MirrorShape, count = 240): THREE.Vector2[] {
  const points = outline(shape).getSpacedPoints(count);
  points.pop();
  return points;
}
