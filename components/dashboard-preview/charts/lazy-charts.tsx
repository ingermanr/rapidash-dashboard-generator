"use client"

import dynamic from "next/dynamic"

/**
 * Recharts-based charts, loaded on demand. Only the detail view draws them, so the landing and the builder
 * do not download the charting library. While a chart loads, its card keeps its size and shows nothing.
 */
const blank = () => <div className="h-full w-full" aria-hidden="true" />

export const AreaChart = dynamic(() => import("./area-chart").then((m) => m.AreaChart), { loading: blank })
export const BarChart = dynamic(() => import("./bar-chart").then((m) => m.BarChart), { loading: blank })
export const DonutChart = dynamic(() => import("./donut-chart").then((m) => m.DonutChart), { loading: blank })
export const HorizontalBarChart = dynamic(() => import("./horizontal-bar-chart").then((m) => m.HorizontalBarChart), {
  loading: blank,
})
export const LineChart = dynamic(() => import("./line-chart").then((m) => m.LineChart), { loading: blank })
export const PieChart = dynamic(() => import("./pie-chart").then((m) => m.PieChart), { loading: blank })
export const RadialChart = dynamic(() => import("./radial-chart").then((m) => m.RadialChart), { loading: blank })
