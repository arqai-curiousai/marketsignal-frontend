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
import { Loader2, ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw, PanelLeftOpen, PanelLeftClose, X } from 'lucide-react';
import type { INewsGraphNode, INewsGraphEdge } from '@/types/analytics';
import { cn } from '@/lib/utils';
import {
  NODE_TYPE_COLORS,
  EDGE_STYLES,
  getSentimentColor,
  THEME_COLORS,
  THEME_LABELS,
  classifySentiment,
} from './constants';
import { NetworkTooltip } from './NetworkTooltip';
import { NetworkLegend } from './NetworkLegend';
import { NetworkInsightsPanel, type NetworkInsights } from './NetworkInsightsPanel';

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
  importance: number;
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

/** Compute importance score for article nodes */
function computeImportance(node: INewsGraphNode, edgeCount: number, maxEdges: number, nowMs: number): number {
  if (node.type !== 'article') return 0;
  // Recency factor: 1.0 for <1h, decays to 0.3 at 24h+
  const ageMs = node.published_at ? nowMs - new Date(node.published_at).getTime() : 86400000;
  const ageHours = Math.max(0, ageMs / 3600000);
  const recency = Math.max(0.3, 1 - (ageHours / 30));
  // Connectivity factor
  const connectivity = maxEdges > 0 ? edgeCount / maxEdges : 0;
  // Sentiment magnitude
  const sentMag = node.sentiment_score != null ? Math.abs(node.sentiment_score) : 0;
  return 0.4 * recency + 0.35 * connectivity + 0.25 * sentMag;
}

function getNodeRadius(node: INewsGraphNode, importance: number): number {
  switch (node.type) {
    case 'ticker': return 22;
    case 'theme': return 18;
    case 'article': return 8 + importance * 12; // 8-20px
    default: return 12;
  }
}

