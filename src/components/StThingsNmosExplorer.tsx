import React, { useState } from 'react';
import { 
  Cpu, 
  Clock, 
  FileCode, 
  Layers, 
  Radio, 
  Zap, 
  CheckCircle2, 
  Link, 
  Unlink, 
  RefreshCw,
  Sliders,
  FileText
} from 'lucide-react';
import { PtpClockStatus, NmosDevice, StreamPipeline } from '../types';

interface StThingsNmosExplorerProps {
  ptpClock: PtpClockStatus | null;
  nmosDevices: NmosDevice[];
  pipelines: StreamPipeline[];
}

export const StThingsNmosExplorer: React.FC<StThingsNmosExplorerProps> = ({
  ptpClock,
  nmosDevices,
  pipelines
}) => {
  const [generatedSdp, setGeneratedSdp] = useState('');
  const [sdpForm, setSdpForm] = useState({
    streamName: 'ST 2110-20 Studio Feed',
    ip: '239.100.1.20',
    port: 50004,
    format: 'YCbCr-4:2:2',
    width: 3840,
    height: 2160,
    fps: 60,
    audioCh: 8
  });

  const handleGenerateSdp = async () => {
    try {
      const res = await fetch('/api/sdp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sdpForm)
      });
      const data = await res.json();
      setGeneratedSdp(data.sdp);
    } catch (err) {
      alert('Failed to generate SDP');
    }
  };

  return (
    <div className="space-y-4 font-sans">
      
      {/* Top Banner */}
      <div className="bg-[#0F0F12] p-4 rounded border border-slate-800">
        <h2 className="text-xs font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2 font-mono">
          <Cpu className="w-4 h-4 text-indigo-400" />
          SMPTE ST Things & NMOS Registry Explorer
        </h2>
        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
          SMPTE ST 2110-20 (Uncompressed Video), ST 2110-30 (PCM Audio), ST 2110-40 (Ancillary Data), PTP IEEE 1588-2008 Timing, and NMOS IS-04/IS-05 Discovery
        </p>
      </div>

      {/* Grid Layout: PTP Clock + ST Standards Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 font-mono">
        
        {/* PTP Clock IEEE 1588 Status Card */}
        <div className="bg-[#0F0F12] rounded border border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-green-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-tight">
                PTP IEEE 1588-2008 v2
              </h3>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-500/10 text-green-400 border border-green-500/30 flex items-center gap-1 uppercase">
              <Zap className="w-2.5 h-2.5 text-green-400" />
              {ptpClock?.state || 'LOCKED'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 bg-[#0A0A0B] rounded border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase">Grandmaster ID:</span>
              <span className="text-indigo-300 font-bold text-[11px]">{ptpClock?.grandmasterId || '70:b3:d5:ff:fe:00:11:22'}</span>
            </div>

            <div className="flex justify-between p-2 bg-[#0A0A0B] rounded border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase">Grandmaster IP:</span>
              <span className="text-slate-200 text-[11px]">{ptpClock?.grandmasterIp || '10.211.0.254'}</span>
            </div>

            <div className="flex justify-between p-2 bg-[#0A0A0B] rounded border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase">Domain ID:</span>
              <span className="text-amber-400 font-bold text-[11px]">{ptpClock?.domain || 127}</span>
            </div>

            <div className="flex justify-between p-2 bg-[#0A0A0B] rounded border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase">Offset From Master:</span>
              <span className="text-green-400 font-bold text-[11px]">{ptpClock ? `${ptpClock.offsetFromMasterNs} ns` : '24 ns'}</span>
            </div>

            <div className="flex justify-between p-2 bg-[#0A0A0B] rounded border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase">Mean Path Delay:</span>
              <span className="text-indigo-400 text-[11px]">{ptpClock?.meanPathDelayNs || 812} ns</span>
            </div>
          </div>
        </div>

        {/* SMPTE ST Standards Reference */}
        <div className="lg:col-span-2 bg-[#0F0F12] rounded border border-slate-800 p-4 space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            SMPTE ST Media Suite Protocols
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-[#0A0A0B] p-2.5 rounded border border-slate-800 space-y-1">
              <div className="font-bold text-indigo-300 flex items-center justify-between">
                <span>ST 2110-20</span>
                <span className="text-[9px] bg-indigo-950/80 px-1.5 py-0.5 rounded text-indigo-300 border border-indigo-800/80 uppercase">Video</span>
              </div>
              <p className="text-slate-400 text-[10px]">
                Uncompressed video elementary streams over RTP/UDP with PTP timestamp alignment.
              </p>
            </div>

            <div className="bg-[#0A0A0B] p-2.5 rounded border border-slate-800 space-y-1">
              <div className="font-bold text-green-400 flex items-center justify-between">
                <span>ST 2110-30 / -31</span>
                <span className="text-[9px] bg-green-950/80 px-1.5 py-0.5 rounded text-green-300 border border-green-800/80 uppercase">PCM Audio</span>
              </div>
              <p className="text-slate-400 text-[10px]">
                PCM uncompressed audio (AES67 compatible), 48kHz 24-bit multichannel audio.
              </p>
            </div>

            <div className="bg-[#0A0A0B] p-2.5 rounded border border-slate-800 space-y-1">
              <div className="font-bold text-amber-400 flex items-center justify-between">
                <span>ST 2110-40</span>
                <span className="text-[9px] bg-amber-950/80 px-1.5 py-0.5 rounded text-amber-300 border border-amber-800/80 uppercase">Ancillary Data</span>
              </div>
              <p className="text-slate-400 text-[10px]">
                ANC metadata encapsulation (Timecode, Captions, SCTE-104 triggers).
              </p>
            </div>

            <div className="bg-[#0A0A0B] p-2.5 rounded border border-slate-800 space-y-1">
              <div className="font-bold text-indigo-400 flex items-center justify-between">
                <span>ST 2022-6 / -7</span>
                <span className="text-[9px] bg-indigo-950/80 px-1.5 py-0.5 rounded text-indigo-300 border border-indigo-800/80 uppercase">SDI over IP</span>
              </div>
              <p className="text-slate-400 text-[10px]">
                High bitrate SDI payload encapsulation and hitless merge redundancy.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* NMOS IS-04 / IS-05 Registered Node Table */}
      <div className="bg-[#0F0F12] rounded border border-slate-800 p-4 space-y-3 font-mono">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Radio className="w-4 h-4 text-indigo-400" />
              NMOS IS-04 Node & IS-05 Connection Registry
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Network Media Open Specifications discovery and connection management
            </p>
          </div>

          <button
            onClick={() => alert('NMOS IS-04 Registry re-indexed.')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-3 py-1.5 rounded font-mono flex items-center gap-1.5 cursor-pointer uppercase tracking-tight"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Re-scan Registry</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left font-mono">
            <thead className="bg-[#0A0A0B] text-slate-400 border-b border-slate-800 uppercase text-[9px]">
              <tr>
                <th className="p-2.5">Device Label / ID</th>
                <th className="p-2.5">Type</th>
                <th className="p-2.5">Protocol</th>
                <th className="p-2.5">Format</th>
                <th className="p-2.5">Transport URN</th>
                <th className="p-2.5">Bound Pipeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {nmosDevices.map((dev) => (
                <tr key={dev.id} className="hover:bg-slate-800/40">
                  <td className="p-2.5 font-bold text-slate-200">{dev.label}</td>
                  <td className="p-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      dev.type === 'sender' ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/80' : 'bg-green-950/80 text-green-300 border border-green-800/80'
                    }`}>
                      {dev.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-2.5 text-indigo-300 font-bold">{dev.protocol}</td>
                  <td className="p-2.5 text-slate-300">{dev.format}</td>
                  <td className="p-2.5 text-slate-500 text-[10px]">{dev.transport}</td>
                  <td className="p-2.5 text-green-400">{dev.boundPipelineId || 'Unbound'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive SDP Manifest Generator */}
      <div className="bg-[#0F0F12] rounded border border-slate-800 p-4 space-y-4 font-mono">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-400" />
            Interactive SMPTE ST 2110 SDP File Generator
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Generate Session Description Protocol manifests for broadcast receiver orchestration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Form */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-mono uppercase">Stream Session Name</label>
              <input
                type="text"
                value={sdpForm.streamName}
                onChange={e => setSdpForm({ ...sdpForm, streamName: e.target.value })}
                className="w-full bg-[#0A0A0B] border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-mono uppercase">Multicast IP</label>
                <input
                  type="text"
                  value={sdpForm.ip}
                  onChange={e => setSdpForm({ ...sdpForm, ip: e.target.value })}
                  className="w-full bg-[#0A0A0B] border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-mono uppercase">RTP Port</label>
                <input
                  type="number"
                  value={sdpForm.port}
                  onChange={e => setSdpForm({ ...sdpForm, port: Number(e.target.value) })}
                  className="w-full bg-[#0A0A0B] border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-mono uppercase">Width</label>
                <input
                  type="number"
                  value={sdpForm.width}
                  onChange={e => setSdpForm({ ...sdpForm, width: Number(e.target.value) })}
                  className="w-full bg-[#0A0A0B] border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-mono uppercase">Height</label>
                <input
                  type="number"
                  value={sdpForm.height}
                  onChange={e => setSdpForm({ ...sdpForm, height: Number(e.target.value) })}
                  className="w-full bg-[#0A0A0B] border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-mono uppercase">FPS</label>
                <input
                  type="number"
                  value={sdpForm.fps}
                  onChange={e => setSdpForm({ ...sdpForm, fps: Number(e.target.value) })}
                  className="w-full bg-[#0A0A0B] border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateSdp}
              className="bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 text-white text-xs px-4 py-2 rounded font-mono font-medium cursor-pointer shadow-lg shadow-indigo-900/20 transition-colors w-full uppercase tracking-tight"
            >
              Generate SDP Manifest
            </button>
          </div>

          {/* Generated SDP Display */}
          <div className="bg-[#0A0A0B] rounded border border-slate-800 p-4 font-mono text-xs text-indigo-300 flex flex-col justify-between overflow-x-auto">
            <pre className="whitespace-pre">
              {generatedSdp || `v=0
o=- 1723200000 1 IN IP4 239.100.1.20
s=ST 2110-20 Studio Feed
t=0 0
m=video 50004 RTP/AVP 112
c=IN IP4 239.100.1.20/32
a=rtpmap:112 raw/90000
a=fmtp:112 sampling=YCbCr-4:2:2; width=3840; height=2160; exactframerate=60
a=ts-refclk:ptp=IEEE1588-2008:70-B3-D5-FF-FE-00-11-22:0`}
            </pre>

            {generatedSdp && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedSdp);
                  alert('SDP Manifest copied to clipboard!');
                }}
                className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded self-end cursor-pointer font-mono border border-indigo-500 uppercase"
              >
                Copy SDP
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
