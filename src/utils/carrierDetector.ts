export interface CarrierInfo {
  carrier: 'Vodacom' | 'MTN' | 'Telkom Mobile' | 'Cell C' | 'South African Landline' | 'International / Other';
  isMobile: boolean;
  prefix: string;
  badgeColor: string; // Tailwind class
  networkRouting: string;
  formattedNational: string;
  formattedInternational: string;
}

/**
 * Detects South African network provider and number characteristics
 * Examples: '076 101 5283' -> Vodacom Mobile
 */
export function detectCarrier(rawNumber: string): CarrierInfo {
  // Normalize digits only
  const digits = rawNumber.replace(/[^\d]/g, '');

  let nationalDigits = digits;
  if (digits.startsWith('27') && digits.length >= 11) {
    nationalDigits = '0' + digits.slice(2);
  } else if (!digits.startsWith('0') && digits.length === 9) {
    nationalDigits = '0' + digits;
  }

  const prefix3 = nationalDigits.slice(0, 3);
  const prefix4 = nationalDigits.slice(0, 4);

  // Format 10 digit South African number: '076 101 5283'
  let formattedNational = rawNumber;
  let formattedInternational = rawNumber;
  if (nationalDigits.length === 10) {
    formattedNational = `${nationalDigits.slice(0, 3)} ${nationalDigits.slice(3, 6)} ${nationalDigits.slice(6, 10)}`;
    formattedInternational = `+27 ${nationalDigits.slice(1, 3)} ${nationalDigits.slice(3, 6)} ${nationalDigits.slice(6, 10)}`;
  }

  // Vodacom SA prefixes: 082, 072, 076, 079, 0710-0716, 060
  if (
    ['082', '072', '076', '079'].includes(prefix3) ||
    ['0710', '0711', '0712', '0713', '0714', '0715', '0716'].includes(prefix4) ||
    prefix3 === '060'
  ) {
    return {
      carrier: 'Vodacom',
      isMobile: true,
      prefix: prefix3,
      badgeColor: 'bg-rose-950 text-rose-300 border-rose-800',
      networkRouting: 'Vodacom Business Cellular Network (sip.vodacom.co.za / KZN Metro POP)',
      formattedNational,
      formattedInternational,
    };
  }

  // MTN SA prefixes: 083, 073, 078, 0717-0719, 063
  if (
    ['083', '073', '078'].includes(prefix3) ||
    ['0717', '0718', '0719'].includes(prefix4) ||
    prefix3 === '063'
  ) {
    return {
      carrier: 'MTN',
      isMobile: true,
      prefix: prefix3,
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-800',
      networkRouting: 'MTN South Africa Cellular Trunk (sip.mtn.co.za)',
      formattedNational,
      formattedInternational,
    };
  }

  // Cell C prefixes: 084, 074, 061, 062
  if (['084', '074', '061', '062'].includes(prefix3)) {
    return {
      carrier: 'Cell C',
      isMobile: true,
      prefix: prefix3,
      badgeColor: 'bg-purple-950 text-purple-300 border-purple-800',
      networkRouting: 'Cell C Mobile Core Network Interconnect',
      formattedNational,
      formattedInternational,
    };
  }

  // Telkom Mobile: 081, 067
  if (['081', '067'].includes(prefix3)) {
    return {
      carrier: 'Telkom Mobile',
      isMobile: true,
      prefix: prefix3,
      badgeColor: 'bg-blue-950 text-blue-300 border-blue-800',
      networkRouting: 'Telkom Openserve / Mobile Core (sip.kzn.telkom.co.za)',
      formattedNational,
      formattedInternational,
    };
  }

  // Fixed Line Geo Geographic: 031 (Durban), 011/012 (Gauteng), 021 (Cape Town)
  if (prefix3 === '031' || prefix3 === '011' || prefix3 === '012' || prefix3 === '021') {
    const geo = prefix3 === '031' ? 'Durban / eThekwini' : prefix3 === '011' ? 'Johannesburg' : prefix3 === '021' ? 'Cape Town' : 'Pretoria';
    return {
      carrier: 'South African Landline',
      isMobile: false,
      prefix: prefix3,
      badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800',
      networkRouting: `${geo} Geographic Fixed Line (PSTN / Telkom Metro SIP)`,
      formattedNational,
      formattedInternational,
    };
  }

  return {
    carrier: 'International / Other',
    isMobile: false,
    prefix: prefix3,
    badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
    networkRouting: 'Standard PSTN / Inter-Carrier Gateway',
    formattedNational,
    formattedInternational,
  };
}
