import {
  LocalProvider,
  DialRule,
  DepartmentProviderMap,
} from '../types';

/**
 * NETWORK PROVIDER ROUTING ENGINE
 * Provides intelligent call routing based on destination number patterns,
 * department assignment, and provider availability
 */

// Dial routing rules for South African destinations
export const DIAL_ROUTING_RULES: DialRule[] = [
  {
    id: 'rule-031-durban-local',
    name: 'Durban Local (031)',
    pattern: '^031', // Matches: 031 XXXXXXX
    description: 'Local Durban & KZN area code - route to Telkom primary trunk',
    primaryProviderId: 'prov-telkom',
    fallbackProviderIds: ['prov-switchtel'],
    cost: 0.25, // Cost per minute in ZAR
    priority: 1,
    enabled: true,
  },
  {
    id: 'rule-mobile-carriers',
    name: 'South African Mobile Carriers',
    pattern: '^(082|083|084|072|076|073|071|074)', // Vodacom, MTN, Cell C prefixes
    description: 'Mobile carriers - route through mobile interconnect',
    primaryProviderId: 'prov-vodacom',
    fallbackProviderIds: ['prov-mtn', 'prov-telkom'],
    cost: 0.35,
    priority: 2,
    enabled: true,
  },
  {
    id: 'rule-national-ld',
    name: 'National Long Distance',
    pattern: '^(01|02|03|04|05)', // 01X-05X - other area codes
    description: 'National long distance calls - use Telkom with LCR',
    primaryProviderId: 'prov-telkom',
    fallbackProviderIds: ['prov-liquid', 'prov-switchtel'],
    cost: 0.45,
    priority: 3,
    enabled: true,
  },
  {
    id: 'rule-emergency',
    name: 'Emergency Services',
    pattern: '^(10111|112|10177)', // Emergency numbers
    description: 'Emergency calls - always use Telkom Priority 1',
    primaryProviderId: 'prov-telkom',
    fallbackProviderIds: [],
    cost: 0, // No charge
    priority: 0, // Highest priority
    enabled: true,
  },
  {
    id: 'rule-voicemail',
    name: 'Office Voicemail',
    pattern: '^\\*97$', // Exact match: *97
    description: 'Voicemail access code - internal routing',
    primaryProviderId: 'prov-telkom',
    fallbackProviderIds: [],
    cost: 0,
    priority: 10,
    enabled: true,
  },
];

// Department-to-provider assignments
export const DEPARTMENT_PROVIDER_MAPPING: DepartmentProviderMap[] = [
  {
    id: 'dept-001',
    departmentName: 'Front Desk & Central Operator',
    primaryProviderId: 'prov-telkom',
    fallbackProviderIds: ['prov-switchtel'],
    description: 'Switchboard receives all inbound calls via Telkom 031 trunk',
  },
  {
    id: 'dept-002',
    departmentName: 'Commercial & Sales',
    primaryProviderId: 'prov-telkom',
    fallbackProviderIds: ['prov-vodacom'],
    description: 'Sales team routes via Telkom for mobile outbound',
  },
  {
    id: 'dept-003',
    departmentName: 'Financial Ops & Billing',
    primaryProviderId: 'prov-telkom',
    fallbackProviderIds: ['prov-liquid'],
    description: 'Finance department uses direct DID on Telkom',
  },
  {
    id: 'dept-004',
    departmentName: 'Harbour Logistics & Pier 1',
    primaryProviderId: 'prov-vodacom',
    fallbackProviderIds: ['prov-mtn', 'prov-telkom'],
    description: 'Logistics team uses mobile-optimized routing (Vodacom)',
  },
  {
    id: 'dept-005',
    departmentName: 'PBX Infrastructure & NOC',
    primaryProviderId: 'prov-telkom',
    fallbackProviderIds: ['prov-switchtel', 'prov-liquid'],
    description: 'NOC team has access to all trunks for failover testing',
  },
  {
    id: 'dept-006',
    departmentName: 'Field Operations & Mobile',
    primaryProviderId: 'prov-vodacom',
    fallbackProviderIds: ['prov-mtn', 'prov-telkom'],
    description: 'Mobile team - Vodacom primary with mobile twinning on 076 101 5283',
  },
];

/**
 * Get the optimal provider for a given destination number
 * @param dialNumber - The number being dialed
 * @param providers - Available SIP providers
 * @returns LocalProvider to route the call through
 */
