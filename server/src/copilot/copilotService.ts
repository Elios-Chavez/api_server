import { serverEnv } from '../config/env.js';
import { buildBusinessContext } from './context.js';
import { askDeepSeek } from './deepseekProvider.js';
import { askLocal } from './localProvider.js';
import type { CopilotHistoryItem } from './types.js';

export async function askCopilot(question: unknown, history: unknown): Promise<{ response: Awaited<ReturnType<typeof askLocal>>; provider: 'deepseek' | 'local'; fallbackUsed: boolean; durationMs: number }> {
  const startedAt = Date.now();
  if (typeof question !== 'string' || question.trim().length === 0 || question.length > 600) throw Object.assign(new Error('La pregunta no es válida.'), { statusCode: 400 });
  const context = await buildBusinessContext();
  const safeHistory = Array.isArray(history) ? history as CopilotHistoryItem[] : [];
  if (serverEnv.copilotMode === 'deepseek' && serverEnv.deepseekEnabled && serverEnv.deepseekApiKey) {
    try { const response = await askDeepSeek(question, context, safeHistory); console.log(JSON.stringify({ event: 'copilot', provider: 'deepseek', fallbackUsed: false, durationMs: Date.now() - startedAt })); return { response, provider: 'deepseek', fallbackUsed: false, durationMs: Date.now() - startedAt }; } catch (error) { console.warn(JSON.stringify({ event: 'copilot', provider: 'deepseek', fallbackUsed: true, durationMs: Date.now() - startedAt, error: error instanceof Error ? error.message : 'unknown' })); }
  }
  const response = await askLocal(question, context);
  console.log(JSON.stringify({ event: 'copilot', provider: 'local', fallbackUsed: serverEnv.copilotMode === 'deepseek', durationMs: Date.now() - startedAt }));
  return { response, provider: 'local', fallbackUsed: serverEnv.copilotMode === 'deepseek', durationMs: Date.now() - startedAt };
}
