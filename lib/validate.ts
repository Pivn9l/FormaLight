import type { Links, Product } from "./types";
import { MAX_IMAGES, isUploadUrl } from "./uploads";

const str = (value: unknown, max = 500) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export function sanitizeProduct(input: Record<string, unknown>): Omit<Product, "id" | "order"> {
  const price = Number(input.price);
  return {
    title: str(input.title, 120),
    category: str(input.category, 60),
    description: str(input.description, 1000),
    size: str(input.size, 80),
    price: Number.isFinite(price) && price > 0 ? Math.round(price) : 0,
    badge: str(input.badge, 30),
    images: Array.isArray(input.images)
      ? [...new Set(input.images.filter(isUploadUrl))].slice(0, MAX_IMAGES)
      : [],
    visible: input.visible !== false,
  };
}

export function sanitizeCategory(value: unknown): string {
  return str(value, 60).replace(/\s+/g, " ");
}

export function sanitizeSoldCount(value: unknown): string {
  return str(value, 20);
}

export function sanitizeLinks(input: Record<string, unknown>): Links {
  return {
    avito: str(input.avito),
    telegram: str(input.telegram),
    yandexMarket: str(input.yandexMarket),
    instagram: str(input.instagram),
    tiktok: str(input.tiktok),
    phone: str(input.phone, 40),
  };
}
