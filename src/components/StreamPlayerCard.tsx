import React, { useEffect, useRef, useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Camera, 
  Radio, 
  FileText, 
  Check, 
  Zap, 
  Clock, 
  Settings,
  Flame,
  Layers
} from 'lucide-react';
import { StreamPipeline } from '../types';

interface StreamPlayerCardProps {
  pipeline: StreamPipeline;
  onUpdatePipeline: (id: string, patch: Partial<StreamPipeline>) => void;
  onOpenSdpModal: (sdp: string, name: string) => void;
  layoutMode: 'grid-2x2' | 'grid-3x3' | 'single' | 'master-1+5';
}

export const StreamPlayerCard: React.FC<StreamPlayerCardProps> = ({
  pipeline,
  onUpdatePipeline,
  onOpenSdpModal,
  layoutMode
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [useCamera, setUseCamera] = useState(false);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Canvas Motion & Test Pattern Generator
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;

    const renderFrame = () => {
      frameCount++;
      const width = canvas.width;
      const height = canvas.height;

      if (useCamera && videoRef.current && videoRef.current.readyState >= 2) {
        ctx.drawImage(videoRef.current, 0, 0, width, height);
      } else {
        // Draw Broadcast SMPTE Test Pattern / Animated Video Background
        const barWidth = width / 7;
        const colors = [
          '#c0c0c0', '#c0c000', '#00c0c0', '#00c000', 
          '#c000c0', '#c00000', '#0000c0'
        ];

        // Background SMPTE Color Bars
        colors.forEach((color, i) => {
          ctx.fillStyle = color;
          ctx.fillRect(i * barWidth, 0, barWidth, height * 0.7);
        });

        // Bottom test signals
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, height * 0.7, width, height * 0.3);

        // Moving OMT Scanner Bar
        const scanX = (frameCount * 3) % width;
        const gradient = ctx.createLinearGradient(scanX - 60, 0, scanX + 60, 0);
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0)');
        gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.8)');
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(scanX - 60, 0, 120, height * 0.7);

        // Center Grid Overlay
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Dynamic Text Info Overlay inside Canvas
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(10, 10, 240, 28);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`STREAM: ${pipeline.ingestProtocol} ➔ ${pipeline.egressProtocol}`, 18, 28);
      }

      animationFrameId = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [useCamera, pipeline.ingestProtocol, pipeline.egressProtocol]);

  // Handle Camera Toggle
  const toggleCamera = async () => {
    if (!useCamera) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setUseCamera(true);
      } catch (err) {
        alert('Camera access denied or unavailable. Falling back to synthetic test pattern generator.');
      }
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setUseCamera(false);
    }
  };

  // Web Audio Synth Preview
  const toggleAudio = () => {
    if (isMuted) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // 440Hz Broadcast Calibration Tone
      gain.gain.setValueAtTime(0.02, ctx.currentTime); // low volume
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setAudioCtx(ctx);
      setIsMuted(false);
    } else {
      if (audioCtx) {
        audioCtx.close();
        setAudioCtx(null);
      }
      setIsMuted(true);
    }
  };

  // Tally border class
  const tallyBorderClass = 
    pipeline.tallyState === 'program' 
      ? 'ring-4 ring-red-600 shadow-2xl shadow-red-950/80' 
      : pipeline.tallyState === 'preview' 
        ? 'ring-4 ring-emerald-500 shadow-xl shadow-emerald-950/60' 
        : 'ring-1 ring-slate-800';

  return (
    <div className={`relative bg-[#0F0F12] rounded-lg border border-slate-800 overflow-hidden flex flex-col ${tallyBorderClass} transition-all duration-300`}>
      <video ref={videoRef} className="hidden" playsInline muted />
      
      {/* Top Banner Bar */}
      <div className="bg-[#0F0F12] px-3.5 py-2 flex items-center justify-between border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center space-x-2 truncate">
          <div className={`w-2 h-2 rounded-full ${
            pipeline.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'
          }`} />
          <span className="font-bold text-slate-100 uppercase tracking-tight truncate text-[11px]">{pipeline.name}</span>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Protocol Badge */}
          <span className="px-1.5 py-0.5 rounded font-mono text-[9px] font-bold bg-indigo-950/60 text-indigo-300 border border-indigo-800/80 uppercase">
            {pipeline.ingestProtocol}
          </span>
          <span className="text-slate-500 text-[10px]">➔</span>
          <span className="px-1.5 py-0.5 rounded font-mono text-[9px] font-bold bg-indigo-600 text-white border border-indigo-500 uppercase">
            {pipeline.egressProtocol}
          </span>
        </div>
      </div>

      {/* Main Video Canvas viewport */}
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden group">
        <canvas 
          ref={canvasRef} 
          width={640} 
          height={360} 
          className="w-full h-full object-cover" 
        />

        {/* Live Overlay Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 pointer-events-none">
          {/* Tally Pill */}
          {pipeline.tallyState === 'program' && (
            <span className="bg-red-600 text-white font-black text-[9px] px-2 py-0.5 rounded tracking-widest uppercase shadow animate-pulse">
              ● PGM
            </span>
          )}
          {pipeline.tallyState === 'preview' && (
            <span className="bg-green-600 text-white font-black text-[9px] px-2 py-0.5 rounded tracking-widest uppercase shadow">
              ● PVW
            </span>
          )}

          {/* Timecode */}
          <div className="bg-[#0F0F12]/90 text-amber-400 font-mono text-[10px] px-2 py-0.5 rounded font-bold border border-slate-800">
            {pipeline.timecode}
          </div>

          {/* PTP Sync */}
          {pipeline.ptpLocked && (
            <div className="bg-emerald-950/90 text-emerald-300 text-[9px] px-2 py-0.5 rounded font-mono border border-emerald-800/80 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-emerald-400" /> PTP LOCK
            </div>
          )}
        </div>

        {/* Bottom Left Specs */}
        <div className="absolute bottom-2.5 left-2.5 bg-[#0F0F12]/90 backdrop-blur-sm text-[10px] text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-800 flex items-center space-x-2 pointer-events-none">
          <span>{pipeline.resolution}</span>
          <span className="text-slate-600">|</span>
          <span className="text-indigo-400 font-bold">{(pipeline.bitrateKbps / 1000).toFixed(1)} Mbps</span>
          <span className="text-slate-600">|</span>
          <span className="text-green-400">{pipeline.latencyMs} ms</span>
        </div>

        {/* Hover Controls Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3 backdrop-blur-[2px]">
          
          <button
            onClick={toggleAudio}
            className={`p-2 rounded-full backdrop-blur-md transition-transform hover:scale-110 cursor-pointer ${
              isMuted ? 'bg-slate-800/90 text-slate-300' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/50'
            }`}
            title={isMuted ? 'Unmute 440Hz Broadcast Reference Tone' : 'Mute Tone'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleCamera}
            className={`p-2 rounded-full backdrop-blur-md transition-transform hover:scale-110 cursor-pointer ${
              useCamera ? 'bg-green-600 text-white' : 'bg-slate-800/90 text-slate-300'
            }`}
            title={useCamera ? 'Switch to OMT Generator' : 'Use WebCam as Video Feed'}
          >
            <Camera className="w-4 h-4" />
          </button>

          {pipeline.sdpManifest && (
            <button
              onClick={() => onOpenSdpModal(pipeline.sdpManifest!, pipeline.name)}
              className="p-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-full backdrop-blur-md transition-transform hover:scale-110 cursor-pointer"
              title="Inspect SDP Manifest"
            >
              <FileText className="w-4 h-4" />
            </button>
          )}

        </div>
      </div>

      {/* Audio VU Meters & Tally Controller */}
      <div className="bg-[#0F0F12] p-3 space-y-2 border-t border-slate-800 font-mono">
        
        {/* Audio VU Meter Channels */}
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
            <span>AUDIO PPM (dBFS)</span>
            <span>L: {pipeline.audioLevels[0]} dB | R: {pipeline.audioLevels[1]} dB</span>
          </div>

          {/* Left Channel */}
          <div className="w-full bg-[#0A0A0B] rounded-full h-1.5 overflow-hidden flex items-center p-0.5 border border-slate-800">
            <div 
              className="h-full rounded-full transition-all duration-100 bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500"
              style={{ width: `${Math.max(5, Math.min(100, (pipeline.audioLevels[0] + 60) * 1.66))}%` }}
            />
          </div>

          {/* Right Channel */}
          <div className="w-full bg-[#0A0A0B] rounded-full h-1.5 overflow-hidden flex items-center p-0.5 border border-slate-800">
            <div 
              className="h-full rounded-full transition-all duration-100 bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500"
              style={{ width: `${Math.max(5, Math.min(100, (pipeline.audioLevels[1] + 60) * 1.66))}%` }}
            />
          </div>
        </div>

        {/* Tally Selector */}
        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/60">
          <span className="text-slate-500 uppercase font-bold">Tally State:</span>
          <div className="flex space-x-1">
            <button
              onClick={() => onUpdatePipeline(pipeline.id, { tallyState: 'off' })}
              className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors ${
                pipeline.tallyState === 'off' 
                  ? 'bg-slate-800 text-slate-200 border border-slate-700' 
                  : 'bg-[#0A0A0B] text-slate-500 hover:text-slate-300'
              }`}
            >
              OFF
            </button>
            <button
              onClick={() => onUpdatePipeline(pipeline.id, { tallyState: 'preview' })}
              className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors ${
                pipeline.tallyState === 'preview' 
                  ? 'bg-green-600 text-white shadow shadow-green-950' 
                  : 'bg-[#0A0A0B] text-green-600/70 hover:text-green-400'
              }`}
            >
              PVW
            </button>
            <button
              onClick={() => onUpdatePipeline(pipeline.id, { tallyState: 'program' })}
              className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors ${
                pipeline.tallyState === 'program' 
                  ? 'bg-red-600 text-white shadow shadow-red-950' 
                  : 'bg-[#0A0A0B] text-red-600/70 hover:text-red-400'
              }`}
            >
              PGM
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
