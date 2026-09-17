import { Icon } from "./Icon";

const FEATURES = [
  {
    icon: "straighten",
    title: "Большой ассортимент",
    text: "Большой выбор готовых зеркал разных форм и размеров — подберёте под вашу мебель, нишу или стену.",
  },
  {
    icon: "light_mode",
    title: "Тёплая и холодная подсветка",
    text: "Качественные LED-ленты с тёплым и холодным светом и регулировкой яркости.",
  },
  {
    icon: "verified",
    title: "Гарантия сохранности",
    text: "Если стекло приедет разбитым — вернём деньги или заменим на другое зеркало.",
  },
  {
    icon: "local_shipping",
    title: "Покупка и доставка",
    text: "Закажите удобным для вас способом — бережно упакуем и быстро доставим.",
  },
];

export function Features() {
  return (
    <section id="about" className="section section-dark">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Почему Forma &amp; Light</p>
          <h2 className="section-title">Форма и свет в балансе</h2>
        </div>
        <div className="features">
          {FEATURES.map((f) => (
            <article key={f.title} className="feature">
              <span className="feature-icon">
                <Icon name={f.icon} />
              </span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
