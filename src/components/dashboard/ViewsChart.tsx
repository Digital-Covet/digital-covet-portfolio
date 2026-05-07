"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useEffect, useMemo, useRef } from "react";
import type { ChartBucket } from "@/hooks/useDashboardDerivedData";
import type { ThemeColors } from "@/hooks/useThemeColors";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface ViewsChartProps {
  buckets: ChartBucket[];
  colors: ThemeColors;
}

export function ViewsChart({ buckets, colors }: ViewsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  const chartData = useMemo(
    () => ({
      labels: buckets.map((b) => b.label),
      datasets: [
        {
          label: "Views",
          data: buckets.map((b) => b.views),
          borderColor: colors.primary,
          backgroundColor: "transparent",
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.4,
          fill: false,
        },
      ],
    }),
    [buckets, colors.primary],
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: "index" as const },
      plugins: {
        legend: {
          display: true,
          position: "top" as const,
          labels: {
            font: { size: 12, family: "system-ui, sans-serif" },
            color: "#ffffff",
            usePointStyle: true,
            pointStyle: "line" as const,
          },
        },
        tooltip: {
          backgroundColor: colors.popover,
          titleColor: "#ffffff",
          bodyColor: "#ffffff",
          borderColor: colors.border,
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          titleFont: { size: 12 },
          bodyFont: { size: 12 },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            font: { size: 11, family: "system-ui, sans-serif" },
            color: "#ffffff",
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 12,
          },
        },
        y: {
          grid: { color: colors.border, borderDash: [3, 3] },
          border: { display: false },
          beginAtZero: true,
          ticks: {
            font: { size: 11, family: "system-ui, sans-serif" },
            color: "#ffffff",
            precision: 0,
          },
        },
      },
    }),
    [colors],
  );

  const chartDataRef = useRef(chartData);
  const chartOptionsRef = useRef(chartOptions);

  useEffect(() => {
    chartDataRef.current = chartData;
    chartOptionsRef.current = chartOptions;
  }, [chartData, chartOptions]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    chartRef.current = new ChartJS(ctx, {
      type: "line",
      data: chartDataRef.current,
      options: chartOptionsRef.current,
    });
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.data = chartData;
    chart.options = chartOptions;
    chart.update("none");
  }, [chartData, chartOptions]);

  return (
    <div className="h-65 w-full">
      <canvas ref={canvasRef} />
    </div>
  );
}
