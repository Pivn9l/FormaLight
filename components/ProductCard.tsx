"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { Lightbox } from "./Lightbox";
import { formatPrice } from "@/lib/links";
import type { Product } from "@/lib/types";

export function ProductCard({ product, orderHref }: { product: Product; orderHref: string }) {
  const external = orderHref.startsWith("http");
  const [zoomed, setZoomed] = useState(false);
  const [cover, ...rest] = product.images;

  return (
    <article className="card">
      {cover ? (
        <button
          type="button"
          className="card-media card-media-photo"
          onClick={() => setZoomed(true)}
          aria-label={`Увеличить фото ${product.title}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt={product.title} loading="lazy" />
          {product.badge && <span className="card-badge">{product.badge}</span>}
          <span className="card-zoom">
            <Icon name="zoom_in" />
            {rest.length > 0 && <span>+{rest.length}</span>}
          </span>
        </button>
      ) : (
        <div className="card-media" aria-hidden="true">
          <span className="card-initial">{product.title.charAt(0)}</span>
          {product.badge && <span className="card-badge">{product.badge}</span>}
        </div>
      )}
      {zoomed && (
        <Lightbox
          images={product.images}
          title={product.title}
          start={0}
          onClose={() => setZoomed(false)}
        />
      )}

      <div className="card-body">
        {product.category && <p className="card-category">{product.category}</p>}
        <h3 className="card-title">{product.title}</h3>
        {product.description && <p className="card-text">{product.description}</p>}
        {product.size && (
          <p className="card-size">
            <Icon name="straighten" />
            {product.size}
          </p>
        )}
      </div>

      <div className="card-footer">
        <p className="card-price">
          {product.price > 0 ? (
            <>
              <span>от</span> {formatPrice(product.price)}
            </>
          ) : (
            <span>Цена по запросу</span>
          )}
        </p>
        <a
          href={orderHref}
          className="card-action"
          data-track={external ? "telegram" : undefined}
          aria-label={`Заказать ${product.title}`}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          <Icon name="north_east" />
        </a>
      </div>
    </article>
  );
}
