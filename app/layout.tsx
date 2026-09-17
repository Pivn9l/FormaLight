import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Forma & Light — дизайнерские зеркала с подсветкой",
  description:
    "Готовые дизайнерские зеркала с тёплой и холодной подсветкой. Большой ассортимент, бережная упаковка и доставка.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      className={`${playfair.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,200..400,0..1,0&display=block"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
