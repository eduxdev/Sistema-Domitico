'use client'

import { ChartAreaInteractive } from '@/components/dashboard/Chart/ChartArea'
import { ChartRadarDots } from '@/components/dashboard/Chart/ChartRadar'
import { ChartRadialStacked } from '@/components/dashboard/Chart/CharRadial'

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard Multi-Sensor</h2>
        <p className="text-gray-500">Monitoreo en tiempo real de todos los sensores</p>
      </div>

      {/* Gráfica MQ2 - Gas (ancho completo) */}
      <ChartAreaInteractive />

      {/* Gráficas MQ4 y DHT11 en dos columnas */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfica MQ4 - CO */}
        <ChartRadarDots />

        {/* Gráfica DHT11 - Temperatura y Humedad */}
        <ChartRadialStacked />
      </div>
    </div>
  )
}