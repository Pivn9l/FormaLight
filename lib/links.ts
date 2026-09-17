import type { Links } from "./types";

export type LinkKey = keyof Links;

export const LINK_FIELDS: {
  key: LinkKey;
  label: string;
  icon: string;
  placeholder: string;
}[] = [
  { key: "phone", label: "Телефон", icon: "call", placeholder: "+7 900 000-00-00" },
  { key: "telegram", label: "Telegram", icon: "send", placeholder: "@formalight или https://t.me/formalight" },
  { key: "avito", label: "Авито", icon: "storefront", placeholder: "https://www.avito.ru/..." },
  { key: "yandexMarket", label: "Яндекс Маркет", icon: "shopping_bag", placeholder: "https://market.yandex.ru/..." },
  { key: "instagram", label: "Instagram", icon: "photo_camera", placeholder: "https://instagram.com/..." },
  { key: "tiktok", label: "TikTok", icon: "music_note", placeholder: "https://www.tiktok.com/@..." },
];

export function isLinkKey(value: unknown): value is LinkKey {
  return LINK_FIELDS.some((f) => f.key === value);
}

export function hrefFor(key: LinkKey, value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (key === "phone") return `tel:${v.replace(/[^\d+]/g, "")}`;
  if (key === "telegram" && v.startsWith("@")) return `https://t.me/${v.slice(1)}`;
  if (key === "instagram" && v.startsWith("@")) return `https://instagram.com/${v.slice(1)}`;
  if (key === "tiktok" && v.startsWith("@")) return `https://www.tiktok.com/${v}`;
  if (!/^https?:\/\//i.test(v)) return `https://${v}`;
  return v;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU").format(price) + " ₽";
}
