import React, { useState } from 'react';
import {
  Phone,
  PhoneOff,
  PhoneIncoming,
  PhoneForwarded,
  Mic,
  MicOff,
  Pause,
  Play,
  CircleDot,
  Radio,
  Clock,
  User,
  Users,
  Archive,
  Mail,
  RotateCcw,
  Sparkles,
  ArrowRightLeft,
  Square,
} from 'lucide-react';
import {
  ActiveCall,
  CallLogItem,
  Extension,
  LineId,
  LocalProvider,
  Office031Config,
  ParkedCall,
} from '../types';
import { audioEngine } from '../utils/audioEngine';

interface SwitchboardConsoleProps {
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
  onToggleRecord: () => void;
  onParkCall: (slot: number) => void;
  onRetrieveParkedCall: (slot: number) => void;
  parkedCalls: ParkedCall[];
  extensions: Extension[];
  onTransferCall: (extNumber: string, isAttended?: boolean) => void;
  onSendToOfficeMail: () => void;
  office031: Office031Config;
  primaryProvider: LocalProvider;
  callLogs: CallLogItem[];
  onSimulateCustomCall: (name: string, num: string) => void;
}

export const SwitchboardConsole: React.FC<SwitchboardConsoleProps> = ({
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
  onParkCall,
  onRetrieveParkedCall,
  parkedCalls,
  extensions,
  onTransferCall,
  onSendToOfficeMail,
  office031,
  primaryProvider,
  callLogs,
  onSimulateCustomCall,
}) => {
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [isAttendedTransfer, setIsAttendedTransfer] = useState(false);

  const keypadButtons = [
    { key: '1', letters: '' },
    { key: '2', letters: 'ABC' },
    { key: '3', letters: 'DEF' },
    { key: '4', letters: 'GHI' },
    { key: '5', letters: 'JKL' },
    { key: '6', letters: 'MNO' },
    { key: '7', letters: 'PQRS' },
    { key: '8', letters: 'TUV' },
    { key: '9', letters: 'WXYZ' },
    { key: '*', letters: 'OPER' },
    { key: '0', letters: '+' },
    { key: '#', letters: '#' },
  ];

  const handleKeypadPress = (k: string) => {
    audioEngine.playDtmf(k);
    setDialNumber(dialNumber + k);
  };

  const handleBackspace = () => {
    setDialNumber(dialNumber.slice(0, -1));
  };

  const formatSeconds = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner Alert for Incoming Call */}
      {incomingCall && (
        <div
          id="incoming-call-alert"
          className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-emerald-500 rounded-2xl p-4 sm:p-5 shadow-2xl animate-pulse text-white flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center animate-bounce">
              <PhoneIncoming className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500 text-slate-950 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  Incoming 031 Call
                </span>
                <span className="text-xs text-emerald-300 font-mono">
                  Line 1 ({office031.mainNumber})
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mt-1 text-white">
                {incomingCall.remoteName || 'Incoming Caller'}
              </h2>
              <p className="text-sm font-mono text-emerald-200">{incomingCall.remoteNumber}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="answer-incoming-btn"
              onClick={onAnswer}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg transition cursor-pointer"
            >
              <Phone className="w-5 h-5" />
              <span>Answer Call</span>
            </button>

            <button
              id="send-officemail-btn"
              onClick={onSendToOfficeMail}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-medium px-4 py-2.5 rounded-xl transition cursor-pointer text-sm"
              title="Send caller directly to 031 Office Voicemail"
            >
              <Mail className="w-4 h-4" />
              <span>Send to 031 Mail</span>
            </button>

            <button
              id="reject-incoming-btn"
              onClick={onReject}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-medium px-4 py-2.5 rounded-xl transition cursor-pointer text-sm"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Reject</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Switchboard Grid: Left is Softphone & Dialpad, Right is Active Call & BLF Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Lines, Dialpad, and Presets (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Multi-Line Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Switchboard Lines
              </span>
              <span className="text-[11px] text-cyan-400 font-medium">Ext 101 Operator</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'line1' as LineId, label: 'Line 1 (031 Main Pilot)', num: office031.mainNumber },
                { id: 'line2' as LineId, label: 'Line 2 (Intercom)', num: 'Ext 101' },
                { id: 'line3' as LineId, label: 'Line 3 (Trunk 2)', num: 'Direct Inward' },
                { id: 'line4' as LineId, label: 'Line 4 (Conf Bridge)', num: 'Room 700' },
              ].map((line) => {
                const isActive = activeCall?.lineId === line.id;
                const isSelected = selectedLine === line.id;
                return (
                  <button
                    key={line.id}
                    id={`line-btn-${line.id}`}
                    onClick={() => setSelectedLine(line.id)}
                    className={`p-3 rounded-xl text-left border transition cursor-pointer relative ${
                      isActive
                        ? 'bg-emerald-950/70 border-emerald-500/80 text-emerald-200'
                        : isSelected
                        ? 'bg-slate-800 border-cyan-500 text-white'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{line.label}</span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isActive
                            ? 'bg-emerald-400 animate-pulse'
                            : isSelected
                            ? 'bg-cyan-400'
                            : 'bg-slate-600'
                        }`}
                      ></span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-1">{line.num}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Softphone Dialpad */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            {/* Number Display Screen */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <input
                id="dialpad-input"
                type="text"
                value={dialNumber}
                onChange={(e) => setDialNumber(e.target.value)}
                placeholder="Enter 031 or extension..."
                className="bg-transparent text-xl font-mono text-cyan-300 font-bold tracking-wider outline-none w-full placeholder:text-slate-600 placeholder:text-sm"
              />
              {dialNumber && (
                <button
                  id="dialpad-clear-btn"
                  onClick={handleBackspace}
                  className="text-slate-400 hover:text-white p-1 rounded transition text-xs font-medium cursor-pointer"
                  title="Backspace"
                >
                  <Square className="w-4 h-4 fill-slate-700 text-slate-700 hover:fill-slate-500" />
                </button>
              )}
            </div>

            {/* 12-Key Pad */}
            <div className="grid grid-cols-3 gap-2.5">
              {keypadButtons.map((b) => (
                <button
                  key={b.key}
                  id={`keypad-${b.key === '*' ? 'star' : b.key === '#' ? 'hash' : b.key}`}
                  onClick={() => handleKeypadPress(b.key)}
                  className="bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 active:scale-95 active:bg-cyan-900/60 text-white rounded-xl py-3 flex flex-col items-center justify-center transition cursor-pointer shadow-sm"
                >
                  <span className="text-xl font-bold font-mono leading-none">{b.key}</span>
                  {b.letters && (
                    <span className="text-[9px] font-bold text-slate-400 tracking-wider mt-1">
                      {b.letters}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Dial Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                id="call-dial-btn"
                onClick={() => onDial()}
                disabled={!dialNumber && !activeCall}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold shadow-lg transition text-sm cursor-pointer ${
                  activeCall
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                {activeCall ? (
                  <>
                    <PhoneOff className="w-4 h-4" />
                    <span>End Call</span>
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4" />
                    <span>Dial via {primaryProvider.slug.toUpperCase()}</span>
                  </>
                )}
              </button>

              <button
                id="quick-redial-btn"
                onClick={() => {
                  if (callLogs.length > 0) {
                    const last = callLogs[0].number;
                    setDialNumber(last);
                    audioEngine.playDtmf('0');
                  }
                }}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white px-3.5 py-3 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                title="Redial last number"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Redial</span>
              </button>
            </div>
          </div>

          {/* Quick Simulation Presets */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Test Local 031 Scenarios</span>
              </div>
              <span className="text-[10px] text-slate-500">Instant Mock Test</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Durban Pier Customs', num: '031 361 8800' },
                { name: 'Telkom Account Rep', num: '031 308 2111' },
                { name: 'Standard Bank Umhlanga', num: '031 582 3000' },
                { name: 'Mobile Client (SA)', num: '082 994 1234' },
              ].map((c) => (
                <button
                  key={c.num}
                  id={`mock-call-${c.num.replace(/\s+/g, '')}`}
                  onClick={() => onSimulateCustomCall(c.name, c.num)}
                  className="bg-slate-950 hover:bg-slate-800 border border-slate-800/80 p-2 rounded-xl text-left transition cursor-pointer"
                >
                  <div className="text-xs font-medium text-slate-200 truncate">{c.name}</div>
                  <div className="text-[11px] font-mono text-cyan-400">{c.num}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Call Cockpit, BLF Extension Console, and Parked Calls (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          {/* ACTIVE CALL CARD (If call in progress or ringing) */}
          {activeCall ? (
            <div
              id="active-call-card"
              className="bg-gradient-to-b from-slate-850 to-slate-900 border-2 border-cyan-600/50 rounded-2xl p-6 shadow-xl space-y-5 text-white"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      activeCall.state === 'connected'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : activeCall.state === 'on_hold'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 animate-pulse'
                    }`}
                  >
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-white">{activeCall.remoteName}</h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          activeCall.state === 'connected'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : activeCall.state === 'on_hold'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-cyan-500/20 text-cyan-300'
                        }`}
                      >
                        {activeCall.state === 'connected'
                          ? 'In Call'
                          : activeCall.state === 'on_hold'
                          ? 'On Hold'
                          : activeCall.state}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-0.5">
                      <span>{activeCall.remoteNumber}</span>
                      <span>•</span>
                      <span className="text-cyan-400">Trunk: {primaryProvider.name}</span>
                    </div>
                  </div>
                </div>

                {/* Call Timer & Recording indicator */}
                <div className="text-right">
                  <div className="text-2xl font-mono font-bold text-white flex items-center gap-1.5 justify-end">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>{formatSeconds(activeCall.durationSeconds)}</span>
                  </div>
                  {activeCall.isRecording && (
                    <div className="flex items-center justify-end gap-1.5 text-xs text-rose-400 font-medium animate-pulse mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span>REC {formatSeconds(activeCall.recordedSeconds || 0)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Simulated Audio Waveform Bar */}
              <div className="bg-slate-950 rounded-xl p-3 flex items-center justify-between border border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <span>Audio Stream (G.711a Durban IMS):</span>
                </div>
                <div className="flex items-center gap-1 h-5">
                  {[40, 75, 90, 50, 65, 100, 45, 80, 60, 95, 70, 50].map((h, i) => (
                    <span
                      key={i}
                      className={`w-1 rounded-full transition-all duration-300 ${
                        activeCall.state === 'on_hold'
                          ? 'bg-amber-500/60 h-2'
                          : activeCall.isMuted
                          ? 'bg-slate-700 h-1'
                          : 'bg-cyan-400 animate-pulse'
                      }`}
                      style={{ height: activeCall.state === 'on_hold' ? '4px' : `${h * 0.2}px` }}
                    />
                  ))}
                </div>
              </div>

              {/* In-Call Operator Action Buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {/* Mute */}
                <button
                  id="incall-mute-btn"
                  onClick={onToggleMute}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer text-xs font-medium ${
                    activeCall.isMuted
                      ? 'bg-amber-950 border-amber-600 text-amber-200'
                      : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750'
                  }`}
                >
                  {activeCall.isMuted ? <MicOff className="w-4 h-4 text-amber-400" /> : <Mic className="w-4 h-4" />}
                  <span>{activeCall.isMuted ? 'Muted' : 'Mute'}</span>
                </button>

                {/* Hold */}
                <button
                  id="incall-hold-btn"
                  onClick={onToggleHold}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer text-xs font-medium ${
                    activeCall.state === 'on_hold'
                      ? 'bg-amber-950 border-amber-600 text-amber-200'
                      : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750'
                  }`}
                >
                  {activeCall.state === 'on_hold' ? (
                    <Play className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Pause className="w-4 h-4" />
                  )}
                  <span>{activeCall.state === 'on_hold' ? 'Resume' : 'Hold'}</span>
                </button>

                {/* Record */}
                <button
                  id="incall-record-btn"
                  onClick={onToggleRecord}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer text-xs font-medium ${
                    activeCall.isRecording
                      ? 'bg-rose-950 border-rose-600 text-rose-200'
                      : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750'
                  }`}
                >
                  <CircleDot
                    className={`w-4 h-4 ${activeCall.isRecording ? 'text-rose-400 animate-spin' : ''}`}
                  />
                  <span>{activeCall.isRecording ? 'Stop Rec' : 'Record'}</span>
                </button>

                {/* Transfer */}
                <button
                  id="incall-transfer-btn"
                  onClick={() => setTransferModalOpen(true)}
                  className="p-3 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-200 flex flex-col items-center justify-center gap-1 transition cursor-pointer text-xs font-medium"
                >
                  <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
                  <span>Transfer</span>
                </button>

                {/* Park */}
                <button
                  id="incall-park-btn"
                  onClick={() => onParkCall(701)}
                  className="p-3 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-200 flex flex-col items-center justify-center gap-1 transition cursor-pointer text-xs font-medium"
                >
                  <Archive className="w-4 h-4 text-indigo-400" />
                  <span>Park (701)</span>
                </button>

                {/* Hang Up */}
                <button
                  id="incall-hangup-btn"
                  onClick={onEndCall}
                  className="p-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white flex flex-col items-center justify-center gap-1 transition cursor-pointer text-xs font-bold shadow-lg"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>Hang Up</span>
                </button>
              </div>

              {/* Direct Transfer Modal / Drawer */}
              {transferModalOpen && (
                <div className="bg-slate-950 border border-slate-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300">
                      Transfer Call to Extension
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-400 flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAttendedTransfer}
                          onChange={(e) => setIsAttendedTransfer(e.target.checked)}
                          className="rounded text-cyan-500"
                        />
                        <span>Attended (Warm)</span>
                      </label>
                      <button
                        onClick={() => setTransferModalOpen(false)}
                        className="text-slate-400 hover:text-white text-xs px-2 py-0.5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {extensions
                      .filter((e) => !e.isCurrentUser)
                      .map((ext) => (
                        <button
                          key={ext.id}
                          onClick={() => {
                            onTransferCall(ext.extensionNumber, isAttendedTransfer);
                            setTransferModalOpen(false);
                          }}
                          className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-left transition cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white">
                              Ext {ext.extensionNumber}
                            </span>
                            <span
                              className={`w-2 h-2 rounded-full ${
                                ext.status === 'available' ? 'bg-emerald-400' : 'bg-rose-500'
                              }`}
                            />
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">{ext.name}</div>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Idle Switchboard Status Card */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      Switchboard Ready
                    </span>
                    <span className="text-xs text-slate-400">• Pilot DID</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {office031.formattedInternational}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Routing incoming calls to Desktop Phone (Line 1 Ext 101)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="simulate-incoming-card-btn"
                  onClick={() => onSimulateCustomCall('Durban Shipping Hub', '031 361 8800')}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow"
                >
                  <PhoneIncoming className="w-3.5 h-3.5" />
                  <span>Simulate Call</span>
                </button>
              </div>
            </div>
          )}

          {/* BLF (Busy Lamp Field) Extension Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  BLF Extension Matrix (EXP50 Console)
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Avail
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> In-Call
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> Ringing
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {extensions.map((ext) => {
                const isCurrent = ext.isCurrentUser;
                return (
                  <div
                    key={ext.id}
                    id={`blf-ext-${ext.extensionNumber}`}
                    className={`p-3 rounded-xl border transition ${
                      ext.status === 'in_call'
                        ? 'bg-rose-950/40 border-rose-800/60'
                        : ext.status === 'ringing'
                        ? 'bg-amber-950/40 border-amber-800/60 animate-pulse'
                        : isCurrent
                        ? 'bg-cyan-950/30 border-cyan-800/50'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-white">
                        Ext {ext.extensionNumber}
                      </span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          ext.status === 'available'
                            ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                            : ext.status === 'in_call'
                            ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                            : ext.status === 'ringing'
                            ? 'bg-amber-400 animate-ping'
                            : 'bg-slate-600'
                        }`}
                        title={ext.status}
                      />
                    </div>
                    <div className="text-xs font-semibold text-slate-200 mt-1 truncate">
                      {ext.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{ext.department}</div>

                    {!isCurrent && (
                      <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-800/80">
                        <button
                          id={`blf-call-${ext.extensionNumber}`}
                          onClick={() => {
                            setDialNumber(ext.extensionNumber);
                            onDial(ext.extensionNumber);
                          }}
                          className="flex-1 bg-slate-800 hover:bg-slate-750 text-cyan-300 text-[10px] font-medium py-1 rounded transition text-center cursor-pointer"
                        >
                          Intercom
                        </button>
                        {activeCall && (
                          <button
                            id={`blf-transfer-${ext.extensionNumber}`}
                            onClick={() => onTransferCall(ext.extensionNumber, false)}
                            className="bg-cyan-900/60 hover:bg-cyan-800 text-white text-[10px] font-medium px-2 py-1 rounded transition cursor-pointer"
                            title="Quick Blind Transfer"
                          >
                            XFER
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Call Park Slots Rack */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Call Park Slots
                </span>
              </div>
              <span className="text-[11px] text-slate-500">Hold calls in orbital slots</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[701, 702, 703].map((slot) => {
                const parked = parkedCalls.find((p) => p.slot === slot);
                return (
                  <div
                    key={slot}
                    id={`park-slot-${slot}`}
                    className={`p-3 rounded-xl border text-center transition ${
                      parked
                        ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200'
                        : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold">Slot {slot}</div>
                    {parked ? (
                      <div className="mt-1 space-y-1">
                        <div className="text-xs font-semibold text-white truncate">
                          {parked.remoteName}
                        </div>
                        <div className="text-[10px] font-mono text-indigo-300">
                          {parked.remoteNumber}
                        </div>
                        <button
                          id={`retrieve-park-${slot}`}
                          onClick={() => onRetrieveParkedCall(slot)}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold py-1 rounded mt-1.5 transition cursor-pointer"
                        >
                          Retrieve
                        </button>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-600 mt-2">Empty</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Call History */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Recent 031 Call History
              </span>
              <span className="text-[11px] text-slate-500">{callLogs.length} total logs</span>
            </div>

            <div className="divide-y divide-slate-800 max-h-56 overflow-y-auto pr-1">
              {callLogs.map((log) => (
                <div
                  key={log.id}
                  className="py-2.5 flex items-center justify-between text-xs gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        log.direction === 'inbound'
                          ? log.status === 'missed'
                            ? 'bg-rose-950 text-rose-400'
                            : 'bg-emerald-950 text-emerald-400'
                          : 'bg-blue-950 text-blue-400'
                      }`}
                    >
                      {log.direction === 'inbound' ? (
                        <PhoneIncoming className="w-3.5 h-3.5" />
                      ) : (
                        <PhoneForwarded className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">{log.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{log.number}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-slate-300 font-mono">
                      {formatSeconds(log.durationSeconds)}
                    </div>
                    <div className="text-[10px] text-slate-500">{log.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
