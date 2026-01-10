import React, { useEffect, useRef, useState, useCallback } from 'react';
import './CanvasSimulator.css';

// --- Constants ---
const COLORS = {
    LED: ['#FF4757', '#FFA502', '#FFEB3B', '#4CAF50', '#2196F3', '#9C27B0', '#FF6B9D', '#00BCD4'],
    WIRE: ['#FF4757', '#FFA502', '#4CAF50', '#2196F3', '#9E9E9E', '#9C27B0', '#00BCD4', '#FFEB3B']
};

// Polyfill for roundRect
function drawRoundRect(ctx, x, y, width, height, radius) {
    if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, radius);
        return;
    }
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function getOrthogonalPoint(from, to) {
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    if (dx > dy) {
        return { x: to.x, y: from.y };
    } else {
        return { x: from.x, y: to.y };
    }
}

function distanceToWire(wire, px, py) {
    if (wire.points && wire.points.length >= 2) {
        let minDist = Infinity;
        for (let i = 0; i < wire.points.length - 1; i++) {
            const p1 = wire.points[i];
            const p2 = wire.points[i + 1];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const lenSq = dx * dx + dy * dy;

            if (lenSq === 0) {
                minDist = Math.min(minDist, Math.hypot(px - p1.x, py - p1.y));
            } else {
                let t = ((px - p1.x) * dx + (py - p1.y) * dy) / lenSq;
                t = Math.max(0, Math.min(1, t));
                const projX = p1.x + t * dx;
                const projY = p1.y + t * dy;
                minDist = Math.min(minDist, Math.hypot(px - projX, py - projY));
            }
        }
        return minDist;
    }
    return Infinity;
}

function isSegmentDraggable(wire, index) {
    const p1 = wire.points[index];
    const p2 = wire.points[index + 1];
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    if (len < 30) return false;
    if (wire.points.length > 2) {
        if (index === 0 && wire.from) return false;
        if (index === wire.points.length - 2 && wire.to) return false;
    }
    return true;
}

