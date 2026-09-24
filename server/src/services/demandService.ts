import { demandRepository } from '../repositories/demandRepository.js';
import type { DemandAnalytics, DemandPeriod } from '../analytics/demandTypes.js';

const periods: Record<DemandPeriod, number> = { '7d': 7, '30d': 30, '90d': 90 };
const validPeriod = (value: unknown): value is DemandPeriod => typeof value === 'string' && value in periods;
const toIso = (date: Date) => date.toISOString();

export async function getDemandAnalytics(input: { period?: unknown; from?: unknown; to?: unknown }): Promise<DemandAnalytics> {
  if (input.period !== undefined && !validPeriod(input.period)) throw Object.assign(new Error('El período de demanda no es válido.'), { statusCode: 400 });
  const period = (input.period ?? '30d') as DemandPeriod;
  const parseDate = (value: unknown, label: string) => {
    if (value === undefined) return undefined;
    if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) throw Object.assign(new Error('La fecha ' + label + ' no es válida.'), { statusCode: 400 });
    return new Date(value);
  };
  const to = parseDate(input.to, 'final') ?? new Date();
  const from = parseDate(input.from, 'inicial') ?? new Date(to.getTime() - periods[period] * 24 * 60 * 60 * 1000);
  if (from >= to) throw Object.assign(new Error('El período de demanda no es válido.'), { statusCode: 400 });
  return demandRepository.getDemandAnalytics({ period, from: toIso(from), to: toIso(to) });
}
