"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { LogoMark } from "@/components/Logo";
import { LINK_FIELDS, formatPrice } from "@/lib/links";
import type { Links, Product, StatsPeriod, StatsSummary } from "@/lib/types";

type Draft = Omit<Product, "id" | "order" | "price"> & { price: string };

const EMPTY_DRAFT: Draft = {
  title: "",
  category: "",
  description: "",
  size: "",
  price: "",
  badge: "",
  images: [],
  visible: true,
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "Ошибка запроса");
  return data as T;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    api<{ authed: boolean }>("/api/auth")
      .then((d) => setAuthed(d.authed))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) {
    return <div className="admin-center">Загрузка…</div>;
  }
  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;
  return <Dashboard onLogout={() => setAuthed(false)} />;
}

/* ───────────────────────── Вход ───────────────────────── */

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/auth", { method: "POST", body: JSON.stringify({ password }) });
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-center">
      <form className="login" onSubmit={submit}>
        <LogoMark size={56} />
        <h1>Админ-панель</h1>
        <p>Forma &amp; Light</p>
        <label className="field">
          <span className="field-label">Пароль</span>
          <span className="field-control">
            <Icon name="lock" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
          </span>
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "Вход…" : "Войти"}
        </button>
        <a href="/" className="login-back">
          <Icon name="arrow_back" /> На сайт
        </a>
      </form>
    </div>
  );
}

