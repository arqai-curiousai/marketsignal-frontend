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

  // Responsive sizing
  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setGraphSize({
          width: Math.max(rect.width, 400),
          height: Math.max(Math.min(rect.width * 0.65, 600), 350),
        });
      }
    }
    updateSize();
    globalThis.addEventListener('resize', updateSize);
    return () => globalThis.removeEventListener('resize', updateSize);
  }, []);

  // Build graph data
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = selectedAssets.map((ticker) => {
      const asset = ASSET_MAP.get(ticker);
      return {
        id: ticker,
        type: asset?.type || 'stock',
        name: asset?.name || ticker,
        radius: asset?.type === 'stock' ? 24 : 28,
        x: graphSize.width / 2 + (Math.random() - 0.5) * 200,
        y: graphSize.height / 2 + (Math.random() - 0.5) * 200,
      };
    });

    const graphLinks: GraphLink[] = [];
    for (let i = 0; i < selectedAssets.length; i++) {
      for (let j = i + 1; j < selectedAssets.length; j++) {
        const corr = getCorr(selectedAssets[i], selectedAssets[j]);
        if (corr !== null && Math.abs(corr) >= minEdgeCorr) {
          graphLinks.push({
            sourceId: selectedAssets[i],
            targetId: selectedAssets[j],
            correlation: corr,
          });
        }
      }
    }

    return { nodes, links: graphLinks };
  }, [selectedAssets, getCorr, minEdgeCorr, graphSize]);

  // D3 Force Simulation
  useEffect(() => {
    if (graphData.nodes.length === 0) return;

    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const nodes: GraphNode[] = graphData.nodes.map((n) => ({ ...n }));
    const simLinks: SimLink[] = graphData.links.map((l) => ({
      source: l.sourceId as unknown as GraphNode,
      target: l.targetId as unknown as GraphNode,
      sourceId: l.sourceId,
      targetId: l.targetId,
      correlation: l.correlation,
    }));

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

    sim.on('tick', () => {
      for (const node of nodes) {
        const nx = node.x ?? 0;
        const ny = node.y ?? 0;
        node.x = Math.max(node.radius + 10, Math.min(graphSize.width - node.radius - 10, nx));
        node.y = Math.max(node.radius + 10, Math.min(graphSize.height - node.radius - 10, ny));
      }
      setNodePositions([...nodes]);
      setLinks(
        simLinks.map((l) => ({
          sourceId: typeof l.source === 'object' ? (l.source as GraphNode).id : String(l.source),
          targetId: typeof l.target === 'object' ? (l.target as GraphNode).id : String(l.target),
          correlation: l.correlation,
        })),
      );
    });

    simulationRef.current = sim;

    return () => {
      sim.stop();
    };
  }, [graphData, graphSize]);

  // Drag handlers
  const handleMouseDown = useCallback((nodeId: string) => {
    setDragging(nodeId);
    if (simulationRef.current) {
      simulationRef.current.alphaTarget(0.3).restart();
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!dragging || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      if (simulationRef.current) {
        const node = simulationRef.current.nodes().find((n) => n.id === dragging);
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
        <span className="text-[9px] text-red-400">-1</span>
        <div
          className="w-20 h-2 rounded-full"
          style={{
            background: 'linear-gradient(to right, #EF4444, #F87171, #475569, #6EE7B7, #10B981)',
          }}
        />
        <span className="text-[9px] text-emerald-400">+1</span>
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        width={graphSize.width}
        height={graphSize.height}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
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
                  strokeDasharray={link.correlation < 0 ? '6 4' : undefined}
                  className="transition-all duration-200 pointer-events-none"
                />
                {(isHovered || isSelectedEdge) && (
                  <text
                    x={(sx + tx) / 2} y={(sy + ty) / 2 - 8}
                    textAnchor="middle"
                    className="fill-white text-[10px] font-mono font-bold pointer-events-none"
                    style={{ textShadow: '0 0 8px rgba(0,0,0,0.8)' }}
                  >
                    r={link.correlation.toFixed(2)}
                  </text>
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
                onMouseDown={(e) => { e.preventDefault(); handleMouseDown(node.id); }}
                onMouseEnter={() => !dragging && setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => handleNodeClick(node.id)}
                className="cursor-pointer"
                style={{ transition: 'transform 0.15s ease-out' }}
                opacity={isFaded ? 0.25 : 1}
              >
                {isInPair && (
                  <circle
                    r={node.radius + 6} fill="none"
                    stroke={nodeColor} strokeWidth={2} strokeOpacity={0.5} strokeDasharray="4 3"
                  >
                    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="8s" repeatCount="indefinite" />
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
