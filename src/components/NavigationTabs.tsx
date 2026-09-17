import React from 'react';
import { 
  Tv, 
  ArrowLeftRight, 
  Network, 
  Cpu, 
  BarChart3, 
  Bot 
} from 'lucide-react';

export type TabType = 'preview' | 'matrix' | 'bridge' | 'stthings' | 'telemetry' | 'ai';

interface NavigationTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  activeStreamCount: number;
  bridgeCount: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onTabChange,
  activeStreamCount,
  bridgeCount
}) => {
  const tabs = [
    {
      id: 'preview' as TabType,
      label: 'Live Preview & Multi-View',
      icon: Tv,
      badge: `${activeStreamCount} Live`
    },
    {
      id: 'matrix' as TabType,
      label: 'Protocol Conversion Matrix',
      icon: ArrowLeftRight,
      badge: 'OMT / ST2110 / SRT'
    },
    {
      id: 'bridge' as TabType,
      label: 'Linux Bridge Controller',
      icon: Network,
      badge: `${bridgeCount} Bridges`
    },
    {
      id: 'stthings' as TabType,
      label: 'ST Things & NMOS Registry',
      icon: Cpu,
      badge: 'ST 2110-20/30/40'
    },
    {
      id: 'telemetry' as TabType,
      label: 'Packet Telemetry & Latency',
      icon: BarChart3,
      badge: 'Live Metrics'
    },
    {
      id: 'ai' as TabType,
      label: 'AI Broadcast Advisor',
      icon: Bot,
      badge: 'Gemini Assistant'
    }
  ];

  return (
    <div className="bg-[#0F0F12] border-b border-slate-800 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <nav className="flex space-x-2 sm:space-x-3 overflow-x-auto py-2 scrollbar-none font-mono" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-semibold transition-all whitespace-nowrap cursor-pointer uppercase tracking-tight ${
                  isActive
                    ? 'bg-indigo-600 text-white border border-indigo-500 shadow-lg shadow-indigo-900/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 text-[10px] rounded font-mono font-normal ${
                  isActive ? 'bg-indigo-700/60 text-indigo-100' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
