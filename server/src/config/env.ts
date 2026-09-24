import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: process.env.SERVER_ENV_FILE ?? 'server/.env' });
dotenv.config({ path: '.env', override: false });

export const serverEnv = {
  port: Number(process.env.PORT ?? 3001),
  host: process.env.HOST ?? '0.0.0.0',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:5174,http://10.32.0.163:5173',
  dataPath: path.resolve(process.env.DATA_PATH ?? 'server/data/copiloto.json'),
  persistenceMode: process.env.PERSISTENCE_MODE === 'postgres' ? 'postgres' : 'json',
  dbHost: process.env.DB_HOST ?? '127.0.0.1',
  dbPort: Number(process.env.DB_PORT ?? 3306),
  dbName: process.env.DB_NAME ?? 'copiloto_phygital',
  dbUser: process.env.DB_USER ?? '',
  dbPassword: process.env.DB_PASSWORD ?? '',
  version: process.env.npm_package_version ?? '0.1.0',
  copilotMode: process.env.COPILOT_MODE === 'deepseek' ? 'deepseek' : 'local',
  deepseekEnabled: process.env.DEEPSEEK_ENABLED === 'true',
  deepseekApiKey: process.env.DEEPSEEK_API_KEY ?? '',
  deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com',
  deepseekModel: process.env.DEEPSEEK_MODEL ?? 'deepseek-flash',
  deepseekTimeoutMs: Number(process.env.DEEPSEEK_TIMEOUT_MS ?? 8000),
  deepseekMaxTokens: Number(process.env.DEEPSEEK_MAX_TOKENS ?? 500),
  deepseekVisionModel: process.env.DEEPSEEK_VISION_MODEL ?? 'deepseek-flash',
  deepseekVisionTimeoutMs: Number(process.env.DEEPSEEK_VISION_TIMEOUT_MS ?? 25000),
  deepseekVisionMaxTokens: Number(process.env.DEEPSEEK_VISION_MAX_TOKENS ?? 400),
  deepseekInsightsTimeoutMs: Number(process.env.DEEPSEEK_INSIGHTS_TIMEOUT_MS ?? 20000),
  deepseekInsightsMaxTokens: Number(process.env.DEEPSEEK_INSIGHTS_MAX_TOKENS ?? 2400),
  agentIntervalMs: Number(process.env.AGENT_INTERVAL_MS ?? 300000),
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? '',
  twilioWhatsAppFrom: process.env.TWILIO_WHATSAPP_FROM ?? '',
  twilioWhatsAppTo: process.env.TWILIO_WHATSAPP_TO ?? '',
};
