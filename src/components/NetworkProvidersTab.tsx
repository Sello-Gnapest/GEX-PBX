import React, { useState } from 'react';
import {
  Server,
  Radio,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  ArrowUpDown,
  ShieldCheck,
  Plus,
  Network,
  Globe,
  Gauge,
  PhoneForwarded,
} from 'lucide-react';
import { LocalProvider, Office031Config } from '../types';

interface NetworkProvidersTabProps {
  providers: LocalProvider[];
  onSetPrimaryProvider: (id: string) => void;
  onRefreshLatency: () => void;
  isPinging: boolean;
  office031: Office031Config;
  onAddNewCustomTrunk: (trunk: Partial<LocalProvider>) => void;
}

export const NetworkProvidersTab: React.FC<NetworkProvidersTabProps> = ({
  providers,
  onSetPrimaryProvider,
  onRefreshLatency,
  isPinging,
  office031,
  onAddNewCustomTrunk,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customHost, setCustomHost] = useState('');
  const [customPort, setCustomPort] = useState(5060);
  const [customProtocol, setCustomProtocol] = useState<'UDP' | 'TCP' | 'TLS'>('UDP');
  const [customUser, setCustomUser] = useState('');
  const [customPop, setCustomPop] = useState('Durban Gateway Point');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customHost) return;

    onAddNewCustomTrunk({
      name: customName,
      slug: 'custom',
      providerType: 'VoIP Specialist',
      host: customHost,
      port: Number(customPort),
      protocol: customProtocol,
      authUsername: customUser || 'sip-user',
      durbanPopLocation: customPop,
      latencyMs: Math.floor(Math.random() * 15) + 12,
      codecs: ['G.711a (PCMA)', 'G.729'],
      isPrimary: false,
      didRanges: ['+27 (031) ...'],
      channelCapacity: 10,
      activeChannels: 0,
    });

    setShowAddModal(false);
    setCustomName('');
    setCustomHost('');
    setCustomUser('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-white">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              South Africa Telecommunications Interconnect
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
              ICASA Licensed
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            Local Network Providers & SIP Trunks
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Link and manage regional Durban (031) pilot voice trunks, least-cost routing, and SIP peering.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="ping-providers-btn"
            onClick={onRefreshLatency}
            disabled={isPinging}
            className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{isPinging ? 'Testing SIP Latency...' : 'Ping All Trunks (OPTIONS)'}</span>
          </button>

          <button
            id="add-trunk-btn"
            onClick={() => setShowAddModal(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom SIP Trunk</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {providers.map((prov) => {
          const isRegistered = prov.registrationStatus === 'registered';
          const isPrimary = prov.isPrimary;

          return (
            <div
              key={prov.id}
              id={`provider-card-${prov.slug}`}
              className={`rounded-2xl border p-5 transition flex flex-col justify-between space-y-4 ${
                isPrimary
                  ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-cyan-500/80 shadow-lg shadow-cyan-950/40'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        prov.slug === 'telkom'
                          ? 'bg-blue-600 text-white'
                          : prov.slug === 'vodacom'
                          ? 'bg-red-600 text-white'
                          : prov.slug === 'mtn'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-cyan-700 text-white'
                      }`}
                    >
                      {prov.slug === 'telkom'
                        ? 'TK'
                        : prov.slug === 'vodacom'
                        ? 'VC'
                        : prov.slug === 'mtn'
                        ? 'MTN'
                        : 'SIP'}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">{prov.name}</h3>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {prov.providerType}
                      </span>
                    </div>
                  </div>

                  {isPrimary && (
                    <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Primary 031 Trunk
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Host:</span>
                    <span className="text-slate-200">{prov.host}:{prov.port}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Protocol:</span>
                    <span className="text-cyan-300 font-semibold">{prov.protocol}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Auth ID:</span>
                    <span className="text-slate-300 truncate max-w-[150px]">{prov.authUsername}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Durban Exchange:</span>
                    <span className="text-slate-300 text-[11px] truncate max-w-[160px]">
                      {prov.durbanPopLocation}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Ping Latency:</span>
                    <span
                      className={`font-mono font-bold ${
                        prov.latencyMs < 20
                          ? 'text-emerald-400'
                          : prov.latencyMs < 40
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {prov.latencyMs}ms
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px]">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isRegistered ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                      }`}
                    />
                    <span className={isRegistered ? 'text-emerald-400 font-medium' : 'text-rose-400'}>
                      {isRegistered ? 'REGISTERED' : 'OFFLINE'}
                    </span>
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                  <span className="text-slate-500">DID Block:</span>
                  <span className="text-slate-300 font-mono">{prov.didRanges.join(', ')}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                {isPrimary ? (
                  <div className="w-full py-2 bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Active Route for {office031.mainNumber}</span>
                  </div>
                ) : (
                  <button
                    id={`set-primary-${prov.slug}`}
                    onClick={() => onSetPrimaryProvider(prov.id)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Set as Primary 031 Trunk</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">
              PBX Dial Plan & Route Allocation
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Durban KZN Dialing Matrix</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3 font-semibold">Route Name</th>
                <th className="py-2.5 px-3 font-semibold">Prefix Pattern</th>
                <th className="py-2.5 px-3 font-semibold">Primary Carrier</th>
                <th className="py-2.5 px-3 font-semibold">Failover Route</th>
                <th className="py-2.5 px-3 font-semibold">Destination Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Inbound Office Main (031)</td>
                <td className="py-2.5 px-3 text-cyan-300">{office031.formattedInternational}</td>
                <td className="py-2.5 px-3 text-emerald-400">Telkom Enterprise SIP</td>
                <td className="py-2.5 px-3 text-slate-400">031 Office Mail (*97)</td>
                <td className="py-2.5 px-3 text-cyan-300">Switchboard Desk Phone (Ext 101)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Local KZN / Durban</td>
                <td className="py-2.5 px-3 text-cyan-300">031XXXXXXX</td>
                <td className="py-2.5 px-3 text-emerald-400">Telkom KZN Direct</td>
                <td className="py-2.5 px-3 text-slate-400">Switch Telecom</td>
                <td className="py-2.5 px-3 text-slate-300">Local Exchange Breakout</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Mobile Carriers (SA)</td>
                <td className="py-2.5 px-3 text-cyan-300">082/083/084/072/076</td>
                <td className="py-2.5 px-3 text-emerald-400">Vodacom / MTN Interconnect</td>
                <td className="py-2.5 px-3 text-slate-400">Telkom Cellular LCR</td>
                <td className="py-2.5 px-3 text-slate-300">Direct Cellular Gateway</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">National Long Distance</td>
                <td className="py-2.5 px-3 text-cyan-300">01X / 02X / 04X / 05X</td>
                <td className="py-2.5 px-3 text-emerald-400">Telkom SA Enterprise</td>
                <td className="py-2.5 px-3 text-slate-400">Liquid Intelligent Tech</td>
                <td className="py-2.5 px-3 text-slate-300">National Voice Cloud</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Emergency Services</td>
                <td className="py-2.5 px-3 text-rose-400">10111, 112, 10177</td>
                <td className="py-2.5 px-3 text-rose-400 font-bold">Telkom SA Priority 1</td>
                <td className="py-2.5 px-3 text-slate-400">Direct GSM Fallback</td>
                <td className="py-2.5 px-3 text-slate-300">Public Safety Answer Point</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Add Custom Network Provider / Trunk</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Provider / Carrier Name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Durban Metro Fibre Voice"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">SIP Registrar / Host</label>
                  <input
                    type="text"
                    value={customHost}
                    onChange={(e) => setCustomHost(e.target.value)}
                    placeholder="sip.voice.co.za"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Port</label>
                  <input
                    type="number"
                    value={customPort}
                    onChange={(e) => setCustomPort(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Transport</label>
                  <select
                    value={customProtocol}
                    onChange={(e) => setCustomProtocol(e.target.value as 'UDP' | 'TCP' | 'TLS')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                  >
                    <option value="UDP">UDP (Standard)</option>
                    <option value="TLS">TLS (Encrypted)</option>
                    <option value="TCP">TCP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Auth Username</label>
                  <input
                    type="text"
                    value={customUser}
                    onChange={(e) => setCustomUser(e.target.value)}
                    placeholder="trunk-auth-id"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Local POP / Point of Presence</label>
                <input
                  type="text"
                  value={customPop}
                  onChange={(e) => setCustomPop(e.target.value)}
                  placeholder="e.g. Durban Umhlanga Exchange"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                >
                  Save & Register Trunk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
