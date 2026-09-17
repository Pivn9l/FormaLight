"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

type Props = {
  images: string[];
  title: string;
  start: number;
  onClose: () => void;
};

/** Полноэкранный просмотр фото товара: Esc — закрыть, ←/→ — листать */
export function Lightbox({ images, title, start, onClose }: Props) {
  const [index, setIndex] = useState(start);
  const many = images.length > 1;
  const go = (dir: number) => setIndex((i) => (i + dir + images.length) % images.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [images.length, onClose]);

  return createPortal(
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <button className="lightbox-btn lightbox-close" onClick={onClose} aria-label="Закрыть">
        <Icon name="close" />
      </button>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="lightbox-img" src={images[index]} alt={`${title} — фото ${index + 1}`} />

      {many && (
        <>
          <button className="lightbox-btn lightbox-prev" onClick={() => go(-1)} aria-label="Предыдущее фото">
            <Icon name="chevron_left" />
          </button>
          <button className="lightbox-btn lightbox-next" onClick={() => go(1)} aria-label="Следующее фото">
            <Icon name="chevron_right" />
          </button>
          <p className="lightbox-count">
            {index + 1} / {images.length}
          </p>
        </>
      )}
    </div>,
    document.body,
  );
}
