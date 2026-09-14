import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  PhoneIncoming,
  PhoneForwarded,
  Mic,
  MicOff,
  Pause,
  Play,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  ArrowRightLeft,
  Square,
  Voicemail,
  CheckCircle2,
  BellRing,
  ShieldCheck,
  Smartphone,
  Apple,
  Clock,
  User,
  Users,
  Radio,
  Share2,
  HelpCircle,
  Delete,
  Hash,
  Asterisk,
  BookUser,
  Star,
  Plus,
  Search,
} from 'lucide-react';
import { ActiveCall, CallLogItem, Extension, Office031Config, LocalProvider, PhoneContact } from '../types';
import { audioEngine } from '../utils/audioEngine';
import { PWAInstallButton } from './PWAInstallButton';
import { PhonebookDrawer } from './PhonebookDrawer';
import { isContactPickerSupported } from '../utils/contactBookHelper';

interface AgentSoftphoneViewProps {
  currentAgent: Extension;
  allAgents: Extension[];
  onSwitchAgent: (extNumber: string) => void;
  office031: Office031Config;
  primaryProvider: LocalProvider;
  onTransferToSwitchboard: () => void;
  // External triggers or state
  forwardedCallFromSwitchboard?: ActiveCall | null;
  onAcceptForwardedCall?: () => void;
  onRejectForwardedCall?: () => void;
  // Device Contacts & Phonebook integration
  phoneContacts?: PhoneContact[];
  onAddContact?: (c: PhoneContact) => void;
  onAddBatchContacts?: (cs: PhoneContact[]) => void;
  onDeleteContact?: (id: string) => void;
  onToggleFavoriteContact?: (id: string) => void;
}

