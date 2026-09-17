import { CopyPhone } from "./CopyPhone";
import { Icon } from "./Icon";
import { LINK_FIELDS, LinkKey, hrefFor } from "@/lib/links";
import type { Links } from "@/lib/types";

// Логотипы из public/logos. withName — у логотипа нет названия, дописываем его текстом
const LOGOS: Partial<Record<LinkKey, { src: string; withName?: boolean }>> = {
  telegram: { src: "/logos/telegram.svg", withName: true },
  avito: { src: "/logos/avito.svg" },
  yandexMarket: { src: "/logos/yandex-market.svg" },
  instagram: { src: "/logos/instagram.svg", withName: true },
  tiktok: { src: "/logos/tiktok.svg" },
};

export function Contacts({ links }: { links: Links }) {
  const items = LINK_FIELDS.filter((f) => links[f.key].trim());

  return (
    <section id="contacts" className="section section-soft">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Контакты</p>
          <h2 className="section-title">Подберём зеркало для вашего интерьера</h2>
          <p className="section-lead">
            Напишите нам в удобном мессенджере или найдите нас на площадках — поможем
            подобрать решение.
          </p>
        </div>

        {items.length > 0 ? (
          <ul className="social-grid">
            {items.map((f) => {
              if (f.key === "phone") {
                return (
                  <li key={f.key}>
                    <CopyPhone phone={links.phone} />
                  </li>
                );
              }
              const href = hrefFor(f.key, links[f.key]);
              const logo = LOGOS[f.key];
              return (
                <li key={f.key}>
                  <a
                    href={href}
                    className="social-tile"
                    data-track={f.key}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={f.label}
                  >
                    <span className="social-logo">
                      {logo ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={logo.src} alt="" className={`social-img social-img-${f.key}`} />
                          {logo.withName && <span className="social-name">{f.label}</span>}
                        </>
                      ) : (
                        <span className="social-name">{f.label}</span>
                      )}
                    </span>
                    <span className="social-foot">
                      <span>Перейти</span>
                      <Icon name="arrow_outward" />
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty">Контакты скоро появятся.</p>
        )}
      </div>
    </section>
  );
}
