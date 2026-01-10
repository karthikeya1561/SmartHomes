import React from 'react';
import { Handle, useReactFlow } from '@xyflow/react';
import useSimulationStore from '../../../store/useSimulationStore';

const SmartHandle = (props) => {
  const { id, type, nodeId } = props;
  const { drawing, startWiring, completeWiring, nodes } = useSimulationStore();
  const { screenToFlowPosition } = useReactFlow();

  const handleClick = (e) => {
    e.stopPropagation();
    if (drawing.active) {
      completeWiring(nodeId, id);
    } else {
      const node = nodes.find(n => n.id === nodeId);
      let offsetX = 0; let offsetY = 0;

      if (node?.type === 'ledNode') {
        offsetX = id === 'cathode' ? 21 : 43;
        offsetY = id === 'cathode' ? 79 : 80;
      } else if (node?.type === 'batteryNode') {
        offsetX = id === 'positive' ? 11 : 71;
        offsetY = 46;
      } else if (node?.type === 'resistorNode') {
        offsetX = id === 'p1' ? 0 : 200;
        offsetY = 50;
      }

      const startPos = node ? { x: node.position.x + offsetX, y: node.position.y + offsetY } : screenToFlowPosition({ x: e.clientX, y: e.clientY });
      startWiring(nodeId, id, startPos);
    }
  };

  return (
    <Handle
      {...props}
      isConnectable={false}
      onClick={handleClick}
      className="!w-6 !h-6 !opacity-30 !cursor-crosshair !border-white !bg-blue-500 hover:!opacity-80 transition-opacity"
      style={{ borderRadius: '50%', transform: 'translate(-50%, -50%)' }}
    />
  );
};

export default SmartHandle;