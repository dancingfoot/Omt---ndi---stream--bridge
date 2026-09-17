import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { 
  NetworkBridgeInterface, 
  StreamPipeline, 
  PtpClockStatus, 
  NmosDevice, 
  SystemStats 
} from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Storage & Real-Time Simulation State
let bridges: NetworkBridgeInterface[] = [
  {
    id: "br-omt0",
    name: "omt-br0",
    type: "bridge",
    ipAddress: "192.168.10.1",
    netmask: "255.255.255.0",
    macAddress: "52:54:00:12:34:56",
    mtu: 9000,
    status: "up",
    slaves: ["eth0", "veth-omt1"],
    vlanId: 100,
    rxBytes: 10485760000,
    txBytes: 12582912000,
    rxPackets: 8234500,
    txPackets: 9812400,
    rxDropped: 12,
    txDropped: 0,
    promiscuous: true,
    stpEnabled: false
  },
  {
    id: "br-st2110",
    name: "st2110-br1",
    type: "bridge",
    ipAddress: "10.211.0.1",
    netmask: "255.255.0.0",
    macAddress: "52:54:00:ab:cd:ef",
    mtu: 9000,
    status: "up",
    slaves: ["eth1", "veth-st2110-20"],
    vlanId: 200,
    rxBytes: 45097152000,
    txBytes: 42949672960,
    rxPackets: 34500000,
    txPackets: 33200000,
    rxDropped: 184,
    txDropped: 4,
    promiscuous: true,
    stpEnabled: true
  },
  {
    id: "br-srt-wan",
    name: "srt-br0",
    type: "bridge",
    ipAddress: "172.16.50.1",
    netmask: "255.255.255.0",
    macAddress: "52:54:00:78:90:ab",
    mtu: 1500,
    status: "up",
    slaves: ["eth2"],
    rxBytes: 3221225472,
    txBytes: 2147483648,
    rxPackets: 2500000,
    txPackets: 1800000,
    rxDropped: 3,
    txDropped: 0,
    promiscuous: false,
    stpEnabled: false
  }
];