export const AgentSoftphoneView: React.FC<AgentSoftphoneViewProps> = ({
  currentAgent,
  allAgents,
  onSwitchAgent,
  office031,
  primaryProvider,
  onTransferToSwitchboard,
  forwardedCallFromSwitchboard,
  onAcceptForwardedCall,
  onRejectForwardedCall,
  phoneContacts = [],
  onAddContact = (_c: PhoneContact) => {},
  onAddBatchContacts = (_cs: PhoneContact[]) => {},
  onDeleteContact = (_id: string) => {},
  onToggleFavoriteContact = (_id: string) => {},
}) => {
  // Dialpad state
  const [dialNumber, setDialNumber] = useState('');
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<ActiveCall | null>(null);

  // Phonebook Modal & Right Panel Tab
  const [isPhonebookOpen, setIsPhonebookOpen] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<'contacts' | 'directory' | 'history'>('contacts');

  // Agent Status
  const [agentStatus, setAgentStatus] = useState<'available' | 'dnd' | 'away'>('available');

  // Audio & Mic
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeCliChoice, setActiveCliChoice] = useState<'office_031' | 'mobile'>('office_031');

  // Transfer Dropdown State
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Agent's local call logs
  const [agentLogs, setAgentLogs] = useState<CallLogItem[]>([
    {
      id: 'alog-1',
      direction: 'outbound',
      number: '031 361 8800',
      name: 'Transnet Durban Harbour Ops',
      timestamp: '14 mins ago',
      durationSeconds: 142,
      status: 'answered',
      lineId: 'line1',
      providerName: `CLI: ${currentAgent.outboundCli || office031.mainNumber}`,
    },
    {
      id: 'alog-2',
      direction: 'inbound',
      number: '082 555 1010',
      name: 'Forwarded via Switchboard Ext 101',
      timestamp: '1 hour ago',
      durationSeconds: 285,
      status: 'transferred',
      lineId: 'line1',
      providerName: 'Inbound 031 Transfer',
    },
  ]);

  // Duration timer
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize incoming forwarded call from switchboard if present
  useEffect(() => {
    if (forwardedCallFromSwitchboard && !incomingCall && !activeCall) {
      setIncomingCall(forwardedCallFromSwitchboard);
      audioEngine.startRingtone();
    }
  }, [forwardedCallFromSwitchboard]);

  // Active call duration counter
  useEffect(() => {
    if (activeCall && activeCall.state === 'connected') {
      durationTimerRef.current = setInterval(() => {
        setActiveCall((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            durationSeconds: prev.durationSeconds + 1,
          };
        });
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }

    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [activeCall?.state]);

  // Handle number click with DTMF tone
  const handleDigit = (digit: string) => {
    audioEngine.playDtmf(digit);
    setDialNumber((prev) => prev + digit);
  };

  const handleBackspace = () => {
    setDialNumber((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setDialNumber('');
  };

  // Dial out as Office Agent
  const handleDialOut = (customNum?: string) => {
    const num = (customNum || dialNumber).trim();
    if (!num) return;

    if (activeCall) {
      handleEndCall();
    }

    // Match name from agents or phone contacts or regional contacts
    const matchedAgent = allAgents.find(
      (a) => a.extensionNumber === num || num.endsWith(a.extensionNumber)
    );
    const matchedContact = phoneContacts.find(
      (c) =>
        c.phoneNumber.replace(/[^\d]/g, '') === num.replace(/[^\d]/g, '') ||
        (num.length >= 7 && c.phoneNumber.includes(num))
    );
    const remoteName = matchedAgent
      ? `${matchedAgent.name} (Ext ${matchedAgent.extensionNumber})`
      : matchedContact
      ? `${matchedContact.name}${matchedContact.company ? ` (${matchedContact.company})` : ''}`
      : num.startsWith('031')
      ? 'Durban Regional Metro'
      : num.startsWith('082') || num.startsWith('083') || num.startsWith('071')
      ? 'SA Mobile Client'
      : num.startsWith('*')
      ? 'PBX Feature System'
      : 'Outbound Client';

    const newCall: ActiveCall = {
      id: `acall-${Date.now()}`,
      lineId: 'line1',
      remoteNumber: num,
      remoteName,
      direction: 'outbound',
      state: 'dialing',
      startTime: Date.now(),
      durationSeconds: 0,
      isMuted: false,
      isRecording: false,
      providerId: primaryProvider.id,
    };

    setActiveCall(newCall);
    audioEngine.startRingback();

    // Connect after 1.6s
    setTimeout(() => {
      audioEngine.stopRingback();
      audioEngine.playConnectChime();
      setActiveCall((prev) => {
        if (!prev || prev.id !== newCall.id) return prev;
        return {
          ...prev,
          state: 'connected',
        };
      });
    }, 1600);
  };

  // Answer incoming / forwarded call
  const handleAnswer = () => {
    if (!incomingCall) return;

    audioEngine.stopRingtone();
    audioEngine.playConnectChime();

    setActiveCall({
      ...incomingCall,
      state: 'connected',
      startTime: Date.now(),
      durationSeconds: 0,
    });
    setIncomingCall(null);

    if (onAcceptForwardedCall) {
      onAcceptForwardedCall();
    }
  };

  // Reject call
  const handleReject = () => {
    if (!incomingCall) return;

    audioEngine.stopRingtone();
    audioEngine.playDisconnectTone();

    setAgentLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        direction: 'inbound',
        number: incomingCall.remoteNumber,
        name: incomingCall.remoteName,
        timestamp: 'Just now',
        durationSeconds: 0,
        status: 'rejected',
        lineId: 'line1',
        providerName: 'Forwarded Call Rejected',
      },
      ...prev,
    ]);

    setIncomingCall(null);
    if (onRejectForwardedCall) {
      onRejectForwardedCall();
    }
  };

  // End Call
  const handleEndCall = () => {
    if (!activeCall) return;

    audioEngine.stopRingback();
    audioEngine.stopHoldMusic();
    audioEngine.playDisconnectTone();

    setAgentLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        direction: activeCall.direction,
        number: activeCall.remoteNumber,
        name: activeCall.remoteName,
        timestamp: 'Just now',
        durationSeconds: activeCall.durationSeconds,
        status: 'answered',
        lineId: 'line1',
        providerName: `CLI: ${currentAgent.outboundCli || office031.mainNumber}`,
        recordingAvailable: isRecording,
      },
      ...prev,
    ]);

    setActiveCall(null);
    setIsOnHold(false);
    setIsMuted(false);
    setIsRecording(false);
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioEngine.playToneSequence(nextMute ? [400, 300] : [300, 450], 80);
  };

  // Toggle Hold
  const handleToggleHold = () => {
    if (!activeCall) return;
    const nextHold = !isOnHold;
    setIsOnHold(nextHold);

    if (nextHold) {
      setActiveCall({ ...activeCall, state: 'on_hold' });
      audioEngine.startHoldMusic();
    } else {
      setActiveCall({ ...activeCall, state: 'connected' });
      audioEngine.stopHoldMusic();
      audioEngine.playConnectChime();
    }
  };

  // Toggle Record
  const handleToggleRecord = () => {
    const nextRec = !isRecording;
    setIsRecording(nextRec);
    audioEngine.playToneSequence(nextRec ? [500, 750] : [750, 500], 90);
  };

  // Transfer Call to another Extension
  const handleTransferTo = (ext: Extension) => {
    if (!activeCall) return;

    audioEngine.stopHoldMusic();
    audioEngine.playToneSequence([350, 440, 580], 100);

    setAgentLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        direction: activeCall.direction,
        number: activeCall.remoteNumber,
        name: activeCall.remoteName,
        timestamp: 'Just now',
        durationSeconds: activeCall.durationSeconds,
        status: 'transferred',
        lineId: 'line1',
        providerName: `Transferred to ${ext.name} (Ext ${ext.extensionNumber})`,
      },
      ...prev,
    ]);

    setActiveCall(null);
    setShowTransferModal(false);
  };

  // Quick simulate incoming call to this agent
  const handleSimulateCallToAgent = () => {
    const newInc: ActiveCall = {
      id: `agent-inc-${Date.now()}`,
      lineId: 'line1',
      remoteNumber: '031 361 8800',
      remoteName: 'Transnet Port Pier 1 (Forwarded from Switchboard)',
      direction: 'inbound',
      state: 'ringing',
      startTime: Date.now(),
      durationSeconds: 0,
      isMuted: false,
      isRecording: false,
      providerId: primaryProvider.id,
    };

    setIncomingCall(newInc);
    audioEngine.startRingtone();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Agent Switcher & Status Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center font-mono font-bold text-cyan-300 text-lg">
            {currentAgent.extensionNumber}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">{currentAgent.name}</h3>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-semibold uppercase">
                {currentAgent.role || 'Agent'}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
              <span>{currentAgent.department}</span>
              <span>•</span>
              {currentAgent.mobileNumber ? (
                <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800 text-[11px]">
                  <Smartphone className="w-3 h-3 text-rose-400" />
                  <span className="text-slate-300 font-mono font-medium">{currentAgent.mobileNumber}</span>
                  <span className="text-[9px] bg-rose-950 text-rose-300 border border-rose-800 px-1 rounded">
                    {currentAgent.mobileCarrier || 'Vodacom'}
                  </span>
                  {currentAgent.mobileTwinningMode && currentAgent.mobileTwinningMode !== 'off' && (
                    <span className="text-[9px] text-amber-400 font-medium">⚡ Twinning</span>
                  )}
                </div>
              ) : (
                <span className="text-slate-500 italic">No mobile linked</span>
              )}
            </div>

            {/* Outbound CLI Masking Selector */}
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px]">
              <span className="text-slate-400 font-medium">Outbound CLI:</span>
              <button
                type="button"
                onClick={() => setActiveCliChoice('office_031')}
                className={`px-2 py-0.5 rounded-md font-mono text-[10px] transition cursor-pointer border ${
                  activeCliChoice === 'office_031'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title="Mask caller ID with Durban 031 company number"
              >
                🏢 {office031.mainNumber} (Office)
              </button>

              {currentAgent.mobileNumber && (
                <button
                  type="button"
                  onClick={() => setActiveCliChoice('mobile')}
                  className={`px-2 py-0.5 rounded-md font-mono text-[10px] transition cursor-pointer border ${
                    activeCliChoice === 'mobile'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  title="Present agent direct Vodacom mobile number"
                >
                  📱 {currentAgent.mobileNumber} (Direct SIM)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Switch Agent Dropdown & PWA Install */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400">Agent:</span>
            <select
              value={currentAgent.extensionNumber}
              onChange={(e) => onSwitchAgent(e.target.value)}
              className="bg-transparent font-bold text-cyan-300 outline-none cursor-pointer"
            >
              {allAgents.map((a) => (
                <option key={a.id} value={a.extensionNumber} className="bg-slate-900 text-white">
                  Ext {a.extensionNumber} - {a.name}
                </option>
              ))}
            </select>
          </div>

          <button
            id="agent-test-incoming-btn"
            onClick={handleSimulateCallToAgent}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border border-slate-700"
            title="Simulate Switchboard Forwarding a Call to this Agent"
          >
            <PhoneForwarded className="w-3.5 h-3.5 text-amber-400" />
            <span>Test Inbound FWD</span>
          </button>

          <PWAInstallButton variant="compact" label="Install PWA" />
        </div>
      </div>

      {/* Incoming Call Notification Banner */}
      {incomingCall && (
        <div
          id="agent-incoming-call-box"
          className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-emerald-500 rounded-3xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl animate-pulse"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 animate-bounce">
              <PhoneIncoming className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                  Forwarded Call
                </span>
                <span className="text-xs text-emerald-300 font-mono">
                  Durban 031 Line (Ext {currentAgent.extensionNumber})
                </span>
              </div>
              <h4 className="text-xl font-bold text-white mt-0.5">{incomingCall.remoteName}</h4>
              <p className="text-xs font-mono text-emerald-400">{incomingCall.remoteNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="agent-answer-btn"
              onClick={handleAnswer}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg transition cursor-pointer text-sm"
            >
              <Phone className="w-4 h-4" />
              <span>Answer</span>
            </button>
            <button
              id="agent-reject-btn"
              onClick={handleReject}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2.5 rounded-xl shadow transition cursor-pointer text-sm"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Decline</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Softphone Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left / Center: Softphone Keypad and Screen (7 cols) */}
        <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl text-white">
          {/* OLED Softphone Display */}
          <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 space-y-2 relative overflow-hidden shadow-inner">
            <div className="flex items-center justify-between text-[11px] font-mono border-b border-slate-800/80 pb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-700/50 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                  GEX PBX
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    activeCall
                      ? 'bg-emerald-400 animate-ping'
                      : 'bg-cyan-400 animate-pulse'
                  }`}
                />
                <span className="font-bold text-cyan-400 uppercase">
                  {activeCall
                    ? activeCall.state === 'on_hold'
                      ? 'ON HOLD'
                      : 'CALL ACTIVE'
                    : 'READY TO CALL'}
                </span>
              </div>
              <span className="text-slate-400">CLI: {currentAgent.outboundCli}</span>
            </div>

            {/* Dial / Connected Number Display */}
            <div className="py-2">
              {activeCall ? (
                <div className="space-y-1">
                  <div className="text-xs text-slate-400">Connected to:</div>
                  <div className="text-2xl font-bold text-white truncate">
                    {activeCall.remoteName}
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-cyan-300">{activeCall.remoteNumber}</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      {Math.floor(activeCall.durationSeconds / 60)
                        .toString()
                        .padStart(2, '0')}
                      :
                      {(activeCall.durationSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <input
                    type="text"
                    id="agent-dial-input"
                    value={dialNumber}
                    onChange={(e) => setDialNumber(e.target.value)}
                    placeholder="Enter phone number or ext..."
                    className="w-full bg-transparent text-2xl font-mono font-bold text-white outline-none tracking-wider placeholder:text-slate-600 placeholder:text-base"
                  />
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Type number or search contacts</span>
                    {dialNumber && (
                      <button
                        onClick={handleClear}
                        className="text-slate-400 hover:text-white transition cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Predictive contact matching preview */}
                  {!activeCall && dialNumber && (
                    (() => {
                      const matched = phoneContacts.filter((c) =>
                        c.phoneNumber.replace(/[^\d]/g, '').includes(dialNumber.replace(/[^\d]/g, '')) ||
                        c.name.toLowerCase().includes(dialNumber.toLowerCase())
                      ).slice(0, 2);
                      if (matched.length === 0) return null;
                      return (
                        <div className="pt-1.5 space-y-1">
                          {matched.map((ct) => (
                            <div
                              key={ct.id}
                              onClick={() => {
                                setDialNumber(ct.phoneNumber);
                                handleDialOut(ct.phoneNumber);
                              }}
                              className="flex items-center justify-between p-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-xs cursor-pointer transition"
                              title="Click to dial this contact"
                            >
                              <div className="flex items-center gap-2">
                                <BookUser className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                <span className="font-bold text-white truncate">{ct.name}</span>
                                {ct.company && <span className="text-[10px] text-slate-400 hidden sm:inline">({ct.company})</span>}
                              </div>
                              <div className="flex items-center gap-1.5 text-cyan-300 font-mono text-[11px] shrink-0">
                                <span>{ct.phoneNumber}</span>
                                <Phone className="w-3 h-3 text-emerald-400" />
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Keypad Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { digit: '1', letters: '' },
              { digit: '2', letters: 'ABC' },
              { digit: '3', letters: 'DEF' },
              { digit: '4', letters: 'GHI' },
              { digit: '5', letters: 'JKL' },
              { digit: '6', letters: 'MNO' },
              { digit: '7', letters: 'PQRS' },
              { digit: '8', letters: 'TUV' },
              { digit: '9', letters: 'WXYZ' },
              { digit: '*', letters: '' },
              { digit: '0', letters: '+' },
              { digit: '#', letters: '' },
            ].map((btn) => (
              <button
                key={btn.digit}
                id={`agent-key-${btn.digit}`}
                onClick={() => handleDigit(btn.digit)}
                className="h-14 rounded-2xl bg-slate-950 hover:bg-slate-800 active:bg-cyan-950 active:border-cyan-500 border border-slate-800 transition cursor-pointer flex flex-col items-center justify-center text-white shadow group select-none"
              >
                <span className="text-xl font-mono font-bold group-hover:text-cyan-300">
                  {btn.digit}
                </span>
                {btn.letters && (
                  <span className="text-[9px] font-semibold text-slate-500 group-hover:text-slate-300 -mt-1 tracking-widest">
                    {btn.letters}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Action Row */}
          <div className="space-y-3">
            {activeCall ? (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2">
                  {/* Mute */}
                  <button
                    id="agent-mute-btn"
                    onClick={handleToggleMute}
                    className={`py-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-semibold transition cursor-pointer ${
                      isMuted
                        ? 'bg-rose-950/80 border-rose-600 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4" />}
                    <span>{isMuted ? 'Muted' : 'Mute'}</span>
                  </button>

                  {/* Hold */}
                  <button
                    id="agent-hold-btn"
                    onClick={handleToggleHold}
                    className={`py-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-semibold transition cursor-pointer ${
                      isOnHold
                        ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isOnHold ? <Play className="w-4 h-4 text-amber-400" /> : <Pause className="w-4 h-4" />}
                    <span>{isOnHold ? 'Resume' : 'Hold'}</span>
                  </button>

                  {/* Transfer */}
                  <button
                    id="agent-transfer-btn"
                    onClick={() => setShowTransferModal(true)}
                    className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex flex-col items-center justify-center gap-1 text-xs font-semibold transition cursor-pointer"
                  >
                    <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
                    <span>Transfer</span>
                  </button>

                  {/* Record */}
                  <button
                    id="agent-record-btn"
                    onClick={handleToggleRecord}
                    className={`py-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-semibold transition cursor-pointer ${
                      isRecording
                        ? 'bg-rose-950/80 border-rose-600 text-rose-300 animate-pulse'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full ${
                        isRecording ? 'bg-rose-500' : 'bg-slate-500'
                      }`}
                    />
                    <span>{isRecording ? 'Rec ON' : 'Record'}</span>
                  </button>
                </div>

                {/* Hang Up Button */}
                <button
                  id="agent-end-call-btn"
                  onClick={handleEndCall}
                  className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 rounded-2xl shadow-xl transition cursor-pointer text-sm"
                >
                  <PhoneOff className="w-5 h-5" />
                  <span>End Call</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="agent-make-call-btn"
                  onClick={() => handleDialOut()}
                  disabled={!dialNumber}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm shadow-xl transition cursor-pointer ${
                    dialNumber
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  }`}
                >
                  <Phone className="w-5 h-5" />
                  <span>Place Call ({currentAgent.outboundCli || office031.mainNumber})</span>
                </button>

                {dialNumber && (
                  <button
                    onClick={handleBackspace}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                    title="Backspace"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Tabbed Panel (Contacts & Phonebook, Office Directory, Call History) */}
        <div className="md:col-span-5 space-y-4">
          {/* Tabs header */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
            <button
              id="agent-tab-contacts"
              onClick={() => setRightPanelTab('contacts')}
              className={`flex-1 py-2 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                rightPanelTab === 'contacts'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookUser className="w-3.5 h-3.5" />
              <span>Contacts</span>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.2 rounded-full">
                {phoneContacts.length}
              </span>
            </button>

            <button
              id="agent-tab-directory"
              onClick={() => setRightPanelTab('directory')}
              className={`flex-1 py-2 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                rightPanelTab === 'directory'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Directory</span>
            </button>

            <button
              id="agent-tab-history"
              onClick={() => setRightPanelTab('history')}
              className={`flex-1 py-2 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                rightPanelTab === 'history'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>History</span>
            </button>
          </div>

          {/* TAB 1: Contacts & Device Phonebook */}
          {rightPanelTab === 'contacts' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white space-y-3.5 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookUser className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Device &amp; Office Contacts
                  </h4>
                </div>
                <button
                  id="open-full-phonebook-btn"
                  onClick={() => setIsPhonebookOpen(true)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Manage / Sync</span>
                </button>
              </div>

              {/* Quick Link Device Phonebook Bar */}
              <div className="p-2.5 rounded-2xl bg-gradient-to-r from-emerald-950/70 to-teal-950/70 border border-emerald-500/40 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-emerald-300 text-[11px]">Link Native Phonebook</div>
                    <div className="text-[10px] text-slate-400 truncate">Tap to import Android/iOS contacts</div>
                  </div>
                </div>
                <button
                  id="quick-link-phonebook-btn"
                  onClick={() => setIsPhonebookOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-2.5 py-1.5 rounded-xl transition cursor-pointer shrink-0"
                >
                  Link Book
                </button>
              </div>

              {/* Contacts List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
                {phoneContacts.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    No contacts yet. Tap Link Book to import device contacts.
                  </div>
                ) : (
                  phoneContacts.slice(0, 6).map((ct) => (
                    <div
                      key={ct.id}
                      className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 flex items-center justify-between gap-2 transition"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-bold text-white text-[12px] truncate">{ct.name}</span>
                          {ct.isFavorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                          {ct.source === 'device_phonebook' && (
                            <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1 rounded font-semibold shrink-0">
                              Phone
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-cyan-300 truncate">
                          {ct.phoneNumber} {ct.company ? `• ${ct.company}` : ''}
                        </div>
                      </div>

                      <button
                        id={`quick-call-ct-${ct.id}`}
                        onClick={() => {
                          setDialNumber(ct.phoneNumber);
                          handleDialOut(ct.phoneNumber);
                        }}
                        className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shrink-0"
                        title={`Call ${ct.name} presenting 031 CLI`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {phoneContacts.length > 6 && (
                <button
                  onClick={() => setIsPhonebookOpen(true)}
                  className="w-full text-center text-xs text-cyan-400 hover:text-cyan-300 font-semibold pt-1 block cursor-pointer"
                >
                  View all {phoneContacts.length} contacts &rarr;
                </button>
              )}
            </div>
          )}

          {/* TAB 2: Office Directory */}
          {rightPanelTab === 'directory' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white space-y-3 shadow-lg">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Office Directory &amp; Hotkeys</span>
              </h4>

              <div className="space-y-2 text-xs">
                {/* Central Switchboard */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Central Switchboard</div>
                    <div className="text-[11px] font-mono text-cyan-400">Ext 101 • Operator</div>
                  </div>
                  <button
                    onClick={() => {
                      setDialNumber('101');
                      handleDialOut('101');
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white transition cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Other agents */}
                {allAgents
                  .filter((a) => a.extensionNumber !== currentAgent.extensionNumber)
                  .map((a) => (
                    <div
                      key={a.id}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-white">{a.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          Ext {a.extensionNumber} • {a.department}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setDialNumber(a.extensionNumber);
                          handleDialOut(a.extensionNumber);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white transition cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 3: Agent Call History */}
          {rightPanelTab === 'history' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Recent Calls (Ext {currentAgent.extensionNumber})</span>
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">Agent Log</span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
                {agentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-white text-[12px] truncate">{log.name}</div>
                      <div className="font-mono text-[11px] text-slate-400">
                        {log.number} • {log.timestamp}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Save to contacts if not already in phonebook */}
                      {!phoneContacts.some((c) => c.phoneNumber.includes(log.number)) && (
                        <button
                          onClick={() => {
                            onAddContact({
                              id: `ct-from-log-${Date.now()}`,
                              name: log.name || 'Caller',
                              phoneNumber: log.number,
                              category: 'Client',
                              source: 'manual',
                              isFavorite: false,
                            });
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-cyan-900/80 text-slate-400 hover:text-cyan-300 transition cursor-pointer"
                          title="Save caller to Phonebook"
                        >
                          <BookUser className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setDialNumber(log.number);
                          handleDialOut(log.number);
                        }}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition cursor-pointer"
                        title="Redial"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PWA Home Screen Guide Card */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/40 text-white space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-cyan-300">
              <Smartphone className="w-4 h-4" />
              <span>Device Phonebook &amp; PWA</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              When added to your mobile Home Screen, tap <strong>Link Book</strong> to dial client and personal contacts with seamless 1-click calling presenting your Durban <strong>{currentAgent.outboundCli || office031.mainNumber}</strong> office number.
            </p>
          </div>
        </div>
      </div>

      {/* FULL PHONEBOOK MODAL */}
      <PhonebookDrawer
        isOpen={isPhonebookOpen}
        onClose={() => setIsPhonebookOpen(false)}
        contacts={phoneContacts}
        onAddContact={onAddContact}
        onAddBatchContacts={onAddBatchContacts}
        onDeleteContact={onDeleteContact}
        onToggleFavorite={onToggleFavoriteContact}
        onCallContact={(phone, name) => {
          setDialNumber(phone);
          handleDialOut(phone);
        }}
        outboundCli={currentAgent.outboundCli || office031.mainNumber}
      />

      {/* TRANSFER MODAL */}
      {showTransferModal && activeCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border-2 border-cyan-500/50 p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-white">Transfer Active Call</h3>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Transfer caller <strong>{activeCall.remoteName}</strong> to an extension:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
              {allAgents
                .filter((a) => a.extensionNumber !== currentAgent.extensionNumber)
                .map((a) => (
                  <button
                    key={a.id}
                    onClick={() => handleTransferTo(a)}
                    className="w-full p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition cursor-pointer group"
                  >
                    <div>
                      <div className="font-bold text-white group-hover:text-cyan-300">
                        {a.name} (Ext {a.extensionNumber})
                      </div>
                      <div className="text-[11px] text-slate-400">{a.department}</div>
                    </div>
                    <span className="text-xs font-bold text-cyan-400 bg-cyan-950/80 px-2 py-1 rounded border border-cyan-800">
                      Transfer
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
