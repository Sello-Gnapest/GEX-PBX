import { PhoneContact } from '../types';

// Declare W3C Contact Picker interfaces
interface ContactProperty {
  name?: string[];
  tel?: string[];
  email?: string[];
}

interface ContactsManager {
  getProperties: () => Promise<string[]>;
  select: (
    properties: string[],
    options?: { multiple?: boolean }
  ) => Promise<ContactProperty[]>;
}

// Check if W3C Contact Picker API is available in this browser
export function isContactPickerSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'contacts' in navigator &&
    'ContactsManager' in window &&
    typeof (navigator as unknown as { contacts: ContactsManager }).contacts?.select === 'function'
  );
}

// Request contacts directly from the device's native address book (Android Chrome / supported browsers)
export async function requestDeviceContacts(): Promise<{
  success: boolean;
  contacts: PhoneContact[];
  error?: string;
}> {
  if (!isContactPickerSupported()) {
    return {
      success: false,
      contacts: [],
      error: 'Device Contact Picker API is not supported in this browser.',
    };
  }

  try {
    const contactsManager = (navigator as unknown as { contacts: ContactsManager }).contacts;
    const properties = await contactsManager.getProperties();
    const propsToSelect = properties.filter((p) => ['name', 'tel', 'email'].includes(p));

    const results = await contactsManager.select(propsToSelect, { multiple: true });

    const importedContacts: PhoneContact[] = [];

    for (const item of results) {
      const name = item.name?.[0] || 'Unknown Contact';
      const rawTel = item.tel?.[0] || '';
      const email = item.email?.[0] || '';

      if (rawTel || name) {
        // Clean phone number format
        const cleanTel = rawTel.replace(/[^\d+]/g, '');

        importedContacts.push({
          id: `dev-ct-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name,
          phoneNumber: cleanTel || rawTel,
          email,
          category: 'Personal',
          source: 'device_phonebook',
          notes: 'Imported from native device phonebook',
        });
      }
    }

    return {
      success: true,
      contacts: importedContacts,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'User cancelled contact picker';
    return {
      success: false,
      contacts: [],
      error: errorMsg,
    };
  }
}

// Parse standard vCard (.vcf) files (compatible with iPhone Apple Contacts, Android Contacts export, and Google Contacts)
export function parseVCardText(vcardText: string): PhoneContact[] {
  const contacts: PhoneContact[] = [];
  const cards = vcardText.split(/BEGIN:VCARD/i);

  for (const card of cards) {
    if (!card.trim()) continue;

    let name = '';
    let tel = '';
    let email = '';
    let org = '';

    const lines = card.split(/\r?\n/);
    for (const line of lines) {
      if (/^FN:/i.test(line)) {
        name = line.replace(/^FN:/i, '').trim();
      } else if (!name && /^N:/i.test(line)) {
        const parts = line.replace(/^N:/i, '').split(';');
        name = `${parts[1] || ''} ${parts[0] || ''}`.trim();
      } else if (/^TEL[^:]*:/i.test(line)) {
        // Grab first phone number
        if (!tel) {
          tel = line.replace(/^TEL[^:]*:/i, '').trim();
        }
      } else if (/^EMAIL[^:]*:/i.test(line)) {
        if (!email) {
          email = line.replace(/^EMAIL[^:]*:/i, '').trim();
        }
      } else if (/^ORG:/i.test(line)) {
        org = line.replace(/^ORG:/i, '').replace(/;/g, ' ').trim();
      }
    }

    if (name || tel) {
      contacts.push({
        id: `vcf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: name || 'Unnamed Contact',
        phoneNumber: tel || '000',
        email,
        company: org,
        category: 'Client',
        source: 'vcf_import',
        notes: 'Imported via Apple/Google vCard (.vcf) address book export',
      });
    }
  }

  return contacts;
}

// Export contacts to a standard vCard string for downloading into phone
export function exportContactsToVCard(contacts: PhoneContact[]): string {
  return contacts
    .map((c) => {
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${c.name}`,
        `TEL;TYPE=CELL,VOICE:${c.phoneNumber}`,
        c.email ? `EMAIL;TYPE=PREF,INTERNET:${c.email}` : '',
        c.company ? `ORG:${c.company}` : '',
        c.notes ? `NOTE:${c.notes}` : '',
        'END:VCARD',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');
}
