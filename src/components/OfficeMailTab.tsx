import React, { useState } from 'react';
import {
  Mail,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Trash2,
  PhoneCall,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  Sliders,
  FileAudio,
  Radio,
  User,
  ShieldCheck,
  BellRing,
} from 'lucide-react';
import { Office031Config, OfficeMailItem } from '../types';
import { audioEngine } from '../utils/audioEngine';

interface OfficeMailTabProps {
  office031: Office031Config;
  onUpdateOffice031: (updates: Partial<Office031Config>) => void;
  officeMails: OfficeMailItem[];
  onToggleReadMail: (id: string) => void;
  onDeleteMail: (id: string) => void;
  onSimulateNewVoicemail: () => void;
  onCallBack: (number: string) => void;
}

export const OfficeMailTab: React.FC<OfficeMailTabProps> = ({
  office031,
  onUpdateOffice031,
  officeMails,
  onToggleReadMail,
  onDeleteMail,
  onSimulateNewVoicemail,
  onCallBack,
}) => {
  const [playingMailId, setPlayingMailId] = useState<string | null>(null);
  const [isPlayingGreeting, setIsPlayingGreeting] = useState(false);
  const [emailInput, setEmailInput] = useState(office031.voicemailEmailNotify);
  const [isSavedEmail, setIsSavedEmail] = useState(false);
  const [greetingText, setGreetingText] = useState(office031.greetingScript);
  const [isEditingGreeting, setIsEditingGreeting] = useState(false);
  const [testEmailSentMessage, setTestEmailSentMessage] = useState<string | null>(null);

  const unreadCount = officeMails.filter((m) => !m.isRead).length;

  const handlePlayMail = (mail: OfficeMailItem) => {
    if (playingMailId === mail.id) {
      audioEngine.stopSpeaking();
      setPlayingMailId(null);
    } else {
      audioEngine.stopSpeaking();
      setPlayingMailId(mail.id);
      if (!mail.isRead) {
        onToggleReadMail(mail.id);
      }
      audioEngine.speakText(mail.transcription, () => {
        setPlayingMailId(null);
      });
    }
  };

  const handlePlayGreeting = () => {
    if (isPlayingGreeting) {
      audioEngine.stopSpeaking();
      setIsPlayingGreeting(false);
    } else {
      setIsPlayingGreeting(true);
      audioEngine.speakText(greetingText, () => {
        setIsPlayingGreeting(false);
      });
    }
  };

  const handleSaveEmail = () => {
    onUpdateOffice031({ voicemailEmailNotify: emailInput });
    setIsSavedEmail(true);
    setTimeout(() => setIsSavedEmail(false), 2000);
  };

  const handleSendTestEmail = () => {
    setTestEmailSentMessage(`Test audio dispatch dispatched to ${office031.voicemailEmailNotify}`);
    setTimeout(() => setTestEmailSentMessage(null), 3500);
  };

  const handleSaveGreeting = () => {
    onUpdateOffice031({ greetingScript: greetingText });
    setIsEditingGreeting(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner: Office Mail 031 Provisioning Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 text-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-950/50">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Office Mail Provisioning (031 DID)
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                MWI Lamp Active
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-0.5">
              Office Mailbox for {office031.formattedInternational}
            </h2>
            <p className="text-xs text-slate-400">
              Assigned to Desktop Switchboard Phone (Ext 101) • Access Code: {office031.voicemailNumber}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="simulate-voicemail-btn"
            onClick={onSimulateNewVoicemail}
            className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Simulate Incoming 031 Voicemail</span>
          </button>

          <button
            id="test-email-dispatch-btn"
            onClick={handleSendTestEmail}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow"
          >
            <Send className="w-3.5 h-3.5 text-cyan-400" />
            <span>Test Email Dispatch</span>
          </button>
        </div>
      </div>

      {testEmailSentMessage && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs p-3 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{testEmailSentMessage}</span>
        </div>
      )}

      {/* Main Grid: Left is Inbox, Right is Voicemail-to-Email & Greeting Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Voicemail Inbox for 031 Number (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                  031 Office Mail Inbox
                </h3>
                {unreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 font-mono">Mailbox *97</span>
            </div>

            {/* List of Messages */}
            <div className="space-y-3">
              {officeMails.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs">
                  No voicemails in office mailbox. Use the simulate button above to test.
                </div>
              ) : (
                officeMails.map((mail) => {
                  const isPlaying = playingMailId === mail.id;

                  return (
                    <div
                      key={mail.id}
                      id={`mail-item-${mail.id}`}
                      className={`p-4 rounded-xl border transition space-y-3 ${
                        isPlaying
                          ? 'bg-amber-950/40 border-amber-500/70 shadow'
                          : mail.isRead
                          ? 'bg-slate-950/60 border-slate-800'
                          : 'bg-slate-950 border-amber-500/40 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <button
                            id={`play-mail-${mail.id}`}
                            onClick={() => handlePlayMail(mail)}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer ${
                              isPlaying
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            }`}
                            title={isPlaying ? 'Stop Playback' : 'Play Audio Recording'}
                          >
                            {isPlaying ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4 ml-0.5" />
                            )}
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white">
                                {mail.callerName}
                              </span>
                              {!mail.isRead && (
                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                              )}
                              {mail.urgent && (
                                <span className="bg-rose-950 text-rose-300 border border-rose-800 text-[9px] font-bold px-1.5 py-0.2 rounded">
                                  URGENT
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-mono text-cyan-400">
                              {mail.callerNumber}
                            </div>
                          </div>
                        </div>

                        <div className="text-right text-xs">
                          <div className="font-mono text-slate-300">{mail.audioDurationStr}</div>
                          <div className="text-[10px] text-slate-500">{mail.timestamp}</div>
                        </div>
                      </div>

                      {/* Transcribed Text */}
                      <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                        <div className="text-[10px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>Voicemail Transcription:</span>
                        </div>
                        {mail.transcription}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Dispatched to {mail.emailSentTo}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            id={`callback-${mail.id}`}
                            onClick={() => onCallBack(mail.callerNumber)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          >
                            <PhoneCall className="w-3 h-3" />
                            <span>Call Back</span>
                          </button>

                          <button
                            onClick={() => onToggleReadMail(mail.id)}
                            className="text-slate-400 hover:text-white px-2 py-1 text-xs"
                          >
                            {mail.isRead ? 'Mark Unread' : 'Mark Read'}
                          </button>

                          <button
                            onClick={() => onDeleteMail(mail.id)}
                            className="text-slate-400 hover:text-rose-400 p-1 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Voicemail-to-Email Setup & Custom Greeting Studio (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Voicemail-to-Email Routing Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                  Voicemail-to-Email Forwarding
                </h3>
              </div>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800/60 font-mono">
                SMTP Active
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Recipient Email Notification Address
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500 font-mono text-xs"
                  />
                  <button
                    onClick={handleSaveEmail}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3 py-2 rounded-xl transition cursor-pointer"
                  >
                    Save
                  </button>
                </div>
                {isSavedEmail && (
                  <span className="text-emerald-400 text-[11px] mt-1 block">
                    Email address updated!
                  </span>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-300">Attach MP3 Audio to Email</span>
                  <input
                    type="checkbox"
                    checked={office031.voicemailEmailAttachMp3}
                    onChange={(e) =>
                      onUpdateOffice031({ voicemailEmailAttachMp3: e.target.checked })
                    }
                    className="rounded text-cyan-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-300">Include Automated AI Transcription</span>
                  <input
                    type="checkbox"
                    checked={office031.voicemailAiTranscript}
                    onChange={(e) =>
                      onUpdateOffice031({ voicemailAiTranscript: e.target.checked })
                    }
                    className="rounded text-cyan-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-300">Light MWI LED on Desktop Switchboard</span>
                  <input
                    type="checkbox"
                    checked={office031.mwiLampEnabled}
                    onChange={(e) => onUpdateOffice031({ mwiLampEnabled: e.target.checked })}
                    className="rounded text-cyan-500"
                  />
                </label>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Ring Duration Before Voicemail:</span>
                  <span className="font-mono text-cyan-300">
                    {office031.ringDurationBeforeMailSeconds} seconds (4 rings)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Corporate 031 Audio Greeting Studio */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <FileAudio className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                  031 Office Greeting Audio
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">South Africa KZN Format</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  {office031.greetingAudioTitle}
                </span>
                <button
                  id="preview-greeting-btn"
                  onClick={handlePlayGreeting}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isPlayingGreeting ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isPlayingGreeting ? 'Stop Preview' : 'Listen Greeting'}</span>
                </button>
              </div>

              {isEditingGreeting ? (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={greetingText}
                    onChange={(e) => setGreetingText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setIsEditingGreeting(false)}
                      className="text-xs text-slate-400 hover:text-white px-2 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveGreeting}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-lg cursor-pointer"
                    >
                      Save Script
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-slate-400 italic bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80">
                    "{office031.greetingScript}"
                  </p>
                  <button
                    onClick={() => setIsEditingGreeting(true)}
                    className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                  >
                    Edit Greeting Script
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
