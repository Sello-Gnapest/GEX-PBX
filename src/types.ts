export type CallState =
  | 'idle'
  | 'dialing'
  | 'ringing'
  | 'connected'
  | 'on_hold'
  | 'transferring'
  | 'conference';

export type CallDirection = 'inbound' | 'outbound';

export type LineId = 'line1' | 'line2' | 'line3' | 'line4';

export interface ActiveCall {
  id: string;
  lineId: LineId;
  remoteNumber: string;
  remoteName: string;
  direction: CallDirection;
  state: CallState;
  startTime: number;
  durationSeconds: number;
  isMuted: boolean;
  isRecording: boolean;
  recordedSeconds?: number;
  providerId: string;
}

export interface ParkedCall {
  slot: number; // 701, 702, 703
  callId: string;
  remoteNumber: string;
  remoteName: string;
  parkedAt: number;
  lineId: LineId;
}

export type ExtensionStatus = 'available' | 'in_call' | 'ringing' | 'dnd' | 'offline';

export type ForwardingType = 'unconditional' | 'busy' | 'no_answer' | 'off';

export interface CallForwardingConfig {
  enabled: boolean;
  type: ForwardingType;
  targetNumber: string;
  targetName: string;
  noAnswerTimeoutSeconds: number;
}

export interface Extension {
  id: string;
  extensionNumber: string;
  name: string;
  department: string;
  status: ExtensionStatus;
  currentCallWith?: string;
  isCurrentUser?: boolean;

  // Office Agent User Account & PWA Softphone configuration
  email?: string;
  role?: 'Agent' | 'Manager' | 'Supervisor' | 'Executive' | 'Operator';
  mobileNumber?: string;
  mobileCarrier?: 'Vodacom' | 'MTN' | 'Telkom Mobile' | 'Cell C' | 'Other';
  mobileTwinningMode?: 'simultaneous' | 'follow_me' | 'unconditional' | 'off';
  directDid?: string; // e.g. '031 940 8802'
  allowOutbound: boolean;
  outboundCli: string; // Calling Line Identity to present e.g. '031 940 8800' or direct DID
  webRtcUsername?: string;
  webRtcPassword?: string;
  sipDomain?: string;
  deviceType?: 'PWA Mobile (iOS/Android)' | 'PWA Desktop' | 'SIP Deskphone';
  callForwardingTarget?: string;
  pwaInstalled?: boolean;
  notes?: string;
  
  // NEW: Department-specific provider assignment
  assignedProviderId?: string; // Primary provider for this extension
  allowedProviders?: string[]; // Fallback providers
}

export type ProviderSlug = 'telkom' | 'vodacom' | 'mtn' | 'switchtel' | 'liquid' | 'custom';

export interface LocalProvider {
  id: string;
  name: string;
  slug: ProviderSlug;
  providerType: 'National Tier 1' | 'Mobile Network Carrier' | 'VoIP Specialist' | 'Fibre SIP Trunk';
  host: string;
  port: number;
  protocol: 'UDP' | 'TCP' | 'TLS';
  registrationStatus: 'registered' | 'registering' | 'offline' | 'error';
  latencyMs: number;
  authUsername: string;
  authPassword?: string; // NEW: SIP authentication password
  durbanPopLocation: string; // Durban / KZN Metro Exchange location
  codecs: string[];
  isPrimary: boolean;
  didRanges: string[];
  registeredSince?: string;
  channelCapacity: number;
  activeChannels: number;
  
  // NEW: Enhanced provider configuration
  outboundProxy?: string;
  inboundProxy?: string;
  registrarServer?: string;
  keepAliveInterval?: number; // SIP REGISTER keep-alive (seconds)
  failoverThreshold?: number; // Latency threshold before failover (ms)
  maxRetries?: number;
  retryInterval?: number; // Seconds between registration attempts
  description?: string;
}

// NEW: Dial routing rules
export interface DialRule {
  id: string;
  name: string;
  pattern: string; // Regex pattern for dialing (e.g., "^031", "^082|083|084")
  description: string;
  primaryProviderId: string;
  fallbackProviderIds: string[];
  cost?: number; // Cost per minute
  priority: number; // Lower = higher priority
  enabled: boolean;
}

// NEW: Department provider assignment
export interface DepartmentProviderMap {
  id: string;
  departmentName: string;
  primaryProviderId: string;
  fallbackProviderIds: string[];
  description?: string;
}

export interface Office031Config {
  mainNumber: string; // e.g., '031 940 8800'
  formattedInternational: string; // '+27 31 940 8800'
  areaCode: string; // '031'
  regionName: string; // 'Durban Metro, KwaZulu-Natal'
  providerId: string; // 'telkom'
  switchboardExtension: string; // '101'
  callerIdName: string; // 'KZN Corporate HQ Switchboard'
  
  // Desktop phone binding
  deskPhoneProvisioned: boolean;
  deskPhoneModel: string;
  deskPhoneMac: string;
  deskPhoneIp: string;
  lineKeyIndex: number; // 1
  autoAnswerIntercom: boolean;
  
  // Office Mail (Voicemail) settings
  voicemailEnabled: boolean;
  voicemailNumber: string; // '*97'
  voicemailPin: string;
  voicemailEmailNotify: string; // e.g. 'sello.ncwani@gmail.com'
  voicemailEmailAttachMp3: boolean;
  voicemailAiTranscript: boolean;
  mwiLampEnabled: boolean; // Message Waiting Indicator
  greetingMode: 'custom' | 'standard' | 'tts';
  greetingAudioTitle: string;
  greetingScript: string;
  ringDurationBeforeMailSeconds: number;
}

export interface OfficeMailItem {
  id: string;
  callerNumber: string;
  callerName: string;
  timestamp: string;
  durationSeconds: number;
  isRead: boolean;
  audioDurationStr: string;
  transcription: string;
  urgent: boolean;
  emailSentTo: string;
}

export interface CallLogItem {
  id: string;
  direction: CallDirection;
  number: string;
  name: string;
  timestamp: string;
  durationSeconds: number;
  status: 'answered' | 'missed' | 'transferred' | 'voicemail' | 'rejected';
  lineId: LineId;
  providerName: string;
  recordingAvailable?: boolean;
  
  // NEW: Provider attribution
  cost?: number;
  costCurrency?: string;
}

export interface DesktopPhoneModel {
  id: string;
  brand: string;
  model: string;
  displayName: string;
  description: string;
  screenType: 'Color Touch LCD 7"' | 'Backlit Color LCD 4.3"' | 'Executive Dual-Screen' | 'OLED Business';
  blfKeys: number;
  sipAccounts: number;
  imageAccent: string;
  configFormat: 'yealink_cfg' | 'polycom_xml' | 'grandstream_xml' | 'cisco_xml';
}

export interface PhoneContact {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  company?: string;
  category?: 'Client' | 'Supplier' | 'Partner' | 'Internal' | 'Personal';
  notes?: string;
  isFavorite?: boolean;
  source: 'device_phonebook' | 'manual' | 'vcf_import';
}
