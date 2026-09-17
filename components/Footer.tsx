import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <Logo />
        <p className="footer-note">
          © {new Date().getFullYear()} Forma &amp; Light. Дизайнерские зеркала с подсветкой.
        </p>
      </div>
    </footer>
  );
}
