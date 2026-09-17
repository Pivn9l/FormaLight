import { Analytics } from "@/components/Analytics";
import { Catalog } from "@/components/Catalog";
import { Contacts } from "@/components/Contacts";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { hrefFor } from "@/lib/links";
import { readStore, sortProducts } from "@/lib/store";

// Данные меняются из админ-панели — рендерим страницу на каждый запрос
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { products, categories, links, soldCount } = await readStore();
  const visible = sortProducts(products).filter((p) => p.visible);

  // Кнопка «Заказать» ведёт в Telegram, если он указан, иначе к блоку контактов
  const orderHref = hrefFor("telegram", links.telegram) || "#contacts";

  return (
    <>
      <Header phone={links.phone} />
      <main>
        <Hero soldCount={soldCount} />
        <Catalog products={visible} categories={categories} orderHref={orderHref} />
        <Features />
        <Contacts links={links} />
      </main>
      <Footer />
      <Analytics />
    </>
  );
}
