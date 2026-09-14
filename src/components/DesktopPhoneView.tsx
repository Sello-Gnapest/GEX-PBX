import React, { useState } from 'react';
import {
  Phone,
  PhoneOff,
  PhoneIncoming,
  Mic,
  MicOff,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Radio,
  Clock,
  Mail,
  User,
  CheckCircle2,
  ArrowRightLeft,
  Headphones,
  Sliders,
  ShieldCheck,
  Hash,
} from 'lucide-react';
import {
  ActiveCall,
  Extension,
  Office031Config,
  LocalProvider,
  OfficeMailItem,
  LineId,
} from '../types';
import { audioEngine } from '../utils/audioEngine';

interface DesktopPhoneViewProps {
  activeCall: ActiveCall | null;
  incomingCall: ActiveCall | null;
  office031: Office031Config;
  primaryProvider: LocalProvider;
  extensions: Extension[];
  officeMails: OfficeMailItem[];
  onDial: (number?: string) => void;
  onAnswer: () => void;
  onReject: () => void;
  onEndCall: () => void;
  onToggleHold: () => void;
  onToggleMute: () => void;
  onTransferCall: (ext: string) => void;
  onSendToOfficeMail: () => void;
  onOpenOfficeMailTab: () => void;
  onOpenProvisionTab: () => void;
}

