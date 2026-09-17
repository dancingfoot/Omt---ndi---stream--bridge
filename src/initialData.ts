import { 
  NetworkBridgeInterface, 
  StreamPipeline, 
  PtpClockStatus, 
  NmosDevice, 
  SystemStats 
} from './types';

export const initialBridges: NetworkBridgeInterface[] = [
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

export const initialPipelines: StreamPipeline[] = [
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

export const initialPtpClock: PtpClockStatus = {
  grandmasterId: "70:b3:d5:ff:fe:00:11:22",
  grandmasterIp: "10.211.0.254",
  domain: 127,
  state: "LOCKED",
  offsetFromMasterNs: 24,
  meanPathDelayNs: 812,
  stepsRemoved: 1
};

export const initialNmosDevices: NmosDevice[] = [
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

export const initialStats: SystemStats = {
  cpuUsagePercent: 22,
  memoryUsagePercent: 34,
  networkRxMbps: 1845.2,
  networkTxMbps: 1792.8,
  kernelBuffersFreeKb: 131072,
  activeStreamsCount: 4
};
