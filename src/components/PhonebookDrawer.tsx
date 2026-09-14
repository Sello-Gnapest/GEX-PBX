import React, { useState, useRef } from 'react';
import {
  BookUser,
  Search,
  Plus,
  Smartphone,
  Phone,
  Star,
  Trash2,
  Download,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Apple,
  Building,
  User,
  ExternalLink,
  Copy,
  Info,
} from 'lucide-react';
import { PhoneContact } from '../types';
import {
  isContactPickerSupported,
  requestDeviceContacts,
  parseVCardText,
  exportContactsToVCard,
} from '../utils/contactBookHelper';

interface PhonebookDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: PhoneContact[];
  onAddContact: (contact: PhoneContact) => void;
  onAddBatchContacts: (contacts: PhoneContact[]) => void;
  onDeleteContact: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onCallContact: (phoneNumber: string, contactName: string) => void;
  outboundCli: string;
}

export const PhonebookDrawer: React.FC<PhonebookDrawerProps> = ({
  isOpen,
  onClose,
  contacts,
  onAddContact,
  onAddBatchContacts,
  onDeleteContact,
  onToggleFavorite,
  onCallContact,
  outboundCli,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(
    null
  );

  // Manual Add Form Modal
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCategory, setNewCategory] = useState<'Client' | 'Supplier' | 'Partner' | 'Personal'>('Client');

  // Hidden file input for vCard
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const hasNativeContactPicker = isContactPickerSupported();

  // Handle native device contact picker (Android Chrome / compatible browsers)
  const handleImportNativeDeviceContacts = async () => {
    setStatusMessage({ type: 'info', text: 'Opening device address book...' });

    const res = await requestDeviceContacts();
    if (res.success && res.contacts.length > 0) {
      onAddBatchContacts(res.contacts);
      setStatusMessage({
        type: 'success',
        text: `Successfully imported ${res.contacts.length} contact(s) from device phonebook!`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } else if (res.error) {
      setStatusMessage({
        type: 'error',
        text: res.error.includes('cancel')
          ? 'Contact selection cancelled.'
          : `${res.error} You can also upload a .vcf address book file below.`,
      });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  // Handle vCard file upload (.vcf)
  const handleVcfFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const parsed = parseVCardText(content);
        if (parsed.length > 0) {
          onAddBatchContacts(parsed);
          setStatusMessage({
            type: 'success',
            text: `Imported ${parsed.length} contacts from ${file.name}!`,
          });
          setTimeout(() => setStatusMessage(null), 4000);
        } else {
          setStatusMessage({
            type: 'error',
            text: 'Could not find contacts in this .vcf file.',
          });
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Export to vCard
  const handleExportVCard = () => {
    const vcfString = exportContactsToVCard(contacts);
    const blob = new Blob([vcfString], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'pbx_031_contacts.vcf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Manual Add Form Submit
  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const newCt: PhoneContact = {
      id: `manual-ct-${Date.now()}`,
      name: newName.trim(),
      phoneNumber: newPhone.trim(),
      company: newCompany.trim(),
      email: newEmail.trim(),
      category: newCategory,
      source: 'manual',
      isFavorite: false,
    };

    onAddContact(newCt);
    setShowAddForm(false);
    setNewName('');
    setNewPhone('');
    setNewCompany('');
    setNewEmail('');
    setStatusMessage({ type: 'success', text: `Added ${newCt.name} to phonebook.` });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Filtered contacts
  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phoneNumber.includes(searchQuery) ||
      (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeCategory === 'favorites') return c.isFavorite;
    if (activeCategory === 'device') return c.source === 'device_phonebook';
    if (activeCategory === 'clients') return c.category === 'Client' || c.category === 'Partner';

    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border-2 border-cyan-500/50 p-5 sm:p-6 shadow-2xl space-y-5 text-white max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/60 flex items-center justify-center text-cyan-400">
              <BookUser className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Device Phonebook &amp; Contacts</h3>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-semibold uppercase">
                  Seamless Dialing
                </span>
              </div>
              <p className="text-xs text-slate-400">
                1-click outbound calling presenting Durban CLI: <span className="font-mono text-cyan-300 font-semibold">{outboundCli}</span>
              </p>
            </div>
          </div>

          <button
            id="close-phonebook-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Integration Actions Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Native Device Phonebook Link (Android/Supported) */}
          <button
            id="link-device-phonebook-btn"
            onClick={handleImportNativeDeviceContacts}
            className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition cursor-pointer shadow ${
              hasNativeContactPicker
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white border-emerald-400/50 shadow-emerald-900/30'
                : 'bg-slate-800/90 hover:bg-slate-750 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Import directly from Android / Device native contacts address book"
          >
            <Smartphone className="w-4 h-4 text-emerald-300" />
            <div className="text-left">
              <div className="leading-tight">
                {hasNativeContactPicker ? 'Link Device Phonebook' : 'Sync Device Book'}
              </div>
              <div className="text-[10px] font-normal opacity-80">
                {hasNativeContactPicker ? 'Native Contact Picker' : 'Via Mobile Web'}
              </div>
            </div>
          </button>

          {/* Apple iOS / Google Contacts vCard (.vcf) File Import */}
          <button
            id="import-vcf-btn"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-cyan-500/50 text-xs font-bold transition cursor-pointer"
            title="Import Apple iPhone contacts (.vcf) or Google Contacts export"
          >
            <Apple className="w-4 h-4 text-slate-300" />
            <div className="text-left">
              <div className="leading-tight">Import iPhone / vCard</div>
              <div className="text-[10px] font-normal text-slate-400">.vcf or .csv address book</div>
            </div>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleVcfFileUpload}
            accept=".vcf,text/vcard,text/x-vcard"
            className="hidden"
          />

          {/* Add Manual Contact */}
          <button
            id="manual-add-contact-btn"
            onClick={() => setShowAddForm(true)}
            className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/50 text-xs font-bold transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <div className="text-left">
              <div className="leading-tight">+ Add Contact</div>
              <div className="text-[10px] font-normal text-cyan-400/80">New client / partner</div>
            </div>
          </button>
        </div>

        {/* Status Alert Banner */}
        {statusMessage && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center gap-2 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                : 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            ) : (
              <Info className="w-4 h-4 shrink-0 text-cyan-400" />
            )}
            <span className="flex-1">{statusMessage.text}</span>
          </div>
        )}

        {/* Search & Category Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="phonebook-search-input"
              placeholder="Search contacts by name, company, or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-2xl text-white outline-none text-xs font-medium placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 overflow-x-auto text-xs pb-1">
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: `All (${contacts.length})` },
                { id: 'favorites', label: 'Favorites ⭐' },
                { id: 'device', label: 'Device Linked 📱' },
                { id: 'clients', label: 'Clients / Partners 🏢' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer whitespace-nowrap text-[11px] ${
                    activeCategory === tab.id
                      ? 'bg-cyan-600 text-white font-bold shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleExportVCard}
              className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
              title="Backup contacts to .vcf file"
            >
              <Download className="w-3 h-3" />
              <span>Export .vcf</span>
            </button>
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-80">
          {filteredContacts.length === 0 ? (
            <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <BookUser className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-sm font-bold text-slate-400">No matching contacts found</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Link your device phonebook or import your iPhone/Android vCard to populate contacts instantly.
              </p>
            </div>
          ) : (
            filteredContacts.map((c) => (
              <div
                key={c.id}
                id={`contact-item-${c.id}`}
                className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 transition flex items-center justify-between gap-3 text-xs group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-cyan-400 shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white truncate text-[13px]">{c.name}</span>
                      {c.isFavorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                      {c.source === 'device_phonebook' && (
                        <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.2 rounded font-semibold shrink-0">
                          Device
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono mt-0.5">
                      <span className="text-cyan-300 font-semibold">{c.phoneNumber}</span>
                      {c.company && (
                        <>
                          <span>•</span>
                          <span className="text-slate-400 truncate">{c.company}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Star / Favorite */}
                  <button
                    onClick={() => onToggleFavorite(c.id)}
                    className={`p-2 rounded-xl transition cursor-pointer ${
                      c.isFavorite
                        ? 'text-amber-400 bg-amber-950/60'
                        : 'text-slate-500 hover:text-slate-300 bg-slate-900'
                    }`}
                    title="Toggle favorite"
                  >
                    <Star className={`w-3.5 h-3.5 ${c.isFavorite ? 'fill-amber-400' : ''}`} />
                  </button>

                  {/* 1-Click Call Button */}
                  <button
                    id={`dial-contact-${c.id}`}
                    onClick={() => {
                      onCallContact(c.phoneNumber, c.name);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl transition cursor-pointer shadow shadow-emerald-500/20 text-xs"
                    title={`Dial ${c.phoneNumber} presenting Durban 031 CLI`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => onDeleteContact(c.id)}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 bg-slate-900 transition cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Remove contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info explaining how device linking works */}
        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Supports <strong>Android Contact Picker API</strong> &amp; <strong>Apple iPhone vCard</strong>
            </span>
          </div>
          <span className="text-slate-500">All contacts stored securely in local app memory</span>
        </div>
      </div>

      {/* Manual Add Contact Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border-2 border-cyan-500/50 p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="font-bold text-base text-white">Add New Contact</h4>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualAdd} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Siphesihle Dlamini"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Telephone / Mobile *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 031 361 8800 or 082 123 4567"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Company / Organization</label>
                <input
                  type="text"
                  placeholder="e.g. Transnet Maritime"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="client@domain.co.za"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) =>
                    setNewCategory(e.target.value as 'Client' | 'Supplier' | 'Partner' | 'Personal')
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-500"
                >
                  <option value="Client">Client</option>
                  <option value="Partner">Partner</option>
                  <option value="Supplier">Supplier</option>
                  <option value="Personal">Personal / Internal</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold cursor-pointer"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
