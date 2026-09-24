import type { AlertSeverity } from "@/types/domain";
import type { InventoryAlert, InventoryRecord } from "@/types/domain";

export function getInventorySeverity(item: InventoryRecord): AlertSeverity { const difference = item.physicalStock - item.digitalStock; if (difference !== 0) return "priority"; if (item.digitalStock <= item.reorderPoint) return "attention"; if (item.averageSales <= 1 && item.digitalStock > item.reorderPoint * 2) return "opportunity"; return "stable"; }

export function toInventoryAlert(item: InventoryRecord): InventoryAlert {
  const severity = getInventorySeverity(item);
  const difference = item.physicalStock - item.digitalStock;
  const amount = Math.abs(difference);
  const title = severity === "priority" ? "Revisa " + item.name : severity === "attention" ? item.name + " llegó a su punto de reorden" : severity === "opportunity" ? item.name + " tiene baja rotación" : "Inventario bajo control";
  const message = severity === "priority" ? "Detecté una diferencia de " + amount + " " + (amount === 1 ? "unidad" : "unidades") + " en " + item.name + ". El sistema registra " + item.digitalStock + ", pero en el anaquel observé " + item.physicalStock + "." : severity === "attention" ? item.name + " llegó a su punto de reorden. Quedan " + item.digitalStock + " " + (item.digitalStock === 1 ? "unidad" : "unidades") + ". Conviene revisar si necesitas resurtir." : severity === "opportunity" ? item.name + " tiene movimiento bajo. Podrías revisar su rotación antes de la próxima compra." : "Todo está bajo control. No detecté situaciones que requieran atención en este momento.";
  const suggestedAction = severity === "priority" ? "Revisar si hubo una venta no registrada o corregir el inventario." : severity === "attention" ? "Revisar el próximo pedido y considerar resurtir." : severity === "opportunity" ? "Revisar su movimiento y evaluar una acción comercial." : "Sin intervención inmediata.";
  return { id: "inventory-" + item.id, productId: item.id, productName: item.name, severity, title, message, digitalStock: item.digitalStock, physicalStock: item.physicalStock, difference, reorderPoint: item.reorderPoint, averageSales: item.averageSales, suggestedAction, createdAt: new Date().toISOString() };
}
