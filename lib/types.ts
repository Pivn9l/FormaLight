export type Product = {
  id: string;
  title: string;
  category: string;
  description: string;
  size: string;
  price: number;
  badge: string;
  /** Ссылки на фото товара (/api/uploads/...), первое — обложка */
  images: string[];
  visible: boolean;
  order: number;
};

export type Links = {
  avito: string;
  telegram: string;
  yandexMarket: string;
  instagram: string;
  tiktok: string;
  phone: string;
};

export type Store = {
  categories: string[];
  products: Product[];
  links: Links;
  /** Подпись счётчика продаж на главной, например «500+» */
  soldCount: string;
};

export type StatsPeriod = "total" | "month" | "week" | "day";

export type StatsSummary = {
  /** Уникальные посетители */
  visitors: Record<StatsPeriod, number>;
  /** Переходы по ссылкам из блока контактов и карточек товаров */
  clicks: Record<keyof Links, Record<StatsPeriod, number>>;
};
