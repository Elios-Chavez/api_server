import { env } from '@/config/env';
import { apiClient } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import type { BusinessContext, CopilotProvider, CopilotResponse } from '../types';
import { LocalCopilotProvider } from './copilotEngine';

type CopilotRequest = { question: string; history: Array<{ role: 'user' | 'assistant'; content: string }> };

class ApiCopilotProvider implements CopilotProvider {
  private readonly localFallback = new LocalCopilotProvider();

  public async ask(question: string, context: BusinessContext, history: CopilotRequest['history'] = []): Promise<CopilotResponse> {
    try {
      return await apiClient<CopilotResponse>(endpoints.copilotAsk, { method: 'POST', body: JSON.stringify({ question, history }) });
    } catch {
      return this.localFallback.ask(question, context);
    }
  }
}

export function getCopilotProvider(): CopilotProvider {
  return env.dataMode === 'api' ? new ApiCopilotProvider() : new LocalCopilotProvider();
}