export const DesktopPhoneView: React.FC<DesktopPhoneViewProps> = ({
  activeCall,
  incomingCall,
  office031,
  primaryProvider,
  extensions,
  officeMails,
  onDial,
  onAnswer,
  onReject,
  onEndCall,
  onToggleHold,
  onToggleMute,
  onTransferCall,
  onSendToOfficeMail,
  onOpenOfficeMailTab,
  onOpenProvisionTab,
}) => {
  const [isHandsetOffHook, setIsHandsetOffHook] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isHeadsetOn, setIsHeadsetOn] = useState(false);
  const [lcdDigits, setLcdDigits] = useState('');
  const [volumeLevel, setVolumeLevel] = useState(75);

  const unreadMails = officeMails.filter((m) => !m.isRead).length;

  const handleKeypadPress = (k: string) => {
    audioEngine.playDtmf(k);
    setLcdDigits((prev) => prev + k);
  };

  const handleDialLcd = () => {
    if (lcdDigits) {
      onDial(lcdDigits);
      setLcdDigits('');
    }
  };

  const handleVoicemailKey = () => {
    audioEngine.playDtmf('*');
    setTimeout(() => audioEngine.playDtmf('9'), 100);
    setTimeout(() => audioEngine.playDtmf('7'), 200);
    onOpenOfficeMailTab();
  };

  const handleToggleHandset = () => {
    const nextState = !isHandsetOffHook;
    setIsHandsetOffHook(nextState);
    if (nextState) {
      audioEngine.playConnectChime();
      if (incomingCall) {
        onAnswer();
      }
    } else {
      audioEngine.playDisconnectTone();
      if (activeCall) {
        onEndCall();
      }
    }
  };

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const keypadLayout = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#'],
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner indicating Device State & Office 031 Provisioning Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                GEX PBX Desktop Hardware:
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Line 1 Assigned to 031 Number
              </span>
            </div>
            <div className="text-sm font-semibold text-slate-200 mt-0.5 flex items-center gap-2">
              <span>{office031.deskPhoneModel.toUpperCase()}</span>
              <span className="text-slate-500">•</span>
              <span className="font-mono text-cyan-400">{office031.formattedInternational}</span>
              <span className="text-slate-500">•</span>
              <span className="font-mono text-xs text-slate-400">MAC: {office031.deskPhoneMac}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenProvisionTab}
            className="bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Edit 031 Provisioning</span>
          </button>
        </div>
      </div>

      {/* Realistic Executive Desktop Switchboard Phone Hardware Console */}
      <div className="bg-gradient-to-b from-slate-900 via-zinc-900 to-slate-950 p-6 sm:p-8 rounded-3xl border-4 border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] text-white">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* LEFT: Handset Cradle & Stand Simulation (3 cols on xl) */}
          <div className="xl:col-span-3 flex flex-col items-center justify-center space-y-5 bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80">
            <div className="text-center">
              <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                Telephone Handset
              </span>
              <div className="mt-1">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isHandsetOffHook
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60 animate-pulse'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isHandsetOffHook ? 'OFF HOOK (In Use)' : 'ON HOOK (Resting in Cradle)'}
                </span>
              </div>
            </div>

            {/* Visual Handset Representation */}
            <div
              onClick={handleToggleHandset}
              className={`w-28 sm:w-32 py-10 rounded-3xl border-2 flex flex-col items-center justify-between transition-all cursor-pointer select-none shadow-2xl relative ${
                isHandsetOffHook
                  ? 'bg-slate-800 border-cyan-500 translate-y-[-8px] shadow-[0_0_25px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-900 border-slate-700 hover:border-slate-600'
              }`}
              title="Click to lift or hang up handset"
            >
              <div className="w-16 h-8 rounded-t-2xl bg-slate-950 border border-slate-700 flex items-center justify-center">
                <div className="w-6 h-1 bg-slate-700 rounded"></div>
              </div>
              <div className="my-6 flex flex-col items-center gap-2">
                <div className="w-6 h-12 bg-slate-950/80 rounded border border-slate-800"></div>
                <span className="text-[10px] font-bold tracking-wider text-slate-400">
                  {isHandsetOffHook ? 'LIFTED' : 'CRADLED'}
                </span>
              </div>
              <div className="w-16 h-8 rounded-b-2xl bg-slate-950 border border-slate-700 flex items-center justify-center">
                <div className="w-8 h-2 bg-slate-700 rounded-full"></div>
              </div>
            </div>

            <button
              id="handset-toggle-btn"
              onClick={handleToggleHandset}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                isHandsetOffHook
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>{isHandsetOffHook ? 'Hang Up Handset' : 'Pick Up Handset'}</span>
            </button>

            {/* Audio Mode Quick Status */}
            <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-center text-xs">
              <div
                className={`p-2 rounded-lg border ${
                  isSpeakerOn
                    ? 'bg-cyan-950/50 border-cyan-600/60 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <div className="font-semibold">Speaker</div>
                <div className="text-[10px]">{isSpeakerOn ? 'ACTIVE' : 'OFF'}</div>
              </div>

              <div
                className={`p-2 rounded-lg border ${
                  isHeadsetOn
                    ? 'bg-cyan-950/50 border-cyan-600/60 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <div className="font-semibold">Headset</div>
                <div className="text-[10px]">{isHeadsetOn ? 'ACTIVE' : 'READY'}</div>
              </div>
            </div>
          </div>

          {/* CENTER: Main Phone Base with LCD Touch Screen & Keypad (6 cols on xl) */}
          <div className="xl:col-span-6 space-y-6">
            {/* Color LCD Screen Module (Yealink T48U Touch LCD Display) */}
            <div className="bg-slate-950 border-2 border-slate-700 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
              {/* Screen Top Status Bar */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 text-xs">
                <div className="flex items-center gap-2 text-slate-300 font-mono">
                  <span className="text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 px-1.5 py-0.2 rounded font-bold uppercase">
                    GEX PBX
                  </span>
                  <span className="font-bold text-white">09:47 SAST</span>
                  <span>•</span>
                  <span>Durban, KZN</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Office Mail / MWI Indicator on Screen */}
                  <div
                    onClick={handleVoicemailKey}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer transition ${
                      unreadMails > 0
                        ? 'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="031 Office Mailbox"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold">
                      {unreadMails > 0 ? `${unreadMails} New Mail` : 'Office Mail'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>SIP REG</span>
                  </div>
                </div>
              </div>

              {/* Main Screen Content Body */}
              <div className="py-5 min-h-[140px] flex flex-col justify-between">
                {incomingCall ? (
                  /* Screen Incoming Call State */
                  <div className="text-center space-y-2 animate-pulse">
                    <div className="inline-block bg-emerald-500 text-slate-950 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Incoming Call on Line 1
                    </div>
                    <div className="text-2xl font-bold text-white">{incomingCall.remoteName}</div>
                    <div className="text-sm font-mono text-cyan-300">
                      {incomingCall.remoteNumber}
                    </div>
                  </div>
                ) : activeCall ? (
                  /* Screen In-Call State */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            activeCall.state === 'connected'
                              ? 'bg-emerald-400 animate-pulse'
                              : 'bg-amber-400'
                          }`}
                        />
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Line 1 (Active)
                        </span>
                      </div>
                      <div className="font-mono text-lg font-bold text-cyan-300">
                        {formatSeconds(activeCall.durationSeconds)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xl font-bold text-white">{activeCall.remoteName}</div>
                      <div className="text-xs font-mono text-slate-400">
                        {activeCall.remoteNumber}
                      </div>
                    </div>

                    <div className="bg-slate-900/90 rounded-lg px-3 py-1.5 flex items-center justify-between text-xs text-slate-400 border border-slate-800">
                      <span>Status: {activeCall.state.toUpperCase()}</span>
                      <span>Codec: G.711a (Telkom SA)</span>
                    </div>
                  </div>
                ) : (
                  /* Screen Idle State: PROVISIONED 031 OFFICE NUMBER PROMINENTLY DISPLAYED */
                  <div className="space-y-3 text-center sm:text-left">
                    <div className="bg-gradient-to-r from-cyan-950/80 to-slate-900 border border-cyan-800/60 rounded-xl p-3.5">
                      <div className="flex items-center justify-between text-xs text-cyan-300 mb-1">
                        <span className="font-bold uppercase tracking-wider">
                          Line 1 Provisioned Pilot DID
                        </span>
                        <span className="bg-cyan-500/20 text-cyan-200 px-1.5 py-0.2 rounded text-[10px]">
                          Telkom Voice IMS
                        </span>
                      </div>
                      <div className="text-2xl font-mono font-black text-white tracking-wide">
                        {office031.formattedInternational}
                      </div>
                      <div className="text-xs text-slate-300 mt-1 flex items-center justify-between">
                        <span>{office031.callerIdName}</span>
                        <span className="text-slate-400 font-mono">Ext {office031.switchboardExtension}</span>
                      </div>
                    </div>

                    {/* Digit dial display if typing on phone */}
                    {lcdDigits ? (
                      <div className="bg-slate-900 border border-cyan-500 rounded-lg p-2 font-mono text-lg text-cyan-300 text-center font-bold">
                        {lcdDigits}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
                        <span>Ready for Outbound / Inbound</span>
                        <span className="text-emerald-400">031 Mailbox Linked (*97)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dynamic Contextual Softkeys at bottom of LCD */}
              <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-800">
                {incomingCall ? (
                  <>
                    <button
                      onClick={onAnswer}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 rounded text-xs transition cursor-pointer"
                    >
                      Answer
                    </button>
                    <button
                      onClick={onSendToOfficeMail}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-medium py-1.5 rounded text-xs transition cursor-pointer"
                    >
                      031 Mail
                    </button>
                    <button
                      onClick={onReject}
                      className="bg-rose-600 hover:bg-rose-500 text-white font-medium py-1.5 rounded text-xs transition cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => onTransferCall('102')}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded text-xs transition cursor-pointer"
                    >
                      To Sales
                    </button>
                  </>
                ) : activeCall ? (
                  <>
                    <button
                      onClick={onToggleHold}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded text-xs transition cursor-pointer font-medium"
                    >
                      {activeCall.state === 'on_hold' ? 'Resume' : 'Hold'}
                    </button>
                    <button
                      onClick={() => onTransferCall('102')}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded text-xs transition cursor-pointer font-medium"
                    >
                      Transfer
                    </button>
                    <button
                      onClick={onSendToOfficeMail}
                      className="bg-amber-700 hover:bg-amber-600 text-white py-1.5 rounded text-xs transition cursor-pointer font-medium"
                    >
                      To Mail
                    </button>
                    <button
                      onClick={onEndCall}
                      className="bg-rose-600 hover:bg-rose-500 text-white py-1.5 rounded text-xs transition cursor-pointer font-bold"
                    >
                      End Call
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleVoicemailKey}
                      className="bg-slate-800 hover:bg-slate-700 text-cyan-300 py-1.5 rounded text-xs transition cursor-pointer font-medium"
                    >
                      031 Mail
                    </button>
                    <button
                      onClick={handleDialLcd}
                      disabled={!lcdDigits}
                      className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-30 text-white py-1.5 rounded text-xs transition cursor-pointer font-bold"
                    >
                      Dial
                    </button>
                    <button
                      onClick={() => setLcdDigits('')}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-400 py-1.5 rounded text-xs transition cursor-pointer font-medium"
                    >
                      Clear
                    </button>
                    <button
                      onClick={onOpenProvisionTab}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded text-xs transition cursor-pointer font-medium"
                    >
                      Settings
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Dedicated Telephony Hard Keys Row (Message, Headset, Mute, Speaker) */}
            <div className="grid grid-cols-4 gap-3">
              {/* Message / 031 Voicemail Key with Real LED */}
              <button
                id="hardkey-voicemail"
                onClick={handleVoicemailKey}
                className="bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 transition cursor-pointer relative shadow"
              >
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-200" />
                  {/* Blinking MWI LED on the physical phone */}
                  {unreadMails > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-ping"></span>
                  )}
                  <span
                    className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${
                      unreadMails > 0 ? 'bg-rose-500' : 'bg-slate-600'
                    }`}
                  ></span>
                </div>
                <span className="text-[10px] font-bold text-slate-300">031 Mail</span>
              </button>

              {/* Headset Key */}
              <button
                id="hardkey-headset"
                onClick={() => setIsHeadsetOn(!isHeadsetOn)}
                className={`border rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 transition cursor-pointer relative shadow ${
                  isHeadsetOn
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                    : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300'
                }`}
              >
                <Headphones className="w-5 h-5" />
                <span className="text-[10px] font-bold">Headset</span>
              </button>

              {/* Mute Key */}
              <button
                id="hardkey-mute"
                onClick={onToggleMute}
                className={`border rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 transition cursor-pointer relative shadow ${
                  activeCall?.isMuted
                    ? 'bg-rose-950 border-rose-500 text-rose-300'
                    : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300'
                }`}
              >
                {activeCall?.isMuted ? (
                  <MicOff className="w-5 h-5 text-rose-400" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
                <span className="text-[10px] font-bold">
                  {activeCall?.isMuted ? 'Muted' : 'Mute'}
                </span>
              </button>

              {/* Speakerphone Key */}
              <button
                id="hardkey-speaker"
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className={`border rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 transition cursor-pointer relative shadow ${
                  isSpeakerOn
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300'
                }`}
              >
                <Volume2 className="w-5 h-5" />
                <span className="text-[10px] font-bold">Speaker</span>
              </button>
            </div>

            {/* Tactile Keypad Grid & Volume Controls */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <div className="grid grid-cols-3 gap-2.5">
                {keypadLayout.flat().map((k) => (
                  <button
                    key={k}
                    onClick={() => handleKeypadPress(k)}
                    className="bg-slate-800/90 hover:bg-slate-700 border border-slate-700 active:scale-95 text-white rounded-xl py-2.5 text-center font-mono text-lg font-bold transition cursor-pointer shadow-sm"
                  >
                    {k}
                  </button>
                ))}
              </div>

              {/* Volume Rocker at bottom of phone */}
              <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
                <span className="font-semibold text-[11px] uppercase tracking-wider">
                  Handset Volume
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setVolumeLevel(Math.max(10, volumeLevel - 15))}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full rounded-full transition-all"
                      style={{ width: `${volumeLevel}%` }}
                    />
                  </div>
                  <button
                    onClick={() => setVolumeLevel(Math.min(100, volumeLevel + 15))}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
                  >
                    +
                  </button>
                  <span className="font-mono text-slate-300">{volumeLevel}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: EXP50 BLF Expansion Console Sidecar (3 cols on xl) */}
          <div className="xl:col-span-3 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  EXP50 Sidecar Console
                </span>
                <p className="text-[10px] text-slate-400">Desktop Phone BLF Keys</p>
              </div>
              <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">
                20-Key LCD
              </span>
            </div>

            {/* Sidecar Keys with real LED lights */}
            <div className="space-y-2">
              {extensions.map((ext) => {
                const isCurrent = ext.isCurrentUser;
                return (
                  <button
                    key={ext.id}
                    onClick={() => {
                      if (activeCall) {
                        onTransferCall(ext.extensionNumber);
                      } else {
                        onDial(ext.extensionNumber);
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                      ext.status === 'in_call'
                        ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                        : ext.status === 'ringing'
                        ? 'bg-amber-950/40 border-amber-800/80 text-amber-200 animate-pulse'
                        : isCurrent
                        ? 'bg-cyan-950/40 border-cyan-800/80 text-cyan-200'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                        <span>Ext {ext.extensionNumber}</span>
                        {isCurrent && (
                          <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1 rounded">
                            ME
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{ext.name}</div>
                    </div>

                    {/* Dual-Color Physical Sidecar LED */}
                    <div
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        ext.status === 'available'
                          ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                          : ext.status === 'in_call'
                          ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                          : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                      }`}
                    />
                  </button>
                );
              })}

              {/* Park 701 on Sidecar */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-bold text-indigo-300">Park 701</div>
                  <div className="text-[10px] text-slate-400">Orbital Slot</div>
                </div>
                <div className="w-3 h-3 rounded-full bg-slate-600" />
              </div>

              {/* Auto Attendant Night Mode */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-bold text-amber-300">Day/Night Mode</div>
                  <div className="text-[10px] text-slate-400">Day Schedule Active</div>
                </div>
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
