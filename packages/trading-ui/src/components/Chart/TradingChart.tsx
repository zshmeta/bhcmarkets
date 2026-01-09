/**
 * TradingChart Component (Premium)
 *
 * Professional candlestick chart with lightweight-charts.
 * Features:
 * - Timeframe selector with modern styling
 * - Volume histogram
 * - Crosshair with price label
 * - Chart type toggle (candles/line)
 * - Fullscreen support
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import styled, { css } from 'styled-components';
import { createChart, type IChartApi, type ISeriesApi, ColorType, CrosshairMode, HistogramSeries, CandlestickSeries, LineSeries } from 'lightweight-charts';
import type { OHLC, Timeframe } from '../../types';
import { COLORS, TYPOGRAPHY, SPACING, EFFECTS, SIZING } from '../../theme';
import { formatPrice } from '../../utils';

// =============================================================================
// STYLED COMPONENTS
// =============================================================================

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${COLORS.bg.tertiary};
  border-radius: ${EFFECTS.borderRadius.md};
  overflow: hidden;
  font-family: ${TYPOGRAPHY.fontFamily.sans};
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${SPACING[2]} ${SPACING[3]};
  background: ${COLORS.bg.secondary};
  border-bottom: 1px solid ${COLORS.border.subtle};
  min-height: ${SIZING.panelHeaderCompact};
`;

const ToolbarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING[3]};
`;

const ToolbarRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${SPACING[2]};
`;

const SymbolLabel = styled.div`
  display: flex;
  flex-direction: column;
`;

const SymbolName = styled.span`
  font-weight: ${TYPOGRAPHY.fontWeight.bold};
  font-size: ${TYPOGRAPHY.fontSize.lg};
  color: ${COLORS.text.primary};
`;

const SymbolPrice = styled.span<{ $direction?: 'up' | 'down' | 'unchanged' }>`
  font-size: ${TYPOGRAPHY.fontSize.sm};
  font-family: ${TYPOGRAPHY.fontFamily.mono};
  color: ${({ $direction }) =>
        $direction === 'up' ? COLORS.semantic.positive.main :
            $direction === 'down' ? COLORS.semantic.negative.main :
                COLORS.text.secondary
    };
`;

const TimeframeGroup = styled.div`
  display: flex;
  background: ${COLORS.bg.primary};
  border-radius: ${EFFECTS.borderRadius.base};
  padding: 2px;
`;

const TimeframeButton = styled.button<{ $active?: boolean }>`
  padding: ${SPACING[1]} ${SPACING[2]};
  border: none;
  border-radius: ${EFFECTS.borderRadius.sm};
  font-size: ${TYPOGRAPHY.fontSize.xs};
  font-weight: ${TYPOGRAPHY.fontWeight.medium};
  cursor: pointer;
  transition: ${EFFECTS.transition.fast};
  background: ${({ $active }) => $active ? COLORS.semantic.info.main : 'transparent'};
  color: ${({ $active }) => $active ? '#fff' : COLORS.text.tertiary};

  &:hover {
    background: ${({ $active }) => $active ? COLORS.semantic.info.main : COLORS.bg.hover};
    color: ${({ $active }) => $active ? '#fff' : COLORS.text.secondary};
  }
`;

const ChartTypeGroup = styled.div`
  display: flex;
  background: ${COLORS.bg.primary};
  border-radius: ${EFFECTS.borderRadius.base};
  padding: 2px;
`;

const ChartTypeButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 24px;
  border: none;
  border-radius: ${EFFECTS.borderRadius.sm};
  cursor: pointer;
  transition: ${EFFECTS.transition.fast};
  background: ${({ $active }) => $active ? COLORS.bg.elevated : 'transparent'};
  color: ${({ $active }) => $active ? COLORS.text.primary : COLORS.text.tertiary};

  &:hover {
    background: ${({ $active }) => $active ? COLORS.bg.elevated : COLORS.bg.hover};
    color: ${COLORS.text.primary};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: ${EFFECTS.borderRadius.sm};
  background: transparent;
  color: ${COLORS.text.tertiary};
  cursor: pointer;
  transition: ${EFFECTS.transition.fast};

  &:hover {
    background: ${COLORS.bg.hover};
    color: ${COLORS.text.primary};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ChartWrapper = styled.div<{ $fullscreen?: boolean }>`
  flex: 1;
  position: relative;
  min-height: 250px;

  ${({ $fullscreen }) => $fullscreen && css`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    background: ${COLORS.bg.tertiary};
  `}
`;

const ChartContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

const OHLCInfo = styled.div`
  position: absolute;
  top: ${SPACING[2]};
  left: ${SPACING[3]};
  display: flex;
  gap: ${SPACING[3]};
  z-index: 10;
  font-size: ${TYPOGRAPHY.fontSize.xs};
  font-family: ${TYPOGRAPHY.fontFamily.mono};
  color: ${COLORS.text.secondary};
  pointer-events: none;
`;

const OHLCItem = styled.span<{ $type: 'open' | 'high' | 'low' | 'close' }>`
  display: flex;
  gap: 4px;

  &::before {
    content: '${({ $type }) => $type.charAt(0).toUpperCase()}';
    color: ${COLORS.text.tertiary};
  }

  color: ${({ $type }) => {
        switch ($type) {
            case 'high': return COLORS.semantic.positive.main;
            case 'low': return COLORS.semantic.negative.main;
            default: return COLORS.text.primary;
        }
    }};
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${COLORS.bg.tertiary};
  z-index: 20;
`;

const LoadingSpinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid ${COLORS.border.default};
  border-top-color: ${COLORS.semantic.info.main};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// =============================================================================
// ICONS
// =============================================================================

const CandlestickIcon = () => (
    <svg viewBox="0 0 16 16" fill="currentColor">
        <rect x="2" y="4" width="2" height="8" rx="0.5" />
        <rect x="1" y="6" width="4" height="4" rx="0.5" />
        <rect x="7" y="2" width="2" height="12" rx="0.5" />
        <rect x="6" y="5" width="4" height="6" rx="0.5" />
        <rect x="12" y="3" width="2" height="10" rx="0.5" />
        <rect x="11" y="6" width="4" height="4" rx="0.5" />
    </svg>
);

const LineIcon = () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M1 12L5 6L9 9L15 3" />
    </svg>
);

const FullscreenIcon = () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 5V2h3M11 2h3v3M14 11v3h-3M5 14H2v-3" />
    </svg>
);

const SettingsIcon = () => (
    <svg viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 4.754a3.246 3.246 0 100 6.492 3.246 3.246 0 000-6.492zM5.754 8a2.246 2.246 0 114.492 0 2.246 2.246 0 01-4.492 0z" />
    </svg>
);

// =============================================================================
// COMPONENT
// =============================================================================

type ChartType = 'candlestick' | 'line';

const TIMEFRAME_OPTIONS: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

interface TradingChartProps {
    symbol: string;
    data: OHLC[];
    timeframe?: Timeframe;
    onTimeframeChange?: (tf: Timeframe) => void;
    showToolbar?: boolean;
    isLoading?: boolean;
}

export function TradingChart({
    symbol,
    data,
    timeframe = '1h',
    onTimeframeChange,
    showToolbar = true,
    isLoading = false,
}: TradingChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

    const [chartType, setChartType] = useState<ChartType>('candlestick');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [hoveredData, setHoveredData] = useState<OHLC | null>(null);

    const lastCandle = data.length > 0 ? data[data.length - 1] : null;
    const priceDirection = lastCandle && data.length > 1
        ? lastCandle.close > data[data.length - 2].close ? 'up' : 'down'
        : 'unchanged';

    // Initialize chart
    useEffect(() => {
        if (!containerRef.current) return;

        const chart = createChart(containerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: COLORS.text.tertiary,
                fontFamily: TYPOGRAPHY.fontFamily.sans,
                fontSize: 11,
            },
            grid: {
                vertLines: { color: COLORS.chart.grid },
                horzLines: { color: COLORS.chart.grid },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: {
                    color: COLORS.chart.crosshair,
                    width: 1,
                    style: 2,
                    labelBackgroundColor: COLORS.bg.elevated,
                },
                horzLine: {
                    color: COLORS.chart.crosshair,
                    width: 1,
                    style: 2,
                    labelBackgroundColor: COLORS.bg.elevated,
                },
            },
            rightPriceScale: {
                borderColor: COLORS.border.subtle,
                scaleMargins: { top: 0.1, bottom: 0.2 },
            },
            timeScale: {
                borderColor: COLORS.border.subtle,
                timeVisible: true,
                secondsVisible: false,
            },
            handleScroll: { mouseWheel: true, pressedMouseMove: true },
            handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
        });

        chartRef.current = chart;

        // Subscribe to crosshair move
        chart.subscribeCrosshairMove(param => {
            if (!param.time || !param.seriesData) return;
            const candleData = param.seriesData.get(seriesRef.current!) as OHLC | undefined;
            if (candleData) {
                setHoveredData(candleData);
            }
        });

        // Handle resize
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                chart.resize(width, height);
            }
        });
        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
            chart.remove();
            chartRef.current = null;
            seriesRef.current = null;
            volumeSeriesRef.current = null;
        };
    }, []);

    // Update series when chart type changes
    useEffect(() => {
        if (!chartRef.current) return;

        // Remove existing series
        if (seriesRef.current) {
            chartRef.current.removeSeries(seriesRef.current);
        }
        if (volumeSeriesRef.current) {
            chartRef.current.removeSeries(volumeSeriesRef.current);
        }

        // Add volume histogram
        volumeSeriesRef.current = chartRef.current.addSeries(HistogramSeries, {
            color: COLORS.chart.volume,
            priceFormat: { type: 'volume' },
            priceScaleId: '',
        });
        volumeSeriesRef.current.priceScale().applyOptions({
            scaleMargins: { top: 0.85, bottom: 0 },
        });

        // Add main series
        if (chartType === 'candlestick') {
            seriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
                upColor: COLORS.chart.upBody,
                downColor: COLORS.chart.downBody,
                borderUpColor: COLORS.chart.upBorder,
                borderDownColor: COLORS.chart.downBorder,
                wickUpColor: COLORS.chart.upWick,
                wickDownColor: COLORS.chart.downWick,
            });
        } else {
            seriesRef.current = chartRef.current.addSeries(LineSeries, {
                color: COLORS.semantic.info.main,
                lineWidth: 2,
                crosshairMarkerVisible: true,
                crosshairMarkerRadius: 4,
                crosshairMarkerBorderColor: COLORS.semantic.info.main,
                crosshairMarkerBackgroundColor: COLORS.bg.tertiary,
            });
        }

        // Set data
        if (data.length > 0) {
            if (chartType === 'candlestick') {
                (seriesRef.current as ISeriesApi<'Candlestick'>).setData(data);
            } else {
                (seriesRef.current as ISeriesApi<'Line'>).setData(
                    data.map(d => ({ time: d.time, value: d.close }))
                );
            }

            volumeSeriesRef.current?.setData(
                data.map(d => ({
                    time: d.time,
                    value: d.volume || 0,
                    color: d.close >= d.open
                        ? 'rgba(32, 178, 108, 0.4)'
                        : 'rgba(239, 68, 68, 0.4)',
                }))
            );
        }
    }, [chartType]);

    // Update data
    useEffect(() => {
        if (!seriesRef.current || data.length === 0) return;

        if (chartType === 'candlestick') {
            (seriesRef.current as ISeriesApi<'Candlestick'>).setData(data);
        } else {
            (seriesRef.current as ISeriesApi<'Line'>).setData(
                data.map(d => ({ time: d.time, value: d.close }))
            );
        }

        volumeSeriesRef.current?.setData(
            data.map(d => ({
                time: d.time,
                value: d.volume || 0,
                color: d.close >= d.open
                    ? 'rgba(32, 178, 108, 0.4)'
                    : 'rgba(239, 68, 68, 0.4)',
            }))
        );

        chartRef.current?.timeScale().fitContent();
    }, [data, chartType]);

    const handleTimeframeClick = useCallback((tf: Timeframe) => {
        onTimeframeChange?.(tf);
    }, [onTimeframeChange]);

    const displayData = hoveredData || lastCandle;

    return (
        <Container>
            {showToolbar && (
                <Toolbar>
                    <ToolbarLeft>
                        <SymbolLabel>
                            <SymbolName>{symbol}</SymbolName>
                            {lastCandle && (
                                <SymbolPrice $direction={priceDirection}>
                                    {formatPrice(lastCandle.close, 5)}
                                </SymbolPrice>
                            )}
                        </SymbolLabel>

                        <TimeframeGroup>
                            {TIMEFRAME_OPTIONS.map(tf => (
                                <TimeframeButton
                                    key={tf}
                                    $active={tf === timeframe}
                                    onClick={() => handleTimeframeClick(tf)}
                                >
                                    {tf}
                                </TimeframeButton>
                            ))}
                        </TimeframeGroup>
                    </ToolbarLeft>

                    <ToolbarRight>
                        <ChartTypeGroup>
                            <ChartTypeButton
                                $active={chartType === 'candlestick'}
                                onClick={() => setChartType('candlestick')}
                                title="Candlestick"
                            >
                                <CandlestickIcon />
                            </ChartTypeButton>
                            <ChartTypeButton
                                $active={chartType === 'line'}
                                onClick={() => setChartType('line')}
                                title="Line"
                            >
                                <LineIcon />
                            </ChartTypeButton>
                        </ChartTypeGroup>

                        <IconButton onClick={() => setIsFullscreen(!isFullscreen)} title="Fullscreen">
                            <FullscreenIcon />
                        </IconButton>
                    </ToolbarRight>
                </Toolbar>
            )}

            <ChartWrapper $fullscreen={isFullscreen}>
                {displayData && (
                    <OHLCInfo>
                        <OHLCItem $type="open">{formatPrice(displayData.open, 5)}</OHLCItem>
                        <OHLCItem $type="high">{formatPrice(displayData.high, 5)}</OHLCItem>
                        <OHLCItem $type="low">{formatPrice(displayData.low, 5)}</OHLCItem>
                        <OHLCItem $type="close">{formatPrice(displayData.close, 5)}</OHLCItem>
                    </OHLCInfo>
                )}

                <ChartContainer ref={containerRef} />

                {isLoading && (
                    <LoadingOverlay>
                        <LoadingSpinner />
                    </LoadingOverlay>
                )}
            </ChartWrapper>
        </Container>
    );
}

export default TradingChart;