export function NewsNetworkGraph({
  nodes,
  edges,
  loading,
  onSelectArticle,
  onSelectTicker,
}: NewsNetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
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

  // Fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Focus mode
  const [focusNode, setFocusNode] = useState<string | null>(null);

  // Insights panel
  const [showInsights, setShowInsights] = useState(false);

  // Tooltip
  const [tooltipData, setTooltipData] = useState<{
    node: GraphNode;
    x: number;
    y: number;
  } | null>(null);

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

  // Fullscreen listeners
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) setIsFullscreen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFullscreen]);

  // Passive-false wheel zoom
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((z) => Math.max(0.3, Math.min(3, z + delta)));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // Connected nodes map
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

  // Edge counts per node (for importance)
  const edgeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of edges) {
      counts.set(e.source, (counts.get(e.source) || 0) + 1);
      counts.set(e.target, (counts.get(e.target) || 0) + 1);
    }
    return counts;
  }, [edges]);

  // Compute insights
  const insights: NetworkInsights = useMemo(() => {
    const tickerCounts = new Map<string, number>();
    const themeCounts = new Map<string, number>();
    let bullish = 0, bearish = 0, neutral = 0, totalScore = 0, articleCount = 0;

    for (const n of nodes) {
      if (n.type === 'ticker') {
        tickerCounts.set(n.id, edgeCounts.get(n.id) || 0);
      }
      if (n.type === 'theme') {
        themeCounts.set(n.id, edgeCounts.get(n.id) || 0);
      }
      if (n.type === 'article') {
        const cls = classifySentiment(n.sentiment_score);
        if (cls === 'bullish') bullish++;
        else if (cls === 'bearish') bearish++;
        else neutral++;
        totalScore += n.sentiment_score ?? 0;
        articleCount++;
      }
    }

    const tickerMentions = Array.from(tickerCounts.entries())
      .map(([ticker, count]) => ({ ticker, count }))
      .sort((a, b) => b.count - a.count);

    const themeDistribution = Array.from(themeCounts.entries())
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count);

    const coOccurringPairs: Array<{ pair: [string, string]; weight: number }> = [];
    for (const e of edges) {
      if (e.relationship === 'co_occurrence') {
        coOccurringPairs.push({ pair: [e.source, e.target], weight: e.weight });
      }
    }
    coOccurringPairs.sort((a, b) => b.weight - a.weight);

    return {
      tickerMentions,
      themeDistribution,
      sentiment: { bullish, neutral, bearish, avgScore: articleCount > 0 ? totalScore / articleCount : 0 },
      coOccurringPairs,
      stats: { nodes: nodes.length, edges: edges.length },
    };
  }, [nodes, edges, edgeCounts]);

  // Build simulation
  useEffect(() => {
    if (nodes.length === 0) return;

    const w = dimensions.width;
    const h = dimensions.height;
    const nowMs = Date.now();
    const maxEdgeCount = Math.max(1, ...Array.from(edgeCounts.values()));

    const graphNodes: GraphNode[] = nodes.map((n) => {
      const imp = computeImportance(n, edgeCounts.get(n.id) || 0, maxEdgeCount, nowMs);
      return {
        ...n,
        radius: getNodeRadius(n, imp),
        importance: imp,
        x: w / 2 + (Math.random() - 0.5) * 200,
        y: h / 2 + (Math.random() - 0.5) * 200,
      };
    });

    const nodeMap = new Map(graphNodes.map((n) => [n.id, n]));

    const simLinks: SimLink[] = edges
      .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map((e) => ({
        source: e.source,
        target: e.target,
        relationship: e.relationship,
        weight: e.weight,
      }));

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
        if (tickCountRef.current % 3 === 0) {
          setNodePositions([...graphNodes]);
        }
      })
      .on('end', () => {
        setNodePositions([...graphNodes]);
      });

    setNodePositions([...graphNodes]);
    nodePositionsRef.current = graphNodes;
    simLinksRef.current = simLinks;
    simRef.current = sim;

    return () => { sim.stop(); };
  }, [nodes, edges, dimensions, edgeCounts]);

  const isHighlighted = useCallback(
    (nodeId: string) => {
      if (focusNode) {
        return nodeId === focusNode || (connectedMap.get(focusNode)?.has(nodeId) ?? false);
      }
      if (!hoveredNode) return true;
      if (nodeId === hoveredNode) return true;
      return connectedMap.get(hoveredNode)?.has(nodeId) ?? false;
    },
    [hoveredNode, focusNode, connectedMap]
  );

  // Visible nodes/edges based on focus mode
  const visibleNodes = useMemo(() => {
    if (!focusNode) return new Set(nodePositions.map((n) => n.id));
    const visible = new Set<string>([focusNode]);
    const connected = connectedMap.get(focusNode);
    if (connected) {
      Array.from(connected).forEach((id) => visible.add(id));
    }
    return visible;
  }, [focusNode, nodePositions, connectedMap]);

  // Tooltip context for ticker/theme nodes
  const getTooltipContext = useCallback((node: GraphNode) => {
    const connected = connectedMap.get(node.id);
    if (!connected) return {};
    const connectedThemes: string[] = [];
    const connectedTickers: string[] = [];
    let bullish = 0, bearish = 0, neutral = 0;

    const connectedArr = Array.from(connected);
    for (let ci = 0; ci < connectedArr.length; ci++) {
      const id = connectedArr[ci];
      if (id.startsWith('theme:')) connectedThemes.push(id);
      if (id.startsWith('ticker:')) connectedTickers.push(id);
      // Check article sentiments
      const articleNode = nodePositionsRef.current.find((n) => n.id === id && n.type === 'article');
      if (articleNode) {
        const cls = classifySentiment(articleNode.sentiment_score);
        if (cls === 'bullish') bullish++;
        else if (cls === 'bearish') bearish++;
        else neutral++;
      }
    }

    return {
      connectedThemes: node.type === 'ticker' ? connectedThemes : undefined,
      connectedTickers: node.type === 'theme' ? connectedTickers : undefined,
      sentimentBreakdown: (bullish + bearish + neutral > 0) ? { bullish, bearish, neutral } : undefined,
    };
  }, [connectedMap]);

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

  const handleNodeHover = useCallback((node: GraphNode, e: React.MouseEvent) => {
    if (dragging) return;
    setHoveredNode(node.id);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipData({
        node,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, [dragging]);

  const handleNodeLeave = useCallback(() => {
    setHoveredNode(null);
    setTooltipData(null);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen();
    }
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setFocusNode(null);
  }, []);

  // Node position map for edges
  const nodePositionMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    for (const n of nodePositions) map.set(n.id, n);
    return map;
  }, [nodePositions]);

  // Resolve edge endpoints
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

  // Focus node label for chip
  const focusLabel = useMemo(() => {
    if (!focusNode) return '';
    const n = nodePositionMap.get(focusNode);
    if (!n) return focusNode;
    if (n.type === 'ticker') return n.label;
    if (n.type === 'theme') {
      const key = n.id.replace('theme:', '');
      return THEME_LABELS[key] || key;
    }
    return n.label;
  }, [focusNode, nodePositionMap]);

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center min-h-[300px]', isFullscreen ? 'h-screen' : 'h-[60vh] max-h-[700px]')}>
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className={cn('flex items-center justify-center min-h-[300px] text-muted-foreground text-sm', isFullscreen ? 'h-screen' : 'h-[60vh] max-h-[700px]')}>
        No graph data available. Try a different time range.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full rounded-xl border border-white/10 bg-[#0d1117] overflow-hidden',
        isFullscreen ? 'fixed inset-0 z-50 h-screen rounded-none border-none' : 'min-h-[300px] h-[60vh] max-h-[700px]',
      )}
    >
      {/* Controls — top right */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
        <button
          onClick={() => setShowInsights((v) => !v)}
          className="p-1.5 rounded-md bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
          title={showInsights ? 'Hide insights' : 'Show insights'}
        >
          {showInsights ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
        </button>
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
          onClick={resetView}
          className="p-1.5 rounded-md bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
          title="Reset view"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-md bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Focus mode chip */}
      {focusNode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-medium backdrop-blur-sm">
          Focus: {focusLabel}
          <button
            onClick={() => setFocusNode(null)}
            className="p-0.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Insights Panel */}
      <NetworkInsightsPanel
        insights={insights}
        open={showInsights}
        onClose={() => setShowInsights(false)}
        onFocusTicker={(ticker) => {
          setFocusNode(ticker);
          setShowInsights(false);
        }}
        onFocusTheme={(theme) => {
          setFocusNode(theme);
          setShowInsights(false);
        }}
      />

      {/* Legend */}
      <NetworkLegend />

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
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
      >
        {/* Defs */}
        <defs>
          <filter id="news-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Edges */}
          {resolvedEdges.map((edge, i) => {
            const { sourceNode, targetNode } = edge;
            if (!sourceNode || !targetNode) return null;
            if (!visibleNodes.has(edge.source) || !visibleNodes.has(edge.target)) return null;

            const style = EDGE_STYLES[edge.relationship] || EDGE_STYLES.mentions;
            const highlighted = isHighlighted(edge.source) && isHighlighted(edge.target);
            const isActive = !hoveredNode || highlighted;

            return (
              <line
                key={`edge-${i}`}
                x1={sourceNode.x ?? 0}
                y1={sourceNode.y ?? 0}
                x2={targetNode.x ?? 0}
                y2={targetNode.y ?? 0}
                stroke={isActive ? style.color : '#1e293b'}
                strokeWidth={edge.relationship === 'co_occurrence' ? Math.max(2, edge.weight * 3) : Math.max(1, edge.weight * 2)}
                strokeOpacity={hoveredNode ? (highlighted ? style.opacity * 2.5 : 0.04) : style.opacity}
                strokeDasharray={style.dash}
                style={{ transition: 'stroke-opacity 0.2s' }}
              />
            );
          })}

          {/* Nodes */}
          {nodePositions.map((node) => {
            if (node.x == null || node.y == null) return null;
            if (!visibleNodes.has(node.id)) return null;

            const highlighted = isHighlighted(node.id);
            const isHovered = hoveredNode === node.id;
            const fillOpacity = node.type === 'article'
              ? 0.5 + node.importance * 0.4
              : 0.8;

            return (
              <g
                key={node.id}
                className="cursor-pointer"
                transform={`translate(${node.x}, ${node.y})`}
                opacity={hoveredNode ? (highlighted ? 1 : 0.12) : (focusNode && !visibleNodes.has(node.id) ? 0.08 : 1)}
                onMouseEnter={(e) => handleNodeHover(node, e)}
                onMouseLeave={handleNodeLeave}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                onClick={() => handleNodeClick(node)}
              >
                {/* Node shape */}
                {node.type === 'article' ? (
                  <circle
                    r={node.radius}
                    fill={getSentimentColor(node.sentiment, node.sentiment_score)}
                    fillOpacity={fillOpacity}
                    stroke={isHovered ? '#fff' : getSentimentColor(node.sentiment, node.sentiment_score)}
                    strokeWidth={isHovered ? 2 : 0.6}
                    strokeOpacity={isHovered ? 1 : 0.4}
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
                    stroke={isHovered ? '#fff' : 'rgba(255,255,255,0.2)'}
                    strokeWidth={isHovered ? 2 : 0.8}
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
                    stroke={isHovered ? '#fff' : 'rgba(255,255,255,0.15)'}
                    strokeWidth={isHovered ? 2 : 0.5}
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
                    : node.type === 'theme'
                    ? (THEME_LABELS[(node.id || '').replace('theme:', '')] || node.label).slice(0, 18)
                    : node.label.length > 22
                    ? node.label.slice(0, 20) + '...'
                    : node.label}
                </text>

                {/* Article count badge for ticker/theme */}
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

      {/* Custom Tooltip */}
      {tooltipData && !dragging && (
        <NetworkTooltip
          node={tooltipData.node}
          x={tooltipData.x}
          y={tooltipData.y}
          containerWidth={dimensions.width}
          containerHeight={dimensions.height}
          {...getTooltipContext(tooltipData.node)}
          onFocus={
            (tooltipData.node.type === 'ticker' || tooltipData.node.type === 'theme')
              ? () => { setFocusNode(tooltipData.node.id); setTooltipData(null); setHoveredNode(null); }
              : undefined
          }
        />
      )}
    </div>
  );
}
