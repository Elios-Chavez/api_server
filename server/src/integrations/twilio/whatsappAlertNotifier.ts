import { serverEnv } from '../../config/env.js';
import type { InventoryAlert } from '../../types/domain.js';

type DiscrepancyContext = { zoneId: string; sourceId: string; observedAt: string };

const whatsappAddress = (value: string) => value.startsWith('whatsapp:') ? value : 'whatsapp:' + value;

export function formatPriorityDiscrepancyMessage(alert: InventoryAlert, context: DiscrepancyContext): string {
  return [
    '🚨 ALERTA DE INVENTARIO',
    'Discrepancia físico–digital',
    '',
    'Producto: ' + alert.productName,
    'Sistema: ' + alert.digitalStock + ' unidades',
    'Anaquel: ' + alert.physicalStock + ' unidades',
    'Diferencia: ' + (alert.difference > 0 ? '+' : '') + alert.difference + ' unidades',
    '',
    'Zona: ' + context.zoneId + ' · Fuente: ' + context.sourceId,
    'Observado: ' + context.observedAt,
    '',
    'Acción sugerida: ' + alert.suggestedAction,
  ].join('\n');
}

export function isTwilioWhatsAppConfigured(): boolean {
  return Boolean(serverEnv.twilioAccountSid && serverEnv.twilioAuthToken && serverEnv.twilioWhatsAppFrom && serverEnv.twilioWhatsAppTo);
}

export async function notifyPriorityDiscrepancy(alert: InventoryAlert, context: DiscrepancyContext): Promise<void> {
  if (!isTwilioWhatsAppConfigured()) return;

  const endpoint = 'https://api.twilio.com/2010-04-01/Accounts/' + encodeURIComponent(serverEnv.twilioAccountSid) + '/Messages.json';
  const credentials = Buffer.from(serverEnv.twilioAccountSid + ':' + serverEnv.twilioAuthToken).toString('base64');
  const body = new URLSearchParams({
    From: whatsappAddress(serverEnv.twilioWhatsAppFrom),
    To: whatsappAddress(serverEnv.twilioWhatsAppTo),
    Body: formatPriorityDiscrepancyMessage(alert, context),
  });

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: 'Basic ' + credentials, 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) throw new Error('Twilio respondió ' + response.status + '.');
  } catch (error) {
    console.error('No se pudo enviar la alerta de discrepancia por WhatsApp.', error);
  }
}
