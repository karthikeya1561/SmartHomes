import React, { memo } from 'react';
import { getSmoothStepPath, BaseEdge } from '@xyflow/react';

// memo() prevents the wire from re-rendering unless its specific coordinates change
const MovableWire = memo(({ 
  sourceX, sourceY, targetX, targetY, 
  sourcePosition, targetPosition, 
  style = {}, selected, markerEnd 
}) => {
  const [edgePath] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, 
    borderRadius: 0, // Keep professional right-angles
  });

  return (
    <BaseEdge 
      path={edgePath} 
      markerEnd={markerEnd} 
      style={{ 
        ...style, 
        strokeWidth: selected ? 4 : 2, 
        filter: selected ? 'drop-shadow(0 0 2px #fff)' : 'none',
        transition: 'stroke-width 0.2s',
        // GPU Acceleration: Tells the browser to optimize this path for movement
        willChange: 'd, stroke-width', 
      }} 
    />
  );
});

export default MovableWire;