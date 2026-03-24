'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Plus, Minus, RotateCcw, Search } from 'lucide-react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
} from 'd3-force';
import {
  ASSET_MAP,
  TYPE_COLORS,
  TYPE_GLOW,
  COMMUNITY_COLORS,
  corrColor,
  type GraphNode,
  type GraphLink,
  type SimLink,
} from './constants';
import type { IMSTEdge } from '@/types/analytics';

interface NetworkGraphProps {
  selectedAssets: string[];
  getCorr: (a: string, b: string) => number | null;
  minEdgeCorr: number;
  selectedPair: [string, string] | null;
  onPairSelect: (pair: [string, string] | null) => void;
  mstEdges?: IMSTEdge[] | null;
  communityMap?: Record<string, number> | null;
  hubNode?: string | null;
}

export function NetworkGraph({
  selectedAssets,
  getCorr,
  minEdgeCorr,
  selectedPair,
  onPairSelect,
  mstEdges,
  communityMap,
  hubNode,
}: NetworkGraphProps) {
  const [nodePositions, setNodePositions] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<GraphLink | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<ReturnType<typeof forceSimulation<GraphNode>> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphSize, setGraphSize] = useState({ width: 700, height: 500 });
  const [simulating, setSimulating] = useState(false);
  // Drag threshold: track mousedown position to distinguish click from drag
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const pendingDragNodeRef = useRef<string | null>(null);
  // Persist node positions across re-renders to avoid jarring restarts
  const positionCacheRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  // Store getCorr in a ref so graphData doesn't depend on it
  const getCorrRef = useRef(getCorr);
  getCorrRef.current = getCorr;

  // Responsive sizing
  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setGraphSize({
          width: Math.max(rect.width, 400),
          height: Math.max(Math.min(rect.width * 0.65, 600), rect.width < 640 ? 300 : 350),
        });
      }
    }
    updateSize();
    globalThis.addEventListener('resize', updateSize);
    return () => globalThis.removeEventListener('resize', updateSize);
  }, []);

  // Build graph nodes (only when assets or size change — NOT on getCorr changes)
  // Node radius scales with connectivity — hub nodes naturally stand out
  const graphNodes = useMemo(() => {
    const cache = positionCacheRef.current;
    const currentGetCorr = getCorrRef.current;
    // Count edges per node for radius scaling
    const edgeCounts = new Map<string, number>();
    for (let i = 0; i < selectedAssets.length; i++) {
      for (let j = i + 1; j < selectedAssets.length; j++) {
        const corr = currentGetCorr(selectedAssets[i], selectedAssets[j]);
        if (corr !== null && Math.abs(corr) >= 0.2) {
          edgeCounts.set(selectedAssets[i], (edgeCounts.get(selectedAssets[i]) ?? 0) + 1);
          edgeCounts.set(selectedAssets[j], (edgeCounts.get(selectedAssets[j]) ?? 0) + 1);
        }
      }
    }
    return selectedAssets.map((ticker) => {
      const asset = ASSET_MAP.get(ticker);
      const cached = cache.get(ticker);
      const baseRadius = asset?.type === 'stock' ? 24 : 28;
      const edges = edgeCounts.get(ticker) ?? 0;
      return {
        id: ticker,
        type: asset?.type || 'stock',
        name: asset?.name || ticker,
        radius: baseRadius + Math.min(edges * 1.5, 8),
        x: cached?.x ?? graphSize.width / 2 + (Math.random() - 0.5) * 200,
        y: cached?.y ?? graphSize.height / 2 + (Math.random() - 0.5) * 200,
      };
    });
  }, [selectedAssets, graphSize]);

  // Build graph links (updates when correlations or threshold change)
  const graphLinks = useMemo(() => {
    const currentGetCorr = getCorrRef.current;
    const result: GraphLink[] = [];
    for (let i = 0; i < selectedAssets.length; i++) {
      for (let j = i + 1; j < selectedAssets.length; j++) {
        const corr = currentGetCorr(selectedAssets[i], selectedAssets[j]);
        if (corr !== null && Math.abs(corr) >= minEdgeCorr) {
          result.push({
            sourceId: selectedAssets[i],
            targetId: selectedAssets[j],
            correlation: corr,
          });
        }
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAssets, minEdgeCorr, getCorr]);

  // D3 Force Simulation — only restarts when node set or size changes
  useEffect(() => {
    if (graphNodes.length === 0) return;

    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    setSimulating(true);

    const nodes: GraphNode[] = graphNodes.map((n) => ({ ...n }));
    const currentLinks = getCorrRef.current;
    const simLinks: SimLink[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const corr = currentLinks(nodes[i].id, nodes[j].id);
        if (corr !== null && Math.abs(corr) >= minEdgeCorr) {
          simLinks.push({
            source: nodes[i].id as unknown as GraphNode,
            target: nodes[j].id as unknown as GraphNode,
            sourceId: nodes[i].id,
            targetId: nodes[j].id,
            correlation: corr,
          });
        }
      }
    }

    const sim = forceSimulation<GraphNode>(nodes)
      .force(
        'link',
        forceLink<GraphNode, SimLink>(simLinks)
          .id((d: GraphNode) => d.id)
          .distance((d: SimLink) => 120 - Math.abs(d.correlation) * 60)
          .strength((d: SimLink) => Math.abs(d.correlation) * 0.5),
      )
      .force('charge', forceManyBody().strength(-300).distanceMax(400))
      .force('center', forceCenter(graphSize.width / 2, graphSize.height / 2).strength(0.05))
      .force('collision', forceCollide<GraphNode>().radius((d: GraphNode) => d.radius + 8))
      .force('x', forceX(graphSize.width / 2).strength(0.03))
      .force('y', forceY(graphSize.height / 2).strength(0.03))
      .alphaDecay(0.02)
      .velocityDecay(0.3);

    let tickCount = 0;
    let rafId: number | null = null;

    const flushToReact = () => {
      const cache = positionCacheRef.current;
      for (const node of nodes) {
        const nx = node.x ?? 0;
        const ny = node.y ?? 0;
        node.x = Math.max(node.radius + 10, Math.min(graphSize.width - node.radius - 10, nx));
        node.y = Math.max(node.radius + 10, Math.min(graphSize.height - node.radius - 10, ny));
        // Persist position for reuse
        cache.set(node.id, { x: node.x, y: node.y });
      }
      setNodePositions([...nodes]);
      setLinks(
        simLinks.map((l) => ({
          sourceId: typeof l.source === 'object' ? (l.source as GraphNode).id : String(l.source),
          targetId: typeof l.target === 'object' ? (l.target as GraphNode).id : String(l.target),
          correlation: l.correlation,
        })),
      );
      rafId = null;
    };

    sim.on('tick', () => {
      tickCount++;
      // Throttle React re-renders: only update every 3rd tick via rAF
      if (tickCount % 3 === 0 && rafId === null) {
        rafId = requestAnimationFrame(flushToReact);
      }
    });

    sim.on('end', () => {
      flushToReact();
      setSimulating(false);
    });

    simulationRef.current = sim;

    return () => {
      sim.stop();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
    // Only restart simulation when nodes or graph size change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphNodes, graphSize]);

  // Update links without restarting simulation when correlations change
  useEffect(() => {
    setLinks(graphLinks);
  }, [graphLinks]);

  // Drag handlers
  const handleMouseDown = useCallback((nodeId: string, e: React.MouseEvent) => {
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    pendingDragNodeRef.current = nodeId;
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      // Check if we need to promote a pending drag to an actual drag (threshold = 5px)
      if (!dragging && pendingDragNodeRef.current && mouseDownPosRef.current) {
        const dx = e.clientX - mouseDownPosRef.current.x;
        const dy = e.clientY - mouseDownPosRef.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > 5) {
          setDragging(pendingDragNodeRef.current);
          if (simulationRef.current) {
            simulationRef.current.alphaTarget(0.3).restart();
          }
        } else {
          return;
        }
      }
      if (!dragging && !pendingDragNodeRef.current) return;
      const activeNode = dragging || pendingDragNodeRef.current;
      if (!activeNode || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      if (simulationRef.current) {
        const node = simulationRef.current.nodes().find((n) => n.id === activeNode);
        if (node) {
          node.fx = x;
          node.fy = y;
        }
      }
    },
    [dragging, zoom, pan],
  );

  const handleMouseUp = useCallback(() => {
    if (dragging && simulationRef.current) {
      const node = simulationRef.current.nodes().find((n) => n.id === dragging);
      if (node) {
        node.fx = null;
        node.fy = null;
      }
      simulationRef.current.alphaTarget(0);
    }
    setDragging(null);
    mouseDownPosRef.current = null;
    pendingDragNodeRef.current = null;
  }, [dragging]);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      if (dragging) return;
      if (!selectedPair) {
        onPairSelect([nodeId, '']);
      } else if (selectedPair[0] === nodeId) {
        onPairSelect(null);
      } else if (selectedPair[1] === '') {
        onPairSelect([selectedPair[0], nodeId]);
      } else {
        onPairSelect([nodeId, '']);
      }
    },
    [selectedPair, dragging, onPairSelect],
  );

  const handleLinkClick = useCallback(
    (link: GraphLink) => {
      onPairSelect([link.sourceId, link.targetId]);
    },
    [onPairSelect],
  );

  // MST edge lookup
  const mstEdgeSet = useMemo(() => {
    if (!mstEdges) return null;
    const set = new Set<string>();
    for (const e of mstEdges) {
      set.add(`${e.source}:${e.target}`);
      set.add(`${e.target}:${e.source}`);
    }
    return set;
  }, [mstEdges]);

  const isMstEdge = useCallback(
    (a: string, b: string): boolean => {
      if (!mstEdgeSet) return false;
      return mstEdgeSet.has(`${a}:${b}`);
    },
    [mstEdgeSet],
  );

  // Resolve node color based on community map
  const getNodeColor = useCallback(
    (nodeId: string, nodeType: string): string => {
      if (communityMap && nodeId in communityMap) {
        return COMMUNITY_COLORS[communityMap[nodeId] % COMMUNITY_COLORS.length];
      }
      return TYPE_COLORS[nodeType];
    },
    [communityMap],
  );

  if (selectedAssets.length === 0) {
    return (
      <div
        ref={containerRef}
        className="relative rounded-2xl border border-white/10 bg-[#0d1117] overflow-hidden"
        style={{ minHeight: 400 }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
          <Search className="h-12 w-12 text-brand-blue/30 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Start Exploring</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Search for assets or use Quick Add to build your correlation network.
            Drag nodes to rearrange. Click two nodes to compare.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl border border-white/10 bg-[#0d1117] overflow-hidden"
      style={{ minHeight: graphSize.height }}
    >
      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}
          className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))}
          className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Color legend */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 px-2 py-1 bg-black/40 rounded-lg backdrop-blur-sm">
        <span className="text-[9px] text-blue-400">-1</span>
        <div
          className="w-20 h-2 rounded-full"
          style={{
            background: 'linear-gradient(to right, #2563EB, #60A5FA, #475569, #FB923C, #EA580C)',
          }}
        />
        <span className="text-[9px] text-orange-400">+1</span>
      </div>

      {/* Simulation loading indicator */}
      {simulating && (
        <div className={`absolute z-[5] pointer-events-none ${nodePositions.length === 0 ? 'inset-0 flex items-center justify-center' : 'top-3 left-3'}`}>
          <span className="text-xs text-muted-foreground animate-pulse px-2 py-1 bg-black/40 rounded-lg backdrop-blur-sm">
            {nodePositions.length === 0 ? 'Arranging...' : 'Rearranging...'}
          </span>
        </div>
      )}

      {/* Half-pair selection hint */}
      {selectedPair && selectedPair[0] && selectedPair[1] === '' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 bg-blue-500/15 border border-blue-400/30 rounded-full backdrop-blur-sm">
          <span className="text-xs text-blue-300 font-medium whitespace-nowrap">
            Selected {selectedPair[0]} &mdash; click another node to compare
          </span>
        </div>
      )}

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        width={graphSize.width}
        height={graphSize.height}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={(e) => {
          e.preventDefault();
          setZoom((z) => {
            const delta = e.deltaY > 0 ? -0.2 : 0.2;
            return Math.min(2.0, Math.max(0.4, z + delta));
          });
        }}
        className="cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
        role="img"
        aria-label={`Correlation network graph with ${nodePositions.length} assets and ${links.length} connections`}
      >
        <defs>
          {Object.entries(TYPE_GLOW).map(([type, color]) => (
            <filter key={type} id={`glow-${type}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor={color} result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Links */}
          {links.map((link) => {
            const source = nodePositions.find((n) => n.id === link.sourceId);
            const target = nodePositions.find((n) => n.id === link.targetId);
            if (!source || !target) return null;
            const sx = source.x ?? 0;
            const sy = source.y ?? 0;
            const tx = target.x ?? 0;
            const ty = target.y ?? 0;

            const isHovered =
              hoveredLink?.sourceId === link.sourceId && hoveredLink?.targetId === link.targetId;
            const isSelectedEdge =
              selectedPair &&
              ((selectedPair[0] === link.sourceId && selectedPair[1] === link.targetId) ||
                (selectedPair[0] === link.targetId && selectedPair[1] === link.sourceId));
            const isConnectedToHover =
              hoveredNode && (link.sourceId === hoveredNode || link.targetId === hoveredNode);
            const isFaded =
              (hoveredNode && !isConnectedToHover) ||
              (selectedPair && selectedPair[1] && !isSelectedEdge);
            const absCorr = Math.abs(link.correlation);
            const inMst = isMstEdge(link.sourceId, link.targetId);
            const hasMst = mstEdgeSet !== null;

            // MST mode: non-MST edges are very faded
            const mstFade = hasMst && !inMst;

            return (
              <g key={`${link.sourceId}-${link.targetId}`}>
                <line
                  x1={sx} y1={sy} x2={tx} y2={ty}
                  stroke="transparent" strokeWidth={12}
                  className="cursor-pointer"
                  onClick={() => handleLinkClick(link)}
                  onMouseEnter={() => setHoveredLink(link)}
                  onMouseLeave={() => setHoveredLink(null)}
                />
                <line
                  x1={sx} y1={sy} x2={tx} y2={ty}
                  stroke={corrColor(link.correlation)}
                  strokeWidth={inMst ? 3 : 1 + absCorr * 3}
                  strokeOpacity={
                    mstFade ? 0.04
                    : isFaded ? 0.08
                    : isHovered || isSelectedEdge ? 0.9
                    : 0.3 + absCorr * 0.4
                  }
                  strokeDasharray={link.correlation < 0 ? '8 3 4 3' : undefined}
                  className="transition-all duration-200 pointer-events-none"
                />
                {(isHovered || isSelectedEdge) && (
                  <>
                    <rect
                      x={(sx + tx) / 2 - 28} y={(sy + ty) / 2 - 20}
                      width={56} height={18} rx={4}
                      fill="rgba(13,17,23,0.85)"
                      className="pointer-events-none"
                    />
                    <text
                      x={(sx + tx) / 2} y={(sy + ty) / 2 - 7}
                      textAnchor="middle"
                      className="fill-white text-[10px] font-mono font-bold pointer-events-none"
                    >
                      r={link.correlation.toFixed(2)}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodePositions.map((node) => {
            const nx = node.x ?? 0;
            const ny = node.y ?? 0;
            const isHovered = hoveredNode === node.id;
            const isInPair = selectedPair?.includes(node.id);
            const nodeColor = getNodeColor(node.id, node.type);
            const isFaded =
              hoveredNode && hoveredNode !== node.id && !links.some(
                (l) =>
                  (l.sourceId === hoveredNode && l.targetId === node.id) ||
                  (l.targetId === hoveredNode && l.sourceId === node.id),
              );
            const scale = isHovered ? 1.15 : 1;

            return (
              <g
                key={node.id}
                transform={`translate(${nx}, ${ny}) scale(${scale})`}
                onMouseDown={(e) => { e.preventDefault(); handleMouseDown(node.id, e); }}
                onMouseEnter={() => !dragging && setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => handleNodeClick(node.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNodeClick(node.id); } }}
                className="cursor-pointer"
                style={{ transition: 'transform 0.15s ease-out' }}
                opacity={isFaded ? 0.25 : 1}
                tabIndex={0}
                role="button"
                aria-label={`${node.id} (${node.type}), ${links.filter(l => l.sourceId === node.id || l.targetId === node.id).length} connections`}
              >
                {isInPair && (
                  <circle
                    r={node.radius + 6} fill="none"
                    stroke={nodeColor} strokeWidth={2} strokeOpacity={0.5} strokeDasharray="4 3"
                  >
                    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="8s" repeatCount="3" />
                  </circle>
                )}
                {hubNode === node.id && (
                  <circle
                    r={node.radius + 8} fill="none"
                    stroke="#FBBF24" strokeWidth={1.5} strokeOpacity={0.4} strokeDasharray="2 3"
                  >
                    <animate attributeName="stroke-opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  r={hubNode === node.id ? node.radius + 2 : node.radius}
                  fill={`${nodeColor}15`}
                  stroke={nodeColor}
                  strokeWidth={isInPair ? 2.5 : 1.5}
                  filter={isHovered || isInPair ? `url(#glow-${node.type})` : undefined}
                  className="transition-all duration-200"
                />
                <circle r={3} fill={nodeColor} opacity={0.8} />
                <text
                  y={node.radius + 14} textAnchor="middle"
                  className="fill-white text-[10px] font-semibold pointer-events-none"
                  style={{ textShadow: '0 0 6px rgba(0,0,0,0.9)' }}
                >
                  {node.id.length > 10 ? node.id.slice(0, 9) + '..' : node.id}
                </text>
                {node.type !== 'stock' && (
                  <text
                    y={node.radius + 24} textAnchor="middle"
                    className="text-[8px] pointer-events-none" fill={TYPE_COLORS[node.type]} opacity={0.7}
                  >
                    {node.type === 'currency' ? 'FX' : 'CMDTY'}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
