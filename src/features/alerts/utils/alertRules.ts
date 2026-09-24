import type { AlertSeverity, InventoryAlert } from '@/types/domain';
export const severityOrder: AlertSeverity[] = ['priority', 'attention', 'opportunity', 'stable'];
export function prepareAlerts(alerts: InventoryAlert[]){return [...alerts].sort((a,b)=>severityOrder.indexOf(a.severity)-severityOrder.indexOf(b.severity));}
