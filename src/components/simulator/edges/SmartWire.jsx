import React, { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, useReactFlow } from '@xyflow/react';
import useSimulationStore from '../../../store/useSimulationStore';

// Helper: Distance from point P to line segment AB
function distanceToSegment(p, a, b) {
    const l2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)));
}

const SmartWire = memo(({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    selected,
    style = {},
    data = {},
}) => {
    const { updateEdgePath } = useSimulationStore();
    const { screenToFlowPosition } = useReactFlow();

    const waypoints = data.waypoints || [];

    // 1. Calculate the Path
    let fullPoints = [{ x: sourceX, y: sourceY }, ...waypoints, { x: targetX, y: targetY }];

    // Auto-route if no waypoints: Step Line
    if (waypoints.length === 0) {
        const midX = sourceX + (targetX - sourceX) / 2;
        // Implicit points for the path string, but we don't save them to state yet
        // If user clicks to add a point, we will materialize them.
    }

    let edgePath = '';
    if (waypoints.length === 0) {
        const midX = sourceX + (targetX - sourceX) / 2;
        edgePath = `M ${sourceX},${sourceY} L ${midX},${sourceY} L ${midX},${targetY} L ${targetX},${targetY}`;
    } else {
        edgePath = `M ${sourceX},${sourceY}`;
        waypoints.forEach(p => edgePath += ` L ${p.x},${p.y}`);
        edgePath += ` L ${targetX},${targetY}`;
    }

    // 2. Interaction: dragging existing handles
    const handleDrag = (e, index) => {
        e.stopPropagation();
        e.preventDefault();
        const target = e.target;
        target.setPointerCapture(e.pointerId);

        const onMove = (moveEvent) => {
            moveEvent.stopPropagation();
            moveEvent.preventDefault();
            const flowPos = screenToFlowPosition({ x: moveEvent.clientX, y: moveEvent.clientY });
            const snappedX = Math.round(flowPos.x / 10) * 10;
            const snappedY = Math.round(flowPos.y / 10) * 10;

            const newWaypoints = [...waypoints];
            newWaypoints[index] = { x: snappedX, y: snappedY };
            updateEdgePath(id, newWaypoints);
        };

        const onUp = (upEvent) => {
            upEvent.stopPropagation();
            target.releasePointerCapture(upEvent.pointerId);
            target.removeEventListener('pointermove', onMove);
            target.removeEventListener('pointerup', onUp);
        };

        target.addEventListener('pointermove', onMove);
        target.addEventListener('pointerup', onUp);
    };

    // 3. Interaction: Click to Add Point
    const onWireClick = (e) => {
        // Only trigger if we are selecting or interacting.
        // If we want to support "click on unselected wire selects it AND adds point", 
        // we might get conflict with React Flow selection. 
        // Better: Only add point if ALREADY selected.
        if (!selected) return;

        e.stopPropagation(); // Prevent deselection

        const clickPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        const snappedPos = {
            x: Math.round(clickPos.x / 10) * 10,
            y: Math.round(clickPos.y / 10) * 10
        };

        // If no waypoints exist yet, we "materialize" the auto-path + the new point
        let newWaypoints = [];
        if (waypoints.length === 0) {
            const midX = sourceX + (targetX - sourceX) / 2;
            // The default path was M S L mid,Sy L mid,Ty L T
            // We have implicit corners at (midX, sourceY) and (midX, targetY)
            // We find where the click is relative to these segments.
            // Simplified: Just insert the click point into a logical place?
            // BETTER: Just initialize with the click point and let the user drag.
            // Or better: Materialize the implied curve points?
            // Let's just add the click point.
            newWaypoints = [snappedPos];
        } else {
            // Find insertion index based on proximity to segments
            let minDistance = Infinity;
            let insertIndex = 0;

            // fullPoints has Source + Waypoints + Target
            for (let i = 0; i < fullPoints.length - 1; i++) {
                const p1 = fullPoints[i];
                const p2 = fullPoints[i + 1];
                const d = distanceToSegment(clickPos, p1, p2);
                if (d < minDistance) {
                    minDistance = d;
                    insertIndex = i + 1; // Insert after p1 (before p2)
                }
            }

            newWaypoints = [...waypoints];
            // Since fullPoints includes Source at 0, insertIndex 1 corresponds to waypoints[0]
            // We need to map back to waypoints array indices.
            // fullPoints: [S, w0, w1, T]
            // if insert is 1 (between S and w0), we splice at 0.
            // if insert is 2 (between w0 and w1), we splice at 1.
            const spliceIndex = insertIndex - 1;
            newWaypoints.splice(spliceIndex, 0, snappedPos);
        }

        updateEdgePath(id, newWaypoints);
    };

    // Define styles
    const strokeColor = style.stroke || '#2ED573';
    // Thin wire style requested
    const mainStrokeWidth = 2; // Was 4
    const selectedStrokeWidth = 3; // Was 6

    return (
        <>
            {/* 1. Transparent Hit Box for easier clicking */}
            <BaseEdge
                path={edgePath}
                style={{
                    strokeWidth: 20,
                    stroke: 'transparent',
                    cursor: 'crosshair',
                    pointerEvents: 'stroke', // Ensure clicks register on the stroke
                }}
            />
            {/* 1.1 Invisible click listener overlay on the path 
                BaseEdge doesn't easily accept onClick, usually. 
                React Flow edges handle clicks via `onEdgeClick`. 
                However, for custom "add point" logic, we capture it via the hit box wrapper 
                if we can access it. 
                Actually, simpler: We put the onClick on the visible wire group or use a trick.
                Since BaseEdge renders a path, we can't wrap it easily.
                
                Workaround: Use EdgeLabelRenderer to render a full-size SVG overlay? No, complex.
                
                Actually, we can pass `interactionWidth` to `BaseEdge`? No.
                
                Let's rely on React Flow's onEdgeClick? 
                SimulatorView passes `onEdgeClick`. That selects the edge.
                
                We need a way to intercept the click *inside* the component.
                The transparent path above with `pointerEvents: stroke` works IF we attach the handler.
                But BaseEdge prop API is limited.
                
                Let's use an SVG path covering the same d attribute.
            */}
            <path
                d={edgePath}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                style={{ cursor: 'crosshair', pointerEvents: 'all' }}
                onClick={onWireClick}
            />

            {/* 2. Visual Wire */}
            <BaseEdge
                path={edgePath}
                style={{
                    ...style,
                    strokeWidth: selected ? selectedStrokeWidth : mainStrokeWidth,
                    stroke: strokeColor,
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    pointerEvents: 'none', // Let clicks pass to the hit box
                }}
            />

            {/* 3. Drag Handles (Only if selected) */}
            {selected && (
                <EdgeLabelRenderer>
                    <div style={{
                        position: 'absolute',
                        pointerEvents: 'none',
                        width: '100%', height: '100%',
                        top: 0, left: 0
                    }}>
                        {waypoints.map((p, i) => (
                            <div
                                key={i}
                                className="nodrag"
                                onPointerDown={(e) => handleDrag(e, i)}
                                style={{
                                    position: 'absolute',
                                    left: p.x, top: p.y,
                                    width: 12, height: 12, // Slightly smaller handles
                                    background: '#fff',
                                    border: `2px solid ${strokeColor}`,
                                    borderRadius: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    cursor: 'crosshair',
                                    pointerEvents: 'all',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
                                }}
                            />
                        ))}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
});

export default SmartWire;
