import type { BusinessContext, CopilotResponse } from './types.js';

const normalize = (value: string) => value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const facts = (entries: [string, string][]) => entries.map(([label, value]) => ({ label, value }));
const unknown = (): CopilotResponse => ({ message: 'No tengo suficiente información para responder esa pregunta. Puedo ayudarte con inventario, discrepancias, resurtido, rotación o el resumen del día.', source: 'local' });

export async function askLocal(question: string, context: BusinessContext): Promise<CopilotResponse> {
  const text = normalize(question);
  if (text.includes('ano pasado') || text.includes('mes pasado') || text.includes('semana pasada')) return unknown();
  if (text.includes('demanda') || text.includes('solicitan') || text.includes('piden') || text.includes('pidiendo') || text.includes('no encuentran') || text.includes('no manejo') || text.includes('buscan')) {
    const products = context.demand.topProducts.slice(0, 3).map((item) => `${item.productName} (${item.requests})`).join(', ');
    const missing = context.demand.topNotFound.slice(0, 3).map((item) => `${item.normalizedQuery} (${item.requests})`).join(', ');
    return { message: `En los últimos ${context.demand.filters.period}, se registraron ${context.demand.summary.totalRequests} solicitudes. Los productos más solicitados fueron ${products || 'ninguno todavía'}. Las consultas sin coincidencia más frecuentes fueron ${missing || 'ninguna'}.`, actionRoute: '/admin/demanda', facts: facts([['Solicitudes', String(context.demand.summary.totalRequests)], ['No encontradas', String(context.demand.summary.notFoundRequests)], ['Período', context.demand.filters.period]]), source: 'local' };
  }
  if (text.includes('diferenc') || text.includes('discrep') || text.includes('fisic')) {
    const item = context.discrepancies[0];
    if (!item) return { message: 'No encontré diferencias entre el inventario digital y el físico en los productos observados.', source: 'local' };
    return { message: `Sí. ${item.name} tiene ${item.digitalStock} unidades en el sistema y ${item.physicalStock} físicamente. La diferencia es ${item.physicalStock - item.digitalStock}.`, severity: 'priority', suggestedAction: 'Conviene revisar el inventario físico.', actionRoute: '/admin/inventario', facts: facts([['Producto', item.name], ['Digital', String(item.digitalStock)], ['Físico', String(item.physicalStock)], ['Diferencia', String(item.physicalStock - item.digitalStock)]]), source: 'local' };
  }
  if (text.includes('resurt') || text.includes('repon') || text.includes('reorden') || text.includes('comprar')) return context.reorderProducts.length ? { message: `Conviene revisar el resurtido de: ${context.reorderProducts.map((item) => item.name).join(', ')}.`, severity: 'attention', suggestedAction: 'Revisa existencias y considera el próximo pedido.', actionRoute: '/admin/inventario', source: 'local' } : { message: 'No encontré productos por debajo de su punto de reorden.', source: 'local' };
  if (text.includes('baja rot') || text.includes('capital detenido')) return context.lowRotationProducts.length ? { message: `${context.lowRotationProducts.map((item) => item.name).join(', ')} presenta baja rotación.`, severity: 'opportunity', suggestedAction: 'Considera revisar su movimiento antes de la próxima compra.', actionRoute: '/admin/inventario', source: 'local' } : { message: 'No encontré productos con baja rotación.', source: 'local' };
  if (text.includes('cerro') || text.includes('resumen') || text.includes('dia')) { const summary = context.dailySummary; return { message: `El día cierra con ${summary.priority} prioridad, ${summary.attention} por revisar, ${summary.opportunity} oportunidad y ${summary.stable} estables. Se registraron ${summary.sales} ventas y ${summary.purchases} entradas.`, actionRoute: '/admin/dashboard', source: 'local' }; }
  const item = context.inventory.find((candidate) => text.includes(normalize(candidate.name)));
  if (item) { const alert = context.alerts.find((candidate) => candidate.productId === item.id); return { message: `${item.name} tiene ${item.digitalStock} unidades en el sistema y ${item.physicalStock} físicamente. La diferencia es ${item.physicalStock - item.digitalStock}.`, severity: alert?.severity ?? 'stable', suggestedAction: alert?.suggestedAction, actionRoute: alert?.severity === 'stable' ? undefined : '/admin/inventario', facts: facts([['Digital', String(item.digitalStock)], ['Físico', String(item.physicalStock)], ['Estado', alert?.severity ?? 'stable']]), source: 'local' }; }
  if (text.includes("atencion") || text.includes("prioridad") || text.includes("necesita")) {
    const focus = context.alerts.find((alert) => alert.severity !== "stable");
    if (!focus) return { message: "No hay situaciones operativas que requieran atención inmediata.", severity: "stable", actionRoute: "/admin/dashboard", source: "local" };
    const discrepancy = focus.severity === "priority" && focus.difference !== 0;
    return {
      message: discrepancy ? "Hay una discrepancia en " + focus.productName + ": el sistema registra " + focus.digitalStock + ", físicamente se detectaron " + focus.physicalStock + " y la diferencia es " + focus.difference + "." : "Hay una situación " + focus.severity + " en " + focus.productName + ".",
      severity: focus.severity,
      suggestedAction: focus.suggestedAction,
      actionRoute: focus.productId.startsWith("demand:") ? "/admin/demanda" : "/admin/inventario",
      facts: discrepancy ? facts([["Producto", focus.productName], ["Digital", String(focus.digitalStock)], ["Físico", String(focus.physicalStock)], ["Diferencia", String(focus.difference)]]) : facts([["Producto", focus.productName], ["Nivel", focus.severity], ["Solicitudes", String(focus.productId.startsWith("demand:") ? focus.message.match(/solicitado (\d+)/)?.[1] ?? "0" : "-")]]),
      source: "local",
    };
  }
  return unknown();
}
