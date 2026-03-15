'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import { Loader2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { INewsGraphNode, INewsGraphEdge } from '@/types/analytics';
import { cn } from '@/lib/utils';
import {
  NODE_TYPE_COLORS,
  EDGE_STYLES,
  getSentimentColor,
  THEME_COLORS,
  formatTimeAgo,
  getSourceDisplayName,
} from './constants';

interface GraphNode extends SimulationNodeDatum {
  id: string;
  type: 'article' | 'ticker' | 'theme';
  label: string;
  sentiment: string | null;
  sentiment_score: number | null;
  published_at: string | null;
  source: string | null;
  article_count: number | null;
  radius: number;
}

interface SimLink extends SimulationLinkDatum<GraphNode> {
  relationship: string;
  weight: number;
}

interface NewsNetworkGraphProps {
  nodes: INewsGraphNode[];
  edges: INewsGraphEdge[];
  loading: boolean;
  onSelectArticle: (nodeId: string) => void;
  onSelectTicker: (ticker: string) => void;
}

function getNodeRadius(node: INewsGraphNode): number {
  switch (node.type) {
    case 'ticker': return 22;
    case 'theme': return 18;
    case 'article': return 12;
    default: return 12;
  }
}

/** Build tooltip text for a graph node */
function getNodeTooltip(node: GraphNode): string {
  const parts: string[] = [node.label];
  if (node.type === 'article') {
    if (node.source) parts.push(`Source: ${getSourceDisplayName(node.source)}`);
    if (node.published_at) parts.push(formatTimeAgo(node.published_at));
    if (node.sentiment_score != null) parts.push(`Sentiment: ${node.sentiment_score >= 0 ? '+' : ''}${node.sentiment_score.toFixed(2)}`);
  } else {
    if (node.article_count) parts.push(`${node.article_count} article${node.article_count !== 1 ? 's' : ''}`);
  }
  return parts.join('\n');
}

