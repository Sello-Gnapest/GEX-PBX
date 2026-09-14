import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  PhoneForwarded,
  PhoneIncoming,
  Mic,
  MicOff,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Delete,
  X,
  Copy,
  Check,
  Voicemail,
  Radio,
  Clock,
  User,
  ArrowRightLeft,
  CircleDot,
  Headphones,
  Settings2,
  ChevronDown,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import {
  ActiveCall,
  CallForwardingConfig,
  Extension,
  ForwardingType,
  LineId,
  LocalProvider,
  Office031Config,
} from '../types';
import { audioEngine } from '../utils/audioEngine';

interface DialpadProps {
  activeCall: ActiveCall | null;
  incomingCall: ActiveCall | null;
  selectedLine: LineId;
  setSelectedLine: (line: LineId) => void;
  dialNumber: string;
  setDialNumber: (num: string) => void;
  onDial: (num?: string) => void;
  onAnswer: () => void;
  onReject: () => void;
  onEndCall: () => void;
  onToggleHold: () => void;
  onToggleMute: () => void;
  onToggleRecord?: () => void;
  onSendToOfficeMail: () => void;
  onTransferCall?: (extNumber: string, isAttended?: boolean) => void;
  office031: Office031Config;
  primaryProvider: LocalProvider;
  extensions: Extension[];
  forwardingConfig: CallForwardingConfig;
  onUpdateForwarding: (updates: Partial<CallForwardingConfig>) => void;
  className?: string;
  isCompact?: boolean;
}

