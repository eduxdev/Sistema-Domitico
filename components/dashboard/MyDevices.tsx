'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Smartphone, Activity, Clock, MapPin, Wifi, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Reading {
  id: number
  valor_ppm: number
  estado: string
  created_at: string
  sensor_nombre: string
}

interface Device {
  id: string
  device_id: string
  nombre: string
  tipo: string
  ubicacion?: string
  nickname?: string
  claimed_at: string
  ip_address?: string
  mac_address?: string
  estado: string
  latest_reading?: Reading
  recent_readings?: Reading[]
}

export default function MyDevices() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/devices/my-devices')
        const data = await response.json()
        
        if (data.success) {
          // Obtener lecturas recientes para cada dispositivo
          const devicesWithReadings = await Promise.all(
            data.devices.map(async (device: Device) => {
              const recentReadings = await fetchRecentReadings(device.device_id)
              return {
                ...device,
                recent_readings: recentReadings,
                latest_reading: recentReadings[0] || device.latest_reading
              }
            })
          )
          
          setDevices(devicesWithReadings)
          setError(null)
        } else {
          setError(data.error || 'Error al cargar dispositivos')
        }
      } catch (error) {
        console.error('Error fetching devices:', error)
        setError('Error de conexión')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // Actualizar cada 10 segundos para lecturas en tiempo real
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])


  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'normal': return 'bg-green-100 text-green-800'
      case 'precaucion': return 'bg-yellow-100 text-yellow-800'
      case 'peligro': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'normal': return <Activity className="h-4 w-4 text-green-600" />
      case 'precaucion': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'peligro': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const fetchRecentReadings = async (deviceId: string): Promise<Reading[]> => {
    try {
      const response = await fetch(`/api/sensor/data?limit=5&device_id=${deviceId}`)
      const data = await response.json()
      return data.success ? data.data : []
    } catch (error) {
      console.error('Error fetching recent readings:', error)
      return []
    }
  }

  const getTrendIcon = (readings: Reading[]) => {
    if (readings.length < 2) return <Minus className="h-3 w-3 text-gray-400" />
    
    const latest = readings[0].valor_ppm
    const previous = readings[1].valor_ppm
    
    if (latest > previous) return <TrendingUp className="h-3 w-3 text-red-500" />
    if (latest < previous) return <TrendingDown className="h-3 w-3 text-green-500" />
    return <Minus className="h-3 w-3 text-gray-400" />
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Ahora'
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Mis Dispositivos</h2>
          <p className="text-gray-500">Dispositivos que has reclamado</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Mis Dispositivos</h2>
          <p className="text-gray-500">Dispositivos que has reclamado</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Mis Dispositivos</h2>
          <p className="text-gray-500">Dispositivos que has reclamado ({devices.length})</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline" size="sm">
          Actualizar
        </Button>
      </div>

      {devices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Smartphone className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No tienes dispositivos</h3>
            <p className="text-gray-500 text-center mb-4">
              Aún no has reclamado ningún dispositivo. Ve a &quot;Reclamar Dispositivo&quot; para agregar uno.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => (
            <Card key={device.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    {device.nickname || device.nombre}
                  </CardTitle>
                  {device.latest_reading && (
                    <div className="flex items-center gap-1">
                      {getStatusIcon(device.latest_reading.estado)}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">{device.device_id}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Estado actual */}
                {device.latest_reading ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Última lectura:</span>
                      <Badge className={getStatusColor(device.latest_reading.estado)}>
                        {device.latest_reading.estado.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Nivel de gas:</span>
                      <span className="font-semibold">{device.latest_reading.valor_ppm} PPM</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {new Date(device.latest_reading.created_at).toLocaleString('es-ES')}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">Sin lecturas recientes</p>
                  </div>
                )}

                {/* Lecturas Recientes */}
                {device.recent_readings && device.recent_readings.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Lecturas Recientes:</span>
                      {getTrendIcon(device.recent_readings)}
                    </div>
                    <div className="space-y-1">
                      {device.recent_readings.slice(0, 5).map((reading, index) => (
                        <div 
                          key={reading.id} 
                          className={`flex items-center justify-between text-xs p-2 rounded ${
                            index === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              reading.estado === 'normal' ? 'bg-green-500' :
                              reading.estado === 'precaucion' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            <span className="font-mono">{reading.valor_ppm} PPM</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs px-1 py-0 ${getStatusColor(reading.estado)}`}
                            >
                              {reading.estado.charAt(0).toUpperCase()}
                            </Badge>
                            <span className="text-gray-500">{formatTimeAgo(reading.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Información del dispositivo */}
                <div className="space-y-2 pt-2 border-t">
                  {device.ubicacion && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{device.ubicacion}</span>
                    </div>
                  )}
                  {device.ip_address && (
                    <div className="flex items-center gap-2 text-sm">
                      <Wifi className="h-4 w-4 text-gray-400" />
                      <span className="font-mono text-xs">{device.ip_address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    Reclamado: {new Date(device.claimed_at).toLocaleDateString('es-ES')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
