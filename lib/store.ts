import { promises as fs } from "fs";
import path from "path";
import { seed } from "./seed";
import type { Product, Store } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "store.json");

export async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      categories: parsed.categories ?? [...seed.categories],
      products: (parsed.products ?? []).map((p) => ({ ...p, images: p.images ?? [] })),
      links: { ...seed.links, ...parsed.links },
      soldCount: parsed.soldCount ?? seed.soldCount,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      const initial = structuredClone(seed);
      await writeStore(initial);
      return initial;
    }
    throw error;
  }
}

export async function writeStore(store: Store): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(store, null, 2), "utf8");
}

export function sortProducts(products: Product[]): Product[] {
  return [...products].sort((a, b) => a.order - b.order);
}
