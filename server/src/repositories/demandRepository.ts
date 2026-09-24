import { serverEnv } from '../config/env.js';
import { JsonRepository } from './jsonRepository.js';
import type { CustomerData } from '../customer/types.js';
import type { DemandAnalytics, DemandFilters } from '../analytics/demandTypes.js';
import { PostgresDemandRepository } from './postgresDemandRepository.js';
import { businessRepository } from './businessRepository.js';
import { aggregateDemand } from '../analytics/demandAggregation.js';

export interface DemandRepository { getDemandAnalytics(filters: DemandFilters): Promise<DemandAnalytics>; }

class JsonDemandRepository implements DemandRepository {
  private readonly repository = new JsonRepository<CustomerData>(serverEnv.dataPath.replace(/\.json$/, '-customer.json'), { sessions: [], messages: [], productRequests: [] });

  public async getDemandAnalytics(filters: DemandFilters): Promise<DemandAnalytics> {
    const data = await this.repository.read();
    const business = await businessRepository.read();
    return aggregateDemand(data.productRequests, business.products, filters);
  }
}

export const demandRepository: DemandRepository = serverEnv.persistenceMode === 'postgres' ? new PostgresDemandRepository() : new JsonDemandRepository();
