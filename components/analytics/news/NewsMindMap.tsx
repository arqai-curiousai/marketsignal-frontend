'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { hierarchy, tree as d3Tree } from 'd3-hierarchy';
import { Loader2, Search, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { INewsMindMapNode } from '@/types/analytics';
import {
  getSentimentColor,
  getSourceDisplayName,
  THEME_COLORS,
  NODE_TYPE_COLORS,
  formatTimeAgo,
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

export function NewsMindMap({
  tree,
  loading,
  ticker,
  onSelectTicker,
  onSelectArticle,
  tickerOptions,
}: NewsMindMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [mapZoom, setMapZoom] = useState(1);

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

  // D3 tree layout
  const layout = useMemo(() => {
    if (!prunedTree) return null;

    const root = hierarchy(prunedTree);
    const treeLayout = d3Tree<TreeNode>()
      .size([dimensions.height - 80, dimensions.width - 240])
      .separation((a, b) => (a.parent === b.parent ? 1.2 : 1.8));

    treeLayout(root);
    return root;
  }, [prunedTree, dimensions]);

  const toggleNode = (nodeId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

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
      className="relative w-full h-[500px] rounded-xl border border-white/10 bg-[#0d1117] overflow-auto"
    >
      {/* Zoom controls */}
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
          onClick={() => setMapZoom(1)}
          className="p-1.5 rounded-md bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
          title="Reset zoom"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <svg
        width={Math.max(dimensions.width, Math.max(...layout.descendants().map((d) => (d.y ?? 0))) + 400) * mapZoom}
        height={Math.max(dimensions.height, (layout.leaves().length * 28) + 80) * mapZoom}
        className="min-w-full"
        onWheel={(e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setMapZoom((z) => Math.max(0.4, Math.min(2.5, z + delta)));
          }
        }}
      >
        <g transform={`scale(${mapZoom}) translate(120, 40)`}>
          {/* Links */}
          {layout.links().map((link, i) => {
            const sx = link.source.y ?? 0;
            const sy = link.source.x ?? 0;
            const tx = link.target.y ?? 0;
            const ty = link.target.x ?? 0;
            const data = link.target.data;
            const sentColor = getSentimentColor(data.sentiment, data.sentiment_score);

            return (
              <path
                key={i}
                d={`M${sx},${sy} C${(sx + tx) / 2},${sy} ${(sx + tx) / 2},${ty} ${tx},${ty}`}
                fill="none"
                stroke={sentColor}
                strokeWidth={data.type === 'theme' ? 2 : data.type === 'article' ? 1.5 : 1}
                strokeOpacity={hoveredNode && hoveredNode !== data.id ? 0.2 : 0.5}
              />
            );
          })}

          {/* Nodes */}
          {layout.descendants().map((d) => {
            const node = d.data;
            const x = d.y ?? 0;
            const y = d.x ?? 0;
            const sentColor = getSentimentColor(node.sentiment, node.sentiment_score);
            const hasChildren = (d.data.children?.length ?? 0) > 0 || collapsedNodes.has(node.id);
            const isCollapsed = collapsedNodes.has(node.id);
            const isHovered = hoveredNode === node.id;

            return (
              <g
                key={node.id}
                transform={`translate(${x}, ${y})`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => {
                  if (node.type === 'theme' || (node.type === 'article' && hasChildren)) {
                    toggleNode(node.id);
                  }
                  if (node.type === 'article' && node.id.startsWith('article:')) {
                    onSelectArticle(node.id.replace('article:', ''));
                  }
                }}
              >
                {/* Node circle */}
                {node.type === 'ticker' ? (
                  <circle
                    r={20}
                    fill={NODE_TYPE_COLORS.ticker}
                    fillOpacity={0.8}
                    stroke={isHovered ? '#fff' : NODE_TYPE_COLORS.ticker}
                    strokeWidth={isHovered ? 2.5 : 2}
                  />
                ) : node.type === 'theme' ? (
                  <circle
                    r={14}
                    fill={THEME_COLORS[node.id.replace('theme:', '')] || sentColor}
                    fillOpacity={0.3}
                    stroke={THEME_COLORS[node.id.replace('theme:', '')] || sentColor}
                    strokeWidth={isHovered ? 2 : 1.5}
                  />
                ) : node.type === 'article' ? (
                  <circle
                    r={8}
                    fill={sentColor}
                    fillOpacity={0.6}
                    stroke={isHovered ? '#fff' : sentColor}
                    strokeWidth={isHovered ? 2 : 1}
                  />
                ) : (
                  <circle
                    r={4}
                    fill="#475569"
                    fillOpacity={0.6}
                  />
                )}

                {/* Expand/collapse indicator */}
                {node.type === 'theme' && (
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#fff"
                    fontSize={10}
                    fontWeight={600}
                    className="pointer-events-none select-none"
                  >
                    {isCollapsed ? '+' : node.article_count || ''}
                  </text>
                )}

                {/* Ticker label inside circle */}
                {node.type === 'ticker' && (
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
                )}

                {/* Label text to the right */}
                {node.type !== 'ticker' && (
                  <text
                    x={node.type === 'theme' ? 20 : node.type === 'article' ? 14 : 8}
                    y={0}
                    dominantBaseline="central"
                    fill={isHovered ? '#fff' : '#94A3B8'}
                    fontSize={node.type === 'theme' ? 11 : node.type === 'article' ? 10 : 9}
                    fontWeight={node.type === 'theme' ? 600 : 400}
                    className="pointer-events-none select-none"
                  >
                    {node.label.length > 50 ? node.label.slice(0, 48) + '...' : node.label}
                    {node.label.length > 50 && <title>{node.label}</title>}
                  </text>
                )}

                {/* Tooltip for full details */}
                <title>
                  {node.label}
                  {node.source ? `\n${getSourceDisplayName(node.source)}` : ''}
                  {node.published_at ? ` ${formatTimeAgo(node.published_at)}` : ''}
                </title>

                {/* Impact badge for articles */}
                {node.type === 'article' && node.impact && (
                  <ImpactBadge impact={node.impact} x={14} y={-14} />
                )}

                {/* Source badge for articles */}
                {node.type === 'article' && node.source && (
                  <text
                    x={14}
                    y={14}
                    fill="#64748B"
                    fontSize={8}
                    className="pointer-events-none select-none"
                  >
                    {getSourceDisplayName(node.source ?? '')} {formatTimeAgo(node.published_at)}
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

function ImpactBadge({
  impact,
  x,
  y,
}: {
  impact: { '1h': number | null; '4h': number | null; '1d': number | null };
  x: number;
  y: number;
}) {
  // Show the most significant non-null impact
  const val = impact['1d'] ?? impact['4h'] ?? impact['1h'];
  if (val == null) return null;

  const color = val >= 0 ? '#10B981' : '#EF4444';
  const text = `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;

  return (
    <text
      x={x + 60}
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