let pipelines: StreamPipeline[] = [
  {
    id: "pipe-1",
    name: "CAM 01 - Main Stage OMT to WebRTC Preview",
    ingestProtocol: "OMT",
    ingestUri: "omt://192.168.10.50:9001/cam01",
    egressProtocol: "WebRTC",
    egressUri: "webrtc://localhost:8088/live/cam01",
    bridgeInterface: "omt-br0",
    status: "active",
    bitrateKbps: 45000,
    fps: 59.94,
    latencyMs: 1.8,
    jitterMs: 0.2,
    packetLossPercent: 0.001,
    resolution: "1920x1080p 59.94",
    timecode: "01:14:22:18",
    ptpLocked: true,
    tallyState: "program",
    audioChannels: 8,
    audioLevels: [-12, -14],
    sdpManifest: `v=0
o=- 1723200000 1 IN IP4 192.168.10.50
s=OMT Studio Cam 01
t=0 0
m=video 9001 RTP/AVP 96
c=IN IP4 239.255.10.1/32
a=rtpmap:96 raw/90000
a=fmtp:96 sampling=YCbCr-4:2:2; width=1920; height=1080; exactframerate=60000/1001; depth=10
a=ts-refclk:ptp=IEEE1588-2008:00-11-22-FF-FE-33-44-55:0`
  },
  {
    id: "pipe-2",
    name: "OB-VAN ST 2110-20 Uncompressed to OMT Local Gateway",
    ingestProtocol: "ST_2110_20",
    ingestUri: "rtp://239.100.1.1:50004",
    egressProtocol: "OMT",
    egressUri: "omt://192.168.10.1:9002/obvan_feed",
    bridgeInterface: "st2110-br1",
    status: "active",
    bitrateKbps: 1500000,
    fps: 60,
    latencyMs: 2.1,
    jitterMs: 0.1,
    packetLossPercent: 0.0,
    resolution: "3840x2160p 60 (4K)",
    timecode: "01:14:22:18",
    ptpLocked: true,
    tallyState: "preview",
    audioChannels: 16,
    audioLevels: [-18, -18],
    sdpManifest: `v=0
o=- 1723200100 1 IN IP4 10.211.0.50
s=ST 2110-20 4K UHD Feed
t=0 0
m=video 50004 RTP/AVP 112
c=IN IP4 239.100.1.1/32
a=rtpmap:112 raw/90000
a=fmtp:112 sampling=YCbCr-4:2:2; width=3840; height=2160; exactframerate=60; depth=10
a=ts-refclk:ptp=IEEE1588-2008:70-B3-D5-FF-FE-00-11-22:0`
  },
  {
    id: "pipe-3",
    name: "Remote Broadcast SRT Caller to ST 2110-20 Translator",
    ingestProtocol: "SRT",
    ingestUri: "srt://203.0.113.88:9000?mode=caller&latency=120",
    egressProtocol: "ST_2110_20",
    egressUri: "rtp://239.100.1.2:50004",
    bridgeInterface: "srt-br0",
    status: "active",
    bitrateKbps: 18500,
    fps: 50,
    latencyMs: 118.5,
    jitterMs: 3.4,
    packetLossPercent: 0.04,
    resolution: "1920x1080i 50",
    timecode: "01:14:22:18",
    ptpLocked: true,
    tallyState: "off",
    audioChannels: 4,
    audioLevels: [-22, -24],
    sdpManifest: `v=0
o=- 1723200200 1 IN IP4 172.16.50.1
s=SRT Transcoded ST2110 Stream
t=0 0
m=video 50004 RTP/AVP 96
c=IN IP4 239.100.1.2/32
a=rtpmap:96 raw/90000
a=fmtp:96 sampling=YCbCr-4:2:2; width=1920; height=1080; exactframerate=50
a=ts-refclk:ptp=IEEE1588-2008:70-B3-D5-FF-FE-00-11-22:0`
  },
  {
    id: "pipe-4",
    name: "Studio B NDI Feed to OMT Multicast Relay",
    ingestProtocol: "NDI",
    ingestUri: "ndi://STUDIO-B-PC/Line-Out",
    egressProtocol: "OMT",
    egressUri: "omt://239.255.20.10:9005",
    bridgeInterface: "omt-br0",
    status: "active",
    bitrateKbps: 120000,
    fps: 59.94,
    latencyMs: 8.4,
    jitterMs: 0.8,
    packetLossPercent: 0.0,
    resolution: "1920x1080p 59.94",
    timecode: "01:14:22:18",
    ptpLocked: true,
    tallyState: "off",
    audioChannels: 2,
    audioLevels: [-10, -10],
    sdpManifest: `v=0
o=- 1723200300 1 IN IP4 192.168.10.88
s=NDI to OMT Multicast
t=0 0
m=video 9005 RTP/AVP 96
c=IN IP4 239.255.20.10/32
a=rtpmap:96 raw/90000`
  }
];

let ptpClock: PtpClockStatus = {
  grandmasterId: "70:b3:d5:ff:fe:00:11:22",
  grandmasterIp: "10.211.0.254",
  domain: 127,
  state: "LOCKED",
  offsetFromMasterNs: 24,
  meanPathDelayNs: 812,
  stepsRemoved: 1
};

let nmosDevices: NmosDevice[] = [
  {
    id: "nmos-snd-01",
    label: "Main Camera OMT Sender",
    type: "sender",
    protocol: "OMT",
    transport: "urn:x-nmos:transport:omt.mcast",
    format: "video",
    boundPipelineId: "pipe-1"
  },
  {
    id: "nmos-snd-02",
    label: "OB-Van ST 2110-20 Video Sender",
    type: "sender",
    protocol: "ST_2110_20",
    transport: "urn:x-nmos:transport:rtp.mcast",
    format: "video",
    boundPipelineId: "pipe-2"
  },
  {
    id: "nmos-rcv-01",
    label: "Master Control Monitor Receiver",
    type: "receiver",
    protocol: "WebRTC",
    transport: "urn:x-nmos:transport:webrtc",
    format: "video",
    boundPipelineId: "pipe-1"
  },
  {
    id: "nmos-rcv-02",
    label: "ST2110-30 PCM Audio Receiver (16 Ch)",
    type: "receiver",
    protocol: "ST_2110_30",
    transport: "urn:x-nmos:transport:rtp.mcast",
    format: "audio",
    boundPipelineId: "pipe-2"
  }
];

