import { Mirror3D } from "./Mirror3D";

export function Hero({ soldCount }: { soldCount: string }) {
  return (
    <section className="hero">
      <div className="container hero-inner">
        <div className="hero-copy">
          <h1 className="hero-title">
            Зеркала, в которых <em>живёт свет</em>
          </h1>
          <p className="hero-lead">
            Дизайнерские зеркала с подсветкой в наличии — выберите готовую модель для своего интерьера.
            Точная геометрия, тёплый и холодный свет и материалы, которые служат годами.
          </p>
          <dl className="hero-stats">
            {soldCount && (
              <div>
                <dt>{soldCount}</dt>
                <dd>зеркал продано</dd>
              </div>
            )}
            <div>
              <dt>100%</dt>
              <dd>возврат или замена, если зеркало приедет разбитым</dd>
            </div>
            <div>
              <dt>2 режима</dt>
              <dd>тёплый и холодный свет с регулировкой яркости</dd>
            </div>
          </dl>
        </div>

        <div className="hero-visual">
          <Mirror3D />
        </div>
      </div>
    </section>
  );
}
