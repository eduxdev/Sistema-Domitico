"use client"

import * as React from "react"
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"

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
  temperatura: number
  humedad: number
}

const chartConfig = {
  temperatura: {
    label: "Temperatura",
    color: "hsl(290, 50%, 70%)", // Morado claro
  },
  humedad: {
    label: "Humedad",
    color: "hsl(260, 65%, 45%)", // Morado oscuro
  },
} satisfies ChartConfig

export function ChartRadialStacked() {
  const [chartData, setChartData] = React.useState<ChartDataPoint[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchChartData = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/sensor/chart-data-dht?limit=1`)
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
  const totalValue = latestData ? latestData.temperatura + latestData.humedad : 0

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Sensor DHT11 - Temperatura y Humedad</CardTitle>
        <CardDescription>
          Lectura actual (actualización cada 5 segundos)
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center pb-0">
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
            className="mx-auto aspect-square w-full max-w-[250px]"
          >
            <RadialBarChart
              data={[latestData]}
              endAngle={180}
              innerRadius={80}
              outerRadius={130}
            >
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 16}
                            className="fill-foreground text-2xl font-bold"
                          >
                            {totalValue.toFixed(1)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 4}
                            className="fill-muted-foreground"
                          >
                            Total
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </PolarRadiusAxis>
              <RadialBar
                dataKey="temperatura"
                stackId="a"
                cornerRadius={5}
                fill="var(--color-temperatura)"
                className="stroke-transparent stroke-2"
              />
              <RadialBar
                dataKey="humedad"
                fill="var(--color-humedad)"
                stackId="a"
                cornerRadius={5}
                className="stroke-transparent stroke-2"
              />
            </RadialBarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
