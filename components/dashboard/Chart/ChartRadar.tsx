"use client"

import * as React from "react"
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

interface ChartDataPoint {
  time: string
  valor: number
}

const chartConfig = {
  valor: {
    label: "CO",
    color: "hsl(280, 60%, 60%)", // Morado medio
  },
} satisfies ChartConfig

export function ChartRadarDots() {
  const [chartData, setChartData] = React.useState<ChartDataPoint[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchChartData = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/sensor/chart-data-mq4?limit=1`)
      const data = await response.json()
      
      if (data.success && data.data.length > 0) {
        setChartData(data.data)
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

  const latestData = chartData[0]
  const radialData = latestData ? [{ 
    sensor: "MQ4", 
    valor: latestData.valor, 
    fill: "var(--color-valor)" 
  }] : []

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Sensor MQ4 - Monóxido de Carbono</CardTitle>
        <CardDescription>
          Lectura actual (actualización cada 5 segundos)
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {loading ? (
          <div className="w-full space-y-3">
            <Skeleton className="h-[250px] w-full" />
          </div>
        ) : !latestData ? (
          <div className="flex items-center justify-center h-[250px] w-full text-muted-foreground">
            No hay datos disponibles
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[250px]"
          >
            <RadialBarChart
              data={radialData}
              endAngle={100}
              innerRadius={80}
              outerRadius={140}
            >
              <PolarGrid
                gridType="circle"
                radialLines={false}
                stroke="none"
                className="first:fill-muted last:fill-background"
                polarRadius={[86, 74]}
              />
              <RadialBar dataKey="valor" background />
              <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-4xl font-bold"
                          >
                            {latestData.valor.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground"
                          >
                            PPM
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </PolarRadiusAxis>
            </RadialBarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
