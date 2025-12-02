'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ExclamationTriangleIcon, CheckCircledIcon, ClockIcon } from '@radix-ui/react-icons'

interface SensorAlert {
  id: number
  sensor_tipo: string
  valor: number
  unidad: string
  estado: string
  sensor_nombre: string | null
  device_id: string | null
  created_at: string
  device_name?: string
}

interface Device {
  id: string
  device_id: string
  nombre: string
}

const SENSOR_ICONS = {
  MQ2: '🔥',
  MQ4: '☠️',
  DHT11_temp: '🌡️',
  DHT11_hum: '💧'
}

const SENSOR_NAMES = {
  MQ2: 'Gas',
  MQ4: 'Monóxido de Carbono',
  DHT11_temp: 'Temperatura',
  DHT11_hum: 'Humedad'
}

export default function MultiSensorAlerts() {
  const [alerts, setAlerts] = useState<SensorAlert[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
    // Auto-refresh cada 15 segundos
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      setError(null)

      // Obtener dispositivos del usuario
      const devicesResponse = await fetch('/api/devices/my-devices')
      if (!devicesResponse.ok) {
        throw new Error('Error al obtener dispositivos')
      }
      const devicesData = await devicesResponse.json()
      
      if (!devicesData.success) {
        throw new Error(devicesData.error || 'Error desconocido')
      }

      setDevices(devicesData.data)

      // Obtener alertas para cada dispositivo
      const allAlerts: SensorAlert[] = []
      
      for (const device of devicesData.data) {
        try {
          // Obtener lecturas de cada tipo de sensor
          const sensorTypes = ['MQ2', 'MQ4', 'DHT11_temp', 'DHT11_hum']
          
          for (const sensorType of sensorTypes) {
            const alertsResponse = await fetch(
              `/api/sensor/multi-data?device_id=${device.device_id}&sensor_tipo=${sensorType}&limit=10`
            )
            if (alertsResponse.ok) {
              const alertsData = await alertsResponse.json()
              if (alertsData.success && alertsData.data) {
                // Filtrar solo alertas de peligro (más críticas)
                const deviceAlerts = alertsData.data
                  .filter((alert: SensorAlert) => alert.estado === 'peligro')
                  .map((alert: SensorAlert) => ({
                    ...alert,
                    device_name: device.nombre
                  }))
                
                allAlerts.push(...deviceAlerts)
              }
            }
          }
        } catch (err) {
          console.error(`Error obteniendo alertas para ${device.device_id}:`, err)
        }
      }

      // Ordenar por fecha más reciente y eliminar duplicados
      const uniqueAlerts = allAlerts.reduce((acc: SensorAlert[], current) => {
        const exists = acc.find(
          alert => alert.device_id === current.device_id && 
                   alert.sensor_tipo === current.sensor_tipo &&
                   Math.abs(new Date(alert.created_at).getTime() - new Date(current.created_at).getTime()) < 5000
        )
        if (!exists) {
          acc.push(current)
        }
        return acc
      }, [])

      uniqueAlerts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      setAlerts(uniqueAlerts.slice(0, 20)) // Limitar a 20 alertas más recientes
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const getAlertColor = (estado: string) => {
    switch (estado) {
      case 'peligro':
        return 'bg-red-500 text-white'
      case 'precaucion':
        return 'bg-yellow-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getAlertIcon = (estado: string) => {
    switch (estado) {
      case 'peligro':
        return <ExclamationTriangleIcon className="h-4 w-4" />
      case 'precaucion':
        return <ClockIcon className="h-4 w-4" />
      default:
        return <CheckCircledIcon className="h-4 w-4" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const alertTime = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Ahora'
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Alertas Multi-Sensor</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Alertas Multi-Sensor</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span>{error}</span>
            </div>
            <Button 
              onClick={fetchData} 
              className="mt-4"
              variant="outline"
            >
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Alertas Multi-Sensor</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <CheckCircledIcon className="h-4 w-4" />
            <span>Actualización cada 15s</span>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircledIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ¡Todo está normal!
              </h3>
              <p className="text-gray-500">
                No hay alertas activas en tus sensores.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Alertas Multi-Sensor</h2>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span>{alerts.length} alertas activas</span>
          </div>
          <div className="flex items-center space-x-1">
            <ClockIcon className="h-4 w-4" />
            <span>Actualización cada 15s</span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {alerts.map((alert) => (
          <Card key={alert.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header con icono y estado */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {SENSOR_ICONS[alert.sensor_tipo as keyof typeof SENSOR_ICONS] || '📊'}
                    </span>
                    <span className="font-medium text-sm">
                      {SENSOR_NAMES[alert.sensor_tipo as keyof typeof SENSOR_NAMES] || alert.sensor_tipo}
                    </span>
                  </div>
                  <Badge className={`text-xs ${getAlertColor(alert.estado)}`}>
                    <div className="flex items-center space-x-1">
                      {getAlertIcon(alert.estado)}
                      <span>{alert.estado.toUpperCase()}</span>
                    </div>
                  </Badge>
                </div>

                {/* Valor y dispositivo */}
                <div className="space-y-1">
                  <div className="text-lg font-bold text-center">
                    {alert.valor} {alert.unidad}
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    {alert.device_name || alert.device_id}
                  </div>
                </div>

                {/* Tiempo */}
                <div className="flex items-center justify-center space-x-1 text-xs text-gray-400">
                  <ClockIcon className="h-3 w-3" />
                  <span>{formatTimeAgo(alert.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resumen por estado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumen de Alertas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {alerts.filter(a => a.estado === 'peligro').length}
              </div>
              <div className="text-sm text-red-600">Peligro</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {alerts.filter(a => a.estado === 'precaucion').length}
              </div>
              <div className="text-sm text-yellow-600">Precaución</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {devices.length}
              </div>
              <div className="text-sm text-blue-600">Dispositivos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
