import React from 'react';
import {
  Phone,
  PhoneCall,
  Server,
  Mail,
  Sliders,
  Volume2,
  VolumeX,
  BellOff,
  Bell,
  Radio,
  CheckCircle2,
  Users,
  Headphones,
  Globe,
} from 'lucide-react';
import { LocalProvider, Office031Config, OfficeMailItem } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

export type AppTab =
  | 'console'
  | 'agents'
  | 'agent-softphone'
  | 'deskphone'
  | 'providers'
  | 'officemail'
  | 'provision';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  primaryProvider: LocalProvider;
  office031: Office031Config;
  officeMails: OfficeMailItem[];
  isMuted: boolean;
  onToggleMute: () => void;
  isDnd: boolean;
  onToggleDnd: () => void;
  onSimulateIncomingCall: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  primaryProvider,
  office031,
  officeMails,
  isMuted,
  onToggleMute,
  isDnd,
  onToggleDnd,
  onSimulateIncomingCall,
}) => {
  const unreadMails = officeMails.filter((m) => !m.isRead).length;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
      {/* Top utility bar with network status and quick telemetry */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 px-2.5 py-1 rounded-full font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{primaryProvider.name}</span>
            <span className="text-emerald-500 font-mono">({primaryProvider.latencyMs}ms)</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-slate-400 bg-slate-800/70 border border-slate-700/50 px-2.5 py-1 rounded-full">
            <Radio className="w-3 h-3 text-cyan-400" />
            <span>Exchange:</span>
            <span className="text-slate-200 font-medium">{primaryProvider.durbanPopLocation}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-amber-950/60 border border-amber-600/40 text-amber-300 px-2.5 py-1 rounded-full font-mono">
            <span className="font-semibold text-amber-200">DID:</span>
            <span>{office031.mainNumber}</span>
            <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-200">KZN 031</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* PWA Install Button */}
          <PWAInstallButton variant="compact" />

          {/* Incoming Call Simulator trigger */}
          <button
            id="simulate-call-btn"
            onClick={onSimulateIncomingCall}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-2.5 py-1 rounded transition text-xs shadow-sm cursor-pointer"
            title="Simulate incoming client call to 031 number"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Simulate 031 Call</span>
            <span className="sm:hidden">Simulate</span>
          </button>

          {/* DND Toggle */}
          <button
            id="dnd-toggle-btn"
            onClick={onToggleDnd}
            className={`flex items-center gap-1 px-2 py-1 rounded border transition text-xs cursor-pointer ${
              isDnd
                ? 'bg-rose-900/80 border-rose-700 text-rose-200'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Toggle Do Not Disturb"
          >
            {isDnd ? <BellOff className="w-3 h-3 text-rose-400" /> : <Bell className="w-3 h-3 text-slate-400" />}
            <span className="hidden md:inline">{isDnd ? 'DND ON' : 'DND'}</span>
          </button>

          {/* Master Audio Mute */}
          <button
            id="audio-mute-btn"
            onClick={onToggleMute}
            className={`p-1.5 rounded border transition cursor-pointer ${
              isMuted
                ? 'bg-amber-900/60 border-amber-700 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isMuted ? 'Sound Muted' : 'Sound Enabled'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main header row with logo and tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-950/60 relative border border-cyan-400/30">
            <Globe className="w-5 h-5 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span className="bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                  GEX PBX
                </span>
                <span className="text-[10px] uppercase tracking-widest font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-700/60 shadow-sm font-bold">
                  Enterprise OS
                </span>
              </h1>
              <span className="hidden md:inline-block text-[11px] text-slate-400 font-medium">
                (Global Extension Exchange)
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-cyan-400 font-medium">Ext 101 Console</span>
              <span>•</span>
              <span className="text-slate-300 font-medium">031 Durban Metro Pilot</span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Desk Phone Provisioned
              </span>
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
          <button
            id="tab-console"
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === 'console'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Switchboard (Ext 101)</span>
          </button>

          <button
            id="tab-agents"
            onClick={() => setActiveTab('agents')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === 'agents'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Office Agents &amp; PWA</span>
          </button>

          <button
            id="tab-agent-softphone"
            onClick={() => setActiveTab('agent-softphone')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === 'agent-softphone'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Agent Softphone</span>
          </button>

          <button
            id="tab-deskphone"
            onClick={() => setActiveTab('deskphone')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === 'deskphone'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>Desktop Phone</span>
          </button>

          <button
            id="tab-officemail"
            onClick={() => setActiveTab('officemail')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer relative whitespace-nowrap ${
              activeTab === 'officemail'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>031 Office Mail</span>
            {unreadMails > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                {unreadMails}
              </span>
            )}
          </button>

          <button
            id="tab-providers"
            onClick={() => setActiveTab('providers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === 'providers'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Local Providers (SA)</span>
          </button>

          <button
            id="tab-provision"
            onClick={() => setActiveTab('provision')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === 'provision'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Provisioning</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