export function getOptimalProvider(
  dialNumber: string,
  providers: LocalProvider[],
  departmentName?: string
): LocalProvider | null {
  // Step 1: Check if department has specific routing preference
  if (departmentName) {
    const deptMap = DEPARTMENT_PROVIDER_MAPPING.find(
      (d) => d.departmentName === departmentName
    );
    if (deptMap) {
      const primaryProvider = providers.find((p) => p.id === deptMap.primaryProviderId);
      if (primaryProvider && primaryProvider.registrationStatus === 'registered') {
        return primaryProvider;
      }
      // Try fallbacks
      for (const fallbackId of deptMap.fallbackProviderIds) {
        const fallback = providers.find(
          (p) => p.id === fallbackId && p.registrationStatus === 'registered'
        );
        if (fallback) return fallback;
      }
    }
  }

  // Step 2: Match destination pattern to dial routing rules
  let matchedRule: DialRule | null = null;
  for (const rule of DIAL_ROUTING_RULES.sort((a, b) => a.priority - b.priority)) {
    if (!rule.enabled) continue;
    const regex = new RegExp(rule.pattern);
    if (regex.test(dialNumber)) {
      matchedRule = rule;
      break;
    }
  }

  if (matchedRule) {
    // Try primary provider first
    const primaryProvider = providers.find(
      (p) => p.id === matchedRule!.primaryProviderId && p.registrationStatus === 'registered'
    );
    if (primaryProvider) return primaryProvider;

    // Try fallback providers
    for (const fallbackId of matchedRule.fallbackProviderIds) {
      const fallback = providers.find(
        (p) => p.id === fallbackId && p.registrationStatus === 'registered'
      );
      if (fallback) return fallback;
    }
  }

  // Step 3: Default fallback - return first registered provider
  return providers.find((p) => p.registrationStatus === 'registered') || null;
}

/**
 * Get cost estimate for a call
 * @param dialNumber - The number being dialed
 * @param durationSeconds - Call duration in seconds
 * @returns Estimated cost in ZAR
 */
export function getCallCost(
  dialNumber: string,
  durationSeconds: number,
  providers: LocalProvider[]
): number {
  // Find matching rule
  for (const rule of DIAL_ROUTING_RULES) {
    if (!rule.enabled) continue;
    const regex = new RegExp(rule.pattern);
    if (regex.test(dialNumber)) {
      const costPerMinute = rule.cost || 0;
      return (durationSeconds / 60) * costPerMinute;
    }
  }
  return 0; // No cost if no rule matches
}

/**
 * Validate provider credentials before registration
 * @param provider - Provider to validate
 * @returns Error message if invalid, null if valid
 */
export function validateProviderConfig(provider: LocalProvider): string | null {
  if (!provider.host) return 'SIP server host is required';
  if (!provider.port || provider.port < 1 || provider.port > 65535) {
    return 'Valid SIP port (1-65535) is required';
  }
  if (!provider.authUsername) return 'Authentication username is required';
  if (provider.protocol !== 'UDP' && provider.protocol !== 'TCP' && provider.protocol !== 'TLS') {
    return 'Protocol must be UDP, TCP, or TLS';
  }
  if (provider.keepAliveInterval && provider.keepAliveInterval < 30) {
    return 'Keep-alive interval must be at least 30 seconds';
  }
  return null;
}

/**
 * Check if provider should failover based on latency
 * @param provider - Provider to check
 * @returns true if provider should failover
 */
export function shouldFailover(provider: LocalProvider): boolean {
  const threshold = provider.failoverThreshold || 100; // Default 100ms
  return provider.latencyMs > threshold || provider.registrationStatus !== 'registered';
}

/**
 * Get all available registered providers sorted by latency
 * @param providers - List of providers
 * @returns Sorted providers by latency (lowest first)
 */
export function getRegisteredProvidersByLatency(providers: LocalProvider[]): LocalProvider[] {
  return providers
    .filter((p) => p.registrationStatus === 'registered')
    .sort((a, b) => a.latencyMs - b.latencyMs);
}

/**
 * Calculate provider load balance score
 * Considers: latency, active channels, channel capacity
 * @param provider - Provider to score
 * @returns Score (lower = better)
 */
export function getProviderLoadScore(provider: LocalProvider): number {
  const utilizationRatio = provider.activeChannels / provider.channelCapacity;
  const latencyWeight = provider.latencyMs * 0.4;
  const utilizationWeight = utilizationRatio * 1000 * 0.6;
  return latencyWeight + utilizationWeight;
}

/**
 * Get best provider for load balancing (lowest score)
 * @param providers - List of providers
 * @returns Best provider for this call
 */
export function getBestProviderForLoadBalancing(providers: LocalProvider[]): LocalProvider | null {
  const registered = providers.filter((p) => p.registrationStatus === 'registered');
  if (registered.length === 0) return null;

  return registered.reduce((best, current) => {
    const bestScore = getProviderLoadScore(best);
    const currentScore = getProviderLoadScore(current);
    return currentScore < bestScore ? current : best;
  });
}
