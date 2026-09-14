import React, { useState } from 'react';
import {
  Smartphone,
  Radio,
  PhoneForwarded,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  PhoneCall,
  BellRing,
  X,
  Zap,
  PhoneOutgoing,
} from 'lucide-react';
import { Extension, Office031Config } from '../types';
import { detectCarrier } from '../utils/carrierDetector';

interface MobileLinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Extension;
  office031: Office031Config;
  onSave: (agentId: string, updates: Partial<Extension>) => void;
  onTestMobileCall?: (mobileNum: string, agentName: string) => void;
}

export const MobileLinkingModal: React.FC<MobileLinkingModalProps> = ({
  isOpen,
  onClose,
  agent,
  office031,
  onSave,
  onTestMobileCall,
}) => {
  const [mobileInput, setMobileInput] = useState(agent.mobileNumber || '076 101 5283');
  const [twinningMode, setTwinningMode] = useState<'simultaneous' | 'follow_me' | 'unconditional' | 'off'>(
    agent.mobileTwinningMode || 'simultaneous'
  );
  const [outboundCliChoice, setOutboundCliChoice] = useState<'office_031' | 'mobile_number'>(
    agent.outboundCli === agent.mobileNumber ? 'mobile_number' : 'office_031'
  );
  const [testCallActive, setTestCallActive] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const carrierInfo = detectCarrier(mobileInput);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = mobileInput.trim();
    const updates: Partial<Extension> = {
      mobileNumber: cleanNumber,
      mobileCarrier: carrierInfo.carrier as any,
      mobileTwinningMode: twinningMode,
      outboundCli: outboundCliChoice === 'office_031' ? office031.mainNumber : cleanNumber,
    };
    onSave(agent.id, updates);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleTestRing = () => {
    setTestCallActive(true);
    if (onTestMobileCall) {
      onTestMobileCall(mobileInput, agent.name);
    }
    setTimeout(() => setTestCallActive(false), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full shadow-2xl p-6 text-white space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center shadow-lg shadow-rose-950">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>Link Mobile Phone Number</span>
                <span className="text-xs bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded-full font-mono">
                  GSM / LTE
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Bridge <span className="text-white font-semibold">{agent.name}</span> (Ext {agent.extensionNumber}) with a cellular SIM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleApply} className="space-y-4">
          {/* Mobile Phone Number Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Mobile Phone Number (e.g. Vodacom 076...):</span>
              <span className="text-[11px] text-cyan-400 font-mono">South Africa (+27)</span>
            </label>

            <div className="relative">
              <input
                type="tel"
                value={mobileInput}
                onChange={(e) => setMobileInput(e.target.value)}
                placeholder="076 101 5283"
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-2xl py-3 px-4 text-sm font-mono text-white placeholder:text-slate-600 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setMobileInput('076 101 5283')}
                className="absolute right-2 top-2 text-[11px] bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 px-2.5 py-1.5 rounded-xl border border-slate-700 transition cursor-pointer font-mono"
              >
                Use 076 101 5283
              </button>
            </div>

            {/* Carrier Detection & Routing Card */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">Detected Carrier:</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${carrierInfo.badgeColor}`}
                    >
                      {carrierInfo.carrier}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {carrierInfo.networkRouting}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400">E.164 Format</div>
                <div className="font-mono text-xs text-white">{carrierInfo.formattedInternational}</div>
              </div>
            </div>
          </div>

          {/* Linking / Twinning Modes */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Inbound Call Routing to Mobile Number:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: Mobile Twinning (Dual Ring) */}
              <div
                onClick={() => setTwinningMode('simultaneous')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between gap-2 ${
                  twinningMode === 'simultaneous'
                    ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950/40'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs text-white">Mobile Twinning</span>
                  </div>
                  <input
                    type="radio"
                    name="twinningMode"
                    checked={twinningMode === 'simultaneous'}
                    onChange={() => setTwinningMode('simultaneous')}
                    className="accent-rose-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  <strong className="text-slate-200">Dual-Ring:</strong> Softphone and Vodacom mobile ring at the exact same time. Answer from either.
                </p>
              </div>

              {/* Option 2: Follow-Me / Overflow */}
              <div
                onClick={() => setTwinningMode('follow_me')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between gap-2 ${
                  twinningMode === 'follow_me'
                    ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950/40'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <PhoneForwarded className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-xs text-white">Follow-Me (No Answer)</span>
                  </div>
                  <input
                    type="radio"
                    name="twinningMode"
                    checked={twinningMode === 'follow_me'}
                    onChange={() => setTwinningMode('follow_me')}
                    className="accent-rose-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  <strong className="text-slate-200">Overflow:</strong> Rings softphone for 15 sec (4 rings). If unanswered, diverts automatically to mobile.
                </p>
              </div>

              {/* Option 3: Unconditional Divert */}
              <div
                onClick={() => setTwinningMode('unconditional')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between gap-2 ${
                  twinningMode === 'unconditional'
                    ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950/40'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-xs text-white">Direct Divert (Always)</span>
                  </div>
                  <input
                    type="radio"
                    name="twinningMode"
                    checked={twinningMode === 'unconditional'}
                    onChange={() => setTwinningMode('unconditional')}
                    className="accent-rose-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  <strong className="text-slate-200">100% Mobile:</strong> Bypasses softphone completely and rings directly on the Vodacom SIM.
                </p>
              </div>

              {/* Option 4: Disabled */}
              <div
                onClick={() => setTwinningMode('off')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between gap-2 ${
                  twinningMode === 'off'
                    ? 'bg-slate-800 border-slate-600'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-bold text-xs text-slate-300">Softphone Only</span>
                  <input
                    type="radio"
                    name="twinningMode"
                    checked={twinningMode === 'off'}
                    onChange={() => setTwinningMode('off')}
                    className="accent-slate-500 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Mobile number is saved for SMS / directory only. Inbound calls ring softphone.
                </p>
              </div>
            </div>
          </div>

          {/* Outbound Caller ID Masking */}
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-xs text-white">Outbound Caller ID Masking (CLI)</span>
              </div>
              <span className="text-[10px] text-slate-400">When calling clients</span>
            </div>

            <p className="text-[11px] text-slate-400">
              When making calls from this phone via the PWA softphone, choose which number the recipient sees on their screen:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-cyan-500">
                <input
                  type="radio"
                  name="cliOption"
                  checked={outboundCliChoice === 'office_031'}
                  onChange={() => setOutboundCliChoice('office_031')}
                  className="accent-cyan-500"
                />
                <div>
                  <div className="font-bold text-xs text-white">Office 031 Number</div>
                  <div className="text-[10px] font-mono text-cyan-300">{office031.mainNumber}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Keeps cell private</div>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-rose-500">
                <input
                  type="radio"
                  name="cliOption"
                  checked={outboundCliChoice === 'mobile_number'}
                  onChange={() => setOutboundCliChoice('mobile_number')}
                  className="accent-rose-500"
                />
                <div>
                  <div className="font-bold text-xs text-white">Mobile Direct CLI</div>
                  <div className="text-[10px] font-mono text-rose-300">{mobileInput || '076 101 5283'}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Presents cell number</div>
                </div>
              </label>
            </div>
          </div>

          {/* Test Call Simulation Banner */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-xs font-semibold text-white">Test Mobile Dual-Ring</div>
                <div className="text-[10px] text-slate-400">
                  Simulate a 031 call ringing {mobileInput} via Vodacom
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestRing}
              disabled={testCallActive}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                testCallActive
                  ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-800/60'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{testCallActive ? 'Ringing 076...' : 'Test Ring'}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-lg shadow-rose-950 transition cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Linked Successfully!</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4" />
                  <span>Save &amp; Link Mobile Number</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