// Helper to simulate timecode and live audio jitter
setInterval(() => {
  const now = new Date();
  const hrs = String(now.getHours()).padStart(2, "0");
  const mins = String(now.getMinutes()).padStart(2, "0");
  const secs = String(now.getSeconds()).padStart(2, "0");
  const frames = String(Math.floor((now.getMilliseconds() / 1000) * 60)).padStart(2, "0");
  const currentTimecode = `${hrs}:${mins}:${secs}:${frames}`;

  // Update pipelines
  pipelines = pipelines.map(p => {
    if (p.status !== "active") return p;
    // simulate micro variations
    const audioL = Math.max(-60, Math.min(0, p.audioLevels[0] + (Math.random() * 4 - 2)));
    const audioR = Math.max(-60, Math.min(0, p.audioLevels[1] + (Math.random() * 4 - 2)));
    const jitter = Math.max(0.05, p.jitterMs + (Math.random() * 0.1 - 0.05));
    return {
      ...p,
      timecode: currentTimecode,
      audioLevels: [parseFloat(audioL.toFixed(1)), parseFloat(audioR.toFixed(1))],
      jitterMs: parseFloat(jitter.toFixed(2))
    };
  });

  // Update PTP micro offset
  ptpClock.offsetFromMasterNs = Math.floor(20 + (Math.random() * 15 - 7.5));
}, 500);

// Helper for Gemini AI Lazy Setup
function getGeminiAi() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// REST API ROUTES
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Open Media Transport Bridge Daemon", version: "2.4.0-omt" });
});

app.get("/api/stats", (req, res) => {
  const stats: SystemStats = {
    cpuUsagePercent: Math.floor(18 + Math.random() * 12),
    memoryUsagePercent: 34,
    networkRxMbps: 1845.2,
    networkTxMbps: 1792.8,
    kernelBuffersFreeKb: 131072,
    activeStreamsCount: pipelines.filter(p => p.status === 'active').length
  };
  res.json(stats);
});

// Bridge routes
app.get("/api/bridges", (req, res) => {
  res.json(bridges);
});

app.post("/api/bridges", (req, res) => {
  const { name, ipAddress, netmask, mtu, promiscuous, stpEnabled, slaves, vlanId } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Bridge name is required" });
  }

  const newBridge: NetworkBridgeInterface = {
    id: `br-${Date.now()}`,
    name: name.startsWith("omt-") || name.startsWith("st") ? name : `omt-${name}`,
    type: "bridge",
    ipAddress: ipAddress || "192.168.100.1",
    netmask: netmask || "255.255.255.0",
    macAddress: `52:54:00:${Math.floor(Math.random()*256).toString(16).padStart(2,'0')}:${Math.floor(Math.random()*256).toString(16).padStart(2,'0')}:${Math.floor(Math.random()*256).toString(16).padStart(2,'0')}`,
    mtu: Number(mtu) || 9000,
    status: "up",
    slaves: Array.isArray(slaves) ? slaves : ["eth0"],
    vlanId: vlanId ? Number(vlanId) : undefined,
    rxBytes: 0,
    txBytes: 0,
    rxPackets: 0,
    txPackets: 0,
    rxDropped: 0,
    txDropped: 0,
    promiscuous: Boolean(promiscuous),
    stpEnabled: Boolean(stpEnabled)
  };

  bridges.push(newBridge);
  res.status(201).json(newBridge);
});

app.post("/api/bridges/:id/toggle", (req, res) => {
  const bridge = bridges.find(b => b.id === req.params.id);
  if (!bridge) return res.status(404).json({ error: "Bridge not found" });

  bridge.status = bridge.status === "up" ? "down" : "up";
  res.json(bridge);
});

