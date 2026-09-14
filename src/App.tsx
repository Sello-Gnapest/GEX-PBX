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
  Voicemail,
  CheckCircle2,
  BellRing,
  ShieldCheck,
  Server,
  Sliders,
  ChevronRight,
  AlertTriangle,
  BookUser,
} from 'lucide-react';
import {
  ActiveCall,
  CallForwardingConfig,
  CallLogItem,
  Extension,
  ForwardingType,
  LineId,
  LocalProvider,
  Office031Config,
  OfficeMailItem,
  ParkedCall,
  PhoneContact,
} from './types';
import {
  DEFAULT_EXTENSIONS,
  DEFAULT_LOCAL_PROVIDERS,
  DEFAULT_OFFICE_031_CONFIG,
  INITIAL_CALL_LOGS,
  INITIAL_OFFICE_MAILS,
  DEFAULT_PHONE_CONTACTS,
} from './utils/pbxDefaults';
import { audioEngine } from './utils/audioEngine';
import { Header, AppTab } from './components/Header';
import { Dialpad } from './components/Dialpad';
import { DesktopPhoneView } from './components/DesktopPhoneView';
import { NetworkProvidersTab } from './components/NetworkProvidersTab';
import { OfficeMailTab } from './components/OfficeMailTab';
import { DeviceProvisioningTab } from './components/DeviceProvisioningTab';
import { AgentExtensionsTab } from './components/AgentExtensionsTab';
import { AgentSoftphoneView } from './components/AgentSoftphoneView';
import { PhonebookDrawer } from './components/PhonebookDrawer';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<AppTab>('console');

  // PBX State
  const [providers, setProviders] = useState<LocalProvider[]>(DEFAULT_LOCAL_PROVIDERS);
  const [primaryProviderId, setPrimaryProviderId] = useState<string>('prov-telkom');
  const [office031, setOffice031] = useState<Office031Config>(DEFAULT_OFFICE_031_CONFIG);
  const [extensions, setExtensions] = useState<Extension[]>(DEFAULT_EXTENSIONS);
  const [officeMails, setOfficeMails] = useState<OfficeMailItem[]>(INITIAL_OFFICE_MAILS);
  const [callLogs, setCallLogs] = useState<CallLogItem[]>(INITIAL_CALL_LOGS);
  const [parkedCalls, setParkedCalls] = useState<ParkedCall[]>([]);

  // Phonebook & Device Contacts State
  const [contacts, setContacts] = useState<PhoneContact[]>(DEFAULT_PHONE_CONTACTS);
  const [isConsolePhonebookOpen, setIsConsolePhonebookOpen] = useState(false);

  const handleAddContact = (newCt: PhoneContact) => {
    setContacts((prev) => [newCt, ...prev]);
  };
  const handleAddBatchContacts = (newCts: PhoneContact[]) => {
    setContacts((prev) => [...newCts, ...prev]);
  };
  const handleDeleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };
  const handleToggleFavoriteContact = (id: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c))
    );
  };

  // Active Office Agent extension selected for the Web Softphone
  const [activeAgentExtNumber, setActiveAgentExtNumber] = useState<string>('102');
  const [forwardedToAgentCall, setForwardedToAgentCall] = useState<ActiveCall | null>(null);

  // Line & Dialpad State
  const [selectedLine, setSelectedLine] = useState<LineId>('line1');
  const [dialNumber, setDialNumber] = useState<string>('');

  // Call States
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<ActiveCall | null>(null);

  // Audio & DND State
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isDnd, setIsDnd] = useState<boolean>(false);
  const [isPinging, setIsPinging] = useState<boolean>(false);

  // Call Forwarding Configuration
  const [forwardingConfig, setForwardingConfig] = useState<CallForwardingConfig>({
    enabled: false,
    type: 'off',
    targetNumber: '102',
    targetName: 'Durban Sales Desk (Ext 102)',
    noAnswerTimeoutSeconds: 15,
  });

  // Call Forwarding Notification Toast
  const [forwardNotification, setForwardNotification] = useState<string | null>(null);

  // Active Provider
  const primaryProvider =
    providers.find((p) => p.id === primaryProviderId) || providers[0];

  // Timer Ref for call duration
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const noAnswerTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Active call duration counter
  useEffect(() => {
    if (activeCall && activeCall.state === 'connected') {
      durationTimerRef.current = setInterval(() => {
        setActiveCall((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            durationSeconds: prev.durationSeconds + 1,
            recordedSeconds: prev.isRecording
              ? (prev.recordedSeconds || 0) + 1
              : prev.recordedSeconds,
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
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [activeCall?.state]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      audioEngine.stopRingtone();
      audioEngine.stopRingback();
      audioEngine.stopHoldMusic();
      audioEngine.stopSpeaking();
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (noAnswerTimerRef.current) clearTimeout(noAnswerTimerRef.current);
    };
  }, []);

  // Update Call Forwarding configuration
  const handleUpdateForwarding = (updates: Partial<CallForwardingConfig>) => {
    setForwardingConfig((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  // Dial out function
  const handleDial = (numberToDial?: string) => {
    const target = (numberToDial || dialNumber).trim();
    if (!target) return;

    if (activeCall) {
      // If already in call, end it first or conference
      handleEndCall();
    }

    // Resolve name from known extensions or contacts
    const matchedExt = extensions.find(
      (e) => e.extensionNumber === target || target.endsWith(e.extensionNumber)
    );
    const remoteName = matchedExt
      ? matchedExt.name
      : target.startsWith('031')
      ? 'Durban Regional Metro'
      : target.startsWith('*97')
      ? '031 Office Mailbox'
      : target.startsWith('*')
      ? 'PBX Feature Service'
      : 'Outbound Client';

    const newCall: ActiveCall = {
      id: `call-${Date.now()}`,
      lineId: selectedLine,
      remoteNumber: target,
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

    // Simulate connection after ringback (1.8s)
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

      // If dialing voicemail (*97), speak greeting prompt
      if (target === office031.voicemailNumber || target === '*97') {
        setTimeout(() => {
          audioEngine.speakText(
            `Welcome to GEX PBX Office Mail for ${office031.formattedInternational}. You have ${
              officeMails.filter((m) => !m.isRead).length
            } new voicemails. Press 1 to listen.`
          );
        }, 600);
      }
    }, 1800);
  };

  // Answer incoming call
  const handleAnswer = () => {
    if (!incomingCall) return;

    audioEngine.stopRingtone();
    audioEngine.playConnectChime();
    if (noAnswerTimerRef.current) {
      clearTimeout(noAnswerTimerRef.current);
      noAnswerTimerRef.current = null;
    }

    setActiveCall({
      ...incomingCall,
      state: 'connected',
      startTime: Date.now(),
      durationSeconds: 0,
    });
    setIncomingCall(null);
  };

  // Reject incoming call
  const handleReject = () => {
    if (!incomingCall) return;

    audioEngine.stopRingtone();
    audioEngine.playDisconnectTone();
    if (noAnswerTimerRef.current) {
      clearTimeout(noAnswerTimerRef.current);
      noAnswerTimerRef.current = null;
    }

    // Log missed/rejected
    const newLog: CallLogItem = {
      id: `log-${Date.now()}`,
      direction: 'inbound',
      number: incomingCall.remoteNumber,
      name: incomingCall.remoteName,
      timestamp: 'Just now',
      durationSeconds: 0,
      status: 'rejected',
      lineId: incomingCall.lineId,
      providerName: primaryProvider.name,
    };
    setCallLogs((prev) => [newLog, ...prev]);
    setIncomingCall(null);
  };

  // End active call
  const handleEndCall = () => {
    if (!activeCall) return;

    audioEngine.stopRingback();
    audioEngine.stopHoldMusic();
    audioEngine.stopSpeaking();
    audioEngine.playDisconnectTone();

    // Log call
    const newLog: CallLogItem = {
      id: `log-${Date.now()}`,
      direction: activeCall.direction,
      number: activeCall.remoteNumber,
      name: activeCall.remoteName,
      timestamp: 'Just now',
      durationSeconds: activeCall.durationSeconds,
      status: 'answered',
      lineId: activeCall.lineId,
      providerName: primaryProvider.name,
      recordingAvailable: activeCall.isRecording,
    };
    setCallLogs((prev) => [newLog, ...prev]);

    setActiveCall(null);
  };

  // Hold / Resume
  const handleToggleHold = () => {
    if (!activeCall) return;

    if (activeCall.state === 'connected') {
      setActiveCall({ ...activeCall, state: 'on_hold' });
      audioEngine.startHoldMusic();
    } else if (activeCall.state === 'on_hold') {
      audioEngine.stopHoldMusic();
      audioEngine.playConnectChime();
      setActiveCall({ ...activeCall, state: 'connected' });
    }
  };

  // Mute / Unmute
  const handleToggleMute = () => {
    if (!activeCall) return;
    const nextMuted = !activeCall.isMuted;
    setActiveCall({ ...activeCall, isMuted: nextMuted });
    audioEngine.playToneSequence(nextMuted ? [400, 300] : [300, 450], 80);
  };

  // Record / Stop Record
  const handleToggleRecord = () => {
    if (!activeCall) return;
    const nextRecording = !activeCall.isRecording;
    setActiveCall({
      ...activeCall,
      isRecording: nextRecording,
      recordedSeconds: nextRecording ? 0 : activeCall.recordedSeconds,
    });
    audioEngine.playToneSequence(nextRecording ? [500, 750] : [750, 500], 90);
  };

  // Send to 031 Office Mailbox
  const handleSendToOfficeMail = () => {
    const callerNumber = incomingCall
      ? incomingCall.remoteNumber
      : activeCall
      ? activeCall.remoteNumber
      : '031 361 8700';

    const callerName = incomingCall
      ? incomingCall.remoteName
      : activeCall
      ? activeCall.remoteName
      : 'Durban Metro Caller';

    audioEngine.stopRingtone();
    audioEngine.stopHoldMusic();
    audioEngine.stopRingback();
    audioEngine.playVoicemailTone();

    // Create new voicemail item
    const newMail: OfficeMailItem = {
      id: `mail-${Date.now()}`,
      callerNumber,
      callerName,
      timestamp: 'Just now',
      durationSeconds: 28,
      audioDurationStr: '0:28',
      isRead: false,
      transcription: `Inquiry left for Durban Office 031 line: Caller ${callerName} (${callerNumber}) requested switchboard return call regarding maritime logistics and service SLA.`,
      urgent: true,
      emailSentTo: office031.voicemailEmailNotify,
    };

    setOfficeMails((prev) => [newMail, ...prev]);

    if (incomingCall) setIncomingCall(null);
    if (activeCall) setActiveCall(null);

    setForwardNotification(
      `Caller transferred to 031 Office Voicemail. Notification dispatched to ${office031.voicemailEmailNotify}`
    );
    setTimeout(() => setForwardNotification(null), 5000);
  };

  // Transfer Call (Blind or Attended)
  const handleTransferCall = (extNumber: string, isAttended: boolean = false) => {
    if (!activeCall) return;

    const targetExt = extensions.find((e) => e.extensionNumber === extNumber);
    const targetName = targetExt ? targetExt.name : `Ext ${extNumber}`;

    audioEngine.stopHoldMusic();
    audioEngine.playToneSequence([350, 440, 580], 100);

    // Update extension state
    setExtensions((prev) =>
      prev.map((e) =>
        e.extensionNumber === extNumber
          ? { ...e, status: 'in_call', currentCallWith: `${activeCall.remoteName} (${activeCall.remoteNumber})` }
          : e
      )
    );

    // Forward active call to targeted agent softphone
    setForwardedToAgentCall({
      ...activeCall,
      remoteName: `${activeCall.remoteName} (Forwarded from Switchboard)`,
      state: 'ringing',
    });
    setActiveAgentExtNumber(extNumber);

    // Add transfer log
    const newLog: CallLogItem = {
      id: `log-${Date.now()}`,
      direction: activeCall.direction,
      number: activeCall.remoteNumber,
      name: activeCall.remoteName,
      timestamp: 'Just now',
      durationSeconds: activeCall.durationSeconds,
      status: 'transferred',
      lineId: activeCall.lineId,
      providerName: `${isAttended ? 'Attended' : 'Blind'} Transfer to ${targetName}`,
    };
    setCallLogs((prev) => [newLog, ...prev]);

    setForwardNotification(
      `Call with ${activeCall.remoteName} successfully transferred to ${targetName} (${isAttended ? 'Attended' : 'Blind'})`
    );
    setTimeout(() => setForwardNotification(null), 4500);

    setActiveCall(null);
  };

  // Agent Extension Management Handlers
  const handleAddExtension = (newExt: Extension) => {
    setExtensions((prev) => [...prev, newExt]);
    audioEngine.playToneSequence([440, 554, 659], 80);
    setForwardNotification(`Office Agent Ext ${newExt.extensionNumber} (${newExt.name}) added and provisioned`);
    setTimeout(() => setForwardNotification(null), 4000);
  };

  const handleUpdateExtension = (extId: string, updates: Partial<Extension>) => {
    setExtensions((prev) => prev.map((e) => (e.id === extId ? { ...e, ...updates } : e)));
  };

  const handleDeleteExtension = (extId: string) => {
    setExtensions((prev) => prev.filter((e) => e.id !== extId));
    audioEngine.playToneSequence([400, 300], 80);
  };

  const handleSelectAgentSoftphone = (extNumber: string) => {
    setActiveAgentExtNumber(extNumber);
    setActiveTab('agent-softphone');
  };

  // Call Parking
  const handleParkCall = (slot: number) => {
    if (!activeCall) return;

    const newPark: ParkedCall = {
      slot,
      callId: activeCall.id,
      remoteNumber: activeCall.remoteNumber,
      remoteName: activeCall.remoteName,
      parkedAt: Date.now(),
      lineId: activeCall.lineId,
    };

    setParkedCalls((prev) => [...prev.filter((p) => p.slot !== slot), newPark]);
    audioEngine.playToneSequence([440, 550], 90);

    setForwardNotification(
      `Call with ${activeCall.remoteName} parked in PBX Orbit Slot ${slot}`
    );
    setTimeout(() => setForwardNotification(null), 4000);

    setActiveCall(null);
  };

  // Retrieve Parked Call
  const handleRetrieveParkedCall = (slot: number) => {
    const park = parkedCalls.find((p) => p.slot === slot);
    if (!park) return;

    setParkedCalls((prev) => prev.filter((p) => p.slot !== slot));

    setActiveCall({
      id: park.callId,
      lineId: park.lineId,
      remoteNumber: park.remoteNumber,
      remoteName: park.remoteName,
      direction: 'inbound',
      state: 'connected',
      startTime: Date.now(),
      durationSeconds: 0,
      isMuted: false,
      isRecording: false,
      providerId: primaryProvider.id,
    });

    audioEngine.playConnectChime();
  };

  // Simulate Incoming Call (with Call Forwarding Logic)
  const handleSimulateIncomingCall = (
    callerName = 'Transnet Durban Harbour Ops',
    callerNumber = '031 361 8800'
  ) => {
    if (isDnd) {
      audioEngine.playDisconnectTone();
      setForwardNotification('Incoming call rejected: DND (Do Not Disturb) is active on Ext 101');
      setTimeout(() => setForwardNotification(null), 4000);
      return;
    }

    // 1. Check Call Forwarding Unconditional (CFU / *72)
    if (forwardingConfig.enabled && forwardingConfig.type === 'unconditional') {
      audioEngine.playToneSequence([350, 440, 550], 120);
      setForwardNotification(
        `Incoming call from ${callerName} (${callerNumber}) automatically forwarded to ${forwardingConfig.targetName} [CFU *72 Active]`
      );
      setTimeout(() => setForwardNotification(null), 5000);

      // Route directly to the targeted agent's softphone
      setForwardedToAgentCall({
        id: `fwd-inc-${Date.now()}`,
        lineId: 'line1',
        remoteNumber: callerNumber,
        remoteName: `${callerName} (Forwarded to Ext ${forwardingConfig.targetNumber})`,
        direction: 'inbound',
        state: 'ringing',
        startTime: Date.now(),
        durationSeconds: 0,
        isMuted: false,
        isRecording: false,
        providerId: primaryProvider.id,
      });
      setActiveAgentExtNumber(forwardingConfig.targetNumber);

      // Log the forwarded call
      setCallLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          direction: 'inbound',
          number: callerNumber,
          name: callerName,
          timestamp: 'Just now',
          durationSeconds: 0,
          status: 'transferred',
          lineId: 'line1',
          providerName: `Forwarded to ${forwardingConfig.targetName}`,
        },
        ...prev,
      ]);
      return;
    }

    // 2. Check Call Forwarding on Busy (CFB / *90)
    if (activeCall && forwardingConfig.enabled && forwardingConfig.type === 'busy') {
      audioEngine.playToneSequence([350, 440, 550], 120);
      setForwardNotification(
        `Switchboard busy: Call from ${callerName} automatically forwarded to ${forwardingConfig.targetName} [CFB *90 Active]`
      );
      setTimeout(() => setForwardNotification(null), 5000);

      setCallLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          direction: 'inbound',
          number: callerNumber,
          name: callerName,
          timestamp: 'Just now',
          durationSeconds: 0,
          status: 'transferred',
          lineId: 'line1',
          providerName: `Forwarded (Busy) to ${forwardingConfig.targetName}`,
        },
        ...prev,
      ]);
      return;
    }

    // 3. Normal Incoming Ring
    const newIncoming: ActiveCall = {
      id: `incoming-${Date.now()}`,
      lineId: 'line1',
      remoteNumber: callerNumber,
      remoteName: callerName,
      direction: 'inbound',
      state: 'ringing',
      startTime: Date.now(),
      durationSeconds: 0,
      isMuted: false,
      isRecording: false,
      providerId: primaryProvider.id,
    };

    setIncomingCall(newIncoming);
    audioEngine.startRingtone();

    // 4. Check Call Forwarding on No Answer (CFNA / *92)
    if (noAnswerTimerRef.current) clearTimeout(noAnswerTimerRef.current);

    noAnswerTimerRef.current = setTimeout(() => {
      setIncomingCall((current) => {
        if (!current || current.id !== newIncoming.id) return current;

        audioEngine.stopRingtone();

        if (forwardingConfig.enabled && forwardingConfig.type === 'no_answer') {
          audioEngine.playToneSequence([350, 440, 550], 120);
          setForwardNotification(
            `No answer on 031 Switchboard: Diverted to ${forwardingConfig.targetName} [CFNA *92]`
          );
          setTimeout(() => setForwardNotification(null), 5000);
        } else {
          // Default: send to 031 Office Mailbox
          handleSendToOfficeMail();
        }
        return null;
      });
    }, forwardingConfig.noAnswerTimeoutSeconds * 1000);
  };

  // Master Mute
  const handleToggleMasterMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioEngine.setMuted(nextMuted);
  };

  // Master DND
  const handleToggleDnd = () => {
    setIsDnd(!isDnd);
    audioEngine.playToneSequence(!isDnd ? [450, 300] : [300, 450], 100);
  };

  // Local Provider Latency Refresh
  const handleRefreshLatency = () => {
    setIsPinging(true);
    audioEngine.playToneSequence([440, 550, 660], 60);
    setTimeout(() => {
      setProviders((prev) =>
        prev.map((p) => ({
          ...p,
          latencyMs:
            p.slug === 'telkom'
              ? Math.floor(Math.random() * 5) + 12
              : p.slug === 'vodacom'
              ? Math.floor(Math.random() * 6) + 16
              : p.slug === 'mtn'
              ? Math.floor(Math.random() * 8) + 18
              : Math.floor(Math.random() * 10) + 15,
        }))
      );
      setIsPinging(false);
    }, 1000);
  };

  // Add Custom SIP Trunk
  const handleAddCustomTrunk = (trunk: Partial<LocalProvider>) => {
    const newTrunk: LocalProvider = {
      id: `prov-custom-${Date.now()}`,
      name: trunk.name || 'Custom SIP Trunk',
      slug: 'custom',
      providerType: 'VoIP Specialist',
      host: trunk.host || 'sip.custom.co.za',
      port: trunk.port || 5060,
      protocol: trunk.protocol || 'UDP',
      registrationStatus: 'registered',
      latencyMs: trunk.latencyMs || 15,
      authUsername: trunk.authUsername || 'custom-user',
      durbanPopLocation: trunk.durbanPopLocation || 'Durban Central',
      codecs: trunk.codecs || ['G.711a (PCMA)', 'G.729'],
      isPrimary: false,
      didRanges: trunk.didRanges || ['+27 (031) ...'],
      channelCapacity: 30,
      activeChannels: 0,
      registeredSince: 'Just now',
    };

    setProviders((prev) => [...prev, newTrunk]);
    audioEngine.playToneSequence([440, 550, 880], 80);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Universal PBX Header with Carrier Telemetry and Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        primaryProvider={primaryProvider}
        office031={office031}
        officeMails={officeMails}
        isMuted={isMuted}
        onToggleMute={handleToggleMasterMute}
        isDnd={isDnd}
        onToggleDnd={handleToggleDnd}
        onSimulateIncomingCall={() =>
          handleSimulateIncomingCall('Transnet Port Dispatch', '031 361 8800')
        }
      />

      {/* Floating Call Forwarding / Notification Toast */}
      {forwardNotification && (
        <div className="fixed top-24 right-4 sm:right-6 z-50 max-w-md bg-gradient-to-r from-amber-950/95 via-slate-900/95 to-amber-950/95 border-2 border-amber-500/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 duration-300 flex items-start gap-3 text-white">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
            <PhoneForwarded className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>PBX Routing Notification</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {forwardNotification}
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'console' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            {/* Top Banner Alert for Incoming Call */}
            {incomingCall && (
              <div
                id="incoming-call-alert"
                className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-emerald-500 rounded-3xl p-5 shadow-2xl text-white flex flex-col md:flex-row items-center justify-between gap-5 animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center animate-bounce">
                    <PhoneIncoming className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500 text-slate-950 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        Incoming 031 DID Call
                      </span>
                      <span className="text-xs text-emerald-300 font-mono">
                        Line 1 ({office031.mainNumber})
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold mt-1 text-white">
                      {incomingCall.remoteName || 'Incoming Caller'}
                    </h2>
                    <p className="text-sm font-mono text-emerald-300">
                      {incomingCall.remoteNumber}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    id="banner-answer-btn"
                    onClick={handleAnswer}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg transition cursor-pointer"
                  >
                    <Phone className="w-5 h-5" />
                    <span>Answer Call</span>
                  </button>

                  <button
                    id="banner-divert-mail-btn"
                    onClick={handleSendToOfficeMail}
                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer text-sm shadow"
                    title="Send caller directly to 031 Office Voicemail"
                  >
                    <Voicemail className="w-4 h-4" />
                    <span>Send to 031 Mail</span>
                  </button>

                  <button
                    id="banner-reject-btn"
                    onClick={handleReject}
                    className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer text-sm shadow"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            )}

            {/* Primary Console Grid: Left is Modern Dialpad, Right is BLF Matrix & Switchboard Orbit */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT: Modern Responsive Dialpad (5 cols on lg) */}
              <div className="lg:col-span-5 space-y-4">
                <Dialpad
                  activeCall={activeCall}
                  incomingCall={incomingCall}
                  selectedLine={selectedLine}
                  setSelectedLine={setSelectedLine}
                  dialNumber={dialNumber}
                  setDialNumber={setDialNumber}
                  onDial={handleDial}
                  onAnswer={handleAnswer}
                  onReject={handleReject}
                  onEndCall={handleEndCall}
                  onToggleHold={handleToggleHold}
                  onToggleMute={handleToggleMute}
                  onToggleRecord={handleToggleRecord}
                  onSendToOfficeMail={handleSendToOfficeMail}
                  onTransferCall={handleTransferCall}
                  office031={office031}
                  primaryProvider={primaryProvider}
                  extensions={extensions}
                  forwardingConfig={forwardingConfig}
                  onUpdateForwarding={handleUpdateForwarding}
                />

                {/* Device Phonebook & Contacts Trigger */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                      <BookUser className="w-4 h-4 text-cyan-400" />
                      <span>Phonebook &amp; Contacts</span>
                    </div>
                    <span className="text-[10px] bg-cyan-950 text-cyan-300 font-mono px-2 py-0.5 rounded-full border border-cyan-800">
                      {contacts.length} saved
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Link native Android/iOS contacts or import vCards for seamless 1-click 031 outbound dialing.
                  </p>

                  <button
                    id="open-console-phonebook-btn"
                    onClick={() => setIsConsolePhonebookOpen(true)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg transition cursor-pointer"
                  >
                    <BookUser className="w-3.5 h-3.5" />
                    <span>Open Phonebook ({contacts.length} Contacts)</span>
                  </button>
                </div>

                {/* Quick Simulation Scenarios Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Test Durban 031 Scenarios</span>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-mono">Live Call Simulation</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { name: 'Durban Pier Customs', num: '031 361 8800' },
                      { name: 'Telkom Voice NOC', num: '031 308 2111' },
                      { name: 'Standard Bank Umhlanga', num: '031 582 3000' },
                      { name: 'Vodacom Business SA', num: '082 994 1234' },
                    ].map((c) => (
                      <button
                        key={c.num}
                        id={`simulate-scenario-${c.num.replace(/\s+/g, '')}`}
                        onClick={() => handleSimulateIncomingCall(c.name, c.num)}
                        className="bg-slate-950 hover:bg-slate-800 border border-slate-800/80 hover:border-cyan-500/50 p-2.5 rounded-xl text-left transition cursor-pointer group"
                      >
                        <div className="font-semibold text-white group-hover:text-cyan-300 truncate">
                          {c.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {c.num}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT: BLF Extension Matrix, Parked Calls, Call Logs (7 cols on lg) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Active Call Live Telemetry (if connected) */}
                {activeCall && (
                  <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-2 border-cyan-500/60 rounded-3xl p-5 text-white shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                          Active Line Session (Line {activeCall.lineId.replace('line', '')})
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        Codec: Opus HD (48kHz)
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <span>{activeCall.remoteName}</span>
                          {activeCall.isMuted && (
                            <span className="bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold px-2 py-0.5 rounded">
                              MUTED
                            </span>
                          )}
                          {activeCall.state === 'on_hold' && (
                            <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">
                              ON HOLD
                            </span>
                          )}
                        </h3>
                        <div className="text-sm font-mono text-cyan-300 mt-0.5">
                          {activeCall.remoteNumber}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-mono font-bold text-white">
                            {Math.floor(activeCall.durationSeconds / 60)
                              .toString()
                              .padStart(2, '0')}
                            :
                            {(activeCall.durationSeconds % 60).toString().padStart(2, '0')}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                            Call Duration
                          </div>
                        </div>

                        {activeCall.isRecording && (
                          <div className="flex items-center gap-1.5 bg-rose-950/80 border border-rose-600/50 text-rose-300 px-3 py-1.5 rounded-xl text-xs font-semibold animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            <span>REC ON</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Park in Orbit Slots 701, 702, 703 */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                      <span className="text-slate-400 font-semibold">
                        Park Call in Switchboard Orbit:
                      </span>
                      <div className="flex items-center gap-2">
                        {[701, 702, 703].map((slot) => {
                          const isOccupied = parkedCalls.some((p) => p.slot === slot);
                          return (
                            <button
                              key={slot}
                              id={`park-slot-${slot}`}
                              onClick={() => handleParkCall(slot)}
                              disabled={isOccupied}
                              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer border ${
                                isOccupied
                                  ? 'bg-slate-950 text-slate-600 border-slate-800 cursor-not-allowed'
                                  : 'bg-slate-800 hover:bg-cyan-600 hover:text-white border-slate-700 text-slate-200'
                              }`}
                            >
                              Orbit {slot} {isOccupied ? '(Busy)' : ''}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Parked Calls Panel if any */}
                {parkedCalls.length > 0 && (
                  <div className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-4 text-white space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-amber-300 text-xs uppercase tracking-wider">
                        <Archive className="w-4 h-4" />
                        <span>Parked Calls in PBX Orbit</span>
                      </div>
                      <span className="text-xs font-mono text-amber-200">
                        {parkedCalls.length} Parked
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {parkedCalls.map((p) => (
                        <div
                          key={p.slot}
                          className="bg-slate-950 border border-amber-500/40 p-3 rounded-xl flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded font-mono">
                                Slot {p.slot}
                              </span>
                              <span className="font-bold text-xs text-white truncate">
                                {p.remoteName}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                              {p.remoteNumber}
                            </div>
                          </div>

                          <button
                            id={`retrieve-park-${p.slot}`}
                            onClick={() => handleRetrieveParkedCall(p.slot)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg transition cursor-pointer shrink-0"
                          >
                            Retrieve
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* BLF Extensions Matrix (Busy Lamp Field) */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-cyan-400" />
                      <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                        Durban Regional Extensions (BLF Matrix)
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">Operator Console</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {extensions.map((ext) => {
                      const isAvailable = ext.status === 'available';
                      const isInCall = ext.status === 'in_call';

                      return (
                        <div
                          key={ext.id}
                          className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-3.5 rounded-2xl transition flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
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
                                <span className="font-bold text-xs text-white">{ext.name}</span>
                                {ext.isCurrentUser && (
                                  <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1 py-0.2 rounded">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">{ext.department}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Dial button */}
                            <button
                              id={`dial-ext-${ext.extensionNumber}`}
                              onClick={() => {
                                setDialNumber(ext.extensionNumber);
                                handleDial(ext.extensionNumber);
                              }}
                              className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-900 hover:bg-slate-800 rounded-xl transition cursor-pointer border border-slate-800"
                              title={`Dial Ext ${ext.extensionNumber}`}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>

                            {/* Transfer button if active call */}
                            {activeCall && !ext.isCurrentUser && (
                              <button
                                id={`quick-transfer-${ext.extensionNumber}`}
                                onClick={() => handleTransferCall(ext.extensionNumber, false)}
                                className="bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold px-2 py-1.5 rounded-xl transition cursor-pointer"
                                title="Transfer Active Call to this Extension"
                              >
                                FWD
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Switchboard Call Logs */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                        Recent Switchboard Call History
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">Line 1 Audit</span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {callLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              log.direction === 'inbound'
                                ? 'bg-emerald-950 text-emerald-400'
                                : 'bg-blue-950 text-blue-400'
                            }`}
                          >
                            {log.direction === 'inbound' ? (
                              <PhoneIncoming className="w-4 h-4" />
                            ) : (
                              <Phone className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white">{log.name}</div>
                            <div className="font-mono text-[11px] text-slate-400">
                              {log.number} • {log.providerName}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <div className="font-mono text-slate-300">
                              {Math.floor(log.durationSeconds / 60)}:
                              {(log.durationSeconds % 60).toString().padStart(2, '0')}
                            </div>
                            <div className="text-[10px] text-slate-500">{log.timestamp}</div>
                          </div>

                          <button
                            id={`redial-log-${log.id}`}
                            onClick={() => {
                              setDialNumber(log.number);
                              handleDial(log.number);
                            }}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 bg-slate-900 rounded-lg transition cursor-pointer"
                            title="Redial"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'agents' && (
          <AgentExtensionsTab
            extensions={extensions}
            onAddExtension={handleAddExtension}
            onUpdateExtension={handleUpdateExtension}
            onDeleteExtension={handleDeleteExtension}
            office031={office031}
            onSelectAgentSoftphone={handleSelectAgentSoftphone}
            forwardingConfig={forwardingConfig}
            onUpdateForwarding={(updates) =>
              setForwardingConfig((prev) => ({ ...prev, ...updates }))
            }
          />
        )}

        {activeTab === 'agent-softphone' && (
          <AgentSoftphoneView
            currentAgent={
              extensions.find((e) => e.extensionNumber === activeAgentExtNumber) ||
              extensions[1] ||
              extensions[0]
            }
            allAgents={extensions}
            onSwitchAgent={(extNum) => setActiveAgentExtNumber(extNum)}
            office031={office031}
            primaryProvider={primaryProvider}
            onTransferToSwitchboard={() => setActiveTab('console')}
            forwardedCallFromSwitchboard={forwardedToAgentCall}
            onAcceptForwardedCall={() => setForwardedToAgentCall(null)}
            onRejectForwardedCall={() => setForwardedToAgentCall(null)}
            phoneContacts={contacts}
            onAddContact={handleAddContact}
            onAddBatchContacts={handleAddBatchContacts}
            onDeleteContact={handleDeleteContact}
            onToggleFavoriteContact={handleToggleFavoriteContact}
          />
        )}

        {activeTab === 'deskphone' && (
          <DesktopPhoneView
            activeCall={activeCall}
            incomingCall={incomingCall}
            office031={office031}
            primaryProvider={primaryProvider}
            extensions={extensions}
            officeMails={officeMails}
            onDial={handleDial}
            onAnswer={handleAnswer}
            onReject={handleReject}
            onEndCall={handleEndCall}
            onToggleHold={handleToggleHold}
            onToggleMute={handleToggleMute}
            onTransferCall={handleTransferCall}
            onSendToOfficeMail={handleSendToOfficeMail}
            onOpenOfficeMailTab={() => setActiveTab('officemail')}
            onOpenProvisionTab={() => setActiveTab('provision')}
          />
        )}

        {activeTab === 'providers' && (
          <NetworkProvidersTab
            providers={providers}
            onSetPrimaryProvider={setPrimaryProviderId}
            onRefreshLatency={handleRefreshLatency}
            isPinging={isPinging}
            office031={office031}
            onAddNewCustomTrunk={handleAddCustomTrunk}
          />
        )}

        {activeTab === 'officemail' && (
          <OfficeMailTab
            office031={office031}
            onUpdateOffice031={(updates) => setOffice031((prev) => ({ ...prev, ...updates }))}
            officeMails={officeMails}
            onToggleReadMail={(id) => {
              setOfficeMails((prev) =>
                prev.map((m) => (m.id === id ? { ...m, isRead: !m.isRead } : m))
              );
            }}
            onDeleteMail={(id) => {
              setOfficeMails((prev) => prev.filter((m) => m.id !== id));
            }}
            onSimulateNewVoicemail={() => {
              const newMail: OfficeMailItem = {
                id: `mail-${Date.now()}`,
                callerNumber: '031 940 1234',
                callerName: 'KZN Logistics Port Authority',
                timestamp: 'Just now',
                durationSeconds: 35,
                audioDurationStr: '0:35',
                isRead: false,
                transcription:
                  'Good day, Durban switchboard. Calling regarding container booking dispatch on Pier 1. Please call us back or forward to Ext 106 Logistics.',
                urgent: true,
                emailSentTo: office031.voicemailEmailNotify,
              };
              setOfficeMails((prev) => [newMail, ...prev]);
              audioEngine.playVoicemailTone();
            }}
            onCallBack={(num) => {
              setActiveTab('console');
              setDialNumber(num);
              handleDial(num);
            }}
          />
        )}

        {activeTab === 'provision' && (
          <DeviceProvisioningTab
            office031={office031}
            onUpdateOffice031={(updates) => setOffice031((prev) => ({ ...prev, ...updates }))}
            primaryProvider={primaryProvider}
            extensions={extensions}
          />
        )}
      </main>

      {/* Switchboard Console Phonebook Drawer */}
      <PhonebookDrawer
        isOpen={isConsolePhonebookOpen}
        onClose={() => setIsConsolePhonebookOpen(false)}
        contacts={contacts}
        onAddContact={handleAddContact}
        onAddBatchContacts={handleAddBatchContacts}
        onDeleteContact={handleDeleteContact}
        onToggleFavorite={handleToggleFavoriteContact}
        onCallContact={(phone) => {
          setDialNumber(phone);
          handleDial(phone);
        }}
        outboundCli={office031.mainNumber}
      />
    </div>
  );
}