export function NewsNetworkGraph({
  nodes,
  edges,
  loading,
  onSelectArticle,
  onSelectTicker,
}: NewsNetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [nodePositions, setNodePositions] = useState<GraphNode[]>([]);
  const nodePositionsRef = useRef<GraphNode[]>([]);
  const simLinksRef = useRef<SimLink[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const simRef = useRef<ReturnType<typeof forceSimulation<GraphNode>> | null>(null);
  const tickCountRef = useRef(0);

  // Responsive sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({
        width: Math.max(width, 300),
        height: Math.max(height, 300),
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Build simulation — pure React rendering, no d3-selection DOM manipulation
  useEffect(() => {
    if (nodes.length === 0) return;

    const w = dimensions.width;
    const h = dimensions.height;

    const graphNodes: GraphNode[] = nodes.map((n) => ({
      ...n,
      radius: getNodeRadius(n),
      x: w / 2 + (Math.random() - 0.5) * 200,
      y: h / 2 + (Math.random() - 0.5) * 200,
    }));

    const nodeMap = new Map(graphNodes.map((n) => [n.id, n]));

    const simLinks: SimLink[] = edges
      .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map((e) => ({
        source: e.source,
        target: e.target,
        relationship: e.relationship,
        weight: e.weight,
      }));

    // Clean up old sim
    simRef.current?.stop();
    tickCountRef.current = 0;

    const sim = forceSimulation<GraphNode>(graphNodes)
      .force(
        'link',
        forceLink<GraphNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance((d) => {
            if (d.relationship === 'mentions') return 70;
            if (d.relationship === 'co_topic') return 90;
            return 120;
          })
          .strength((d) => d.weight * 0.25)
      )
      .force('charge', forceManyBody<GraphNode>().strength(-180).distanceMax(350))
      .force('center', forceCenter(w / 2, h / 2).strength(0.04))
      .force('collision', forceCollide<GraphNode>().radius((d) => d.radius + 4))
      .force('x', forceX(w / 2).strength(0.02))
      .force('y', forceY(h / 2).strength(0.02))
      .alphaDecay(0.025)
      .velocityDecay(0.3)
      .on('tick', () => {
        tickCountRef.current++;
        nodePositionsRef.current = graphNodes;
        simLinksRef.current = simLinks;
        // Throttle React state updates to every 3rd tick (~30fps)
        if (tickCountRef.current % 3 === 0) {
          setNodePositions([...graphNodes]);
        }
      })
      .on('end', () => {
        // Final sync to ensure positions are exact
        setNodePositions([...graphNodes]);
      });

    // Set initial positions
    setNodePositions([...graphNodes]);
    nodePositionsRef.current = graphNodes;
    simLinksRef.current = simLinks;
    simRef.current = sim;

    return () => {
      sim.stop();
    };
  }, [nodes, edges, dimensions]);

  // Connected nodes for hover highlighting
  const connectedMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const e of edges) {
      if (!map.has(e.source)) map.set(e.source, new Set());
      if (!map.has(e.target)) map.set(e.target, new Set());
      map.get(e.source)!.add(e.target);
      map.get(e.target)!.add(e.source);
    }
    return map;
  }, [edges]);

  const isHighlighted = useCallback(
    (nodeId: string) => {
      if (!hoveredNode) return true;
      if (nodeId === hoveredNode) return true;
      return connectedMap.get(hoveredNode)?.has(nodeId) ?? false;
    },
    [hoveredNode, connectedMap]
  );

  // Drag handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      setDragging(nodeId);
      simRef.current?.alphaTarget(0.1).restart();
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragging) {
        const node = nodePositionsRef.current.find((n) => n.id === dragging);
        if (node) {
          node.fx = (e.nativeEvent.offsetX - pan.x) / zoom;
          node.fy = (e.nativeEvent.offsetY - pan.y) / zoom;
        }
      } else if (isPanning) {
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        panStart.current = { x: e.clientX, y: e.clientY };
        setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
      }
    },
    [dragging, isPanning, pan, zoom]
  );

  const handleMouseUp = useCallback(() => {
    if (dragging) {
      const node = nodePositionsRef.current.find((n) => n.id === dragging);
      if (node) {
        node.fx = null;
        node.fy = null;
      }
      simRef.current?.alphaTarget(0);
      setDragging(null);
    }
    setIsPanning(false);
  }, [dragging]);

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (node.type === 'article') {
        onSelectArticle(node.id);
      } else if (node.type === 'ticker') {
        onSelectTicker(node.label);
      }
    },
    [onSelectArticle, onSelectTicker]
  );

  // Build node position map for edges — derived from positions state (always in sync)
  const nodePositionMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    for (const n of nodePositions) map.set(n.id, n);
    return map;
  }, [nodePositions]);

  // Resolve edge endpoints from simLinks (after d3 resolves source/target to objects)
  const resolvedEdges = useMemo(() => {
    return simLinksRef.current.map((link) => {
      const source = typeof link.source === 'object' ? link.source : nodePositionMap.get(link.source as string);
      const target = typeof link.target === 'object' ? link.target : nodePositionMap.get(link.target as string);
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source as string;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target as string;
      return {
        source: sourceId,
        target: targetId,
        relationship: link.relationship,
        weight: link.weight,
        sourceNode: source,
        targetNode: target,
      };
    }).filter((e) => e.sourceNode && e.targetNode && e.sourceNode.x != null && e.targetNode.x != null);
  }, [nodePositionMap]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] h-[60vh] max-h-[700px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px] h-[60vh] max-h-[700px] text-muted-foreground text-sm">
        No graph data available. Try a different time range.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full min-h-[300px] h-[60vh] max-h-[700px] rounded-xl border border-white/10 bg-[#0d1117] overflow-hidden">
      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.2, 3))}
          className="p-1.5 rounded-md bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.2, 0.3))}
          className="p-1.5 rounded-md bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="p-1.5 rounded-md bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
          title="Reset view"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Legend — with card background for visibility */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-3 px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 text-[10px] text-muted-foreground backdrop-blur-sm">
        {(['article', 'ticker', 'theme'] as const).map((type) => (
          <span key={type} className="flex items-center gap-1">
            <span
              className={cn(
                type === 'article' ? 'w-2.5 h-2.5 rounded-full' :
                type === 'ticker' ? 'w-3 h-2.5 rounded-sm' :
                'w-2.5 h-2.5 rotate-45'
              )}
              style={{ backgroundColor: NODE_TYPE_COLORS[type] }}
            />
            <span className="capitalize">{type}</span>
          </span>
        ))}
        <span className="text-white/30">|</span>
        <span className="text-white/50">Click to explore</span>
      </div>

      <svg
        width={dimensions.width}
        height={dimensions.height}
        className="cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => {
          if (!dragging) {
            setIsPanning(true);
            panStart.current = { x: e.clientX, y: e.clientY };
          }
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={(e) => {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -0.1 : 0.1;
          setZoom((z) => Math.max(0.3, Math.min(3, z + delta)));
        }}
      >
        {/* Glow filter */}
        <defs>
          <filter id="news-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Edges — rendered from resolved simulation links */}
          {resolvedEdges.map((edge, i) => {
            const { sourceNode, targetNode } = edge;
            if (!sourceNode || !targetNode) return null;

            const style = EDGE_STYLES[edge.relationship] || EDGE_STYLES.mentions;
            const highlighted = isHighlighted(edge.source) && isHighlighted(edge.target);

            return (
              <line
                key={`edge-${i}`}
                x1={sourceNode.x ?? 0}
                y1={sourceNode.y ?? 0}
                x2={targetNode.x ?? 0}
                y2={targetNode.y ?? 0}
                stroke={hoveredNode ? (highlighted ? '#94A3B8' : '#1e293b') : '#475569'}
                strokeWidth={Math.max(1, edge.weight * 2)}
                strokeOpacity={hoveredNode ? (highlighted ? style.opacity * 2 : 0.05) : style.opacity}
                strokeDasharray={style.dash}
              />
            );
          })}

          {/* Nodes — all positions from React state, always in sync */}
          {nodePositions.map((node) => {
            if (node.x == null || node.y == null) return null;
            const highlighted = isHighlighted(node.id);
            const isHovered = hoveredNode === node.id;

            return (
              <g
                key={node.id}
                className="cursor-pointer"
                transform={`translate(${node.x}, ${node.y})`}
                opacity={hoveredNode ? (highlighted ? 1 : 0.15) : 1}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                onClick={() => handleNodeClick(node)}
              >
                {/* Tooltip via SVG title */}
                <title>{getNodeTooltip(node)}</title>

                {/* Node shape */}
                {node.type === 'article' ? (
                  <circle
                    r={node.radius}
                    fill={getSentimentColor(node.sentiment, node.sentiment_score)}
                    fillOpacity={0.7}
                    stroke={isHovered ? '#fff' : 'transparent'}
                    strokeWidth={isHovered ? 2 : 0}
                    filter={isHovered ? 'url(#news-glow)' : undefined}
                  />
                ) : node.type === 'ticker' ? (
                  <rect
                    x={-node.radius}
                    y={-node.radius * 0.7}
                    width={node.radius * 2}
                    height={node.radius * 1.4}
                    rx={5}
                    fill={NODE_TYPE_COLORS.ticker}
                    fillOpacity={0.8}
                    stroke={isHovered ? '#fff' : 'transparent'}
                    strokeWidth={isHovered ? 2 : 0}
                    filter={isHovered ? 'url(#news-glow)' : undefined}
                  />
                ) : (
                  <rect
                    x={-node.radius * 0.7}
                    y={-node.radius * 0.7}
                    width={node.radius * 1.4}
                    height={node.radius * 1.4}
                    rx={2}
                    transform="rotate(45)"
                    fill={THEME_COLORS[(node.id || '').replace('theme:', '')] || NODE_TYPE_COLORS.theme}
                    fillOpacity={0.7}
                    stroke={isHovered ? '#fff' : 'transparent'}
                    strokeWidth={isHovered ? 2 : 0}
                    filter={isHovered ? 'url(#news-glow)' : undefined}
                  />
                )}

                {/* Label */}
                <text
                  y={node.type === 'article' ? node.radius + 12 : 4}
                  textAnchor="middle"
                  fill={isHovered ? '#fff' : '#94A3B8'}
                  fontSize={node.type === 'ticker' ? 10 : node.type === 'theme' ? 9 : 8}
                  fontWeight={node.type !== 'article' ? 600 : 400}
                  fontFamily={node.type === 'ticker' ? 'monospace' : undefined}
                  className="pointer-events-none select-none"
                >
                  {node.type === 'ticker'
                    ? node.label
                    : node.label.length > 20
                    ? node.label.slice(0, 18) + '...'
                    : node.label}
                </text>

                {/* Article count badge for ticker/theme nodes */}
                {node.article_count != null && node.article_count > 0 && node.type !== 'article' && (
                  <>
                    <circle
                      cx={node.radius * 0.7}
                      cy={-node.radius * 0.7}
                      r={7}
                      fill="#1e293b"
                      stroke="#475569"
                      strokeWidth={1}
                    />
                    <text
                      x={node.radius * 0.7}
                      y={-node.radius * 0.7}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#94A3B8"
                      fontSize={8}
                      fontWeight={600}
                      className="pointer-events-none select-none"
                    >
                      {node.article_count}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