export default function CanvasSimulator() {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [stats, setStats] = useState({ leds: 0, batteries: 0, wires: 0 });
    const [uiState, setUiState] = useState({
        showLedControls: false,
        showWireControls: false,
        showBatteryControls: false,
        hasSelection: false,
        selectedColor: null,
    });

    const world = useRef({
        ctx: null,
        components: [],
        batteries: [],
        wires: [],
        selectedObj: null,
        draggingObj: null,
        draggingWireSegment: null,
        hoveredSegment: null,
        wireInProgress: null,
        mouseX: 0,
        mouseY: 0,
        hoveredWire: null,
        hoveredComponent: null,
        needsRender: true,
        pulseTime: 0,
        nets: [],
        netIdCounter: 0,
        width: 0,
        height: 0
    });

    const triggerRender = useCallback(() => {
        world.current.needsRender = true;
    }, []);

    const updateUIState = useCallback(() => {
        const w = world.current;
        const obj = w.selectedObj;
        setUiState({
            showLedControls: obj && obj.type === 'LED',
            showWireControls: obj && obj.type === 'WIRE',
            showBatteryControls: obj && obj.type === 'BATTERY',
            hasSelection: !!obj,
            selectedColor: obj ? obj.color : null
        });
        setStats({
            leds: w.components.length,
            batteries: w.batteries.length,
            wires: w.wires.length
        });
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const w = world.current;
        w.ctx = canvas.getContext('2d');

        // --- CLASSES ---
        class LED {
            constructor(x, y) {
                this.type = 'LED';
                this.x = x; this.y = y;
                this.targetX = x; this.targetY = y;
                this.color = '#FF4757';
                this.isPowered = false;
                this.id = 'LED ' + (w.components.length + 1);
                this.anodeNet = null;
                this.cathodeNet = null;
                this.updateTerminals();
            }
            checkPower() {
                if (!this.anodeNet || !this.cathodeNet || this.anodeNet === this.cathodeNet) {
                    this.isPowered = false; return;
                }
                let hasPos = w.batteries.some(b => b.positiveNet === this.anodeNet);
                let hasNeg = w.batteries.some(b => b.negativeNet === this.cathodeNet);
                this.isPowered = hasPos && hasNeg;
            }
            animate() {
                const ease = 0.2;
                const dx = this.targetX - this.x; const dy = this.targetY - this.y;
                if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
                    this.x += dx * ease; this.y += dy * ease;
                    this.updateTerminals(); return true;
                } else {
                    this.x = this.targetX; this.y = this.targetY;
                    this.updateTerminals(); return false;
                }
            }
            updateTerminals() {
                this.anode = { x: this.x + 13, y: this.y + 31 };
                this.cathode = { x: this.x - 9, y: this.y + 31 };
            }
            lightenColor(color, factor) {
                const hex = color.replace('#', '');
                const r = parseInt(hex.substr(0, 2), 16);
                const g = parseInt(hex.substr(2, 2), 16);
                const b = parseInt(hex.substr(4, 2), 16);
                return `rgb(${Math.min(255, Math.floor(r + (255 - r) * factor))}, ${Math.min(255, Math.floor(g + (255 - g) * factor))}, ${Math.min(255, Math.floor(b + (255 - b) * factor))})`;
            }
            darkenColor(color, factor) {
                const hex = color.replace('#', '');
                const r = parseInt(hex.substr(0, 2), 16);
                const g = parseInt(hex.substr(2, 2), 16);
                const b = parseInt(hex.substr(4, 2), 16);
                return `rgb(${Math.floor(r * (1 - factor))}, ${Math.floor(g * (1 - factor))}, ${Math.floor(b * (1 - factor))})`;
            }
            draw(ctx) {
                ctx.save(); ctx.translate(this.x, this.y);
                if (this.isPowered) {
                    const pulse = Math.sin(w.pulseTime) * 0.35 + 0.65;
                    ctx.shadowColor = this.color; ctx.shadowBlur = 40 + (pulse * 30);
                    for (let i = 0; i < 4; i++) {
                        ctx.globalAlpha = (0.2 - i * 0.04) * pulse;
                        ctx.fillStyle = this.color;
                        ctx.beginPath(); ctx.ellipse(0, -10, 20 + i * 8, 25 + i * 10, 0, 0, Math.PI * 2); ctx.fill();
                    }
                    ctx.globalAlpha = 1;
                }
                ctx.shadowBlur = 0;
                const headWidth = 15; const headHeight = 21;
                if (this.isPowered) {
                    const pulse = Math.sin(w.pulseTime) * 0.25 + 0.75;
                    ctx.fillStyle = this.lightenColor(this.color, 0.6 * pulse);
                } else ctx.fillStyle = this.color;
                ctx.beginPath(); ctx.moveTo(-headWidth, -headHeight);
                ctx.lineTo(headWidth, -headHeight); ctx.lineTo(headWidth, 0);
                ctx.arcTo(headWidth, 1, 0, 1, 1); ctx.lineTo(-headWidth, 1);
                ctx.arcTo(-headWidth, 0, -headWidth, -headHeight, 1);
                ctx.closePath(); ctx.fill();
                const darkShadow = ctx.createLinearGradient(-headWidth, 0, -headWidth + 6, 0);
                darkShadow.addColorStop(0, 'rgba(0, 0, 0, 0.4)'); darkShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = darkShadow; ctx.beginPath();
                ctx.moveTo(-headWidth, -headHeight); ctx.lineTo(-headWidth + 6, -headHeight);
                ctx.lineTo(-headWidth + 6, 0); ctx.lineTo(-headWidth, 0); ctx.closePath(); ctx.fill();
                if (this.isPowered) {
                    const pulse = Math.sin(w.pulseTime) * 0.2 + 0.8;
                    ctx.fillStyle = `rgba(255, 255, 255, ${0.25 * pulse})`;
                } else ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                const lightHighlight = ctx.createLinearGradient(headWidth - 6, 0, headWidth, 0);
                lightHighlight.addColorStop(0, 'rgba(255, 255, 255, 0)');
                lightHighlight.addColorStop(1, this.isPowered ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)');
                ctx.fillStyle = lightHighlight; ctx.fillRect(headWidth - 6, -headHeight + 2, 6, headHeight - 2);
                ctx.beginPath(); ctx.arc(0, -headHeight, headWidth, 0, Math.PI, true);
                const domeGradient = ctx.createRadialGradient(-5, -headHeight - 3, 0, 0, -headHeight, headWidth);
                if (this.isPowered) {
                    const pulse = Math.sin(w.pulseTime) * 0.2 + 0.8;
                    domeGradient.addColorStop(0, `rgba(255, 255, 255, ${0.8 * pulse})`);
                    domeGradient.addColorStop(0.4, this.lightenColor(this.color, 0.7 * pulse));
                    domeGradient.addColorStop(1, this.lightenColor(this.color, 0.3 * pulse));
                } else {
                    domeGradient.addColorStop(0, this.lightenColor(this.color, 0.4));
                    domeGradient.addColorStop(0.5, this.color);
                    domeGradient.addColorStop(1, this.darkenColor(this.color, 0.2));
                }
                ctx.fillStyle = domeGradient; ctx.fill();
                ctx.fillStyle = '#999999'; ctx.fillRect(-9, 1, 3, 30);
                ctx.fillStyle = 'rgba(200, 200, 200, 0.3)'; ctx.fillRect(-9.5, 2, 1, 28);
                ctx.strokeStyle = '#999999'; ctx.lineWidth = 3; ctx.lineCap = 'butt';
                ctx.beginPath(); ctx.moveTo(7, 1); ctx.lineTo(7, 16); ctx.quadraticCurveTo(7, 22, 13, 22); ctx.lineTo(13, 31); ctx.stroke();
                ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(6.3, 2); ctx.lineTo(6.3, 14); ctx.stroke();

                if (w.selectedObj === this) {
                    ctx.shadowColor = '#3498db'; ctx.shadowBlur = 20; ctx.strokeStyle = '#3498db';
                    ctx.setLineDash([6, 3]); ctx.lineWidth = 3; ctx.strokeRect(-22, -30, 44, 60);
                    ctx.setLineDash([]); ctx.shadowBlur = 0;
                }
                ctx.restore();
            }
        }

        class Battery {
            constructor(x, y) {
                this.type = 'BATTERY';
                this.x = x; this.y = y;
                this.targetX = x; this.targetY = y;
                this.voltage = 9;
                this.id = 'Battery ' + (w.batteries.length + 1);
                this.positiveNet = null; this.negativeNet = null;
                this.updateTerminals();
            }
            animate() {
                const ease = 0.2;
                const dx = this.targetX - this.x; const dy = this.targetY - this.y;
                if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
                    this.x += dx * ease; this.y += dy * ease; this.updateTerminals(); return true;
                } else {
                    this.x = this.targetX; this.y = this.targetY; this.updateTerminals(); return false;
                }
            }
            updateTerminals() {
                this.positive = { x: this.x - 30, y: this.y + 28 };
                this.negative = { x: this.x + 30, y: this.y + 28 };
            }
            draw(ctx) {
                ctx.save(); ctx.translate(this.x, this.y);
                ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
                const bodyGradient = ctx.createLinearGradient(-30, 0, 30, 0);
                bodyGradient.addColorStop(0, '#1a252f'); bodyGradient.addColorStop(0.5, '#34495e'); bodyGradient.addColorStop(1, '#1a252f');
                ctx.fillStyle = bodyGradient; drawRoundRect(ctx, -30, -28, 60, 56, 6); ctx.fill();
                ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
                const shineGradient = ctx.createLinearGradient(0, -28, 0, -18);
                shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)'); shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = shineGradient; ctx.fillRect(-28, -26, 56, 10);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'; ctx.fillRect(-30, -28, 3, 56);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fillRect(27, -28, 3, 56);
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(-28, -10); ctx.lineTo(28, -10); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(-28, 10); ctx.lineTo(28, 10); ctx.stroke();
                ctx.fillStyle = 'rgba(52, 152, 219, 0.25)'; ctx.fillRect(-28, -10, 56, 20);
                ctx.shadowColor = 'rgba(52, 152, 219, 0.6)'; ctx.shadowBlur = 10;
                ctx.fillStyle = '#3498db'; ctx.font = 'bold 20px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(this.voltage + 'V', 0, 0); ctx.shadowBlur = 0;
                ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 16px Inter'; ctx.fillText('+', 0, -18);
                ctx.fillStyle = '#95a5a6'; ctx.fillText('−', 0, 18);
                if (w.selectedObj === this) {
                    ctx.shadowColor = '#3498db'; ctx.shadowBlur = 20; ctx.strokeStyle = '#3498db';
                    ctx.setLineDash([8, 4]); ctx.lineWidth = 3; ctx.strokeRect(-35, -33, 70, 66);
                    ctx.setLineDash([]); ctx.shadowBlur = 0;
                }
                ctx.restore();
                ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(this.positive.x, this.positive.y, 3, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#95a5a6'; ctx.beginPath(); ctx.arc(this.negative.x, this.negative.y, 3, 0, Math.PI * 2); ctx.fill();
            }
        }

        class Wire {
            constructor(from, to, points = null) {
                this.type = 'WIRE';
                this.from = from; this.to = to;
                this.color = '#2ED573';
                this.points = points || this.calculateDefaultPoints();
                this.isComplete = !!(from && to);
            }
            calculateDefaultPoints() {
                if (this.from && this.to) {
                    const s = this.from.comp[this.from.type];
                    const e = this.to.comp[this.to.type];
                    return [{ x: s.x, y: s.y }, { x: e.x, y: e.y }];
                }
                return [];
            }
            calculateControlPoints() { return null; }
            updateEndpoint(endpoint) {
                this.to = endpoint; this.isComplete = true;
                if (this.points.length > 0 && endpoint) {
                    const termPos = endpoint.comp[endpoint.type];
                    this.points[this.points.length - 1] = { x: termPos.x, y: termPos.y };
                }
            }
            getPath() {
                const path = new Path2D();
                if (this.points && this.points.length >= 2) {
                    const radius = 15;
                    path.moveTo(this.points[0].x, this.points[0].y);
                    for (let i = 1; i < this.points.length - 1; i++) {
                        const pCurrent = this.points[i];
                        const pNext = this.points[i + 1];
                        path.arcTo(pCurrent.x, pCurrent.y, pNext.x, pNext.y, radius);
                    }
                    const last = this.points[this.points.length - 1];
                    path.lineTo(last.x, last.y);
                    return path;
                }
                return path;
            }
            lightenColor(color, factor) {
                const hex = color.replace('#', '');
                const r = parseInt(hex.substr(0, 2), 16);
                const g = parseInt(hex.substr(2, 2), 16);
                const b = parseInt(hex.substr(4, 2), 16);
                return `rgb(${Math.min(255, Math.floor(r + (255 - r) * factor))}, ${Math.min(255, Math.floor(g + (255 - g) * factor))}, ${Math.min(255, Math.floor(b + (255 - b) * factor))})`;
            }
            draw(ctx) {
                ctx.save();
                if (w.hoveredWire === this || w.selectedObj === this) {
                    ctx.shadowColor = this.color; ctx.shadowBlur = 15; ctx.strokeStyle = this.color;
                    ctx.lineWidth = 10; ctx.globalAlpha = 0.3; ctx.lineCap = 'round';
                    ctx.stroke(this.getPath());
                    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
                }
                if (this.isComplete && this.from && this.to) {
                    const s = this.from.comp[this.from.type];
                    const e = this.to.comp[this.to.type];
                    const gradient = ctx.createLinearGradient(s.x, s.y, e.x, e.y);
                    gradient.addColorStop(0, this.color);
                    gradient.addColorStop(0.5, this.lightenColor(this.color, 0.2));
                    gradient.addColorStop(1, this.color);
                    ctx.strokeStyle = gradient;
                } else ctx.strokeStyle = this.color;
                ctx.lineWidth = w.selectedObj === this ? 8 : 5;
                ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                ctx.stroke(this.getPath());
                if (w.selectedObj === this) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.lineWidth = 2;
                    ctx.setLineDash([8, 4]); ctx.stroke(this.getPath()); ctx.setLineDash([]);
                }
                ctx.restore();
            }
        }
        w.LED = LED; w.Battery = Battery; w.Wire = Wire;

        function rebuildNets() {
            w.netIdCounter = 0; w.nets = [];
            w.components.forEach(l => { l.anodeNet = null; l.cathodeNet = null; });
            w.batteries.forEach(b => { b.positiveNet = null; b.negativeNet = null; });
            const terminalConnections = new Map();
            function getTerminalId(comp, type) {
                if (comp.type === 'LED') return `LED_${w.components.indexOf(comp)}_${type}`;
                else if (comp.type === 'BATTERY') return `BATTERY_${w.batteries.indexOf(comp)}_${type}`;
                return null;
            }
            w.wires.forEach(wire => {
                const fromId = getTerminalId(wire.from.comp, wire.from.type);
                const toId = getTerminalId(wire.to.comp, wire.to.type);
                if (!fromId || !toId) return;
                if (!terminalConnections.has(fromId)) terminalConnections.set(fromId, []);
                if (!terminalConnections.has(toId)) terminalConnections.set(toId, []);
                terminalConnections.get(fromId).push({ comp: wire.to.comp, type: wire.to.type });
                terminalConnections.get(toId).push({ comp: wire.from.comp, type: wire.from.type });
            });
            const visited = new Set();
            function dfs(comp, type, currentNet) {
                const terminalId = getTerminalId(comp, type);
                if (!terminalId || visited.has(terminalId)) return;
                visited.add(terminalId);
                if (comp.type === 'LED') {
                    if (type === 'anode') comp.anodeNet = currentNet; else if (type === 'cathode') comp.cathodeNet = currentNet;
                } else if (comp.type === 'BATTERY') {
                    if (type === 'positive') comp.positiveNet = currentNet; else if (type === 'negative') comp.negativeNet = currentNet;
                }
                const connections = terminalConnections.get(terminalId) || [];
                connections.forEach(({ comp: nextComp, type: nextType }) => dfs(nextComp, nextType, currentNet));
            }
            w.components.forEach(l => { ['anode', 'cathode'].forEach(t => { const id = getTerminalId(l, t); if (id && !visited.has(id)) { const net = w.netIdCounter++; w.nets.push(net); dfs(l, t, net); } }); });
            w.batteries.forEach(b => { ['positive', 'negative'].forEach(t => { const id = getTerminalId(b, t); if (id && !visited.has(id)) { const net = w.netIdCounter++; w.nets.push(net); dfs(b, t, net); } }); });
        }

        // --- RENDER ---
        function render() {
            const ctx = w.ctx;
            if (!ctx) return;
            ctx.clearRect(0, 0, w.width, w.height);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            for (let x = 0; x < w.width; x += 30) {
                for (let y = 0; y < w.height; y += 30) {
                    ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
                }
            }
            w.components.forEach(c => c.checkPower());
            w.wires.forEach(wi => {
                wi.draw(ctx);
                if ((wi === w.selectedObj || wi === w.hoveredWire) && wi.points && wi.points.length >= 2) {
                    ctx.save();
                    for (let i = 0; i < wi.points.length - 1; i++) {
                        if (!isSegmentDraggable(wi, i)) continue;
                        const p1 = wi.points[i];
                        const p2 = wi.points[i + 1];
                        const cx = (p1.x + p2.x) / 2;
                        const cy = (p1.y + p2.y) / 2;
                        const isHoveredDot = w.hoveredSegment && w.hoveredSegment.wire === wi && w.hoveredSegment.index === i;
                        ctx.fillStyle = isHoveredDot ? '#ffffff' : '#9b59b6';
                        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.arc(cx, cy, isHoveredDot ? 6 : 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                    }
                    ctx.restore();
                }
            });
            w.batteries.forEach(b => b.draw(ctx));
            w.components.forEach(c => c.draw(ctx));

            // Terminals
            let hoveredTerminal = null;
            w.components.forEach(c => {
                ['anode', 'cathode'].forEach(type => {
                    const terminal = c[type];
                    if (terminal && Math.hypot(terminal.x - w.mouseX, terminal.y - w.mouseY) < 15) {
                        hoveredTerminal = { terminal, type, comp: c };
                        ctx.save();
                        ctx.fillStyle = 'rgba(52, 152, 219, 0.9)'; ctx.strokeStyle = '#3498db'; ctx.lineWidth = 2;
                        const size = 16; const x = terminal.x - size / 2; const y = terminal.y - size / 2;
                        ctx.fillRect(x, y, size, size); ctx.strokeRect(x, y, size, size);
                        ctx.fillStyle = 'white'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                        ctx.fillText(type === 'anode' ? 'A' : 'C', terminal.x, terminal.y);
                        ctx.restore();
                    }
                });
            });
            w.batteries.forEach(b => {
                ['positive', 'negative'].forEach(type => {
                    const terminal = b[type];
                    if (terminal && Math.hypot(terminal.x - w.mouseX, terminal.y - w.mouseY) < 15) {
                        hoveredTerminal = { terminal, type, comp: b };
                        ctx.save();
                        ctx.fillStyle = type === 'positive' ? 'rgba(231, 76, 60, 0.9)' : 'rgba(149, 165, 166, 0.9)';
                        ctx.strokeStyle = type === 'positive' ? '#e74c3c' : '#95a5a6'; ctx.lineWidth = 2;
                        const size = 16; const x = terminal.x - size / 2; const y = terminal.y - size / 2;
                        ctx.fillRect(x, y, size, size); ctx.strokeRect(x, y, size, size);
                        ctx.fillStyle = 'white'; ctx.font = 'bold 13px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                        ctx.fillText(type === 'positive' ? '+' : '−', terminal.x, terminal.y);
                        ctx.restore();
                    }
                });
            });

            // Labels
            if (w.hoveredComponent) {
                ctx.save();
                ctx.fillStyle = 'rgba(52, 73, 94, 0.95)'; ctx.font = 'bold 13px Inter';
                const text = w.hoveredComponent.id;
                const metrics = ctx.measureText(text);
                const padding = 8;
                const labelX = w.hoveredComponent.x - metrics.width / 2 - padding;
                const labelY = w.hoveredComponent.y - 70;
                drawRoundRect(ctx, labelX, labelY, metrics.width + padding * 2, 22, 6); ctx.fill();
                ctx.fillStyle = '#ecf0f1'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(text, w.hoveredComponent.x, labelY + 11);
                ctx.restore();
            }

            // Ghost Wire
            if (w.wireInProgress) {
                ctx.save();
                ctx.strokeStyle = 'rgba(52, 152, 219, 0.8)'; ctx.lineWidth = 5;
                ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([8, 4]);
                if (w.wireInProgress.points.length >= 1) {
                    const lastKnown = w.wireInProgress.points[w.wireInProgress.points.length - 1];
                    const ortho = getOrthogonalPoint(lastKnown, { x: w.mouseX, y: w.mouseY });
                    const allPoints = [...w.wireInProgress.points, ortho];
                    ctx.beginPath();
                    const radius = 15;
                    if (allPoints.length >= 2) {
                        ctx.moveTo(allPoints[0].x, allPoints[0].y);
                        for (let i = 1; i < allPoints.length - 1; i++) {
                            const pCurrent = allPoints[i]; const pNext = allPoints[i + 1];
                            ctx.arcTo(pCurrent.x, pCurrent.y, pNext.x, pNext.y, radius);
                        }
                        ctx.lineTo(allPoints[allPoints.length - 1].x, allPoints[allPoints.length - 1].y);
                    } else { ctx.moveTo(allPoints[0].x, allPoints[0].y); ctx.lineTo(allPoints[0].x, allPoints[0].y); }
                    ctx.stroke();
                }
                ctx.setLineDash([]);
                w.wireInProgress.points.forEach((point, idx) => {
                    ctx.fillStyle = idx === 0 ? 'rgba(52, 152, 219, 0.8)' : 'rgba(52, 152, 219, 0.6)';
                    ctx.beginPath(); ctx.arc(point.x, point.y, 5, 0, Math.PI * 2); ctx.fill();
                });
                const lastPoint = w.wireInProgress.points[w.wireInProgress.points.length - 1];
                const orthoPoint = getOrthogonalPoint(lastPoint, { x: w.mouseX, y: w.mouseY });
                ctx.fillStyle = 'rgba(52, 152, 219, 0.4)';
                ctx.beginPath(); ctx.arc(orthoPoint.x, orthoPoint.y, 8, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
        }

        let frameId;
        function loop() {
            w.pulseTime += 0.016; // Exact match to neeraj.html
            let hasAnimation = false;
            w.components.forEach(c => { if (c.animate && c.animate()) hasAnimation = true; });
            w.batteries.forEach(b => { if (b.animate && b.animate()) hasAnimation = true; });
            const hasPoweredLEDs = w.components.some(led => led.type === 'LED' && led.isPowered);
            if (hasAnimation || hasPoweredLEDs || w.needsRender) {
                render(); w.needsRender = false;
            }
            frameId = requestAnimationFrame(loop);
        }
        loop();

        // --- EVENTS ---
        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            w.mouseX = e.clientX - rect.left;
            w.mouseY = e.clientY - rect.top;

            if (w.draggingWireSegment) {
                const { wire, index, axis, startMouse, startPoints } = w.draggingWireSegment;
                const p1 = wire.points[index]; const p2 = wire.points[index + 1];
                const delta = axis === 'x' ? w.mouseX - startMouse.x : w.mouseY - startMouse.y;
                p1[axis] = startPoints.p1 + delta; p2[axis] = startPoints.p2 + delta;
                triggerRender(); return;
            }

            if (w.draggingObj) {
                w.draggingObj.targetX = w.mouseX; w.draggingObj.targetY = w.mouseY;
                w.wires.forEach(wi => {
                    if (wi.from && wi.to && (wi.from.comp === w.draggingObj || wi.to.comp === w.draggingObj)) {
                        wi.controlPoints = wi.calculateControlPoints();
                    }
                });
                triggerRender();
            }

            let foundSegmentDot = null;
            const wiresToCheck = w.selectedObj && w.selectedObj.type === 'WIRE' ? [w.selectedObj, ...w.wires.filter(wi => wi !== w.selectedObj)] : w.wires;
            for (let wi of wiresToCheck) {
                if (wi.points && wi.points.length >= 2) {
                    for (let i = 0; i < wi.points.length - 1; i++) {
                        if (!isSegmentDraggable(wi, i)) continue;
                        const p1 = wi.points[i]; const p2 = wi.points[i + 1];
                        const cx = (p1.x + p2.x) / 2; const cy = (p1.y + p2.y) / 2;
                        if (Math.hypot(w.mouseX - cx, w.mouseY - cy) < 8) {
                            foundSegmentDot = { wire: wi, index: i }; break;
                        }
                    }
                    if (foundSegmentDot) break;
                }
            }

            if (w.hoveredSegment !== foundSegmentDot) {
                w.hoveredSegment = foundSegmentDot;
                if (w.hoveredSegment) {
                    const wi = w.hoveredSegment.wire;
                    const p1 = wi.points[w.hoveredSegment.index]; const p2 = wi.points[w.hoveredSegment.index + 1];
                    const isHorizontal = Math.abs(p1.x - p2.x) > Math.abs(p1.y - p2.y);
                    canvas.style.cursor = isHorizontal ? 'ns-resize' : 'ew-resize';
                }
                triggerRender();
            }

            let hovering = false;
            w.components.forEach(c => { ['anode', 'cathode'].forEach(t => { if (Math.hypot(c[t].x - w.mouseX, c[t].y - w.mouseY) < 15) hovering = true; }); });
            w.batteries.forEach(b => { ['positive', 'negative'].forEach(t => { if (Math.hypot(b[t].x - w.mouseX, b[t].y - w.mouseY) < 15) hovering = true; }); });
            if (hovering) triggerRender();

            let newHoveredComponent = null;
            if (!hovering && !w.draggingObj && !w.wireInProgress && !w.hoveredSegment) {
                for (let c of w.components) { if (Math.hypot(c.x - w.mouseX, c.y - w.mouseY) < 35) { newHoveredComponent = c; break; } }
                if (!newHoveredComponent) {
                    for (let b of w.batteries) { if (w.mouseX >= b.x - 35 && w.mouseX <= b.x + 35 && w.mouseY >= b.y - 35 && w.mouseY <= b.y + 45) { newHoveredComponent = b; break; } }
                }
            }
            if (w.hoveredComponent !== newHoveredComponent) { w.hoveredComponent = newHoveredComponent; triggerRender(); }

            let newHoveredWire = null;
            if (!w.wireInProgress && !w.hoveredSegment) {
                for (let wi of w.wires) { if (distanceToWire(wi, w.mouseX, w.mouseY) < 10) { newHoveredWire = wi; canvas.style.cursor = 'pointer'; break; } }
            }
            if (!newHoveredWire && !w.wireInProgress && !w.hoveredSegment) canvas.style.cursor = 'default';
            else if (w.wireInProgress) canvas.style.cursor = 'crosshair';

            if (w.hoveredWire !== newHoveredWire) { w.hoveredWire = newHoveredWire; triggerRender(); }
            if (w.wireInProgress) triggerRender();
        };

        const handleMouseDown = (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top;

            if (w.hoveredSegment) {
                let { wire, index } = w.hoveredSegment; let newIndex = index;
                if (index === 0 && wire.from) {
                    const pStart = wire.points[0]; wire.points.splice(0, 0, { x: pStart.x, y: pStart.y }); newIndex++;
                }
                const currentLastSegmentIndex = wire.points.length - 2;
                if (newIndex === currentLastSegmentIndex && wire.to) {
                    const pEnd = wire.points[wire.points.length - 1]; wire.points.push({ x: pEnd.x, y: pEnd.y });
                }
                const p1 = wire.points[newIndex]; const p2 = wire.points[newIndex + 1];
                const isHorizontal = Math.abs(p1.x - p2.x) > Math.abs(p1.y - p2.y);
                const axis = isHorizontal ? 'y' : 'x';
                w.draggingWireSegment = { wire: wire, index: newIndex, axis: axis, startMouse: { x: mouseX, y: mouseY }, startPoints: { p1: p1[axis], p2: p2[axis] } };
                w.selectedObj = wire; updateUIState(); return;
            }

            if (w.wireInProgress) {
                let foundTerminal = null;
                for (let c of w.components) {
                    for (let type of ['anode', 'cathode']) {
                        if (Math.hypot(c[type].x - mouseX, c[type].y - mouseY) < 15) { foundTerminal = { comp: c, type: type }; break; }
                    }
                    if (foundTerminal) break;
                }
                if (!foundTerminal) {
                    for (let b of w.batteries) {
                        for (let type of ['positive', 'negative']) {
                            if (Math.hypot(b[type].x - mouseX, b[type].y - mouseY) < 15) { foundTerminal = { comp: b, type: type }; break; }
                        }
                        if (foundTerminal) break;
                    }
                }
                if (foundTerminal) {
                    // Exact logic from neeraj.html - no self-connect check
                    const termPos = foundTerminal.type.includes('ode') ? foundTerminal.comp[foundTerminal.type] : foundTerminal.comp[foundTerminal.type];
                    const lastPoint = w.wireInProgress.points[w.wireInProgress.points.length - 1];
                    const orthoPoint = getOrthogonalPoint(lastPoint, termPos);
                    if (orthoPoint.x !== termPos.x || orthoPoint.y !== termPos.y) w.wireInProgress.points.push(orthoPoint);
                    w.wireInProgress.points.push({ x: termPos.x, y: termPos.y });
                    w.wireInProgress.updateEndpoint(foundTerminal);
                    w.wires.push(w.wireInProgress);
                    w.wireInProgress = null;
                    rebuildNets(); updateUIState(); triggerRender();
                } else {
                    const lastPoint = w.wireInProgress.points[w.wireInProgress.points.length - 1];
                    const orthoPoint = getOrthogonalPoint(lastPoint, { x: mouseX, y: mouseY });
                    const dist = Math.hypot(orthoPoint.x - lastPoint.x, orthoPoint.y - lastPoint.y);
                    if (dist > 10) { w.wireInProgress.points.push(orthoPoint); triggerRender(); }
                }
                return;
            }

            for (let c of w.components) {
                for (let type of ['anode', 'cathode']) {
                    const tPos = c[type];
                    if (Math.hypot(tPos.x - mouseX, tPos.y - mouseY) < 15) {
                        w.wireInProgress = new w.Wire({ comp: c, type: type }, null, [{ x: tPos.x, y: tPos.y }]);
                        triggerRender(); return;
                    }
                }
            }
            for (let b of w.batteries) {
                for (let type of ['positive', 'negative']) {
                    const tPos = b[type];
                    if (Math.hypot(tPos.x - mouseX, tPos.y - mouseY) < 15) {
                        w.wireInProgress = new w.Wire({ comp: b, type: type }, null, [{ x: tPos.x, y: tPos.y }]);
                        triggerRender(); return;
                    }
                }
            }

            let foundLED = w.components.find(c => Math.hypot(c.x - mouseX, c.y - mouseY) < 35);
            if (foundLED) { w.selectedObj = w.draggingObj = foundLED; updateUIState(); triggerRender(); return; }

            let foundBattery = w.batteries.find(b => mouseX >= b.x - 35 && mouseX <= b.x + 35 && mouseY >= b.y - 35 && mouseY <= b.y + 45);
            if (foundBattery) { w.selectedObj = w.draggingObj = foundBattery; updateUIState(); triggerRender(); return; }

            let foundWire = null; let minDist = 10;
            for (let wi of w.wires) { const dist = distanceToWire(wi, mouseX, mouseY); if (dist < minDist) { minDist = dist; foundWire = wi; } }
            if (foundWire) w.selectedObj = foundWire; else w.selectedObj = null;
            updateUIState(); triggerRender();
        };

        const handleMouseUp = () => {
            w.draggingWireSegment = null;
            if (w.draggingObj) {
                w.wires.forEach(wi => {
                    if (wi.from.comp === w.draggingObj || wi.to.comp === w.draggingObj) wi.controlPoints = wi.calculateControlPoints();
                });
                rebuildNets();
            }
            w.draggingObj = null;
        };

        const handleResize = () => {
            if (canvas && containerRef.current) {
                const width = containerRef.current.clientWidth || window.innerWidth;
                const height = 700;
                canvas.width = width; canvas.height = height; w.width = width; w.height = height;
                triggerRender();
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Delete' && w.selectedObj) deleteSelected();
            if (e.key === 'Escape') {
                if (w.wireInProgress) w.wireInProgress = null; else w.selectedObj = null;
                updateUIState(); triggerRender();
            }
            if (e.key === 'Enter' && w.wireInProgress) { w.wireInProgress = null; triggerRender(); }
        };

        const handleContextMenu = (e) => {
            e.preventDefault();
            if (w.wireInProgress) { w.wireInProgress = null; triggerRender(); }
            return false;
        };

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', handleResize);

        handleResize();

        return () => {
            cancelAnimationFrame(frameId);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Helper functions exposed to React
    const addLED = () => {
        const w = world.current;
        const newLED = new w.LED(w.width / 2 + (Math.random() - 0.5) * 50, w.height / 2);
        w.components.push(newLED);
        rebuildNets(); updateUIState(); triggerRender();
    };
    const addBattery = () => {
        const w = world.current;
        const newBat = new w.Battery(w.width / 2, w.height / 2);
        w.batteries.push(newBat);
        rebuildNets(); updateUIState(); triggerRender();
    };
    const deleteSelected = () => {
        const w = world.current; const obj = w.selectedObj;
        if (!obj) return;
        if (obj.type === 'WIRE') {
            w.wires = w.wires.filter(x => x !== obj); w.selectedObj = null;
        } else if (obj.type === 'LED') {
            w.wires = w.wires.filter(wi => wi.from.comp !== obj && wi.to.comp !== obj);
            w.components = w.components.filter(c => c !== obj); w.selectedObj = null;
        } else if (obj.type === 'BATTERY') {
            w.wires = w.wires.filter(wi => wi.from.comp !== obj && wi.to.comp !== obj);
            w.batteries = w.batteries.filter(b => b !== obj); w.selectedObj = null;
        }
        rebuildNets(); updateUIState(); triggerRender();
    };
    const clearAll = () => {
        const w = world.current;
        w.components = []; w.batteries = []; w.wires = []; w.selectedObj = null; w.wireInProgress = null;
        rebuildNets(); updateUIState(); triggerRender();
    };
    const updateColor = (color) => {
        const w = world.current;
        if (w.selectedObj) { w.selectedObj.color = color; updateUIState(); triggerRender(); }
    };
    const changeBatteryVoltage = (v) => {
        const w = world.current;
        if (w.selectedObj && w.selectedObj.type === 'BATTERY') {
            w.selectedObj.voltage = v; triggerRender();
        }
    };

    // Need to keep 'rebuildNets' update logic in sync, so define it inside useEffect or reuse logic
    // Actually, 'rebuildNets' is defined inside useEffect for use by inner logic. 
    // We need to define the 'Helper functions' to access the SAME logic.
    // The current pattern with 'world.current' works because the state is in 'world'.
    // BUT 'rebuildNets' function itself is local to useEffect.
    // I need to attach rebuildNets to world or redefine it.
    // For simplicity, I will copy rebuildNets logic into the helpers or make it a ref.
    // To match NEERAJ.HTML exactly, the logic is global.
    // I will adhere to the React Ref pattern: define rebuildNets as a reusable function outside or inside a ref.

    // CORRECT STRATEGY used here: inner definitions in useEffect use local variables. 
    // External React callbacks need to duplicate the trivial logic or access a shared method.
    // Since 'rebuildNets' is complex, I should hoist it.
    // However, for this 'write_to_file', I will duplicate the rebuildNets logic in a helper function within the component body 
    // to ensure the external buttons work correctly.

    const rebuildNetsRef = useRef((w) => {
        w.netIdCounter = 0; w.nets = [];
        w.components.forEach(l => { l.anodeNet = null; l.cathodeNet = null; });
        w.batteries.forEach(b => { b.positiveNet = null; b.negativeNet = null; });
        const terminalConnections = new Map();
        function getTerminalId(comp, type) {
            if (comp.type === 'LED') return `LED_${w.components.indexOf(comp)}_${type}`;
            else if (comp.type === 'BATTERY') return `BATTERY_${w.batteries.indexOf(comp)}_${type}`;
            return null;
        }
        w.wires.forEach(wire => {
            const fromId = getTerminalId(wire.from.comp, wire.from.type);
            const toId = getTerminalId(wire.to.comp, wire.to.type);
            if (!fromId || !toId) return;
            if (!terminalConnections.has(fromId)) terminalConnections.set(fromId, []);
            if (!terminalConnections.has(toId)) terminalConnections.set(toId, []);
            terminalConnections.get(fromId).push({ comp: wire.to.comp, type: wire.to.type });
            terminalConnections.get(toId).push({ comp: wire.from.comp, type: wire.from.type });
        });
        const visited = new Set();
        function dfs(comp, type, currentNet) {
            const terminalId = getTerminalId(comp, type);
            if (!terminalId || visited.has(terminalId)) return;
            visited.add(terminalId);
            if (comp.type === 'LED') {
                if (type === 'anode') comp.anodeNet = currentNet; else if (type === 'cathode') comp.cathodeNet = currentNet;
            } else if (comp.type === 'BATTERY') {
                if (type === 'positive') comp.positiveNet = currentNet; else if (type === 'negative') comp.negativeNet = currentNet;
            }
            const connections = terminalConnections.get(terminalId) || [];
            connections.forEach(({ comp: nextComp, type: nextType }) => dfs(nextComp, nextType, currentNet));
        }
        w.components.forEach(l => { ['anode', 'cathode'].forEach(t => { const id = getTerminalId(l, t); if (id && !visited.has(id)) { const net = w.netIdCounter++; w.nets.push(net); dfs(l, t, net); } }); });
        w.batteries.forEach(b => { ['positive', 'negative'].forEach(t => { const id = getTerminalId(b, t); if (id && !visited.has(id)) { const net = w.netIdCounter++; w.nets.push(net); dfs(b, t, net); } }); });
    });

    const rebuildNets = () => rebuildNetsRef.current(world.current);

    return (
        <div className="canvas-sim-container">
            <div className="canvas-sim-header">
                <h2><div className="logo-icon">⚡</div>Circuit Lab Pro</h2>
                <div className="btn-group">
                    <div className="add-component-wrapper">
                        <button className="btn btn-add" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>+</button>
                        <div className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`}>
                            <div className="dropdown-item led" onClick={() => { addLED(); setIsDropdownOpen(false); }}>
                                <div className="dropdown-icon"><svg viewBox="0 0 30 50"><rect x="7.5" y="15" width="15" height="20" fill="#FF4757" rx="2" /><ellipse cx="15" cy="15" rx="7.5" ry="7.5" fill="#FF6B7A" /></svg></div>Add LED
                            </div>
                            <div className="dropdown-item battery" onClick={() => { addBattery(); setIsDropdownOpen(false); }}>
                                <div className="dropdown-icon"><svg viewBox="0 0 40 40"><rect x="8" y="8" width="24" height="24" rx="3" fill="#34495e" /><text x="20" y="25" fill="#3498db" fontSize="10" textAnchor="middle">9V</text></svg></div>Add Battery
                            </div>
                        </div>
                    </div>
                    <button className="btn btn-delete" onClick={deleteSelected} disabled={!uiState.hasSelection}>Delete</button>
                    <button className="btn btn-clear" onClick={clearAll}>Clear All</button>
                </div>
            </div>

            <div className="canvas-area" ref={containerRef}>
                <div id="legTooltip"></div>
                <canvas ref={canvasRef} />
            </div>

            <div className="sidebar">
                <h3>Inspector</h3>
                {uiState.showLedControls && (
                    <div className="picker-section"><span className="picker-label">LED Body Color</span><div className="color-grid">{COLORS.LED.map(c => <div key={c} className={`color-circle ${uiState.selectedColor === c ? 'active' : ''}`} style={{ background: c }} onClick={() => updateColor(c)} />)}</div></div>
                )}
                {uiState.showWireControls && (
                    <div className="picker-section"><span className="picker-label">Wire Color</span><div className="color-grid">{COLORS.WIRE.map(c => <div key={c} className={`color-circle ${uiState.selectedColor === c ? 'active' : ''}`} style={{ background: c }} onClick={() => updateColor(c)} />)}</div></div>
                )}
                {uiState.showBatteryControls && (
                    <div className="picker-section"><span className="picker-label">Battery Voltage</span><div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}><button className="btn" style={{ flex: 1 }} onClick={() => changeBatteryVoltage(1.5)}>1.5V</button><button className="btn" style={{ flex: 1 }} onClick={() => changeBatteryVoltage(3)}>3V</button><button className="btn" style={{ flex: 1 }} onClick={() => changeBatteryVoltage(9)}>9V</button></div></div>
                )}
                {!uiState.hasSelection && (
                    <p id="hintText">💡 <b>Add a battery</b> and connect it to LEDs to make them glow!<br /><br />🔋 <b>Connect + to Anode</b> and <b>- to Cathode</b> for proper circuit.<br /><br />🖱️ <b>Click terminals</b> to start wires, <b>click to bend</b>, connect to finish!</p>
                )}
                <div className="stats">
                    <div className="stat-item"><div className="stat-value">{stats.leds}</div><div className="stat-label">LEDs</div></div>
                    <div className="stat-item"><div className="stat-value">{stats.batteries}</div><div className="stat-label">Batteries</div></div>
                    <div className="stat-item"><div className="stat-value">{stats.wires}</div><div className="stat-label">Wires</div></div>
                </div>
                <div className="shortcuts"><b>Keyboard Shortcuts:</b><br />Delete - Remove selected<br />Escape - Cancel wire / Deselect<br />Right-click - Cancel wire<br />Drag - Move components</div>
            </div>
        </div>
    );
}