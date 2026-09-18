import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { StreamItem } from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory stream catalogue
let activeStreams: StreamItem[] = [
  {
    id: "stream-camera",
    name: "Live Camera Feed",
    type: "camera",
    url: "camera://v4l2/default",
    resolution: "1920x1080",
    fps: 60,
    format: "Camera Capture (v4l2)",
    status: "online",
    bitrateMbps: 42.5,
    description: "Direct local webcam or HDMI capture card input"
  },
  {
    id: "stream-smpte",
    name: "SMPTE Color Bars (EG 1)",
    type: "test-pattern",
    url: "test://smpte-bars",
    resolution: "1920x1080",
    fps: 60,
    format: "SMPTE RP 219 75% + PLUGE",
    status: "online",
    patternType: "smpte-bars",
    bitrateMbps: 48.0,
    description: "Standard 75% color bars with sub-bars, moving sync & black reference"
  },
  {
    id: "stream-ebu",
    name: "EBU Color Bars Reference",
    type: "test-pattern",
    url: "test://ebu-bars",
    resolution: "1920x1080",
    fps: 60,
    format: "EBU 100% Standard Color Bars",
    status: "online",
    patternType: "ebu-bars",
    bitrateMbps: 48.0,
    description: "European Broadcasting Union 100% color gamut reference"
  },
  {
    id: "stream-gradient",
    name: "Grayscale Ramp & Quantization",
    type: "test-pattern",
    url: "test://gradient-ramp",
    resolution: "1920x1080",
    fps: 60,
    format: "10-bit Dynamic Range Gradient",
    status: "online",
    patternType: "gradient",
    bitrateMbps: 35.2,
    description: "Luminance ramp and 16-step staircase to verify contrast and gamma"
  },
  {
    id: "stream-grid",
    name: "Convergence Grid & Safe Areas",
    type: "test-pattern",
    url: "test://safe-grid",
    resolution: "1920x1080",
    fps: 60,
    format: "Crosshatch & 90%/80% Margins",
    status: "online",
    patternType: "grid",
    bitrateMbps: 22.0,
    description: "Geometric alignment crosshair with 90% action and 80% title safe boundaries"
  },
  {
    id: "stream-omt-cam1",
    name: "Studio Cam 01 (OMT Ingest)",
    type: "omt",
    url: "omt://192.168.10.50:9001/cam01",
    resolution: "1920x1080",
    fps: 59.94,
    format: "VMX 4:2:2 10-bit",
    status: "online",
    bitrateMbps: 54.8,
    description: "Open Media Transport low latency network stream"
  },
  {
    id: "stream-omt-obvan",
    name: "OB-Van 4K Relay",
    type: "omt",
    url: "omt://192.168.10.1:9002/obvan_feed",
    resolution: "3840x2160",
    fps: 60,
    format: "VMX 4:2:2 4K UHD",
    status: "standby",
    bitrateMbps: 120.0,
    description: "High-throughput 4K outside broadcast OMT feed"
  }
];

// Lazy Gemini instance
let geminiClient: GoogleGenAI | null = null;
function getGeminiAi(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Stream catalogue endpoints
app.get("/api/streams", (_req, res) => {
  res.json(activeStreams);
});

app.post("/api/streams", (req, res) => {
  const { name, type, url, resolution, fps, format, description } = req.body;
  if (!name || !url) {
    return res.status(400).json({ error: "Name and URL are required" });
  }
  const newStream: StreamItem = {
    id: `stream-${Date.now()}`,
    name,
    type: type || "omt",
    url,
    resolution: resolution || "1920x1080",
    fps: fps || 60,
    format: format || "VMX 4:2:2 10-bit",
    status: "online",
    bitrateMbps: 48.0,
    description: description || "Custom Open Media Transport stream"
  };
  activeStreams.push(newStream);
  res.status(201).json(newStream);
});

app.delete("/api/streams/:id", (req, res) => {
  const { id } = req.params;
  activeStreams = activeStreams.filter(s => s.id !== id);
  res.json({ message: "Stream deleted", id });
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
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[OMT Stream Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
