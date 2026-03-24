'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { select } from 'd3-selection';
import 'd3-transition';
import { scaleLinear, scaleSqrt } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { max as d3Max } from 'd3-array';
import { SECTOR_COLORS, perfColor, perfTextClass, flowColor, formatMarketCap } from './constants';
import type { ISectorAnalytics, SectorTimeframe } from '@/types/analytics';

interface SectorFlowViewProps {
  sectors: ISectorAnalytics[];
  timeframe: SectorTimeframe;
  selectedSector?: string | null;
  onSectorClick: (sector: ISectorAnalytics) => void;
}

const MARGIN = { top: 30, right: 30, bottom: 45, left: 55 };

export function SectorFlowView({ sectors, timeframe, selectedSector, onSectorClick }: SectorFlowViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const render = useCallback(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    const tooltip = tooltipRef.current;
    if (!container || !svg || !tooltip) return;

    const { width: containerWidth } = container.getBoundingClientRect();
    const width = containerWidth;
    const height = Math.max(400, Math.min(550, width * 0.6));

    const innerW = width - MARGIN.left - MARGIN.right;
    const innerH = height - MARGIN.top - MARGIN.bottom;

    const d3svg = select(svg);
    d3svg.attr('width', width).attr('height', height);

    // Only recreate static elements (quadrants, axes) if dimensions changed
    const prevWidth = d3svg.attr('data-w');
    const dimensionsChanged = prevWidth !== String(width);
    let g = d3svg.select<SVGGElement>('.flow-root');
    if (g.empty() || dimensionsChanged) {
      d3svg.selectAll('*').remove();
      d3svg.attr('data-w', width);
      g = d3svg.append('g').attr('class', 'flow-root').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);
    } else {
      // Remove only data-driven elements (bubbles), keep axes/quadrants
      g.selectAll('.sector-bubble').remove();
    }

    // Scales
    const xScale = scaleLinear().domain([0, 100]).range([0, innerW]);
    const yScale = scaleLinear().domain([-100, 100]).range([innerH, 0]);

    const mcaps = sectors.map((s) => s.total_market_cap ?? 1);
    const rScale = scaleSqrt().domain([0, d3Max(mcaps) ?? 1]).range([8, 40]);

    // Quadrant backgrounds (only draw once, skip if already present)
    const hasStatics = !g.select('.quadrant-bg').empty();
    if (!hasStatics) {

    const quadrants = [
      { x: 0, y: 0, w: innerW / 2, h: innerH / 2, label: 'Weak + Accumulating', color: 'rgba(59,130,246,0.04)' },
      { x: innerW / 2, y: 0, w: innerW / 2, h: innerH / 2, label: 'Strong + Accumulating', color: 'rgba(16,185,129,0.06)' },
      { x: 0, y: innerH / 2, w: innerW / 2, h: innerH / 2, label: 'Weak + Distributing', color: 'rgba(239,68,68,0.06)' },
      { x: innerW / 2, y: innerH / 2, w: innerW / 2, h: innerH / 2, label: 'Strong + Distributing', color: 'rgba(239,68,68,0.04)' },
    ];

    quadrants.forEach((q) => {
      g.append('rect')
        .attr('class', 'quadrant-bg')
        .attr('x', q.x)
        .attr('y', q.y)
        .attr('width', q.w)
        .attr('height', q.h)
        .attr('fill', q.color);

      g.append('text')
        .attr('x', q.x + q.w / 2)
        .attr('y', q.y + 16)
        .attr('text-anchor', 'middle')
        .attr('fill', 'rgba(255,255,255,0.15)')
        .attr('font-size', '10px')
        .attr('font-weight', '500')
        .text(q.label);
    });

    // Gridlines
    g.append('line')
      .attr('x1', xScale(50)).attr('x2', xScale(50))
      .attr('y1', 0).attr('y2', innerH)
      .attr('stroke', 'rgba(255,255,255,0.1)')
      .attr('stroke-dasharray', '4 4');

    g.append('line')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', yScale(0)).attr('y2', yScale(0))
      .attr('stroke', 'rgba(255,255,255,0.1)')
      .attr('stroke-dasharray', '4 4');

    // Axes
    const xAxis = axisBottom(xScale).ticks(5).tickSize(-innerH);
    const yAxis = axisLeft(yScale).ticks(5).tickSize(-innerW);

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(xAxis)
      .call((sel) => {
        sel.selectAll('.tick line').attr('stroke', 'rgba(255,255,255,0.04)');
        sel.selectAll('.tick text').attr('fill', 'rgba(255,255,255,0.4)').attr('font-size', '10px');
        sel.select('.domain').remove();
      });

    g.append('g')
      .call(yAxis)
      .call((sel) => {
        sel.selectAll('.tick line').attr('stroke', 'rgba(255,255,255,0.04)');
        sel.selectAll('.tick text').attr('fill', 'rgba(255,255,255,0.4)').attr('font-size', '10px');
        sel.select('.domain').remove();
      });

    // Axis labels
    g.append('text')
      .attr('x', innerW / 2)
      .attr('y', innerH + 38)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255,255,255,0.5)')
      .attr('font-size', '11px')
      .text('Momentum Score');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerH / 2)
      .attr('y', -42)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255,255,255,0.5)')
      .attr('font-size', '11px')
      .text('Volume Flow Score');

    } // end hasStatics check

    // Bubbles
    const bubbles = g.selectAll<SVGGElement, ISectorAnalytics>('.sector-bubble')
      .data(sectors)
      .enter()
      .append('g')
      .attr('class', 'sector-bubble')
      .attr('transform', (d: ISectorAnalytics) => {
        const x = xScale(Math.max(0, Math.min(100, d.momentum_score)));
        const y = yScale(Math.max(-100, Math.min(100, d.volume_flow_score ?? 0)));
        return `translate(${x},${y})`;
      })
      .style('cursor', 'pointer');

    bubbles.append('circle')
      .attr('r', (d: ISectorAnalytics) => rScale(d.total_market_cap ?? 1))
      .attr('fill', (d: ISectorAnalytics) => {
        const perf = d.performance[timeframe] ?? 0;
        return perfColor(perf, 0.7);
      })
      .attr('stroke', (d: ISectorAnalytics) => SECTOR_COLORS[d.sector] ?? '#64748B')
      .attr('stroke-width', (d: ISectorAnalytics) => d.sector === selectedSector ? 3.5 : 2)
      .attr('opacity', (d: ISectorAnalytics) => d.sector === selectedSector ? 1 : 0.85);

    // Selected pulsing ring
    bubbles.filter((d: ISectorAnalytics) => d.sector === selectedSector)
      .append('circle')
      .attr('r', (d: ISectorAnalytics) => rScale(d.total_market_cap ?? 1) + 5)
      .attr('fill', 'none')
      .attr('stroke', (d: ISectorAnalytics) => SECTOR_COLORS[d.sector] ?? '#64748B')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.4)
      .attr('stroke-dasharray', '4 3');

    // Sector labels on bubbles
    bubbles.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', 'white')
      .attr('font-size', (d: ISectorAnalytics) => {
        const r = rScale(d.total_market_cap ?? 1);
        return r > 20 ? '10px' : '8px';
      })
      .attr('font-weight', '600')
      .attr('pointer-events', 'none')
      .text((d: ISectorAnalytics) => {
        const r = rScale(d.total_market_cap ?? 1);
        if (r < 15) return d.sector.slice(0, 3);
        if (r < 22) return d.sector.slice(0, 6);
        return d.sector.length > 10 ? d.sector.slice(0, 9) + '\u2026' : d.sector;
      });

    // Interactions
    bubbles
      .on('mouseenter', function (event: MouseEvent, d: ISectorAnalytics) {
        select(this).select('circle')
          .transition().duration(150)
          .attr('opacity', 1)
          .attr('stroke-width', 3);

        const perf = d.performance[timeframe] ?? 0;
        const flow = d.volume_flow_score ?? 0;
        tooltip.innerHTML = `
          <div class="font-semibold text-white text-xs mb-1">${d.sector}</div>
          <div class="text-[10px] space-y-0.5">
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">Momentum</span>
              <span class="text-white font-medium">${d.momentum_score.toFixed(0)}/100</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">Flow</span>
              <span class="font-medium" style="color:${flowColor(flow)}">${flow > 0 ? '+' : ''}${flow.toFixed(0)}</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">Perf (${timeframe})</span>
              <span class="font-medium ${perfTextClass(perf)}">${perf >= 0 ? '+' : ''}${perf.toFixed(2)}%</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-muted-foreground">Mkt Cap</span>
              <span class="text-white">${formatMarketCap(d.total_market_cap)}</span>
            </div>
          </div>
        `;
        tooltip.style.opacity = '1';
        tooltip.style.pointerEvents = 'auto';

        const rect = container.getBoundingClientRect();
        const xPos = event.clientX - rect.left;
        const yPos = event.clientY - rect.top;
        tooltip.style.left = `${xPos + 12}px`;
        tooltip.style.top = `${yPos - 12}px`;
      })
      .on('mousemove', function (event: MouseEvent) {
        const rect = container.getBoundingClientRect();
        const xPos = event.clientX - rect.left;
        const yPos = event.clientY - rect.top;
        const ttWidth = tooltip.offsetWidth;
        const adjustedX = xPos + ttWidth + 20 > width ? xPos - ttWidth - 12 : xPos + 12;
        tooltip.style.left = `${adjustedX}px`;
        tooltip.style.top = `${yPos - 12}px`;
      })
      .on('mouseleave', function () {
        select(this).select('circle')
          .transition().duration(150)
          .attr('opacity', 0.85)
          .attr('stroke-width', 2);
        tooltip.style.opacity = '0';
        tooltip.style.pointerEvents = 'none';
      })
      .on('click', function (_event: MouseEvent, d: ISectorAnalytics) {
        onSectorClick(d);
      });
  }, [sectors, timeframe, selectedSector, onSectorClick]);

  useEffect(() => {
    render();

    const observer = new ResizeObserver(() => render());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [render]);

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden"
    >
      <svg ref={svgRef} className="w-full" role="img" aria-label="Sector flow scatter plot: Momentum Score vs Volume Flow Score. Bubble size represents market capitalisation." />
      <div
        ref={tooltipRef}
        className="absolute z-50 rounded-lg border border-white/10 bg-brand-slate/95 backdrop-blur-sm px-3 py-2 shadow-xl transition-opacity duration-150 pointer-events-none"
        style={{ opacity: 0 }}
      />
    </div>
  );
}
