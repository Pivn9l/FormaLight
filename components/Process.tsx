import { Icon } from "./Icon";

const STEPS = [
  { icon: "chat", title: "Заявка", text: "Напишите или позвоните — поможем выбрать форму, размер и подсветку." },
  { icon: "design_services", title: "Подбор модели", text: "Подберём готовое зеркало из каталога под ваш интерьер." },
  { icon: "inventory_2", title: "Упаковка", text: "Проверим зеркало и бережно упакуем для перевозки." },
  { icon: "home", title: "Доставка", text: "Привезём в удобное для вас время." },
];

export function Process() {
  return (
    <section id="process" className="section">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Как мы работаем</p>
          <h2 className="section-title">Четыре шага до вашего зеркала</h2>
        </div>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="step">
              <span className="step-num">{String(i + 1).padStart(2, "0")}</span>
              <Icon name={s.icon} className="step-icon" />
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
