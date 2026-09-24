export type DemandPeriod = '7d' | '30d' | '90d';
export type DemandFilters = { period: DemandPeriod; from: string; to: string };
export type DemandSummary = { totalRequests: number; availableRequests: number; unavailableRequests: number; notFoundRequests: number; uniqueSessions: number };
export type DemandProduct = { productId: string; productName: string; category: string; requests: number; availableRequests: number; unavailableRequests: number; lastRequestAt?: string };
export type DemandNotFound = { normalizedQuery: string; requests: number };
export type DemandDay = { day: string; requests: number; availableRequests: number; unavailableRequests: number; notFoundRequests: number };
export type DemandAnalytics = { source: 'postgres' | 'json'; filters: DemandFilters; summary: DemandSummary; topProducts: DemandProduct[]; topNotFound: DemandNotFound[]; dailyTrend: DemandDay[] };
