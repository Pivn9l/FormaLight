"use client";

import { useEffect } from "react";

const VISITOR_KEY = "fl-visitor";

function send(event: Record<string, string>) {
  fetch("/api/stats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
    keepalive: true, // запрос не оборвётся, если ссылка уводит со страницы
  }).catch(() => undefined);
}

/** Анонимный id браузера: по нему считаем уникальных посетителей */
function visitorId(): string {
  try {
    const saved = localStorage.getItem(VISITOR_KEY);
    if (saved && /^[a-f0-9]{16}$/.test(saved)) return saved;
  } catch {
    // Хранилище недоступно — посетитель будет посчитан заново при следующем заходе
  }
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const id = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  try {
    localStorage.setItem(VISITOR_KEY, id);
  } catch {}
  return id;
}

/** Считает визит и переходы по элементам с атрибутом data-track="<ключ ссылки>" */
export function Analytics() {
  useEffect(() => {
    send({ type: "visit", id: visitorId() });

    const onClick = (e: MouseEvent) => {
      // auxclick — открытие ссылки колёсиком в новой вкладке
      if (e.type === "auxclick" && e.button !== 1) return;
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-track]");
      if (el?.dataset.track) send({ type: "click", key: el.dataset.track });
    };
    document.addEventListener("click", onClick);
    document.addEventListener("auxclick", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("auxclick", onClick);
    };
  }, []);

  return null;
}
