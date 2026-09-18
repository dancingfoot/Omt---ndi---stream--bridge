export type StreamType = 'camera' | 'test-pattern' | 'omt';

export type PatternType = 'smpte-bars' | 'ebu-bars' | 'gradient' | 'grid';

export interface StreamItem {
  id: string;
  name: string;
  type: StreamType;
  url: string;
  resolution: string;
  fps: number;
  format: string;
  status: 'online' | 'standby' | 'offline';
  bitrateMbps?: number;
  patternType?: PatternType;
  description?: string;
  audioTone?: boolean;
}
