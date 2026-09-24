import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ShoppingBasket } from 'lucide-react';
import type { Promotion } from '@/types/domain';

export function PromotionCarousel({ promotions }: { promotions: Promotion[] }) {
  const available = promotions.filter((promotion) => promotion.active);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef<number | null>(null);
  const count = available.length;
  const current = available[index] ?? null;
  const move = (direction: number) => {
    if (count > 1) setIndex((value) => (value + direction + count) % count);
  };

  useEffect(() => {
    if (count < 2 || paused) return;
    const timer = window.setInterval(() => move(1), 6500);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  if (!current) {
    return (
      <div className="promotion-empty">
        <ShoppingBasket aria-hidden="true" className="size-10 text-primary" />
        <div>
          <h2>Descubre lo que tenemos para ti</h2>
          <p>Pronto encontrarás novedades para tu próxima compra.</p>
        </div>
      </div>
    );
  }

  return (
    <section
      aria-label="Promociones destacadas"
      aria-roledescription="carrusel"
      className="promotion-carousel"
      onPointerDown={(event) => { startX.current = event.clientX; }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onPointerUp={(event) => {
        if (startX.current === null) return;
        const distance = event.clientX - startX.current;
        if (Math.abs(distance) > 48) move(distance < 0 ? 1 : -1);
        startX.current = null;
      }}
    >
      <div aria-hidden="true" className="promotion-art">
        {current.imageUrl ? <img alt="" className="promotion-art-image" loading="lazy" src={current.imageUrl} /> : <><span className="promotion-art-mark">CP</span><span className="promotion-art-line" /></>}
      </div>
      <div className="promotion-copy">
        <p className="promotion-kicker">Promoción de la semana</p>
        <h1>{current.title}</h1>
        <p className="promotion-description">{current.description}</p>
        <span className="promotion-action">Ver promoción <ArrowRight aria-hidden="true" className="size-5" /></span>
      </div>
      {count > 1 && (
        <>
          <button aria-label="Promoción anterior" className="carousel-control carousel-control-prev" onClick={() => move(-1)} type="button">
            <ArrowLeft aria-hidden="true" className="size-5" />
          </button>
          <button aria-label="Siguiente promoción" className="carousel-control carousel-control-next" onClick={() => move(1)} type="button">
            <ArrowRight aria-hidden="true" className="size-5" />
          </button>
          <div aria-label={`Promoción ${index + 1} de ${count}`} className="carousel-dots" role="tablist">
            {available.map((promotion, dotIndex) => (
              <button
                aria-label={`Ver promoción ${dotIndex + 1}`}
                aria-selected={dotIndex === index}
                className={`carousel-dot ${dotIndex === index ? 'is-active' : ''}`}
                key={promotion.id}
                onClick={() => setIndex(dotIndex)}
                role="tab"
                type="button"
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
