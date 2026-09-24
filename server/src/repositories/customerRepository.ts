import { serverEnv } from '../config/env.js';
import { JsonRepository } from './jsonRepository.js';
import { PostgresCustomerRepository } from './postgresCustomerRepository.js';
import type { CustomerData, CustomerMessage, CustomerSession, ProductRequest } from '../customer/types.js';

export const normalizeProductRequest = (value: string) => value.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
const now = () => new Date().toISOString();

export type CustomerRepository = {
  createSession(input: Omit<CustomerSession, 'startedAt'> & { startedAt: string }): Promise<CustomerSession>;
  addMessage(input: Omit<CustomerMessage, 'createdAt'> & { createdAt?: string }): Promise<CustomerMessage>;
  createProductRequest(input: Omit<ProductRequest, 'normalizedQuery' | 'createdAt'> & { createdAt?: string }): Promise<ProductRequest>;
  topNotFound(limit?: number): Promise<Array<{ normalizedQuery: string; total: number }>>;
};


const jsonCustomerSeed: CustomerData = { sessions: [], messages: [], productRequests: [] };
class JsonCustomerRepository implements CustomerRepository {
  private readonly repository = new JsonRepository<CustomerData>(serverEnv.dataPath.replace(/\.json$/, '-customer.json'), jsonCustomerSeed);

  public async createSession(input: CustomerSession) { await this.repository.update((data) => ({ ...data, sessions: [...data.sessions, input] })); return input; }
  public async addMessage(input: Omit<CustomerMessage, 'createdAt'> & { createdAt?: string }) { const message = { ...input, createdAt: input.createdAt ?? now() }; await this.repository.update((data) => ({ ...data, messages: [...data.messages, message] })); return message; }
  public async createProductRequest(input: Omit<ProductRequest, 'normalizedQuery' | 'createdAt'> & { createdAt?: string }) { const request = { ...input, normalizedQuery: normalizeProductRequest(input.rawQuery), createdAt: input.createdAt ?? now() }; await this.repository.update((data) => ({ ...data, productRequests: [...data.productRequests, request] })); return request; }
  public async topNotFound(limit = 10) { const data = await this.repository.read(); const totals = new Map<string, number>(); for (const request of data.productRequests) if (request.status === 'not_found') totals.set(request.normalizedQuery, (totals.get(request.normalizedQuery) ?? 0) + 1); return [...totals.entries()].map(([normalizedQuery, total]) => ({ normalizedQuery, total })).sort((a, b) => b.total - a.total || a.normalizedQuery.localeCompare(b.normalizedQuery)).slice(0, limit); }
}

export const customerRepository: CustomerRepository = serverEnv.persistenceMode === 'postgres' ? new PostgresCustomerRepository() : new JsonCustomerRepository();
