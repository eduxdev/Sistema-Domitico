"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

interface ChartDataPoint {
  time: string
  valor: number
}

const chartConfig = {
  valor: {
    label: "Gas (PPM)",
    color: "hsl(270, 70%, 50%)", // Morado vibrante
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const [chartData, setChartData] = React.useState<ChartDataPoint[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchChartData = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/sensor/chart-data?limit=20`)
      const data = await response.json()
      
      if (data.success) {
        setChartData(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching chart data:', error)
      setChartData([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchChartData()
    const interval = setInterval(fetchChartData, 5000)
    return () => clearInterval(interval)
  }, [fetchChartData])

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Sensor MQ2 - Gas Combustible</CardTitle>
          <CardDescription>
            Últimas 20 lecturas (actualización cada 5 segundos)
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-[250px] w-full" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            No hay datos disponibles
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillValor" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-valor)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-valor)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${value}`}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                      })
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="valor"
                type="monotone"
                fill="url(#fillValor)"
                stroke="var(--color-valor)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
