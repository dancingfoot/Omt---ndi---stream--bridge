import React, { useRef, useEffect } from 'react';
import { PatternType } from '../types';

interface TestPatternCanvasProps {
  patternType: PatternType;
  streamName?: string;
  resolution?: string;
  fps?: number;
  timecode?: string;
  showMovingSync?: boolean;
}

export function TestPatternCanvas({
  patternType,
  streamName = 'OMT Test Generator',
  resolution = '1920x1080',
  fps = 60,
  timecode = '00:00:00:00',
  showMovingSync = true
}: TestPatternCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number>(0);
  const animIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      frameRef.current += 1;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (patternType === 'smpte-bars') {
        // SMPTE EG 1 / RP 219 Color Bars
        const topH = height * 0.67;
        const midH = height * 0.08;
        const botH = height * 0.25;

        // Top 7 bars (75% White, Yellow, Cyan, Green, Magenta, Red, Blue)
        const topColors = [
          '#bfbfbf', // 75% White
          '#bfbf00', // 75% Yellow
          '#00bfbf', // 75% Cyan
          '#00bf00', // 75% Green
          '#bf00bf', // 75% Magenta
          '#bf0000', // 75% Red
          '#0000bf'  // 75% Blue
        ];
        const barW = width / topColors.length;
        topColors.forEach((color, i) => {
          ctx.fillStyle = color;
          ctx.fillRect(i * barW, 0, barW, topH);
        });

        // Middle row
        const midColors = [
          '#0000bf', // Blue
          '#131313', // Black
          '#bf00bf', // Magenta
          '#131313', // Black
          '#00bfbf', // Cyan
          '#131313', // Black
          '#bfbfbf'  // 75% White
        ];
        midColors.forEach((color, i) => {
          ctx.fillStyle = color;
          ctx.fillRect(i * barW, topH, barW, midH);
        });

        // Bottom row: -I, White (100%), +Q, Black, PLUGE (-2%, 0%, +2%), Black
        const botSegments = [
          { color: '#08394e', w: barW * 1.25 }, // -I
          { color: '#ffffff', w: barW * 1.25 }, // 100% White
          { color: '#33084e', w: barW * 1.25 }, // +Q
          { color: '#131313', w: barW * 0.75 }, // Black
          { color: '#090909', w: barW * 0.35 }, // -2% Black (super-black)
          { color: '#131313', w: barW * 0.35 }, // 0% Black
          { color: '#1f1f1f', w: barW * 0.35 }, // +2% Black
          { color: '#131313', w: width - (barW * 4.5 + barW * 1.05) } // Remaining Black
        ];
        let curX = 0;
        botSegments.forEach(seg => {
          ctx.fillStyle = seg.color;
          ctx.fillRect(curX, topH + midH, seg.w, botH);
          curX += seg.w;
        });

      } else if (patternType === 'ebu-bars') {
        // EBU 100% Standard Color Bars
        const colors = [
          '#ffffff', // White
          '#ffff00', // Yellow
          '#00ffff', // Cyan
          '#00ff00', // Green
          '#ff00ff', // Magenta
          '#ff0000', // Red
          '#0000ff', // Blue
          '#000000'  // Black
        ];
        const barW = width / colors.length;
        colors.forEach((col, i) => {
          ctx.fillStyle = col;
          ctx.fillRect(i * barW, 0, barW, height);
        });

      } else if (patternType === 'gradient') {
        // Dynamic Grayscale 10-bit & 8-bit Gradient
        const grad = ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, '#000000');
        grad.addColorStop(0.5, '#7f7f7f');
        grad.addColorStop(1, '#ffffff');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height * 0.7);

        // Lower stepped 10-bar luminance staircase
        const steps = 16;
        const stepW = width / steps;
        for (let i = 0; i < steps; i++) {
          const val = Math.round((i / (steps - 1)) * 255);
          ctx.fillStyle = `rgb(${val},${val},${val})`;
          ctx.fillRect(i * stepW, height * 0.7, stepW, height * 0.3);
        }

      } else if (patternType === 'grid') {
        // Geometry Alignment & Safe Margin Crosshatch
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;

        const gridSize = 40;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Center crosshairs
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Perfect Center Circle
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, height * 0.35, 0, Math.PI * 2);
        ctx.stroke();

        // Safe action (90%) and safe title (80%) borders
        ctx.strokeStyle = '#eab308'; // Action safe yellow
        ctx.lineWidth = 2;
        ctx.strokeRect(width * 0.05, height * 0.05, width * 0.9, height * 0.9);

        ctx.strokeStyle = '#06b6d4'; // Title safe cyan
        ctx.lineWidth = 2;
        ctx.strokeRect(width * 0.1, height * 0.1, width * 0.8, height * 0.8);
      }

      // Moving Sync Bar (Proves broadcast stream is not frozen)
      if (showMovingSync) {
        const syncW = 70;
        const syncH = 14;
        const syncY = height * 0.75 - syncH / 2;
        const sweepX = (frameRef.current * 4) % (width - syncW);

        ctx.fillStyle = '#10b981'; // Emerald
        ctx.fillRect(sweepX, syncY, syncW, syncH);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('SYNC', sweepX + 18, syncY + 10);
      }

      // Center Identifier Slate
      const slateW = 340;
      const slateH = 46;
      const slateX = (width - slateW) / 2;
      const slateY = (height - slateH) / 2;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(slateX, slateY, slateW, slateH);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(slateX, slateY, slateW, slateH);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(streamName, width / 2, slateY + 18);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '11px monospace';
      ctx.fillText(`${resolution} @ ${fps}fps  •  ${timecode}`, width / 2, slateY + 36);

      animIdRef.current = requestAnimationFrame(render);
    };

    animIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, [patternType, streamName, resolution, fps, timecode, showMovingSync]);

  return (
    <canvas
      ref={canvasRef}
      width={1280}
      height={720}
      className="w-full h-full object-cover block select-none bg-black"
    />
  );
}
