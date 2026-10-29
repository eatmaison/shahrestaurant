import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

export function loadConfig(environment = process.env) {
  const values = {};
  for (const relative of ['../../.env', '../../.env.local', '../../.env.phone-agent']) {
    const path = fileURLToPath(new URL(relative, import.meta.url));
    if (existsSync(path)) Object.assign(values, parseEnv(readFileSync(path, 'utf8')));
  }
  Object.assign(values, environment);
  const integer = (key, fallback, min, max) => {
    const value = Number(values[key] || fallback);
    if (!Number.isInteger(value) || value < min || value > max) throw new Error('Invalid setting: ' + key);
    return value;
  };
  const config = {
    enabled: values.PHONE_AGENT_ENABLED === 'true',
    port: integer('PHONE_AGENT_PORT', 3010, 1024, 65535),
    apiKey: values.OPENAI_API_KEY || '',
    webhookSecret: values.OPENAI_WEBHOOK_SECRET || '',
    internalSecret: values.PHONE_AGENT_INTERNAL_SECRET || '',
    databaseUrl: values.DATABASE_URL || '',
    model: values.PHONE_AGENT_MODEL || 'gpt-realtime-2.1-mini',
    transcriptionModel: values.PHONE_AGENT_TRANSCRIPTION_MODEL || 'gpt-transcribe',
    voice: values.PHONE_AGENT_VOICE || 'marin',
    allowedNumbers: (values.PHONE_AGENT_ALLOWED_NUMBERS || '').split(',').map(v => v.trim()).filter(Boolean),
    transferNumber: values.PHONE_AGENT_TRANSFER_NUMBER || '',
    maxConcurrent: integer('PHONE_AGENT_MAX_CONCURRENT', 3, 1, 10),
    maxCallsPerDay: integer('PHONE_AGENT_MAX_CALLS_PER_DAY', 60, 1, 1000),
    maxSeconds: integer('PHONE_AGENT_MAX_SECONDS', 360, 60, 900),
    resendKey: values.RESEND_API_KEY || '',
    emailFrom: values.EMAIL_FROM || values.SMTP_FROM || '',
  };
  config.missing = [
    ['OPENAI_API_KEY', config.apiKey], ['OPENAI_WEBHOOK_SECRET', config.webhookSecret],
    ['DATABASE_URL', config.databaseUrl], ['PHONE_AGENT_INTERNAL_SECRET', config.internalSecret.length >= 32],
    ['PHONE_AGENT_ALLOWED_NUMBERS', config.allowedNumbers.length && config.allowedNumbers.every(n => /^\+[1-9]\d{7,14}$/.test(n))],
  ].filter(([, value]) => !value).map(([key]) => key);
  if (config.transferNumber && (!/^\+[1-9]\d{7,14}$/.test(config.transferNumber) ||
      ['+31203412995', ...config.allowedNumbers].includes(config.transferNumber))) throw new Error('Unsafe transfer number');
  config.ready = config.enabled && config.missing.length === 0;
  return config;
}
