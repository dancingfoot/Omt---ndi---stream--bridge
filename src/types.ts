export type ProtocolType = 
  | 'OMT'
  | 'ST_2110_20'
  | 'ST_2110_30'
  | 'ST_2110_40'
  | 'ST_2022_6'
  | 'SRT'
  | 'NDI'
  | 'RTSP'
  | 'RTMP'
  | 'WebRTC'
  | 'MPEG_TS';

export type PipelineStatus = 'active' | 'degraded' | 'paused' | 'error';

export interface StreamPipeline {
  id: string;
  name: string;
  ingestProtocol: ProtocolType;
  ingestUri: string;
  egressProtocol: ProtocolType;
  egressUri: string;
  bridgeInterface: string;
  status: PipelineStatus;
  bitrateKbps: number;
  fps: number;
  latencyMs: number;
  jitterMs: number;
  packetLossPercent: number;
  resolution: string;
  timecode: string;
  ptpLocked: boolean;
  tallyState: 'off' | 'preview' | 'program';
  sdpManifest?: string;
  audioChannels: number;
  audioLevels: [number, number]; // [Left dBFS, Right dBFS]
}

export interface NetworkBridgeInterface {
  id: string;
  name: string; // e.g., omt-br0
  type: 'bridge' | 'veth' | 'physical' | 'vlan';
  ipAddress: string;
  netmask: string;
  macAddress: string;
  mtu: number;
  status: 'up' | 'down';
  slaves: string[]; // e.g. ['eth0', 'veth-st1']
  vlanId?: number;
  rxBytes: number;
  txBytes: number;
  rxPackets: number;
  txPackets: number;
  rxDropped: number;
  txDropped: number;
  promiscuous: boolean;
  stpEnabled: boolean;
}

export interface PtpClockStatus {
  grandmasterId: string;
  grandmasterIp: string;
  domain: number;
  state: 'LOCKED' | 'HOLDOVER' | 'FREERUN' | 'SEARCHING';
  offsetFromMasterNs: number;
  meanPathDelayNs: number;
  stepsRemoved: number;
}

export interface NmosDevice {
  id: string;
  label: string;
  type: 'sender' | 'receiver';
  protocol: ProtocolType;
  transport: string; // e.g. urn:x-nmos:transport:rtp.mcast
  format: 'video' | 'audio' | 'data';
  boundPipelineId?: string;
}

export interface MetricDataPoint {
  time: string;
  bitrateMbps: number;
  fps: number;
  latencyMs: number;
  packetLoss: number;
}

export interface SystemStats {
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  networkRxMbps: number;
  networkTxMbps: number;
  kernelBuffersFreeKb: number;
  activeStreamsCount: number;
}
