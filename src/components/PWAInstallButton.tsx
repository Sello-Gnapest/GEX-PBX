import React, { useState } from 'react';
import { Download, Smartphone, Apple, X, CheckCircle2, QrCode, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'badge';
  label?: string;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  label,
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already running in standalone mode, show verified active PWA badge or nothing
  if (isInstalled && variant === 'badge') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[11px] font-semibold text-emerald-300">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>PWA Active</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (!outcome) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      {variant === 'compact' && (
        <button
          id="pwa-install-compact-btn"
          onClick={handleInstallClick}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border shadow-sm ${
            isInstallable
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 border-cyan-400/50 shadow-cyan-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-cyan-500/50'
          } ${className}`}
          title="Install as Progressive Web App (iOS, Android, Windows, Mac)"
        >
          {isIOS ? (
            <Apple className="w-3.5 h-3.5 text-slate-300" />
          ) : (
            <Download className="w-3.5 h-3.5 text-cyan-300" />
          )}
          <span>{label || (isIOS ? 'Install on iPhone' : 'Install PWA Softphone')}</span>
        </button>
      )}

      {variant === 'full' && (
        <button
          id="pwa-install-full-btn"
          onClick={handleInstallClick}
          className={`w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border border-cyan-500/40 hover:border-cyan-400 text-left transition cursor-pointer group shadow-lg ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>{label || 'Install Softphone App on Mobile'}</span>
                <span className="text-[10px] bg-cyan-500 text-slate-950 font-extrabold px-1.5 py-0.2 rounded uppercase">
                  iOS & Android
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Zero app store install required • Operates as a native home-screen app
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-cyan-400 font-bold text-xs">
            <span>Setup</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
        </button>
      )}

      {/* Guide Modal for iOS & Android Installation */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border-2 border-cyan-500/50 p-6 shadow-2xl space-y-5 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/60 flex items-center justify-center text-cyan-400">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    PBX 031 Web Softphone for Mobile
                  </h3>
                  <p className="text-xs text-slate-400">
                    Progressive Web App (PWA) installation for Office Agents
                  </p>
                </div>
              </div>

              <button
                id="close-pwa-modal-btn"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct Trigger Button if Chromium is ready */}
            {isInstallable && (
              <div className="p-4 rounded-2xl bg-cyan-950/60 border border-cyan-500/50 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-sm text-cyan-300">Fast 1-Click Install</div>
                  <p className="text-xs text-slate-300">
                    Your browser supports instant native installation
                  </p>
                </div>
                <button
                  id="modal-direct-install-btn"
                  onClick={async () => {
                    await install();
                    setShowModal(false);
                  }}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow"
                >
                  Install Now
                </button>
              </div>
            )}

            {/* OS Tabs / Instructions */}
            <div className="space-y-4 text-xs">
              {/* iOS Instructions */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                  <Apple className="w-4 h-4 text-cyan-400" />
                  <span>Apple iOS (iPhone & iPad Safari)</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full ml-auto">
                    No App Store Needed
                  </span>
                </div>
                <ol className="space-y-2 text-slate-300 pl-4 list-decimal">
                  <li>
                    Open this PBX softphone URL in <strong>Apple Safari</strong> on your iPhone.
                  </li>
                  <li>
                    Tap the <strong>Share</strong> button at the bottom center of Safari (the square with an arrow pointing up).
                  </li>
                  <li>
                    Scroll down the share sheet and tap <strong>&quot;Add to Home Screen&quot;</strong>.
                  </li>
                  <li>
                    Tap <strong>&quot;Add&quot;</strong> in the top right. The 031 PBX Softphone icon will appear on your home screen like any native app.
                  </li>
                </ol>
              </div>

              {/* Android Instructions */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Google Android (Chrome, Edge, Samsung Internet)</span>
                </div>
                <ol className="space-y-2 text-slate-300 pl-4 list-decimal">
                  <li>
                    Open this PBX softphone link in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong>.
                  </li>
                  <li>
                    Tap the <strong>three dots menu (⋮)</strong> in the top right corner.
                  </li>
                  <li>
                    Tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
                  </li>
                  <li>
                    Confirm install. The app will launch in standalone mode without browser URL bars!
                  </li>
                </ol>
              </div>
            </div>

            {/* Enterprise Softphone Highlights */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Durban 031 Outbound CLI</div>
                  <p className="text-[11px] text-slate-400">
                    Agents dial out presenting the office 031 DID number.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Switchboard Forwarding</div>
                  <p className="text-[11px] text-slate-400">
                    Live call transfer and ring group routing directly to agent.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                id="dismiss-pwa-modal-btn"
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Got It, Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