export const Dialpad: React.FC<DialpadProps> = ({
  activeCall,
  incomingCall,
  selectedLine,
  setSelectedLine,
  dialNumber,
  setDialNumber,
  onDial,
  onAnswer,
  onReject,
  onEndCall,
  onToggleHold,
  onToggleMute,
  onToggleRecord,
  onSendToOfficeMail,
  onTransferCall,
  office031,
  primaryProvider,
  extensions,
  forwardingConfig,
  onUpdateForwarding,
  className = '',
  isCompact = false,
}) => {
  const [showForwardingDrawer, setShowForwardingDrawer] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [audioOutput, setAudioOutput] = useState<'speaker' | 'headset'>('speaker');
  const [customForwardInput, setCustomForwardInput] = useState('');
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Match dialed number with known extensions or contacts
  const matchedExtension = extensions.find(
    (e) => e.extensionNumber === dialNumber || dialNumber.endsWith(e.extensionNumber)
  );

  const keypadButtons = [
    { key: '1', letters: '', sub: '' },
    { key: '2', letters: 'ABC', sub: '' },
    { key: '3', letters: 'DEF', sub: '' },
    { key: '4', letters: 'GHI', sub: '' },
    { key: '5', letters: 'JKL', sub: '' },
    { key: '6', letters: 'MNO', sub: '' },
    { key: '7', letters: 'PQRS', sub: '' },
    { key: '8', letters: 'TUV', sub: '' },
    { key: '9', letters: 'WXYZ', sub: '' },
    { key: '*', letters: '', sub: 'Special' },
    { key: '0', letters: '+', sub: 'Hold +' },
    { key: '#', letters: '', sub: 'Send' },
  ];

  const handleKeyPress = (k: string) => {
    audioEngine.playDtmf(k);
    setDialNumber(dialNumber + k);
  };

  const handleZeroMouseDown = () => {
    const timer = setTimeout(() => {
      audioEngine.playDtmf('0');
      setDialNumber(dialNumber + '+');
    }, 600);
    setLongPressTimer(timer);
  };

  const handleZeroMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleBackspace = () => {
    setDialNumber(dialNumber.slice(0, -1));
  };

  const handleClear = () => {
    setDialNumber('');
  };

  const handleCopyNumber = () => {
    if (dialNumber) {
      navigator.clipboard.writeText(dialNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handlePasteNumber = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleaned = text.replace(/[^0-9+*#]/g, '');
      if (cleaned) {
        setDialNumber(cleaned);
      }
    } catch {
      // ignore clipboard error
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (incomingCall) {
        onAnswer();
      } else if (activeCall) {
        onEndCall();
      } else if (dialNumber) {
        onDial(dialNumber);
      }
    } else if (e.key === 'Escape') {
      setDialNumber('');
    }
  };

  const toggleForwardingType = (type: ForwardingType) => {
    if (forwardingConfig.enabled && forwardingConfig.type === type) {
      // turn off
      onUpdateForwarding({ enabled: false, type: 'off' });
      audioEngine.playToneSequence([440, 330], 120);
    } else {
      // turn on
      onUpdateForwarding({
        enabled: true,
        type,
        targetNumber: forwardingConfig.targetNumber || '102',
        targetName: forwardingConfig.targetName || 'Durban Sales Desk',
      });
      audioEngine.playToneSequence([330, 440, 550], 100);
    }
  };

  const setForwardTarget = (ext: Extension) => {
    onUpdateForwarding({
      targetNumber: ext.extensionNumber,
      targetName: `${ext.name} (Ext ${ext.extensionNumber})`,
      enabled: true,
      type: forwardingConfig.type === 'off' ? 'unconditional' : forwardingConfig.type,
    });
    audioEngine.playToneSequence([350, 440], 80);
  };

  const setForwardToVoicemail = () => {
    onUpdateForwarding({
      targetNumber: office031.voicemailNumber,
      targetName: `031 Office Mail (${office031.mainNumber})`,
      enabled: true,
      type: forwardingConfig.type === 'off' ? 'no_answer' : forwardingConfig.type,
    });
    audioEngine.playToneSequence([350, 440], 80);
  };

  const handleCustomForwardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customForwardInput.trim()) {
      onUpdateForwarding({
        targetNumber: customForwardInput.trim(),
        targetName: `External: ${customForwardInput.trim()}`,
        enabled: true,
        type: forwardingConfig.type === 'off' ? 'unconditional' : forwardingConfig.type,
      });
      setCustomForwardInput('');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isCallActive = !!activeCall;
  const isIncoming = !!incomingCall;

  return (
    <div
      id="modern-dialpad-root"
      className={`bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 flex flex-col justify-between text-white relative overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Background Accent Glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header: Line Selector & Call Forwarding Status Badge */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-950">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Switchboard Dialpad
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                <span>{primaryProvider.name}</span>
                <span>•</span>
                <span className="text-cyan-400">{office031.formattedInternational}</span>
              </p>
            </div>
          </div>

          {/* Audio output device toggle */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              id="dialpad-speaker-toggle"
              onClick={() => {
                setAudioOutput('speaker');
                audioEngine.playToneSequence([440], 60);
              }}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                audioOutput === 'speaker'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Speakerphone Output"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
            <button
              id="dialpad-headset-toggle"
              onClick={() => {
                setAudioOutput('headset');
                audioEngine.playToneSequence([550], 60);
              }}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                audioOutput === 'headset'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Operator Headset Output"
            >
              <Headphones className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Multi-Line Buttons */}
        <div className="grid grid-cols-4 gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800/80 text-xs font-mono">
          {(['line1', 'line2', 'line3', 'line4'] as LineId[]).map((line, idx) => {
            const isSelected = selectedLine === line;
            const isLineBusy = activeCall?.lineId === line || incomingCall?.lineId === line;
            return (
              <button
                key={line}
                id={`dialpad-line-select-${line}`}
                onClick={() => {
                  setSelectedLine(line);
                  audioEngine.playToneSequence([300 + idx * 80], 50);
                }}
                className={`py-1.5 px-2 rounded-xl text-center transition flex flex-col items-center justify-center gap-0.5 cursor-pointer border ${
                  isSelected
                    ? 'bg-gradient-to-b from-cyan-600 to-cyan-700 text-white border-cyan-400/50 shadow-md shadow-cyan-950'
                    : isLineBusy
                    ? 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                    : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isLineBusy
                        ? 'bg-rose-500 animate-pulse'
                        : isSelected
                        ? 'bg-emerald-300'
                        : 'bg-slate-600'
                    }`}
                  />
                  <span className="font-bold text-[11px]">L{idx + 1}</span>
                </div>
                <span className="text-[9px] uppercase tracking-tighter opacity-80">
                  {line === 'line1' ? '031 Main' : isLineBusy ? 'Active' : 'Idle'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Call Forwarding Notice Banner */}
        <div className="flex items-center justify-between gap-2 bg-slate-950 border border-slate-800 p-2 rounded-xl">
          <div className="flex items-center gap-2 overflow-hidden">
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                forwardingConfig.enabled
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <PhoneForwarded className="w-3.5 h-3.5" />
            </div>
            <div className="truncate text-xs">
              {forwardingConfig.enabled ? (
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-amber-300 uppercase text-[10px]">
                    {forwardingConfig.type === 'unconditional'
                      ? 'FWD Always:'
                      : forwardingConfig.type === 'busy'
                      ? 'FWD Busy:'
                      : 'FWD No-Ans:'}
                  </span>
                  <span className="text-white font-mono truncate">{forwardingConfig.targetName}</span>
                </div>
              ) : (
                <span className="text-slate-400 text-[11px]">Call Forwarding: Direct to Ext 101</span>
              )}
            </div>
          </div>

          <button
            id="toggle-forwarding-drawer-btn"
            onClick={() => setShowForwardingDrawer(!showForwardingDrawer)}
            className="shrink-0 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-950/70 border border-cyan-800/50 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition"
          >
            <span>{showForwardingDrawer ? 'Hide Rules' : 'Forwarding Rules'}</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform ${showForwardingDrawer ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Expandable Call Forwarding Drawer */}
        {showForwardingDrawer && (
          <div
            id="call-forwarding-panel"
            className="bg-slate-950/95 border border-amber-500/30 rounded-2xl p-3.5 space-y-3 shadow-xl animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-400 uppercase tracking-wider">
                <PhoneForwarded className="w-3.5 h-3.5" />
                <span>Call Forwarding Routing Engine</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">SA PBX Standard</span>
            </div>

            {/* Quick Toggle Forwarding Modes */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                id="cf-unconditional-btn"
                onClick={() => toggleForwardingType('unconditional')}
                className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                  forwardingConfig.enabled && forwardingConfig.type === 'unconditional'
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-amber-500/50'
                }`}
              >
                <span className="font-mono font-bold text-xs">*72 Always</span>
                <span className="text-[10px] opacity-85 leading-tight">Instant Divert</span>
              </button>

              <button
                id="cf-busy-btn"
                onClick={() => toggleForwardingType('busy')}
                className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                  forwardingConfig.enabled && forwardingConfig.type === 'busy'
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-amber-500/50'
                }`}
              >
                <span className="font-mono font-bold text-xs">*90 on Busy</span>
                <span className="text-[10px] opacity-85 leading-tight">When on Call</span>
              </button>

              <button
                id="cf-noanswer-btn"
                onClick={() => toggleForwardingType('no_answer')}
                className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                  forwardingConfig.enabled && forwardingConfig.type === 'no_answer'
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-amber-500/50'
                }`}
              >
                <span className="font-mono font-bold text-xs">*92 No-Ans</span>
                <span className="text-[10px] opacity-85 leading-tight">After 4 Rings</span>
              </button>
            </div>

            {/* Forward Destination Presets */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-400 block">
                Quick Destination Presets:
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {extensions.slice(1, 4).map((ext) => (
                  <button
                    key={ext.id}
                    onClick={() => setForwardTarget(ext)}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 p-1.5 rounded-lg text-left truncate flex items-center justify-between gap-1 transition cursor-pointer"
                  >
                    <span className="truncate">{ext.name}</span>
                    <span className="font-mono text-[10px] text-cyan-400">Ext {ext.extensionNumber}</span>
                  </button>
                ))}

                <button
                  onClick={setForwardToVoicemail}
                  className="bg-slate-900 hover:bg-amber-950/50 border border-slate-800 hover:border-amber-500/50 text-amber-300 p-1.5 rounded-lg text-left truncate flex items-center justify-between gap-1 transition cursor-pointer"
                >
                  <span className="flex items-center gap-1 truncate">
                    <Voicemail className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>031 Voicemail</span>
                  </span>
                  <span className="font-mono text-[10px] text-amber-400">*97</span>
                </button>

                {/* Quick Vodacom Mobile Forward Preset */}
                <button
                  id="fwd-vodacom-preset-btn"
                  onClick={() => {
                    const mobileAgent = extensions.find((e) => e.mobileNumber?.includes('076 101 5283')) || extensions[1];
                    const num = mobileAgent.mobileNumber || '076 101 5283';
                    onUpdateForwarding({
                      enabled: true,
                      type: forwardingConfig.type === 'off' ? 'unconditional' : forwardingConfig.type,
                      targetNumber: num,
                      targetName: `Vodacom Mobile: ${num} (${mobileAgent.name})`,
                    });
                  }}
                  className="bg-slate-900 hover:bg-rose-950/50 border border-slate-800 hover:border-rose-500/50 text-rose-300 p-1.5 rounded-lg text-left truncate flex items-center justify-between gap-1 transition cursor-pointer col-span-2"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Smartphone className="w-3 h-3 text-rose-400 shrink-0" />
                    <span>Vodacom Mobile (076 101 5283)</span>
                  </span>
                  <span className="font-mono text-[10px] text-rose-400">Cellular Divert</span>
                </button>
              </div>
            </div>

            {/* Custom Phone Number Forward Input */}
            <form onSubmit={handleCustomForwardSubmit} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customForwardInput}
                onChange={(e) => setCustomForwardInput(e.target.value)}
                placeholder="Forward to Mobile (e.g. 076 101 5283 or 082...)"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-500 font-mono"
              />
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer shrink-0"
              >
                Set FWD
              </button>
            </form>

            {/* Turn Off Forwarding Button if active */}
            {forwardingConfig.enabled && (
              <button
                id="disable-forwarding-btn"
                onClick={() => {
                  onUpdateForwarding({ enabled: false, type: 'off' });
                  audioEngine.playToneSequence([440, 330], 120);
                }}
                className="w-full bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-500 text-rose-300 text-xs py-1.5 rounded-xl font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <X className="w-3 h-3" />
                <span>Disable Call Forwarding (*73 Cancel)</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modern OLED Display Area */}
      <div
        id="dialpad-display-screen"
        className="my-4 bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-slate-800 rounded-2xl p-4 shadow-inner relative overflow-hidden"
      >
        {/* Subtle grid pattern / scanline simulation */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

        {/* Display Status Bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-2 relative z-10">
          <div className="flex items-center gap-1.5">
            {isCallActive ? (
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {activeCall.state === 'connected'
                  ? 'CALL ACTIVE'
                  : activeCall.state === 'on_hold'
                  ? 'ON HOLD'
                  : activeCall.state === 'dialing'
                  ? 'DIALING...'
                  : activeCall.state.toUpperCase()}
              </span>
            ) : isIncoming ? (
              <span className="flex items-center gap-1 text-amber-400 font-bold animate-pulse">
                <PhoneIncoming className="w-3 h-3 animate-bounce" />
                INCOMING CALL
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-400">
                <Radio className="w-3 h-3 text-cyan-400" />
                READY (SIP REGISTERED)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isCallActive && (
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-emerald-300 font-bold">
                <Clock className="w-3 h-3" />
                <span>{formatDuration(activeCall.durationSeconds)}</span>
              </div>
            )}
            <span className="text-slate-500 font-mono text-[10px]">HD AUDIO</span>
          </div>
        </div>

        {/* Active Call Remote Name / Contact Lookup */}
        {(isCallActive || isIncoming || matchedExtension) && (
          <div className="mb-1 flex items-center justify-between text-xs text-cyan-300 relative z-10">
            <div className="flex items-center gap-1.5 truncate">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold truncate">
                {isCallActive
                  ? activeCall.remoteName
                  : isIncoming
                  ? incomingCall.remoteName
                  : matchedExtension
                  ? `${matchedExtension.name} (${matchedExtension.department})`
                  : ''}
              </span>
            </div>
            {matchedExtension && (
              <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800/60 font-mono">
                Ext {matchedExtension.extensionNumber}
              </span>
            )}
          </div>
        )}

        {/* Main Number Display & Cursor */}
        <div className="flex items-center justify-between gap-2 relative z-10">
          <input
            ref={inputRef}
            type="text"
            id="dialpad-number-input"
            value={isCallActive ? activeCall.remoteNumber : dialNumber}
            onChange={(e) => {
              if (!isCallActive) {
                setDialNumber(e.target.value);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Dial number or Ext..."
            className="w-full bg-transparent text-2xl sm:text-3xl font-mono font-bold tracking-wider text-white placeholder:text-slate-600 outline-none truncate"
          />

          {/* Quick Action Display Buttons (Clear, Backspace, Copy) */}
          <div className="flex items-center gap-1 shrink-0">
            {dialNumber && !isCallActive && (
              <>
                <button
                  id="dialpad-backspace-btn"
                  onClick={handleBackspace}
                  className="p-2 text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 rounded-xl transition cursor-pointer border border-slate-800"
                  title="Backspace"
                >
                  <Delete className="w-4 h-4" />
                </button>
                <button
                  id="dialpad-clear-btn"
                  onClick={handleClear}
                  className="p-2 text-slate-400 hover:text-rose-400 bg-slate-900/80 hover:bg-slate-800 rounded-xl transition cursor-pointer border border-slate-800"
                  title="Clear"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}

            {!isCallActive && !dialNumber && (
              <button
                id="dialpad-paste-btn"
                onClick={handlePasteNumber}
                className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-cyan-300 bg-slate-900/80 hover:bg-slate-800 rounded-xl transition cursor-pointer border border-slate-800"
                title="Paste from clipboard"
              >
                Paste
              </button>
            )}

            {dialNumber && (
              <button
                id="dialpad-copy-btn"
                onClick={handleCopyNumber}
                className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-900/80 hover:bg-slate-800 rounded-xl transition cursor-pointer border border-slate-800"
                title="Copy dialed number"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Quick PBX Feature shortcuts beneath screen */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono relative z-10">
          <div className="flex items-center gap-1">
            <span className="text-slate-500">Quick:</span>
            <button
              onClick={() => {
                setDialNumber('*97');
                audioEngine.playDtmf('*');
              }}
              className="text-amber-400 hover:text-amber-300 underline cursor-pointer"
            >
              *97 Voicemail
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setDialNumber('101');
                audioEngine.playDtmf('1');
              }}
              className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              101 Switchboard
            </button>
          </div>
          <span className="text-slate-500">Durban 031 Metro</span>
        </div>
      </div>

      {/* Responsive Number Buttons Grid (3x4) */}
      <div
        id="dialpad-keys-grid"
        className="grid grid-cols-3 gap-2 sm:gap-2.5 my-2 relative z-10"
      >
        {keypadButtons.map((btn) => (
          <button
            key={btn.key}
            id={`dialpad-key-${btn.key === '*' ? 'star' : btn.key === '#' ? 'hash' : btn.key}`}
            onClick={() => handleKeyPress(btn.key)}
            onMouseDown={btn.key === '0' ? handleZeroMouseDown : undefined}
            onMouseUp={btn.key === '0' ? handleZeroMouseUp : undefined}
            onTouchStart={btn.key === '0' ? handleZeroMouseDown : undefined}
            onTouchEnd={btn.key === '0' ? handleZeroMouseUp : undefined}
            className="group relative bg-slate-950 hover:bg-slate-800/90 active:bg-cyan-600/30 border border-slate-800 hover:border-cyan-500/40 active:border-cyan-400 rounded-2xl py-3 sm:py-3.5 flex flex-col items-center justify-center transition-all duration-150 cursor-pointer shadow-sm hover:shadow-cyan-950/50"
          >
            <span className="text-xl sm:text-2xl font-bold font-mono text-white group-hover:text-cyan-300 transition-colors">
              {btn.key}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 group-hover:text-slate-200 tracking-widest uppercase">
              {btn.letters || btn.sub || '\u00A0'}
            </span>
          </button>
        ))}
      </div>

      {/* Call Action Buttons Area */}
      <div className="space-y-3 mt-3 relative z-10">
        {/* Main Dial / Answer / Hang-up Controls */}
        <div className="grid grid-cols-3 gap-2.5 items-center">
          {/* Left Action: Hold / Voicemail */}
          {isCallActive ? (
            <button
              id="dialpad-hold-call-btn"
              onClick={onToggleHold}
              className={`py-3.5 px-3 rounded-2xl border font-semibold text-xs flex flex-col items-center justify-center gap-1 transition cursor-pointer shadow ${
                activeCall.state === 'on_hold'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-950'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-800'
              }`}
            >
              {activeCall.state === 'on_hold' ? (
                <>
                  <Play className="w-5 h-5 text-slate-950" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="w-5 h-5 text-amber-400" />
                  <span>Hold</span>
                </>
              )}
            </button>
          ) : (
            <button
              id="dialpad-quick-voicemail-btn"
              onClick={() => {
                setDialNumber(office031.voicemailNumber);
                audioEngine.playDtmf('*');
                setTimeout(() => audioEngine.playDtmf('9'), 100);
                setTimeout(() => audioEngine.playDtmf('7'), 200);
                onDial(office031.voicemailNumber);
              }}
              className="py-3.5 px-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-200 font-semibold text-xs flex flex-col items-center justify-center gap-1 transition cursor-pointer"
              title="Dial 031 Office Mailbox (*97)"
            >
              <Voicemail className="w-5 h-5 text-amber-400" />
              <span>Mailbox *97</span>
            </button>
          )}

          {/* Center Action: Dial / Answer / End Call */}
          {isIncoming ? (
            <button
              id="dialpad-answer-call-btn"
              onClick={onAnswer}
              className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-bold text-sm flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-950 animate-bounce transition cursor-pointer"
            >
              <Phone className="w-6 h-6" />
              <span>Answer</span>
            </button>
          ) : isCallActive ? (
            <button
              id="dialpad-end-call-btn"
              onClick={onEndCall}
              className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm flex flex-col items-center justify-center gap-1 shadow-lg shadow-rose-950 transition cursor-pointer active:scale-95"
            >
              <PhoneOff className="w-6 h-6" />
              <span>End Call</span>
            </button>
          ) : (
            <button
              id="dialpad-place-call-btn"
              onClick={() => {
                if (dialNumber) {
                  onDial(dialNumber);
                } else if (extensions[1]) {
                  // Dial Durban Sales if empty
                  setDialNumber(extensions[1].extensionNumber);
                  onDial(extensions[1].extensionNumber);
                }
              }}
              className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-950/80 transition cursor-pointer active:scale-95 group"
            >
              <Phone className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              <span>Call</span>
            </button>
          )}

          {/* Right Action: Mute or Transfer */}
          {isCallActive ? (
            <button
              id="dialpad-mute-call-btn"
              onClick={onToggleMute}
              className={`py-3.5 px-3 rounded-2xl border font-semibold text-xs flex flex-col items-center justify-center gap-1 transition cursor-pointer shadow ${
                activeCall.isMuted
                  ? 'bg-rose-600 text-white border-rose-400 shadow-rose-950'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-800'
              }`}
            >
              {activeCall.isMuted ? (
                <>
                  <MicOff className="w-5 h-5 text-white" />
                  <span>Unmute</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 text-slate-300" />
                  <span>Mute</span>
                </>
              )}
            </button>
          ) : (
            <button
              id="dialpad-open-transfer-drawer-btn"
              onClick={() => setShowForwardingDrawer(!showForwardingDrawer)}
              className={`py-3.5 px-3 rounded-2xl border font-semibold text-xs flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                forwardingConfig.enabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-800'
              }`}
              title="Configure Call Forwarding"
            >
              <PhoneForwarded className="w-5 h-5 text-amber-400" />
              <span>Forwarding</span>
            </button>
          )}
        </div>

        {/* In-Call Advanced Actions Row (Transfer, Record, Send to 031 Voicemail) */}
        {isCallActive && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs">
            {/* Transfer Call */}
            <button
              id="dialpad-transfer-btn"
              onClick={() => setShowTransferModal(true)}
              className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-300 p-2 rounded-xl flex items-center justify-center gap-1.5 font-semibold transition cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Transfer</span>
            </button>

            {/* Record Call */}
            {onToggleRecord && (
              <button
                id="dialpad-record-btn"
                onClick={onToggleRecord}
                className={`p-2 rounded-xl flex items-center justify-center gap-1.5 font-semibold border transition cursor-pointer ${
                  activeCall.isRecording
                    ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                    : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                }`}
              >
                <CircleDot className="w-3.5 h-3.5 text-rose-500" />
                <span>{activeCall.isRecording ? 'Rec On' : 'Record'}</span>
              </button>
            )}

            {/* Divert to 031 Office Mail */}
            <button
              id="dialpad-divert-mail-btn"
              onClick={onSendToOfficeMail}
              className="bg-slate-950 hover:bg-amber-950/50 border border-slate-800 hover:border-amber-500/40 text-amber-300 p-2 rounded-xl flex items-center justify-center gap-1.5 font-semibold transition cursor-pointer"
              title="Divert active caller to 031 Office Mail"
            >
              <Voicemail className="w-3.5 h-3.5" />
              <span>To Mailbox</span>
            </button>
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {showTransferModal && isCallActive && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md rounded-3xl p-5 z-30 flex flex-col justify-between animate-in fade-in duration-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
                <h4 className="font-bold text-sm text-white">Transfer Active Call</h4>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-400">
              Transfer call with{' '}
              <span className="text-white font-semibold">{activeCall.remoteName}</span> (
              <span className="font-mono text-cyan-300">{activeCall.remoteNumber}</span>) to:
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {extensions.map((ext) => (
                <div
                  key={ext.id}
                  className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-semibold text-xs text-white">{ext.name}</div>
                    <div className="text-[10px] text-slate-400">
                      Ext {ext.extensionNumber} • {ext.department}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        if (onTransferCall) onTransferCall(ext.extensionNumber, false);
                        setShowTransferModal(false);
                      }}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                    >
                      Blind
                    </button>
                    <button
                      onClick={() => {
                        if (onTransferCall) onTransferCall(ext.extensionNumber, true);
                        setShowTransferModal(false);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold px-2 py-1 rounded-lg transition cursor-pointer"
                    >
                      Attended
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowTransferModal(false)}
            className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs py-2 rounded-xl font-semibold border border-slate-800 mt-3"
          >
            Cancel Transfer
          </button>
        </div>
      )}
    </div>
  );
};