app.post("/api/bridges/:id/slaves", (req, res) => {
  const bridge = bridges.find(b => b.id === req.params.id);
  if (!bridge) return res.status(404).json({ error: "Bridge not found" });

  const { slave, action } = req.body; // action: 'add' | 'remove'
  if (action === "add" && !bridge.slaves.includes(slave)) {
    bridge.slaves.push(slave);
  } else if (action === "remove") {
    bridge.slaves = bridge.slaves.filter(s => s !== slave);
  }
  res.json(bridge);
});

// Pipeline routes
app.get("/api/pipelines", (req, res) => {
  res.json(pipelines);
});

app.post("/api/pipelines", (req, res) => {
  const { name, ingestProtocol, ingestUri, egressProtocol, egressUri, bridgeInterface, bitrateKbps, resolution, audioChannels } = req.body;
  if (!name || !ingestProtocol || !egressProtocol) {
    return res.status(400).json({ error: "Missing required pipeline fields" });
  }

  const newPipe: StreamPipeline = {
    id: `pipe-${Date.now()}`,
    name,
    ingestProtocol,
    ingestUri: ingestUri || `${ingestProtocol.toLowerCase()}://stream-source:9000`,
    egressProtocol,
    egressUri: egressUri || `${egressProtocol.toLowerCase()}://stream-dest:9000`,
    bridgeInterface: bridgeInterface || "omt-br0",
    status: "active",
    bitrateKbps: Number(bitrateKbps) || 25000,
    fps: 59.94,
    latencyMs: ingestProtocol === "OMT" ? 1.5 : 24.0,
    jitterMs: 0.3,
    packetLossPercent: 0.0,
    resolution: resolution || "1920x1080p 59.94",
    timecode: "00:00:00:00",
    ptpLocked: true,
    tallyState: "off",
    audioChannels: Number(audioChannels) || 2,
    audioLevels: [-14, -14],
    sdpManifest: `v=0
o=- ${Date.now()} 1 IN IP4 192.168.10.1
s=${name}
t=0 0
m=video 9000 RTP/AVP 96
c=IN IP4 239.255.0.1/32
a=rtpmap:96 raw/90000`
  };

  pipelines.push(newPipe);
  res.status(201).json(newPipe);
});

app.patch("/api/pipelines/:id", (req, res) => {
  const pipeIndex = pipelines.findIndex(p => p.id === req.params.id);
  if (pipeIndex === -1) return res.status(404).json({ error: "Pipeline not found" });

  pipelines[pipeIndex] = { ...pipelines[pipeIndex], ...req.body };
  res.json(pipelines[pipeIndex]);
});

app.delete("/api/pipelines/:id", (req, res) => {
  pipelines = pipelines.filter(p => p.id !== req.params.id);
  res.json({ success: true, id: req.params.id });
});

app.post("/api/pipelines/:id/toggle", (req, res) => {
  const pipe = pipelines.find(p => p.id === req.params.id);
  if (!pipe) return res.status(404).json({ error: "Pipeline not found" });

  pipe.status = pipe.status === "active" ? "paused" : "active";
  res.json(pipe);
});

// PTP and ST routes
app.get("/api/ptp", (req, res) => {
  res.json(ptpClock);
});

app.get("/api/nmos/devices", (req, res) => {
  res.json(nmosDevices);
});

app.post("/api/sdp/generate", (req, res) => {
  const { streamName, ip, port, format, width, height, fps, audioCh, ptpClockId } = req.body;
  const sdp = `v=0
o=- ${Date.now()} 1 IN IP4 ${ip || "192.168.10.1"}
s=${streamName || "ST 2110 Stream"}
t=0 0
m=video ${port || 50004} RTP/AVP 112
c=IN IP4 ${ip || "239.100.1.1"}/32
a=rtpmap:112 raw/90000
a=fmtp:112 sampling=${format || "YCbCr-4:2:2"}; width=${width || 1920}; height=${height || 1080}; exactframerate=${fps || 60}; depth=10
a=ts-refclk:ptp=IEEE1588-2008:${ptpClockId || "70-B3-D5-FF-FE-00-11-22"}:0
m=audio ${Number(port || 50004) + 2} RTP/AVP 97
c=IN IP4 ${ip || "239.100.1.1"}/32
a=rtpmap:97 L24/48000/${audioCh || 8}
a=ptime:1`;
  
  res.json({ sdp });
});

