// Общее состояние формы 3D-зеркала: каталог выбирает форму, зеркало в hero её показывает

export type MirrorShape = "circle" | "square" | "rectV" | "rectH" | "oval" | "rhombus";

// Овал и ромб — «секретные»: своих категорий пока нет, выпадают только во вкладке «Все»
const ALL_SHAPES: MirrorShape[] = ["circle", "square", "rectV", "rectH", "oval", "rhombus"];

let current: MirrorShape = "circle";
const listeners = new Set<(shape: MirrorShape) => void>();

export function getMirrorShape(): MirrorShape {
  return current;
}

export function setMirrorShape(shape: MirrorShape) {
  current = shape;
  listeners.forEach((listener) => listener(shape));
}

export function subscribeMirrorShape(listener: (shape: MirrorShape) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

/** Форма для выбранной вкладки каталога; null — категория с формой не связана */
export function shapeForCategory(category: string, isAll: boolean): MirrorShape | null {
  // «Все» — случайная форма, но не та же, что сейчас, чтобы смена была заметна
  if (isAll) return pick(ALL_SHAPES.filter((s) => s !== current));

  const name = category.toLocaleLowerCase("ru");
  if (name.startsWith("кругл")) return "circle";
  if (name.startsWith("квадрат")) return "square";
  if (name.startsWith("прямоуг")) return pick<MirrorShape>(["rectV", "rectH"]);
  // Заготовка на будущее, если в админке появятся такие категории
  if (name.startsWith("овал")) return "oval";
  if (name.startsWith("ромб")) return "rhombus";
  return null;
}
