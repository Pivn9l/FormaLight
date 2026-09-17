import type { Metadata } from "next";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Админ-панель — Forma & Light",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin">
      <div className="admin-theme">
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
