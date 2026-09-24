import { useMemo, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAlertsQuery, useNotifyPriorityAlertsMutation } from "@/features/data/queries";
import { prepareAlerts } from "@/features/alerts/utils/alertRules";
import type { InventoryAlert } from "@/types/domain";
import "./alerts.css";

function Evidence({ alert }: { alert: InventoryAlert }) {
  if (alert.difference === 0) return null;
  return <div className="alert-evidence"><span>Digital <strong>{alert.digitalStock}</strong></span><span>Físico <strong>{alert.physicalStock}</strong></span><span>Diferencia <strong>{Math.abs(alert.difference)}</strong></span></div>;
}

export function AlertsPage() {
  const { data = [], isLoading, isError, refetch } = useAlertsQuery();
  const notify = useNotifyPriorityAlertsMutation();
  const [status, setStatus] = useState("");
  const alerts = useMemo(() => prepareAlerts(data).filter((alert) => alert.severity !== "stable"), [data]);

  async function reloadAndNotify() {
    setStatus("");
    try {
      const result = await notify.mutateAsync();
      await refetch();
      setStatus(result.totalPriority === 0 ? "Revisión completada: no hay discrepancias prioritarias." : "Revisión completada: " + result.notified + " alerta(s) enviada(s) por WhatsApp.");
    } catch {
      setStatus("No fue posible ejecutar la revisión. Verifica la conexión con el backend.");
    }
  }

  return <div className="alerts-page"><div className="alerts-page-heading"><PageHeader title="Alertas" description="Hallazgos activos que requieren seguimiento operativo." /><button className="alerts-refresh-button" type="button" onClick={() => void reloadAndNotify()} disabled={notify.isPending} aria-busy={notify.isPending}><RefreshCw aria-hidden="true" size={17} className={notify.isPending ? "is-spinning" : undefined} />{notify.isPending ? "Revisando…" : "Recargar y revisar"}</button></div>{status && <p className="alerts-status" role="status" aria-live="polite">{status}</p>}{isLoading ? <EmptyState message="Cargando alertas…" /> : isError ? <EmptyState message="No fue posible cargar las alertas." /> : alerts.length === 0 ? <EmptyState message="No hay alertas activas en este momento." /> : <div className="alerts-grid">{alerts.map((alert) => <article className="alert-detail-card" key={alert.id}><div className="alert-detail-heading"><div><StatusBadge status={alert.severity}/><h2>{alert.productName}</h2></div><AlertTriangle aria-hidden="true" /></div><h3>{alert.title}</h3><p>{alert.message}</p><Evidence alert={alert}/><div className="alert-detail-row"><span>Acción sugerida</span><strong>{alert.suggestedAction}</strong></div></article>)}</div>}</div>;
}
