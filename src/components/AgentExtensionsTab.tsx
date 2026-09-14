import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Smartphone,
  Phone,
  PhoneForwarded,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  Copy,
  ExternalLink,
  Trash2,
  Edit2,
  Sparkles,
  ArrowRight,
  Headphones,
  Apple,
  Globe,
  Radio,
  Share2,
  Lock,
  X,
  Laptop,
} from 'lucide-react';
import { Extension, Office031Config, CallForwardingConfig } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { MobileLinkingModal } from './MobileLinkingModal';
import { detectCarrier } from '../utils/carrierDetector';

interface AgentExtensionsTabProps {
  extensions: Extension[];
  onAddExtension: (newExt: Extension) => void;
  onUpdateExtension: (extId: string, updates: Partial<Extension>) => void;
  onDeleteExtension: (extId: string) => void;
  office031: Office031Config;
  onSelectAgentSoftphone: (extNumber: string) => void;
  forwardingConfig: CallForwardingConfig;
  onUpdateForwarding: (updates: Partial<CallForwardingConfig>) => void;
}

export const AgentExtensionsTab: React.FC<AgentExtensionsTabProps> = ({
  extensions,
  onAddExtension,
  onUpdateExtension,
  onDeleteExtension,
  office031,
  onSelectAgentSoftphone,
  forwardingConfig,
  onUpdateForwarding,
}) => {
  // Add Agent Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  // QR Code / Mobile Invite Modal State
  const [selectedAgentForQr, setSelectedAgentForQr] = useState<Extension | null>(null);
  // Mobile Phone Linking Modal State
  const [selectedAgentForMobile, setSelectedAgentForMobile] = useState<Extension | null>(null);
  // Copied feedback
  const [copiedLink, setCopiedLink] = useState(false);

  // New Extension Form State
  const [formName, setFormName] = useState('');
  const [formExtNumber, setFormExtNumber] = useState('');
  const [formDepartment, setFormDepartment] = useState('Commercial & Sales');
  const [formRole, setFormRole] = useState<'Agent' | 'Manager' | 'Supervisor' | 'Executive'>('Agent');
  const [formEmail, setFormEmail] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formAllowOutbound, setFormAllowOutbound] = useState(true);
  const [formCliType, setFormCliType] = useState<'main_031' | 'direct_did'>('main_031');
  const [formDeviceType, setFormDeviceType] = useState<'PWA Mobile (iOS/Android)' | 'PWA Desktop'>(
    'PWA Mobile (iOS/Android)'
  );

  // Auto calculate next available extension number
  const getNextExtNumber = () => {
    const numbers = extensions
      .map((e) => parseInt(e.extensionNumber, 10))
      .filter((n) => !isNaN(n));
    const max = numbers.length > 0 ? Math.max(...numbers) : 101;
    return (max + 1).toString();
  };

  const handleOpenAddModal = () => {
    const nextNum = getNextExtNumber();
    setFormExtNumber(nextNum);
    setFormName('');
    setFormEmail(`agent${nextNum}@gexpbx.co.za`);
    setFormMobile('+27 82 000 0000');
    setShowAddModal(true);
  };

  const handleCreateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formExtNumber.trim()) return;

    const directDid = `031 940 ${8800 + parseInt(formExtNumber, 10) - 100}`;
    const outboundCli = formCliType === 'main_031' ? office031.mainNumber : directDid;

    const newExt: Extension = {
      id: `ext-${Date.now()}`,
      extensionNumber: formExtNumber.trim(),
      name: formName.trim(),
      department: formDepartment,
      status: 'available',
      email: formEmail.trim(),
      role: formRole,
      mobileNumber: formMobile.trim(),
      directDid,
      allowOutbound: formAllowOutbound,
      outboundCli,
      webRtcUsername: `ext${formExtNumber.trim()}-${formName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      webRtcPassword: `PWA-Web!${formExtNumber}-Agent2026`,
      sipDomain: 'sip.kzn.telkom.co.za',
      deviceType: formDeviceType,
      pwaInstalled: false,
      notes: `Office Agent configured for Durban 031 Outbound and Switchboard Forwarding`,
    };

    onAddExtension(newExt);
    setShowAddModal(false);
  };

  const handleCopyAgentLink = (ext: Extension) => {
    const url = `${window.location.origin}/?ext=${ext.extensionNumber}#softphone`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleQuickSetForwarding = (ext: Extension) => {
    onUpdateForwarding({
      enabled: true,
      type: 'unconditional',
      targetNumber: ext.extensionNumber,
      targetName: `${ext.name} (Ext ${ext.extensionNumber})`,
    });
  };

  // Metrics
  const totalAgents = extensions.length;
  const pwaMobileAgents = extensions.filter(
    (e) => e.deviceType === 'PWA Mobile (iOS/Android)'
  ).length;
  const outboundAllowedCount = extensions.filter((e) => e.allowOutbound !== false).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-white space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Progressive Web App Softphones
              </span>
              <span className="text-xs text-slate-400 font-mono">WebRTC VoIP • Opus HD</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Users className="w-7 h-7 text-cyan-400" />
              <span>Office Agents &amp; Mobile PWA Extensions</span>
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Equip your office team with lightweight <strong>PWA Web Softphones</strong>. Agents can install
              this directly on <strong>Apple iOS (Safari)</strong> or <strong>Android (Chrome)</strong> without
              native app store deployment, place outbound calls with the Durban 031 caller ID, and receive
              calls forwarded by the switchboard.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              id="add-office-agent-btn"
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg transition cursor-pointer text-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Agent Extension</span>
            </button>

            <PWAInstallButton variant="compact" label="Install PWA on this Device" />
          </div>
        </div>

        {/* Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-slate-400 font-medium">Total Extensions</div>
            <div className="text-xl font-bold text-white mt-0.5">{totalAgents} Accounts</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-slate-400 font-medium">Mobile PWA Nodes</div>
            <div className="text-xl font-bold text-cyan-300 mt-0.5">{pwaMobileAgents} Devices</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-slate-400 font-medium">Outbound 031 Enabled</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">
              {outboundAllowedCount} / {totalAgents} Active
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-slate-400 font-medium">Switchboard Forwarding</div>
            <div className="text-sm font-bold text-amber-300 mt-1 truncate">
              {forwardingConfig.enabled ? forwardingConfig.targetName : 'Disabled (Rings Ext 101)'}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Phone Number Linking & Mobile Twinning Spotlight Card */}
      <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/30 border border-rose-800/40 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>Link Existing Mobile Number (e.g. Vodacom 076 101 5283)</span>
                </h3>
                <span className="text-[10px] bg-rose-900/60 text-rose-300 border border-rose-700 px-2 py-0.5 rounded-full font-mono">
                  Vodacom / MTN / Telkom
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                You can link any standard cellular number to an extension. When someone calls the Durban <strong>031 940 8800</strong> landline, the PBX can <strong>dual-ring your Vodacom mobile simultaneously (Mobile Twinning)</strong> or divert calls when unanswered.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {extensions.find((e) => e.mobileNumber?.includes('076 101 5283')) ? (
              <button
                id="link-sello-vodacom-quick-btn"
                onClick={() => {
                  const sello = extensions.find((e) => e.mobileNumber?.includes('076 101 5283'));
                  if (sello) setSelectedAgentForMobile(sello);
                }}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Configure 076 101 5283 (Sello Ncwani)</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  const targetAgent = extensions[1] || extensions[0];
                  setSelectedAgentForMobile(targetAgent);
                }}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Link a Mobile Number</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Steps Explainer Pills */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-xs">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-1">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center font-mono text-[10px]">1</span>
              <span>1. Mobile Twinning (Dual Ring)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Incoming 031 landline calls ring your softphone AND your Vodacom cell at the same moment.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-1">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-mono text-[10px]">2</span>
              <span>2. Outbound 031 Identity Masking</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Make outbound calls from your mobile; clients see the official Durban 031 office number.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-1">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-mono text-[10px]">3</span>
              <span>3. Vodacom Trunk Interconnect</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Zero roaming friction: cellular calls connect through the Vodacom Business SIP trunk.
            </p>
          </div>
        </div>
      </div>

      {/* Agents Directory Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>Configured Office Agent Accounts</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {extensions.length}
            </span>
          </h3>
          <span className="text-xs text-slate-400">
            Click &quot;Launch Agent Softphone&quot; to test dial or receive forwarded calls
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {extensions.map((ext) => {
            const isAvailable = ext.status === 'available';
            const isInCall = ext.status === 'in_call';
            const isSwitchboardTarget =
              forwardingConfig.enabled && forwardingConfig.targetNumber === ext.extensionNumber;

            return (
              <div
                key={ext.id}
                id={`agent-card-${ext.extensionNumber}`}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 text-white transition space-y-4 flex flex-col justify-between shadow-lg"
              >
                {/* Header info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-bold text-sm ${
                          isAvailable
                            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                            : isInCall
                            ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {ext.extensionNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-white">{ext.name}</h4>
                          {ext.isCurrentUser && (
                            <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1 py-0.2 rounded">
                              Main
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">{ext.department}</div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isAvailable
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : isInCall
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {ext.status.replace('_', ' ')}
                      </span>
                      {isSwitchboardTarget && (
                        <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.2 rounded font-bold animate-pulse">
                          FWD Active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Role &amp; Device:</span>
                      <span className="text-slate-200 font-medium flex items-center gap-1">
                        {ext.deviceType === 'PWA Mobile (iOS/Android)' ? (
                          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <Laptop className="w-3.5 h-3.5 text-blue-400" />
                        )}
                        <span>{ext.role || 'Agent'} • {ext.deviceType || 'PWA Softphone'}</span>
                      </span>
                    </div>

                    {/* Linked Mobile Phone & Carrier info */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-rose-400" />
                        <span>Linked Mobile:</span>
                      </span>
                      {ext.mobileNumber ? (
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="text-white font-semibold">{ext.mobileNumber}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full border ${
                            ext.mobileCarrier === 'Vodacom' || ext.mobileNumber.includes('076') || ext.mobileNumber.includes('082')
                              ? 'bg-rose-950 text-rose-300 border-rose-800'
                              : 'bg-amber-950 text-amber-300 border-amber-800'
                          }`}>
                            {ext.mobileCarrier || (ext.mobileNumber.includes('076') ? 'Vodacom' : 'Mobile')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px] italic">Not linked</span>
                      )}
                    </div>

                    {ext.mobileTwinningMode && ext.mobileTwinningMode !== 'off' && (
                      <div className="flex items-center justify-between text-[10px] bg-rose-950/40 border border-rose-800/40 px-2 py-1 rounded-lg text-rose-300">
                        <span className="font-semibold">⚡ Mobile Twinning:</span>
                        <span className="uppercase font-mono">
                          {ext.mobileTwinningMode === 'simultaneous' ? 'Dual-Ring Active' : 'Follow-Me Overflow'}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Outbound Caller ID:</span>
                      <span className="font-mono text-cyan-300 font-medium">
                        {ext.outboundCli || office031.mainNumber}
                      </span>
                    </div>

                    {ext.directDid && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Direct Inward DID:</span>
                        <span className="font-mono text-slate-300">{ext.directDid}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">WebRTC SIP User:</span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        {ext.webRtcUsername || `ext${ext.extensionNumber}`}
                      </span>
                    </div>
                  </div>

                  {ext.currentCallWith && (
                    <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-700/40 text-xs text-rose-300 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                      <span className="truncate">In call with: {ext.currentCallWith}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  {/* Primary: Launch Agent Softphone */}
                  <button
                    id={`launch-agent-softphone-${ext.extensionNumber}`}
                    onClick={() => onSelectAgentSoftphone(ext.extensionNumber)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-2 px-3 rounded-xl transition cursor-pointer text-xs shadow"
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    <span>Launch Web Softphone (Ext {ext.extensionNumber})</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* QR Code / Mobile Invite */}
                    <button
                      id={`invite-agent-${ext.extensionNumber}`}
                      onClick={() => setSelectedAgentForQr(ext)}
                      className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white p-2 rounded-xl transition cursor-pointer border border-slate-700 text-[11px]"
                      title="Generate Mobile PWA QR Code & Invite Link for iOS/Android"
                    >
                      <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Mobile Invite</span>
                    </button>

                    {/* Quick Set Forwarding from Switchboard */}
                    <button
                      id={`fwd-agent-${ext.extensionNumber}`}
                      onClick={() => handleQuickSetForwarding(ext)}
                      className={`flex items-center justify-center gap-1.5 p-2 rounded-xl transition cursor-pointer text-[11px] font-medium border ${
                        isSwitchboardTarget
                          ? 'bg-amber-950 text-amber-300 border-amber-600'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                      }`}
                      title="Set Switchboard to automatically forward incoming Durban calls to this agent"
                    >
                      <PhoneForwarded className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isSwitchboardTarget ? 'FWD Active' : 'Forward Calls'}</span>
                    </button>
                  </div>

                  {/* Dedicated Link Mobile Button */}
                  <button
                    id={`link-mobile-btn-${ext.extensionNumber}`}
                    onClick={() => setSelectedAgentForMobile(ext)}
                    className={`w-full flex items-center justify-center gap-1.5 p-2 rounded-xl transition cursor-pointer text-[11px] font-medium border ${
                      ext.mobileNumber?.includes('076') || ext.mobileCarrier === 'Vodacom'
                        ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border-rose-800'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                    }`}
                    title="Link mobile phone number (Vodacom, MTN, etc.) for dual-ring Mobile Twinning"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-rose-400" />
                    <span>
                      {ext.mobileNumber ? `Mobile Twinning (${ext.mobileNumber})` : 'Link Mobile Number (076...)'}
                    </span>
                  </button>

                  {!ext.isCurrentUser && (
                    <div className="flex items-center justify-end pt-1">
                      <button
                        id={`delete-agent-${ext.extensionNumber}`}
                        onClick={() => onDeleteExtension(ext.id)}
                        className="text-[11px] text-slate-500 hover:text-rose-400 flex items-center gap-1 transition cursor-pointer"
                        title="Remove Agent Extension"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove Extension</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ADD AGENT EXTENSION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border-2 border-cyan-500/50 p-6 shadow-2xl space-y-5 text-white max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Add Office Agent Extension</h3>
                  <p className="text-xs text-slate-400">
                    Provision a user account with PWA softphone credentials and 031 outbound routing
                  </p>
                </div>
              </div>

              <button
                id="close-add-modal-btn"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Agent Name */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">Full Agent Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nomusa Khumalo"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-white outline-none font-medium"
                  />
                </div>

                {/* Extension Number */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">Extension Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 107"
                    value={formExtNumber}
                    onChange={(e) => setFormExtNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-white outline-none font-mono"
                  />
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">Department</label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-white outline-none cursor-pointer"
                  >
                    <option value="Commercial & Sales">Commercial &amp; Sales</option>
                    <option value="Harbour Logistics & Pier">Harbour Logistics &amp; Pier</option>
                    <option value="Customer Support Desk">Customer Support Desk</option>
                    <option value="Financial Ops & Billing">Financial Ops &amp; Billing</option>
                    <option value="Field Engineering & NOC">Field Engineering &amp; NOC</option>
                    <option value="Executive Management">Executive Management</option>
                  </select>
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">Agent Role</label>
                  <select
                    value={formRole}
                    onChange={(e) =>
                      setFormRole(e.target.value as 'Agent' | 'Manager' | 'Supervisor' | 'Executive')
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-white outline-none cursor-pointer"
                  >
                    <option value="Agent">Office Agent</option>
                    <option value="Manager">Department Manager</option>
                    <option value="Supervisor">Call Supervisor</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">Corporate Email</label>
                  <input
                    type="email"
                    placeholder="agent@gexpbx.co.za"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-white outline-none"
                  />
                </div>

                {/* Mobile */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold block">Personal/Work Mobile</label>
                  <input
                    type="tel"
                    placeholder="+27 82 123 4567"
                    value={formMobile}
                    onChange={(e) => setFormMobile(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-white outline-none font-mono"
                  />
                </div>
              </div>

              {/* Outbound Calling Configuration */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-xs">Allow Outbound Calling</div>
                    <div className="text-[11px] text-slate-400">
                      Enables the agent to place outbound telephone calls to South African landlines and mobiles
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formAllowOutbound}
                    onChange={(e) => setFormAllowOutbound(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 cursor-pointer accent-cyan-500"
                  />
                </div>

                {formAllowOutbound && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <label className="text-slate-300 font-semibold block">
                      Outbound Calling Line Identity (CLI presented to recipient):
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-700/80 cursor-pointer hover:border-cyan-500">
                        <input
                          type="radio"
                          name="cliChoice"
                          checked={formCliType === 'main_031'}
                          onChange={() => setFormCliType('main_031')}
                          className="text-cyan-500 accent-cyan-500"
                        />
                        <div>
                          <div className="font-bold text-white text-xs">Main Durban Office DID</div>
                          <div className="text-[10px] font-mono text-cyan-400">
                            {office031.mainNumber}
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-700/80 cursor-pointer hover:border-cyan-500">
                        <input
                          type="radio"
                          name="cliChoice"
                          checked={formCliType === 'direct_did'}
                          onChange={() => setFormCliType('direct_did')}
                          className="text-cyan-500 accent-cyan-500"
                        />
                        <div>
                          <div className="font-bold text-white text-xs">Direct Agent DID</div>
                          <div className="text-[10px] font-mono text-slate-400">
                            031 940 {8800 + (parseInt(formExtNumber, 10) || 107) - 100}
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Device Profile */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Primary Device Profile</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormDeviceType('PWA Mobile (iOS/Android)')}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition flex items-center gap-2.5 ${
                      formDeviceType === 'PWA Mobile (iOS/Android)'
                        ? 'bg-cyan-950/80 border-cyan-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-cyan-400 shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-white">PWA Mobile Softphone</div>
                      <div className="text-[10px] text-slate-400">iPhone Safari &amp; Android</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormDeviceType('PWA Desktop')}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition flex items-center gap-2.5 ${
                      formDeviceType === 'PWA Desktop'
                        ? 'bg-cyan-950/80 border-cyan-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Laptop className="w-5 h-5 text-blue-400 shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-white">PWA Desktop Softphone</div>
                      <div className="text-[10px] text-slate-400">Chrome, Mac &amp; Windows</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-create-agent-btn"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg transition cursor-pointer"
                >
                  Save &amp; Provision Extension
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOBILE PWA ONBOARDING & QR CODE MODAL */}
      {selectedAgentForQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border-2 border-cyan-500/50 p-6 shadow-2xl space-y-5 text-white max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    PWA Softphone Mobile Invite for {selectedAgentForQr.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Extension {selectedAgentForQr.extensionNumber} • Durban 031 Outbound Ready
                  </p>
                </div>
              </div>

              <button
                id="close-qr-modal-btn"
                onClick={() => setSelectedAgentForQr(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Code Presentation Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4">
              {/* Stylized QR Matrix Pattern */}
              <div className="p-4 bg-white rounded-2xl shadow-xl">
                <svg
                  viewBox="0 0 160 160"
                  className="w-44 h-44 text-slate-950"
                  fill="currentColor"
                >
                  {/* Outer corner markers */}
                  <rect x="10" y="10" width="40" height="40" rx="6" fill="black" />
                  <rect x="16" y="16" width="28" height="28" rx="3" fill="white" />
                  <rect x="22" y="22" width="16" height="16" rx="2" fill="black" />

                  <rect x="110" y="10" width="40" height="40" rx="6" fill="black" />
                  <rect x="116" y="16" width="28" height="28" rx="3" fill="white" />
                  <rect x="122" y="22" width="16" height="16" rx="2" fill="black" />

                  <rect x="10" y="110" width="40" height="40" rx="6" fill="black" />
                  <rect x="16" y="116" width="28" height="28" rx="3" fill="white" />
                  <rect x="22" y="122" width="16" height="16" rx="2" fill="black" />

                  {/* QR Data Grid Dots */}
                  <rect x="58" y="15" width="8" height="8" fill="black" />
                  <rect x="74" y="15" width="8" height="8" fill="black" />
                  <rect x="90" y="15" width="8" height="8" fill="black" />
                  <rect x="66" y="28" width="8" height="8" fill="black" />
                  <rect x="82" y="28" width="8" height="8" fill="black" />

                  <rect x="15" y="58" width="8" height="8" fill="black" />
                  <rect x="28" y="66" width="8" height="8" fill="black" />
                  <rect x="38" y="76" width="8" height="8" fill="black" />

                  {/* Center PBX branding emblem */}
                  <rect x="60" y="60" width="40" height="40" rx="8" fill="#020617" />
                  <text
                    x="80"
                    y="84"
                    fill="#38bdf8"
                    fontSize="13"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    031
                  </text>

                  {/* Right side data dots */}
                  <rect x="115" y="58" width="8" height="8" fill="black" />
                  <rect x="128" y="68" width="8" height="8" fill="black" />
                  <rect x="140" y="78" width="8" height="8" fill="black" />

                  {/* Bottom data dots */}
                  <rect x="58" y="115" width="8" height="8" fill="black" />
                  <rect x="74" y="128" width="8" height="8" fill="black" />
                  <rect x="90" y="115" width="8" height="8" fill="black" />
                  <rect x="110" y="110" width="12" height="12" fill="black" />
                  <rect x="130" y="130" width="14" height="14" fill="black" />
                </svg>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-bold text-white">Scan with Mobile Camera</div>
                <p className="text-xs text-slate-400">
                  Instantly provisions <strong>Ext {selectedAgentForQr.extensionNumber}</strong> on iPhone or Android
                </p>
              </div>

              {/* Direct Link Copy */}
              <div className="w-full flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/?ext=${selectedAgentForQr.extensionNumber}#softphone`}
                  className="bg-transparent text-slate-300 font-mono text-[11px] flex-1 outline-none truncate"
                />
                <button
                  id="copy-agent-link-btn"
                  onClick={() => handleCopyAgentLink(selectedAgentForQr)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Platform Instructions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <Apple className="w-4 h-4 text-cyan-400" />
                  <span>iPhone / iPad Setup</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Open link in Safari, tap <strong>Share</strong> icon, and choose{' '}
                  <strong>&quot;Add to Home Screen&quot;</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Android Setup</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Open in Chrome, tap <strong>Menu (⋮)</strong>, and tap <strong>&quot;Install App&quot;</strong>.
                </p>
              </div>
            </div>

            {/* Launch Now shortcut */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                id="test-as-agent-btn"
                onClick={() => {
                  onSelectAgentSoftphone(selectedAgentForQr.extensionNumber);
                  setSelectedAgentForQr(null);
                }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer shadow"
              >
                <Headphones className="w-4 h-4" />
                <span>Open &amp; Test as Ext {selectedAgentForQr.extensionNumber} ({selectedAgentForQr.name})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE PHONE LINKING & TWINNING MODAL */}
      {selectedAgentForMobile && (
        <MobileLinkingModal
          isOpen={!!selectedAgentForMobile}
          onClose={() => setSelectedAgentForMobile(null)}
          agent={selectedAgentForMobile}
          office031={office031}
          onSave={(agentId, updates) => {
            onUpdateExtension(agentId, updates);
          }}
          onTestMobileCall={(num, name) => {
            onUpdateForwarding({
              enabled: true,
              type: 'unconditional',
              targetNumber: num,
              targetName: `${name} (Vodacom Mobile ${num})`,
            });
          }}
        />
      )}
    </div>
  );
};
