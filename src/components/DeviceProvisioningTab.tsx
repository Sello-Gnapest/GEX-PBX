import React, { useState } from 'react';
import {
  Sliders,
  Download,
  Copy,
  Check,
  Server,
  Phone,
  RefreshCw,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Laptop,
  Layers,
} from 'lucide-react';
import { DesktopPhoneModel, Extension, LocalProvider, Office031Config } from '../types';
import { DESKTOP_PHONE_MODELS } from '../utils/pbxDefaults';
import { generateProvisionConfig } from '../utils/provisionGenerator';

interface DeviceProvisioningTabProps {
  office031: Office031Config;
  onUpdateOffice031: (updates: Partial<Office031Config>) => void;
  primaryProvider: LocalProvider;
  extensions: Extension[];
}

export const DeviceProvisioningTab: React.FC<DeviceProvisioningTabProps> = ({
  office031,
  onUpdateOffice031,
  primaryProvider,
  extensions,
}) => {
  const [selectedModelId, setSelectedModelId] = useState(office031.deskPhoneModel);
  const [macAddress, setMacAddress] = useState(office031.deskPhoneMac);
  const [phoneIp, setPhoneIp] = useState(office031.deskPhoneIp);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const currentModel =
    DESKTOP_PHONE_MODELS.find((m) => m.id === selectedModelId) || DESKTOP_PHONE_MODELS[0];

  const generatedConfig = generateProvisionConfig(
    { ...office031, deskPhoneMac: macAddress, deskPhoneIp: phoneIp, deskPhoneModel: selectedModelId },
    primaryProvider,
    extensions,
    currentModel
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedConfig);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  const handleDownload = () => {
    const filename = `${macAddress.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}.${
      currentModel.configFormat === 'yealink_cfg' ? 'cfg' : 'xml'
    }`;
    const blob = new Blob([generatedConfig], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveParameters = () => {
    onUpdateOffice031({
      deskPhoneModel: selectedModelId,
      deskPhoneMac: macAddress,
      deskPhoneIp: phoneIp,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-white">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Auto-Provisioning Engine
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                Zero-Touch SIP Active
              </span>
            </div>
            <h2 className="text-xl font-bold mt-0.5">
              Desktop Switchboard Phone Binding (DID: {office031.formattedInternational})
            </h2>
            <p className="text-xs text-slate-400">
              Provision Line 1 to the Durban 031 Office Pilot DID and configure Office Mail MWI keys.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Config</span>
          </button>
          <button
            onClick={handleCopy}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-700 flex items-center gap-2 transition cursor-pointer"
          >
            {copiedConfig ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedConfig ? 'Copied' : 'Copy Config'}</span>
          </button>
        </div>
      </div>

      {isSaved && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs p-3 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Provisioning parameters successfully saved and synchronized with PBX trunk!</span>
        </div>
      )}

      {/* Model Selection & Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Device Selection & IP Configuration */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-cyan-400" />
              <span>Select Desktop Phone Model</span>
            </h3>

            <div className="space-y-2.5">
              {DESKTOP_PHONE_MODELS.map((model) => (
                <div
                  key={model.id}
                  onClick={() => setSelectedModelId(model.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    selectedModelId === model.id
                      ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{model.displayName}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400">
                      {model.brand}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{model.description}</p>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                    <span>Screen: {model.screenType}</span>
                    <span>•</span>
                    <span>BLF Keys: {model.blfKeys}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-amber-400" />
              <span>Device Network & MAC</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Device Hardware MAC Address
                </label>
                <input
                  type="text"
                  value={macAddress}
                  onChange={(e) => setMacAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Static LAN IP</label>
                <input
                  type="text"
                  value={phoneIp}
                  onChange={(e) => setPhoneIp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Provisioning Server URL (DHCP Option 66)
                </label>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 font-mono text-[11px] text-cyan-300 select-all">
                  http://prov.gexpbx.co.za/cfg/{macAddress.replace(/[^a-zA-Z0-9]/g, '')}.cfg
                </div>
              </div>

              <button
                onClick={handleSaveParameters}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded-xl transition cursor-pointer"
              >
                Apply & Save Parameters
              </button>
            </div>
          </div>
        </div>

        {/* Right: Live Config Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Generated Provisioning Configuration</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">{currentModel.configFormat}</span>
            </div>

            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 max-h-[520px] overflow-y-auto leading-relaxed">
              {generatedConfig}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
