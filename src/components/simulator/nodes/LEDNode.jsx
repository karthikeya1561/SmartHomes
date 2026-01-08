import React, { memo, useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';

const LEDNode = memo(({ data, selected }) => {
  const [pulse, setPulse] = useState(1);
  const color = data.color || '#FF4757';
  const isPowered = data.isPowered || false;

  // 1. Logic: Smooth pulsing animation for powered state
  useEffect(() => {
    let animationFrame;
    if (isPowered) {
      const animate = (time) => {
        const p = Math.sin(time / 200) * 0.35 + 0.65;
        setPulse(p);
        animationFrame = requestAnimationFrame(animate);
      };
      animationFrame = requestAnimationFrame(animate);
    } else {
      setPulse(0);
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [isPowered]);

  // Helper for color variations
  const lighten = (col, amt) => col; // In production, use a library like 'tinycolor2'

  return (
    <div className="relative w-[60px] h-[100px]" style={{ filter: selected ? 'drop-shadow(0 0 10px #00ccff)' : 'none' }}>
      <svg width="60" height="100" viewBox="-30 -50 60 100" className="overflow-visible pointer-events-none">
        
        {/* 2. Realistic Glow Layers (Only visible when powered) */}
        {isPowered && (
          <g style={{ opacity: pulse }}>
            <ellipse cx="0" cy="-10" rx={20 * pulse} ry={25 * pulse} fill={color} opacity="0.15" />
            <ellipse cx="0" cy="-10" rx={35 * pulse} ry={45 * pulse} fill={color} opacity="0.05" />
          </g>
        )}

        {/* 3. Refined LED Bulb Geometry */}
        <path 
          d="M -15 -21 L 15 -21 L 15 0 Q 15 1 0 1 L -15 1 Q -15 0 -15 -21 Z" 
          fill={isPowered ? color : color} 
          className="pointer-events-auto"
        />
        <path d="M -15 -21 A 15 15 0 0 1 15 -21" fill={color} />

        {/* 4. Internal Shading & Highlights */}
        <rect x="-15" y="-21" width="6" height="21" fill="rgba(0,0,0,0.2)" />
        <rect x="9" y="-21" width="6" height="21" fill="rgba(255,255,255,0.2)" />

        {/* 5. Realistic Metal Legs */}
        {/* Cathode (Straight - Left) */}
        <rect x="-10.5" y="1" width="3" height="28" fill="#999" />
        
        {/* Anode (Bent - Right) */}
        <path 
          d="M 7 1 L 7 16 Q 7 22 13 22 L 13 30" 
          fill="none" 
          stroke="#999" 
          strokeWidth="3" 
        />
      </svg>

      {/* 6. Precision Connection Terminals */}
      {/* Cathode Terminal (Left) */}
      <div className="absolute" style={{ left: '21px', top: '78px' }}>
        <div className={`w-2 h-2 rounded-full ${isPowered ? 'bg-red-400' : 'bg-red-600'}`} />
        <Handle type="target" position={Position.Bottom} id="cathode" className="!opacity-0 !w-0 !h-0" />
      </div>

      {/* Anode Terminal (Right) */}
      <div className="absolute" style={{ left: '43px', top: '80px' }}>
        <div className={`w-2 h-2 rounded-full ${isPowered ? 'bg-green-400' : 'bg-green-600'}`} />
        <Handle type="source" position={Position.Bottom} id="anode" className="!opacity-0 !w-0 !h-0" />
      </div>
    </div>
  );
});

export default LEDNode;