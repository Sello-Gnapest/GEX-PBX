/**
 * PROVIDER CONFIG LOADER
 * Reads SIP provider credentials from environment variables at runtime
 * and merges them with default provider definitions
 */

import { LocalProvider } from '../types';
import { DEFAULT_LOCAL_PROVIDERS } from './pbxDefaults';

/**
 * Load provider configuration from environment variables
 * This allows runtime override of provider settings without hardcoding credentials
 */
export function loadProviderConfigFromEnv(): LocalProvider[] {
  const providers = [...DEFAULT_LOCAL_PROVIDERS];

  // Override Telkom provider with env values if present
  const telkomProvider = providers.find((p) => p.slug === 'telkom');
  if (telkomProvider) {
    telkomProvider.host = import.meta.env.VITE_PROVIDER_TELKOM_HOST || telkomProvider.host;
    telkomProvider.port = parseInt(import.meta.env.VITE_PROVIDER_TELKOM_PORT || '5060');
    telkomProvider.protocol =
      (import.meta.env.VITE_PROVIDER_TELKOM_PROTOCOL as 'UDP' | 'TCP' | 'TLS') ||
      telkomProvider.protocol;
    telkomProvider.authUsername =
      import.meta.env.VITE_PROVIDER_TELKOM_USERNAME || telkomProvider.authUsername;
    telkomProvider.authPassword = import.meta.env.VITE_PROVIDER_TELKOM_PASSWORD;
  }

  // Override Vodacom provider with env values if present
  const vodacomProvider = providers.find((p) => p.slug === 'vodacom');
  if (vodacomProvider) {
    vodacomProvider.host = import.meta.env.VITE_PROVIDER_VODACOM_HOST || vodacomProvider.host;
    vodacomProvider.port = parseInt(import.meta.env.VITE_PROVIDER_VODACOM_PORT || '5061');
    vodacomProvider.protocol =
      (import.meta.env.VITE_PROVIDER_VODACOM_PROTOCOL as 'UDP' | 'TCP' | 'TLS') ||
      vodacomProvider.protocol;
    vodacomProvider.authUsername =
      import.meta.env.VITE_PROVIDER_VODACOM_USERNAME || vodacomProvider.authUsername;
    vodacomProvider.authPassword = import.meta.env.VITE_PROVIDER_VODACOM_PASSWORD;
  }

  // Override MTN provider with env values if present
  const mtnProvider = providers.find((p) => p.slug === 'mtn');
  if (mtnProvider) {
    mtnProvider.host = import.meta.env.VITE_PROVIDER_MTN_HOST || mtnProvider.host;
    mtnProvider.port = parseInt(import.meta.env.VITE_PROVIDER_MTN_PORT || '5060');
    mtnProvider.protocol =
      (import.meta.env.VITE_PROVIDER_MTN_PROTOCOL as 'UDP' | 'TCP' | 'TLS') || mtnProvider.protocol;
    mtnProvider.authUsername =
      import.meta.env.VITE_PROVIDER_MTN_USERNAME || mtnProvider.authUsername;
    mtnProvider.authPassword = import.meta.env.VITE_PROVIDER_MTN_PASSWORD;
  }

  // Override SwitchTel provider with env values if present
  const switchtelProvider = providers.find((p) => p.slug === 'switchtel');
  if (switchtelProvider) {
    switchtelProvider.host = import.meta.env.VITE_PROVIDER_SWITCHTEL_HOST || switchtelProvider.host;
    switchtelProvider.port = parseInt(import.meta.env.VITE_PROVIDER_SWITCHTEL_PORT || '5060');
    switchtelProvider.protocol =
      (import.meta.env.VITE_PROVIDER_SWITCHTEL_PROTOCOL as 'UDP' | 'TCP' | 'TLS') ||
      switchtelProvider.protocol;
    switchtelProvider.authUsername =
      import.meta.env.VITE_PROVIDER_SWITCHTEL_USERNAME || switchtelProvider.authUsername;
    switchtelProvider.authPassword = import.meta.env.VITE_PROVIDER_SWITCHTEL_PASSWORD;
  }

  // Override Liquid provider with env values if present
  const liquidProvider = providers.find((p) => p.slug === 'liquid');
  if (liquidProvider) {
    liquidProvider.host = import.meta.env.VITE_PROVIDER_LIQUID_HOST || liquidProvider.host;
    liquidProvider.port = parseInt(import.meta.env.VITE_PROVIDER_LIQUID_PORT || '5061');
    liquidProvider.protocol =
      (import.meta.env.VITE_PROVIDER_LIQUID_PROTOCOL as 'UDP' | 'TCP' | 'TLS') ||
      liquidProvider.protocol;
    liquidProvider.authUsername =
      import.meta.env.VITE_PROVIDER_LIQUID_USERNAME || liquidProvider.authUsername;
    liquidProvider.authPassword = import.meta.env.VITE_PROVIDER_LIQUID_PASSWORD;
  }

  // Apply global PBX settings if present
  const failoverEnabled = import.meta.env.VITE_PBX_FAILOVER_ENABLED === 'true';
  const failoverThreshold = parseInt(import.meta.env.VITE_PBX_FAILOVER_THRESHOLD_MS || '120');
  const keepAliveInterval = parseInt(import.meta.env.VITE_PBX_KEEPALIVE_INTERVAL_SECONDS || '300');
  const maxRetries = parseInt(import.meta.env.VITE_PBX_MAX_RETRIES || '5');

  if (failoverEnabled) {
    providers.forEach((p) => {
      p.failoverThreshold = failoverThreshold;
      p.keepAliveInterval = keepAliveInterval;
      p.maxRetries = maxRetries;
    });
  }

  return providers;
}

/**
 * Get a single provider by slug with env overrides applied
 */
export function getProviderConfigBySlug(
  slug: string
): LocalProvider | undefined {
  const providers = loadProviderConfigFromEnv();
  return providers.find((p) => p.slug === slug);
}

/**
 * Validate that all required provider credentials are set
 * Returns array of missing/invalid configurations
 */
export function validateProviderConfig(): string[] {
  const errors: string[] = [];

  const requiredEnvVars = [
    'VITE_PROVIDER_TELKOM_HOST',
    'VITE_PROVIDER_TELKOM_PORT',
    'VITE_PROVIDER_TELKOM_PROTOCOL',
    'VITE_PROVIDER_TELKOM_USERNAME',
    'VITE_PROVIDER_TELKOM_PASSWORD',
  ];

  requiredEnvVars.forEach((envVar) => {
    const value = import.meta.env[envVar];
    if (!value || value === 'CHANGE_ME') {
      errors.push(`Missing or placeholder value for: ${envVar}`);
    }
  });

  return errors;
}

/**
 * Log provider configuration status (for debugging)
 * Do NOT log passwords - only show masked values
 */
export function logProviderConfigStatus(): void {
  const providers = loadProviderConfigFromEnv();
  console.log('=== GEX PBX Provider Configuration Status ===');
  providers.forEach((p) => {
    console.log(`\n${p.slug.toUpperCase()} (${p.name}):`);
    console.log(`  Host: ${p.host}:${p.port}`);
    console.log(`  Protocol: ${p.protocol}`);
    console.log(`  Username: ${p.authUsername}`);
    console.log(`  Password: ${p.authPassword ? '***MASKED***' : 'NOT SET'}`);
    console.log(`  Status: ${p.registrationStatus}`);
    console.log(`  Latency: ${p.latencyMs}ms`);
  });
}