// Shell script generator for Linux deployment
app.get("/api/export/bridge-script", (req, res) => {
  const script = `#!/bin/bash
# ==============================================================================
# Open Media Transport (OMT) & SMPTE ST 2110 Linux Network Bridge Configurator
# Generated by Open Media Transport Web Control Center
# ==============================================================================

set -e

echo "=== Initializing Open Media Transport Kernel Parameters ==="
# Optimize Linux Socket Buffers for High-Bitrate Uncompressed Broadcast Streams (ST 2110 / OMT)
sysctl -w net.core.rmem_max=67108864
sysctl -w net.core.wmem_max=67108864
sysctl -w net.core.rmem_default=33554432
sysctl -w net.core.wmem_default=33554432
sysctl -w net.core.optmem_max=2048000
sysctl -w net.ipv4.igmp_max_memberships=1024
sysctl -w net.ipv4.conf.all.rp_filter=0
sysctl -w net.ipv4.conf.default.rp_filter=0

${bridges.map(b => `
echo "--- Configuring Bridge Interface: ${b.name} ---"
ip link add name ${b.name} type bridge
ip link set ${b.name} mtu ${b.mtu}
${b.stpEnabled ? `ip link set ${b.name} type bridge stp_state 1` : `ip link set ${b.name} type bridge stp_state 0`}

${b.slaves.map(s => `
echo "  > Attaching slave interface ${s} to ${b.name}"
ip link set dev ${s} master ${b.name} || echo "Warning: slave ${s} not present on system"
`).join("")}

ip addr add ${b.ipAddress}/${b.netmask === '255.255.255.0' ? '24' : '16'} dev ${b.name}
ip link set dev ${b.name} up
${b.promiscuous ? `ip link set dev ${b.name} promisc on` : ''}
`).join("\n")}

echo "=== Open Media Transport Bridge Initialization Complete ==="
echo "Active Virtual Bridges:"
ip link show type bridge
`;

  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Content-Disposition", "attachment; filename=omt-bridge-setup.sh");
  res.send(script);
});

// AI Diagnostics Route
app.post("/api/ai/diagnose", async (req, res) => {
  const { query, pipelineContext } = req.body;
  const ai = getGeminiAi();

  if (!ai) {
    return res.json({
      analysis: "Gemini API key is not configured. Running offline rule-based network diagnostic.",
      recommendations: [
        "Ensure jumbo frames (MTU 9000) are configured on all switch ports for ST 2110 & OMT feeds.",
        "Set kernel socket buffer memory `sysctl -w net.core.rmem_max=67108864` to prevent dropped UDP multicast packets.",
        "Check PTP IEEE 1588 Grandmaster clock synchronization to prevent video frame tears and audio buffer drift."
      ],
      sysctlCommands: [
        "sysctl -w net.core.rmem_max=67108864",
        "sysctl -w net.core.wmem_max=67108864",
        "ip link set dev omt-br0 mtu 9000"
      ]
    });
  }

  try {
    const prompt = `You are a Broadcast Systems Engineer specializing in Open Media Transport (OMT), SMPTE ST 2110, ST 2022-6, SRT, and Linux Kernel Network Bridge Optimization.
Analyze the user's issue or stream pipeline query:
Query: "${query || "Analyze current system stream status and advise on latency / buffer settings"}"
Active Pipelines Context: ${JSON.stringify(pipelineContext || pipelines)}
PTP Status: ${JSON.stringify(ptpClock)}

Provide a concise, expert breakdown in plain JSON format with the following keys:
"analysis": (string explaining root cause or setup advice),
"recommendations": (array of strings with concrete broadcast engineering steps),
"sysctlCommands": (array of string bash commands to tune Linux network bridge kernel parameters).

Return ONLY valid JSON without markdown wrapping.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const text = response.text || "";
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanJson);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      error: "AI Diagnosis failed",
      message: err.message,
      fallback: "Ensure PTP grandmaster is locked and socket buffer sizes are expanded."
    });
  }
});

// Start Server and Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[OMT Bridge Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
