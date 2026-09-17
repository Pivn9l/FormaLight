"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "./ProductCard";
import { setMirrorShape, shapeForCategory } from "@/lib/mirrorShape";
import type { Product } from "@/lib/types";

const ALL = "Все";

type Props = {
  products: Product[];
  categories: string[];
  orderHref: string;
};

export function Catalog({ products, categories, orderHref }: Props) {
  const [active, setActive] = useState(ALL);

  // Показываем только категории, в которых есть товары, в порядке из админ-панели
  const tabs = useMemo(() => {
    const used = new Set(products.map((p) => p.category));
    return [ALL, ...categories.filter((c) => used.has(c))];
  }, [products, categories]);

  function selectCategory(category: string) {
    setActive(category);
    const shape = shapeForCategory(category, category === ALL);
    if (shape) setMirrorShape(shape);
  }

  const shown = active === ALL ? products : products.filter((p) => p.category === active);

  return (
    <section id="catalog" className="section">
      <div className="container">
        <div className="section-head section-head-row">
          <div>
            <p className="eyebrow">Каталог</p>
            <h2 className="section-title">Коллекция зеркал</h2>
          </div>
          {tabs.length > 2 && (
            <div className="filters" role="tablist" aria-label="Категории">
              {tabs.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="tab"
                  aria-selected={active === c}
                  className={`chip ${active === c ? "chip-active" : ""}`}
                  onClick={() => selectCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {shown.length > 0 ? (
          <div className="grid">
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} orderHref={orderHref} />
            ))}
          </div>
        ) : (
          <p className="empty">Скоро здесь появятся новые модели.</p>
        )}
      </div>
    </section>
  );
}
