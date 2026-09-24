import { Bot, LayoutDashboard, MessageSquareMore, QrCode, ShoppingCart, UserRound } from "lucide-react";
import { ActionCard } from "@/components/public/ActionCard";
import { PromotionCarousel } from "@/components/public/PromotionCarousel";
import { usePromotionsQuery } from "@/features/data/queries";
import { appConfig } from "@/config/app";
import { useConnectivity } from "@/features/connectivity/ConnectivityProvider";

export function HomePage() {
  const { data: promotions = [] } = usePromotionsQuery(); const { state } = useConnectivity();
  const statusLabel = state === "online" ? "Sistema disponible" : state === "internet-degraded" ? "Conexión limitada" : state === "backend-offline" ? "Servicio temporalmente no disponible" : "Sin conexión";
  return <section className="home-page"><PromotionCarousel promotions={promotions.filter((promotion) => promotion.active)} />
    <header className="home-heading"><p className="section-label">Capa de inteligencia operativa</p><h1>¿Qué necesitas hacer?</h1><p>Tu negocio te avisa qué necesita atención.</p></header>
    <div className="home-modes">
      <section className="home-mode"><div className="home-mode-heading"><UserRound aria-hidden="true"/><div><p className="section-label">Modo cliente</p><h2>Cliente</h2></div></div><div className="home-actions"><ActionCard title="Consultar producto" description="Consulta productos y promociones públicas." icon={<Bot aria-hidden="true" />} to="/asistente" /><ActionCard title="Dar opinión" description="Valora tu experiencia en un toque." icon={<MessageSquareMore aria-hidden="true" />} to="/opiniones" /></div></section>
      <section className="home-mode"><div className="home-mode-heading"><ShoppingCart aria-hidden="true"/><div><p className="section-label">Modo operación</p><h2>Caja</h2></div></div><div className="home-actions"><ActionCard title="Registrar venta" description="Registra la salida que normalmente recibirías de un POS." icon={<ShoppingCart aria-hidden="true" />} to="/admin/ventas" /><ActionCard title="Escanear QR" description="Agrega o edita productos desde un código QR." icon={<QrCode aria-hidden="true" />} to="/admin/productos?mode=qr" /></div></section>
      <section className="home-mode"><div className="home-mode-heading"><LayoutDashboard aria-hidden="true"/><div><p className="section-label">Modo decisión</p><h2>Dueña</h2></div></div><div className="home-actions"><ActionCard title="Centro de Control" description="Revisa qué necesita atención hoy." icon={<LayoutDashboard aria-hidden="true" />} to="/admin/dashboard" /><ActionCard title="Copiloto" description="Entiende qué requiere atención y por qué." icon={<Bot aria-hidden="true" />} to="/admin/copiloto" /></div></section>
    </div>
    <footer className="home-footer"><span translate="no">{appConfig.appName}</span><span className={`system-status system-status-${state}`}><span aria-hidden="true" /><span>{statusLabel}</span></span></footer>
  </section>;
}