/* ───────────────────────── Панель ───────────────────────── */

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<"products" | "categories" | "links" | "stats">("products");
  const [toast, setToast] = useState("");

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }, []);

  async function logout() {
    await api("/api/auth", { method: "DELETE" }).catch(() => undefined);
    onLogout();
  }

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <a href="/" className="admin-brand">
          <LogoMark size={36} />
          <span>
            Forma <em>&amp;</em> Light
          </span>
        </a>
        <nav className="admin-nav">
          <button
            className={tab === "products" ? "active" : ""}
            onClick={() => setTab("products")}
          >
            <Icon name="inventory_2" /> Товары
          </button>
          <button
            className={tab === "categories" ? "active" : ""}
            onClick={() => setTab("categories")}
          >
            <Icon name="category" /> Категории
          </button>
          <button className={tab === "links" ? "active" : ""} onClick={() => setTab("links")}>
            <Icon name="link" /> Ссылки и контакты
          </button>
          <button className={tab === "stats" ? "active" : ""} onClick={() => setTab("stats")}>
            <Icon name="monitoring" /> Статистика
          </button>
        </nav>
        <div className="admin-side-bottom">
          <a href="/" target="_blank" className="admin-link">
            <Icon name="open_in_new" /> Открыть сайт
          </a>
          <button className="admin-link" onClick={logout}>
            <Icon name="logout" /> Выйти
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {tab === "products" && <ProductsPanel notify={notify} />}
        {tab === "categories" && <CategoriesPanel notify={notify} />}
        {tab === "links" && <LinksPanel notify={notify} />}
        {tab === "stats" && <StatsPanel notify={notify} />}
      </main>

      {toast && (
        <div className="toast" role="status">
          <Icon name="check_circle" /> {toast}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Товары ───────────────────────── */

function ProductsPanel({ notify }: { notify: (m: string) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | "new" | null>(null);

  const load = useCallback(async () => {
    const [items, cats] = await Promise.all([
      api<Product[]>("/api/products"),
      api<string[]>("/api/categories"),
    ]);
    setProducts(items);
    setCategories(cats);
    setLoading(false);
  }, []);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  async function save(draft: Draft) {
    const body = JSON.stringify({ ...draft, price: Number(draft.price) || 0 });
    if (editing === "new") {
      await api("/api/products", { method: "POST", body });
      notify("Товар добавлен");
    } else if (editing) {
      await api(`/api/products/${editing.id}`, { method: "PUT", body });
      notify("Изменения сохранены");
    }
    setEditing(null);
    await load();
  }

  async function remove(p: Product) {
    if (!window.confirm(`Удалить «${p.title}»?`)) return;
    await api(`/api/products/${p.id}`, { method: "DELETE" });
    notify("Товар удалён");
    await load();
  }

  async function toggleVisible(p: Product) {
    await api(`/api/products/${p.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...p, visible: !p.visible }),
    });
    notify(p.visible ? "Товар скрыт" : "Товар опубликован");
    await load();
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= products.length) return;
    const next = [...products];
    [next[index], next[target]] = [next[target], next[index]];
    setProducts(next);
    await api("/api/products/reorder", {
      method: "PUT",
      body: JSON.stringify({ ids: next.map((p) => p.id) }),
    });
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Товары</h1>
          <p>{products.length} карточек в каталоге</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing("new")}>
          <Icon name="add" /> Добавить товар
        </button>
      </div>

      {loading ? (
        <p className="admin-muted">Загрузка…</p>
      ) : products.length === 0 ? (
        <div className="admin-empty">
          <Icon name="inventory_2" />
          <p>Пока нет ни одного товара</p>
        </div>
      ) : (
        <ul className="admin-list">
          {products.map((p, i) => (
            <li key={p.id} className={`admin-row ${p.visible ? "" : "is-hidden"}`}>
              <div className="admin-order">
                <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Выше">
                  <Icon name="keyboard_arrow_up" />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === products.length - 1}
                  aria-label="Ниже"
                >
                  <Icon name="keyboard_arrow_down" />
                </button>
              </div>
              <div className="admin-row-main">
                <div className="admin-row-title">
                  <strong>{p.title}</strong>
                  {p.badge && <span className="tag">{p.badge}</span>}
                  {!p.visible && <span className="tag tag-muted">скрыт</span>}
                </div>
                <p>
                  {[p.category, p.size].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              <div className="admin-row-price">
                {p.price > 0 ? formatPrice(p.price) : "по запросу"}
              </div>
              <div className="admin-row-actions">
                <button
                  className="icon-btn"
                  onClick={() => toggleVisible(p)}
                  title={p.visible ? "Скрыть" : "Показать"}
                >
                  <Icon name={p.visible ? "visibility" : "visibility_off"} />
                </button>
                <button className="icon-btn" onClick={() => setEditing(p)} title="Редактировать">
                  <Icon name="edit" />
                </button>
                <button className="icon-btn danger" onClick={() => remove(p)} title="Удалить">
                  <Icon name="delete" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <ProductModal
          product={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </>
  );
}

function ProductModal({
  product,
  categories,
  onClose,
  onSave,
}: {
  product: Product | null;
  categories: string[];
  onClose: () => void;
  onSave: (d: Draft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft>(
    product
      ? { ...product, price: product.price ? String(product.price) : "" }
      : { ...EMPTY_DRAFT, category: categories[0] ?? "" },
  );
  // Если у товара старая категория, которой уже нет в списке, — всё равно показываем её
  const options =
    draft.category && !categories.includes(draft.category)
      ? [...categories, draft.category]
      : categories;
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const uploading = draft.images.some((url) => url.startsWith("blob:"));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave(draft);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit}>
        <div className="modal-head">
          <h2>{product ? "Редактирование товара" : "Новый товар"}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрыть">
            <Icon name="close" />
          </button>
        </div>

        <div className="form-grid">
          <TextField label="Название" icon="label" value={draft.title} onChange={(v) => set("title", v)} required />
          <label className="field">
            <span className="field-label">Категория</span>
            <span className="field-control">
              <Icon name="category" />
              <select value={draft.category} onChange={(e) => set("category", e.target.value)}>
                <option value="">Без категории</option>
                {options.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </span>
          </label>
          <TextField label="Размер" icon="straighten" value={draft.size} onChange={(v) => set("size", v)} placeholder="60 × 90 см" />
          <TextField label="Цена от, ₽" icon="payments" value={draft.price} onChange={(v) => set("price", v.replace(/\D/g, ""))} placeholder="0 — цена по запросу" inputMode="numeric" />
          <TextField label="Метка" icon="sell" value={draft.badge} onChange={(v) => set("badge", v)} placeholder="Хит, Новинка…" />

          <ImagesField
            images={draft.images}
            onChange={(images) => set("images", images)}
            onError={setError}
          />

          <label className="field field-full">
            <span className="field-label">Описание</span>
            <textarea
              rows={4}
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </label>

          <label className="switch field-full">
            <input
              type="checkbox"
              checked={draft.visible}
              onChange={(e) => set("visible", e.target.checked)}
            />
            <span className="switch-track" />
            <span>Показывать на сайте</span>
          </label>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Отмена
          </button>
          <button className="btn btn-primary" disabled={busy || uploading}>
            <Icon name="check" /> {busy ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      </form>
    </div>
  );
}

const MAX_IMAGES = 10;

/** Загрузка фото товара: пока файл грузится, в списке лежит его blob-превью */
function ImagesField({
  images,
  onChange,
  onError,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  onError: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Актуальный список нужен асинхронным загрузкам, завершающимся в разное время
  const latest = useRef(images);
  latest.current = images;

  const update = (next: string[]) => {
    latest.current = next;
    onChange(next);
  };

  async function upload(file: File) {
    const preview = URL.createObjectURL(file);
    update([...latest.current, preview]);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Не удалось загрузить фото");
      update(latest.current.map((url) => (url === preview ? data.url : url)));
    } catch (err) {
      update(latest.current.filter((url) => url !== preview));
      onError((err as Error).message);
    } finally {
      URL.revokeObjectURL(preview);
    }
  }

  function pick(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_IMAGES - images.length);
    e.target.value = "";
    onError("");
    files.forEach(upload);
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...images];
    [next[index], next[index + dir]] = [next[index + dir], next[index]];
    update(next);
  }

  return (
    <div className="field field-full">
      <span className="field-label">Фото · первое будет обложкой</span>
      <div className="photos">
        {images.map((url, i) => (
          <div key={url} className={`photo ${url.startsWith("blob:") ? "is-loading" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Фото ${i + 1}`} />
            {i === 0 && <span className="photo-cover">Обложка</span>}
            <div className="photo-actions">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Левее">
                <Icon name="chevron_left" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === images.length - 1}
                aria-label="Правее"
              >
                <Icon name="chevron_right" />
              </button>
              <button
                type="button"
                onClick={() => update(images.filter((u) => u !== url))}
                aria-label="Удалить фото"
              >
                <Icon name="delete" />
              </button>
            </div>
          </div>
        ))}
        {images.length < MAX_IMAGES && (
          <button type="button" className="photo-add" onClick={() => inputRef.current?.click()}>
            <Icon name="add_photo_alternate" />
            <span>Добавить фото</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        hidden
        onChange={pick}
      />
    </div>
  );
}

function TextField({
  label,
  icon,
  value,
  onChange,
  ...rest
}: {
  label: string;
  icon: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="field-control">
        <Icon name={icon} />
        <input value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
      </span>
    </label>
  );
}

/* ───────────────────────── Категории ───────────────────────── */

function CategoriesPanel({ notify }: { notify: (m: string) => void }) {
  const [categories, setCategories] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [renaming, setRenaming] = useState<{ from: string; to: string } | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [cats, products] = await Promise.all([
      api<string[]>("/api/categories"),
      api<Product[]>("/api/products"),
    ]);
    const next: Record<string, number> = {};
    products.forEach((p) => (next[p.category] = (next[p.category] ?? 0) + 1));
    setCategories(cats);
    setCounts(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    load().catch((e) => {
      setError(e.message);
      setLoading(false);
    });
  }, [load]);

  async function run(action: () => Promise<unknown>, message: string) {
    setError("");
    try {
      await action();
      notify(message);
      await load();
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  }

  async function add(e: FormEvent) {
    e.preventDefault();
    const ok = await run(
      () => api("/api/categories", { method: "POST", body: JSON.stringify({ name }) }),
      "Категория добавлена",
    );
    if (ok) setName("");
  }

  async function rename(e: FormEvent) {
    e.preventDefault();
    if (!renaming) return;
    if (renaming.to.trim() === renaming.from) {
      setRenaming(null);
      return;
    }
    const ok = await run(
      () => api("/api/categories", { method: "PUT", body: JSON.stringify(renaming) }),
      "Категория переименована",
    );
    if (ok) setRenaming(null);
  }

  async function remove(category: string) {
    const used = counts[category] ?? 0;
    const warning = used
      ? `\n\nУ ${used} товар(ов) категория будет очищена — их можно будет назначить заново.`
      : "";
    if (!window.confirm(`Удалить категорию «${category}»?${warning}`)) return;
    await run(
      () => api("/api/categories", { method: "DELETE", body: JSON.stringify({ name: category }) }),
      "Категория удалена",
    );
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= categories.length) return;
    const order = [...categories];
    [order[index], order[target]] = [order[target], order[index]];
    setCategories(order);
    await run(
      () => api("/api/categories", { method: "PUT", body: JSON.stringify({ order }) }),
      "Порядок сохранён",
    );
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Категории</h1>
          <p>Порядок категорий совпадает с порядком фильтров в каталоге</p>
        </div>
      </div>

      <form className="panel category-add" onSubmit={add}>
        <label className="field">
          <span className="field-label">Новая категория</span>
          <span className="field-control">
            <Icon name="add_circle" />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Треугольные, Ромбовидные"
              maxLength={60}
            />
          </span>
        </label>
        <button className="btn btn-primary" disabled={!name.trim()}>
          <Icon name="add" /> Добавить
        </button>
      </form>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p className="admin-muted">Загрузка…</p>
      ) : categories.length === 0 ? (
        <div className="admin-empty">
          <Icon name="category" />
          <p>Категорий пока нет</p>
        </div>
      ) : (
        <ul className="admin-list">
          {categories.map((c, i) => (
            <li key={c} className="admin-row">
              <div className="admin-order">
                <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Выше">
                  <Icon name="keyboard_arrow_up" />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === categories.length - 1}
                  aria-label="Ниже"
                >
                  <Icon name="keyboard_arrow_down" />
                </button>
              </div>

              {renaming?.from === c ? (
                <form className="category-rename" onSubmit={rename}>
                  <span className="field-control">
                    <input
                      value={renaming.to}
                      onChange={(e) => setRenaming({ from: c, to: e.target.value })}
                      onKeyDown={(e) => e.key === "Escape" && setRenaming(null)}
                      maxLength={60}
                      autoFocus
                    />
                  </span>
                  <button className="icon-btn" title="Сохранить">
                    <Icon name="check" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setRenaming(null)}
                    title="Отмена"
                  >
                    <Icon name="close" />
                  </button>
                </form>
              ) : (
                <div className="admin-row-main">
                  <div className="admin-row-title">
                    <strong>{c}</strong>
                  </div>
                  <p>{counts[c] ?? 0} товар(ов)</p>
                </div>
              )}

              <div />
              <div className="admin-row-actions">
                <button
                  className="icon-btn"
                  onClick={() => setRenaming({ from: c, to: c })}
                  title="Переименовать"
                >
                  <Icon name="edit" />
                </button>
                <button className="icon-btn danger" onClick={() => remove(c)} title="Удалить">
                  <Icon name="delete" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/* ───────────────────────── Ссылки ───────────────────────── */

function LinksPanel({ notify }: { notify: (m: string) => void }) {
  const [links, setLinks] = useState<Links | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Links>("/api/links").then(setLinks).catch((e) => setError(e.message));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!links) return;
    setBusy(true);
    setError("");
    try {
      setLinks(await api<Links>("/api/links", { method: "PUT", body: JSON.stringify(links) }));
      notify("Ссылки сохранены");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Ссылки и контакты</h1>
          <p>Заполненные поля появятся в блоке «Контакты» на сайте</p>
        </div>
      </div>

      {!links ? (
        <p className="admin-muted">{error || "Загрузка…"}</p>
      ) : (
        <form className="panel" onSubmit={submit}>
          <div className="form-grid">
            {LINK_FIELDS.map((f) => (
              <TextField
                key={f.key}
                label={f.label}
                icon={f.icon}
                value={links[f.key]}
                placeholder={f.placeholder}
                type={f.key === "phone" ? "tel" : "text"}
                onChange={(v) => setLinks({ ...links, [f.key]: v })}
              />
            ))}
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button className="btn btn-primary" disabled={busy}>
              <Icon name="save" /> {busy ? "Сохранение…" : "Сохранить"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}

/* ───────────────────────── Статистика ───────────────────────── */

const PERIODS: { key: StatsPeriod; label: string }[] = [
  { key: "total", label: "Всего" },
  { key: "month", label: "За месяц" },
  { key: "week", label: "За неделю" },
  { key: "day", label: "Сегодня" },
];

const formatCount = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

function StatsPanel({ notify }: { notify: (m: string) => void }) {
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [soldCount, setSoldCount] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const [summary, settings] = await Promise.all([
        api<StatsSummary>("/api/stats"),
        api<{ soldCount: string }>("/api/settings"),
      ]);
      setStats(summary);
      setSoldCount((current) => current ?? settings.soldCount);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveSold(e: FormEvent) {
    e.preventDefault();
    if (soldCount === null) return;
    setBusy(true);
    setError("");
    try {
      const res = await api<{ soldCount: string }>("/api/settings", {
        method: "PUT",
        body: JSON.stringify({ soldCount }),
      });
      setSoldCount(res.soldCount);
      notify("Счётчик продаж обновлён");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Статистика</h1>
          <p>Уникальные посетители сайта. Ваши визиты после входа в админ-панель не учитываются</p>
        </div>
        <button className="btn btn-ghost" onClick={load}>
          <Icon name="refresh" /> Обновить
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {!stats ? (
        !error && <p className="admin-muted">Загрузка…</p>
      ) : (
        <>
          <div className="stat-grid">
            {PERIODS.map((p) => (
              <div key={p.key} className="stat-card">
                <div className="stat-card-label">{p.label}</div>
                <div className="stat-card-value">{formatCount(stats.visitors[p.key])}</div>
              </div>
            ))}
          </div>

          <section className="panel stat-section">
            <h2>Переходы по ссылкам</h2>
            <p>Сколько раз посетители нажали на контакты и кнопки «Заказать»</p>
            <div className="stat-table-wrap">
              <table className="stat-table">
                <thead>
                  <tr>
                    <th>Ссылка</th>
                    {PERIODS.map((p) => (
                      <th key={p.key}>{p.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {LINK_FIELDS.map((f) => (
                    <tr key={f.key}>
                      <td>
                        <span className="stat-link">
                          <Icon name={f.icon} />
                          {f.key === "phone" ? "Телефон (звонок / копирование)" : f.label}
                        </span>
                      </td>
                      {PERIODS.map((p) => (
                        <td key={p.key}>{formatCount(stats.clicks[f.key][p.key])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {soldCount !== null && (
        <form className="panel stat-section" onSubmit={saveSold}>
          <h2>Счётчик продаж</h2>
          <p>Число в первом экране сайта рядом с подписью «зеркал продано». Пустое поле скроет блок</p>
          <div className="sold-form">
            <TextField
              label="Зеркал продано"
              icon="sell"
              value={soldCount}
              onChange={setSoldCount}
              placeholder="500+"
              maxLength={20}
            />
            <button className="btn btn-primary" disabled={busy}>
              <Icon name="save" /> {busy ? "Сохранение…" : "Сохранить"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
