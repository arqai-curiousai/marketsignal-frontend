'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { hierarchy, tree as d3Tree, type HierarchyPointNode } from 'd3-hierarchy';
import { Loader2, Search, ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import type { INewsMindMapNode } from '@/types/analytics';
import { cn } from '@/lib/utils';
import {
  getSentimentColor,
  getSourceDisplayName,
  THEME_COLORS,
  THEME_LABELS,
  SENTIMENT_COLORS,
  formatTimeAgo,
  classifySentiment,
} from './constants';

interface NewsMindMapProps {
  tree: INewsMindMapNode | null;
  loading: boolean;
  ticker: string | null;
  onSelectTicker: (ticker: string) => void;
  onSelectArticle: (articleId: string) => void;
  tickerOptions: string[];
}

interface TreeNode {
  id: string;
  label: string;
  type: 'ticker' | 'theme' | 'article' | 'fact';
  sentiment: string | null;
  sentiment_score: number | null;
  source: string | null;
  published_at: string | null;
  url: string | null;
  impact: { '1h': number | null; '4h': number | null; '1d': number | null } | null;
  article_count: number | null;
  children: TreeNode[];
}

/** Get the max absolute impact value for an article */
function getImpactMagnitude(impact: TreeNode['impact']): number {
  if (!impact) return 0;
  const vals = [impact['1h'], impact['4h'], impact['1d']].filter((v): v is number => v != null);
  return vals.length > 0 ? Math.max(...vals.map(Math.abs)) : 0;
}

/** Determine article node radius based on impact */
function getArticleRadius(impact: TreeNode['impact']): number {
  const mag = getImpactMagnitude(impact);
  if (mag > 3) return 11;
  if (mag > 1) return 9;
  if (mag > 0) return 7;
  return 6;
}

/** Get theme key from node id */
function getThemeKey(nodeId: string): string {
  return nodeId.replace('theme:', '');
}

/** Get human-readable theme label */
function getThemeLabel(nodeId: string): string {
  const key = getThemeKey(nodeId);
  return THEME_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Compute bullish ratio for theme node children */
function getThemeSentimentRatio(node: TreeNode): { bullish: number; bearish: number; neutral: number } {
  const articles = node.children.filter((c) => c.type === 'article');
  if (articles.length === 0) return { bullish: 0, bearish: 0, neutral: 1 };
  let bullish = 0, bearish = 0, neutral = 0;
  for (const a of articles) {
    const cls = classifySentiment(a.sentiment_score);
    if (cls === 'bullish') bullish++;
    else if (cls === 'bearish') bearish++;
    else neutral++;
  }
  const total = articles.length;
  return { bullish: bullish / total, bearish: bearish / total, neutral: neutral / total };
}

/** Truncate label by type */
function truncateLabel(label: string, type: TreeNode['type']): string {
  const limit = type === 'theme' ? 28 : type === 'article' ? 38 : 30;
  return label.length > limit ? label.slice(0, limit - 2) + '...' : label;
}

export function NewsMindMap({
  tree,
  loading,
  ticker,
  onSelectTicker,
  onSelectArticle,
  tickerOptions,
}: NewsMindMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [mapZoom, setMapZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Pan state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });

  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    node: TreeNode;
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
        width: Math.max(width, 400),
        height: Math.max(height, 400),
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

  // Escape key for CSS fallback fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) setIsFullscreen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFullscreen]);

  // Passive-false wheel listener for zoom
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setMapZoom((z) => Math.max(0.4, Math.min(2.5, z + delta)));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // Build pruned tree (collapse children)
  const prunedTree = useMemo(() => {
    if (!tree) return null;

    function prune(node: TreeNode): TreeNode {
      if (collapsedNodes.has(node.id)) {
        return { ...node, children: [] };
      }
      return {
        ...node,
        children: node.children.map(prune),
      };
    }

    return prune(tree as TreeNode);
  }, [tree, collapsedNodes]);

  // D3 tree layout with wider separation to prevent overlap
  const layout = useMemo(() => {
    if (!prunedTree) return null;

    const root = hierarchy(prunedTree);
    const leafCount = root.leaves().length;
    const treeHeight = Math.max(dimensions.height - 80, leafCount * 44 + 80);
    const treeWidth = Math.max(dimensions.width - 240, 600);

    const treeLayout = d3Tree<TreeNode>()
      .size([treeHeight, treeWidth])
      .separation((a, b) => {
        // Wider separation to prevent text overlap
        if (a.parent === b.parent) {
          // Fact siblings can be tighter since they have hover-only labels
          if (a.data.type === 'fact' && b.data.type === 'fact') return 1.0;
          return 1.8;
        }
        return 2.5;
      });

    treeLayout(root);

    // Post-process: stagger dense siblings to prevent overlap
    const allNodes = root.descendants() as HierarchyPointNode<TreeNode>[];
    const byDepth = new Map<number, HierarchyPointNode<TreeNode>[]>();
    for (let di = 0; di < allNodes.length; di++) {
      const d = allNodes[di];
      const depth = d.depth;
      if (!byDepth.has(depth)) byDepth.set(depth, []);
      byDepth.get(depth)!.push(d);
    }
    const depthGroups = Array.from(byDepth.values());
    for (let gi = 0; gi < depthGroups.length; gi++) {
      const group = depthGroups[gi];
      group.sort((a: HierarchyPointNode<TreeNode>, b: HierarchyPointNode<TreeNode>) => (a.x ?? 0) - (b.x ?? 0));
      for (let i = 1; i < group.length; i++) {
        const prev = group[i - 1];
        const curr = group[i];
        const minGap = curr.data.type === 'fact' ? 14 : 20;
        if (Math.abs((curr.x ?? 0) - (prev.x ?? 0)) < minGap) {
          curr.x = (prev.x ?? 0) + minGap;
        }
      }
    }

    return root;
  }, [prunedTree, dimensions]);

  // Ancestor path set for hovered node (highlight root-to-node path)
  const hoveredPath = useMemo(() => {
    if (!hoveredNode || !layout) return new Set<string>();
    const found = layout.descendants().find((d) => d.data.id === hoveredNode);
    if (!found) return new Set<string>();
    const pathIds = new Set<string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = found;
    while (current) {
      pathIds.add(current.data.id);
      current = current.parent;
    }
    return pathIds;
  }, [hoveredNode, layout]);

  const toggleNode = useCallback((nodeId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {
        // CSS fallback
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  const resetView = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setMapZoom(1);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    panStart.current = { x: e.clientX, y: e.clientY };
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleNodeHover = useCallback((node: TreeNode, e: React.MouseEvent) => {
    setHoveredNode(node.id);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltip({
        node,
        x: e.clientX - rect.left + 12,
        y: e.clientY - rect.top - 8,
      });
    }
  }, []);

  const handleNodeLeave = useCallback(() => {
    setHoveredNode(null);
    setTooltip(null);
  }, []);

  const filteredTickers = searchQuery
    ? tickerOptions.filter((t) => t.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 8)
    : [];

  if (!ticker) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground gap-4">
        <div className="text-center">
          <p className="text-sm mb-3">Select a stock to explore its news mind map</p>
          <div className="relative w-56 mx-auto">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearch(true);
                }}
                onFocus={() => setShowSearch(true)}
                placeholder="Search ticker..."
                className="bg-transparent text-xs text-white placeholder:text-muted-foreground outline-none flex-1"
              />
            </div>
            {showSearch && filteredTickers.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#1a1f2e] border border-white/15 rounded-lg shadow-xl overflow-hidden">
                {filteredTickers.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      onSelectTicker(t);
                      setSearchQuery('');
                      setShowSearch(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 font-mono"
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (!layout) {
    return (
      <div className="flex items-center justify-center h-[500px] text-muted-foreground text-sm">
        No mind map data available for {ticker}.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full rounded-xl border border-white/10 bg-[#0d1117]',
        isFullscreen ? 'fixed inset-0 z-50 h-screen rounded-none border-none' : 'h-[560px]',
        'overflow-hidden'
      )}
    >
      {/* Controls — top right */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
        <button
          onClick={() => setMapZoom((z) => Math.min(z + 0.2, 2.5))}
          className="p-1.5 rounded-md bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setMapZoom((z) => Math.max(z - 0.2, 0.4))}
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

      {/* Legend — bottom left */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-3 px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 text-[10px] text-muted-foreground backdrop-blur-sm">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full" style={{ background: 'linear-gradient(135deg, #6EE7B7, #10B981)' }} />
          <span>Ticker</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm bg-amber-400/60" />
          <span>Theme</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Article</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          <span>Fact</span>
        </span>
        <span className="text-white/20">|</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full shadow-[0_0_6px_2px_rgba(16,185,129,0.5)]" style={{ backgroundColor: '#10B981' }} />
          <span>High Impact</span>
        </span>
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* SVG Defs — gradients and filters */}
        <defs>
          <radialGradient id="ticker-gradient" cx="40%" cy="40%">
            <stop offset="0%" stopColor="#6EE7B7" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#10B981" stopOpacity={0.7} />
          </radialGradient>
          <filter id="mindmap-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="mindmap-glow-sm" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g
          transform={`translate(${pan.x}, ${pan.y}) scale(${mapZoom}) translate(120, 40)`}
          style={{ willChange: 'transform' }}
        >
          {/* Links */}
          {layout.links().map((link, i) => {
            const sx = link.source.y ?? 0;
            const sy = link.source.x ?? 0;
            const tx = link.target.y ?? 0;
            const ty = link.target.x ?? 0;
            const data = link.target.data;
            const sentColor = getSentimentColor(data.sentiment, data.sentiment_score);
            const impactMag = getImpactMagnitude(data.impact);
            const isOnPath = hoveredPath.has(data.id);

            return (
              <path
                key={i}
                d={`M${sx},${sy} C${(sx + tx) / 2},${sy} ${(sx + tx) / 2},${ty} ${tx},${ty}`}
                fill="none"
                stroke={sentColor}
                strokeWidth={
                  data.type === 'theme' ? 2.5 :
                  data.type === 'article' ? (impactMag > 2 ? 2 : 1.5) :
                  0.8
                }
                strokeOpacity={
                  hoveredNode
                    ? (isOnPath ? 0.8 : 0.08)
                    : (impactMag > 2 ? 0.5 : data.type === 'fact' ? 0.15 : 0.35)
                }
                style={{ transition: 'stroke-opacity 0.3s ease' }}
              />
            );
          })}

          {/* Nodes */}
          {layout.descendants().map((d) => {
            const node = d.data;
            const x = d.y ?? 0;
            const y = d.x ?? 0;
            const sentColor = getSentimentColor(node.sentiment, node.sentiment_score);
            const themeKey = getThemeKey(node.id);
            const themeColor = THEME_COLORS[themeKey] || sentColor;
            const hasChildren = (d.data.children?.length ?? 0) > 0 || collapsedNodes.has(node.id);
            const isCollapsed = collapsedNodes.has(node.id);
            const isHovered = hoveredNode === node.id;
            const isOnPath = hoveredPath.has(node.id);
            const impactMag = getImpactMagnitude(node.impact);
            const isHighImpact = impactMag > 2;
            const articleR = getArticleRadius(node.impact);

            return (
              <g
                key={node.id}
                transform={`translate(${x}, ${y})`}
                className="cursor-pointer"
                style={{ transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
                opacity={hoveredNode ? (isOnPath ? 1 : 0.35) : 1}
                onMouseEnter={(e) => handleNodeHover(node, e)}
                onMouseLeave={handleNodeLeave}
                onClick={() => {
                  if (node.type === 'theme' || (node.type === 'article' && hasChildren)) {
                    toggleNode(node.id);
                  }
                  if (node.type === 'article' && node.id.startsWith('article:')) {
                    onSelectArticle(node.id.replace('article:', ''));
                  }
                }}
              >
                {/* === TICKER NODE (root) === */}
                {node.type === 'ticker' && (
                  <>
                    {/* Outer pulse ring */}
                    <circle
                      r={26}
                      fill="none"
                      stroke="white"
                      strokeWidth={1.5}
                      strokeOpacity={0.12}
                      className="animate-[pulse_3s_ease-in-out_infinite]"
                    />
                    {/* Main circle with gradient */}
                    <circle
                      r={20}
                      fill="url(#ticker-gradient)"
                      stroke={isHovered ? '#fff' : 'rgba(255,255,255,0.25)'}
                      strokeWidth={isHovered ? 2.5 : 1.5}
                      filter={isHovered ? 'url(#mindmap-glow-sm)' : undefined}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#fff"
                      fontSize={10}
                      fontWeight={700}
                      fontFamily="monospace"
                      className="pointer-events-none select-none"
                    >
                      {node.label}
                    </text>
                  </>
                )}

                {/* === THEME NODE (pill shape) === */}
                {node.type === 'theme' && (() => {
                  const themeLabel = getThemeLabel(node.id);
                  const displayLabel = truncateLabel(themeLabel, 'theme');
                  const pillWidth = Math.max(displayLabel.length * 6.5 + 24, 60);
                  const pillHeight = 22;
                  const sentRatio = getThemeSentimentRatio(node);

                  return (
                    <>
                      {/* Pill background */}
                      <rect
                        x={-12}
                        y={-pillHeight / 2}
                        width={pillWidth}
                        height={pillHeight}
                        rx={pillHeight / 2}
                        fill={themeColor}
                        fillOpacity={isHovered ? 0.25 : 0.12}
                        stroke={themeColor}
                        strokeWidth={isHovered ? 1.5 : 1}
                        strokeOpacity={isHovered ? 0.8 : 0.5}
                        style={{ transition: 'fill-opacity 0.2s, stroke-opacity 0.2s' }}
                      />
                      {/* Theme label inside pill */}
                      <text
                        x={pillWidth / 2 - 12}
                        y={0}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={isHovered ? '#fff' : '#CBD5E1'}
                        fontSize={10}
                        fontWeight={600}
                        className="pointer-events-none select-none"
                      >
                        {displayLabel}
                      </text>
                      {/* Article count badge */}
                      {node.article_count != null && node.article_count > 0 && (
                        <>
                          <circle
                            cx={pillWidth - 10}
                            cy={-pillHeight / 2 - 2}
                            r={7}
                            fill="#1e293b"
                            stroke={themeColor}
                            strokeWidth={1}
                          />
                          <text
                            x={pillWidth - 10}
                            y={-pillHeight / 2 - 2}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill={themeColor}
                            fontSize={8}
                            fontWeight={600}
                            className="pointer-events-none select-none"
                          >
                            {isCollapsed ? '+' : node.article_count}
                          </text>
                        </>
                      )}
                      {/* Sentiment distribution bar under pill */}
                      <g transform={`translate(${pillWidth / 2 - 24}, ${pillHeight / 2 + 3})`}>
                        <rect x={0} y={0} width={Math.round(sentRatio.bullish * 24)} height={2.5} rx={1} fill={SENTIMENT_COLORS.bullish} />
                        <rect x={Math.round(sentRatio.bullish * 24)} y={0} width={Math.round(sentRatio.neutral * 24)} height={2.5} rx={0} fill={SENTIMENT_COLORS.neutral} fillOpacity={0.4} />
                        <rect x={Math.round((sentRatio.bullish + sentRatio.neutral) * 24)} y={0} width={Math.round(sentRatio.bearish * 24)} height={2.5} rx={1} fill={SENTIMENT_COLORS.bearish} />
                      </g>
                    </>
                  );
                })()}

                {/* === ARTICLE NODE === */}
                {node.type === 'article' && (
                  <>
                    <circle
                      r={articleR}
                      fill={sentColor}
                      fillOpacity={isHighImpact ? 0.8 : 0.55}
                      stroke={isHovered ? '#fff' : sentColor}
                      strokeWidth={isHovered ? 2 : (isHighImpact ? 1.5 : 0.8)}
                      filter={isHighImpact ? 'url(#mindmap-glow)' : undefined}
                    />
                    {/* Label to the right */}
                    <text
                      x={articleR + 6}
                      y={0}
                      dominantBaseline="central"
                      fill={isHovered ? '#fff' : (isOnPath ? '#CBD5E1' : '#94A3B8')}
                      fontSize={isHighImpact ? 10.5 : 10}
                      fontWeight={isHighImpact ? 500 : 400}
                      className="pointer-events-none select-none"
                      style={{ transition: 'fill 0.2s' }}
                    >
                      {truncateLabel(node.label, 'article')}
                    </text>
                    {/* Source + time below */}
                    {node.source && (
                      <text
                        x={articleR + 6}
                        y={14}
                        fill="#4B5563"
                        fontSize={8}
                        className="pointer-events-none select-none"
                      >
                        {getSourceDisplayName(node.source)} {formatTimeAgo(node.published_at)}
                      </text>
                    )}
                    {/* Impact badge */}
                    {node.impact && (
                      <ImpactBadge impact={node.impact} x={articleR + 6} y={-14} />
                    )}
                  </>
                )}

                {/* === FACT NODE (minimal — hover for label) === */}
                {node.type === 'fact' && (
                  <>
                    <circle
                      r={3}
                      fill="#475569"
                      fillOpacity={isHovered ? 0.9 : 0.5}
                      stroke={isHovered ? '#94A3B8' : 'transparent'}
                      strokeWidth={1}
                    />
                    {/* Show label only on hover */}
                    {isHovered && (
                      <>
                        <rect
                          x={8}
                          y={-10}
                          width={Math.min(node.label.length * 5.5 + 12, 260)}
                          height={20}
                          rx={4}
                          fill="#0f172a"
                          fillOpacity={0.92}
                          stroke="#334155"
                          strokeWidth={0.5}
                        />
                        <text
                          x={14}
                          y={1}
                          dominantBaseline="central"
                          fill="#E2E8F0"
                          fontSize={9}
                          className="pointer-events-none select-none"
                        >
                          {node.label.length > 45 ? node.label.slice(0, 43) + '...' : node.label}
                        </text>
                      </>
                    )}
                  </>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Custom Tooltip */}
      {tooltip && tooltip.node.type !== 'fact' && !isPanning && (
        <div
          className="absolute z-30 pointer-events-none"
          style={{
            left: Math.min(tooltip.x, dimensions.width - 280),
            top: Math.max(tooltip.y - 60, 8),
          }}
        >
          <div className="px-3 py-2 rounded-lg bg-[#0f172a]/95 border border-white/10 backdrop-blur-md shadow-xl max-w-[260px]">
            <p className="text-[11px] text-white font-medium leading-tight mb-1">
              {tooltip.node.type === 'theme'
                ? getThemeLabel(tooltip.node.id)
                : tooltip.node.label}
            </p>
            <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
              {tooltip.node.source && (
                <span>{getSourceDisplayName(tooltip.node.source)}</span>
              )}
              {tooltip.node.published_at && (
                <span>{formatTimeAgo(tooltip.node.published_at)}</span>
              )}
            </div>
            {tooltip.node.sentiment_score != null && (
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: getSentimentColor(tooltip.node.sentiment, tooltip.node.sentiment_score) }}
                />
                <span className="text-[9px] text-muted-foreground capitalize">
                  {tooltip.node.sentiment?.replace('_', ' ') || 'neutral'}
                </span>
                <span className="text-[9px] font-mono text-muted-foreground">
                  {tooltip.node.sentiment_score >= 0 ? '+' : ''}{tooltip.node.sentiment_score.toFixed(2)}
                </span>
              </div>
            )}
            {tooltip.node.impact && (() => {
              const val = tooltip.node.impact['1d'] ?? tooltip.node.impact['4h'] ?? tooltip.node.impact['1h'];
              if (val == null) return null;
              return (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[9px] text-muted-foreground">Impact:</span>
                  <span className={cn('text-[9px] font-mono font-semibold', val >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {val >= 0 ? '+' : ''}{val.toFixed(1)}%
                  </span>
                </div>
              );
            })()}
            {tooltip.node.type === 'theme' && tooltip.node.article_count != null && (
              <div className="text-[9px] text-muted-foreground mt-1">
                {tooltip.node.article_count} article{tooltip.node.article_count !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ImpactBadge({
  impact,
  x,
  y,
}: {
  impact: { '1h': number | null; '4h': number | null; '1d': number | null };
  x: number;
  y: number;
}) {
  const val = impact['1d'] ?? impact['4h'] ?? impact['1h'];
  if (val == null) return null;

  const color = val >= 0 ? '#10B981' : '#EF4444';
  const text = `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;

  return (
    <text
      x={x + 50}
      y={y}
      fill={color}
      fontSize={9}
      fontWeight={600}
      fontFamily="monospace"
      className="pointer-events-none select-none"
    >
      {text}
    </text>
  );
}
