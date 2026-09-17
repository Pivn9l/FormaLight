import { Icon } from "./Icon";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { hrefFor } from "@/lib/links";

export function Header({ phone }: { phone: string }) {
  return (
    <header className="header">
      <div className="container header-inner">
        <Logo />
        <nav className="nav" aria-label="Основная навигация">
          <a href="#catalog">Каталог</a>
          <a href="#about">О нас</a>
          <a href="#contacts">Контакты</a>
        </nav>
        <div className="header-actions">
          {phone ? (
            <a href={hrefFor("phone", phone)} className="header-phone" data-track="phone">
              <Icon name="call" />
              <span>{phone}</span>
            </a>
          ) : (
            <a href="#contacts" className="btn btn-outline btn-sm">
              Связаться
            </a>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
