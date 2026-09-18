import React from 'react';
import { StreamViewer } from './components/StreamViewer';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-600 selection:text-white">
      {/* Stream Viewer with Stream List & Test Pattern Generator */}
      <main className="flex-1 flex flex-col items-center justify-start">
        <StreamViewer />
      </main>

      {/* Broadcast Status Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-900 font-mono">
        Open Media Transport (OMT) • Multi-Stream Viewer & Broadcast Test Pattern Generator
      </footer>
    </div>
  );
}
