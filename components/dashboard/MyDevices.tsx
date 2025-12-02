'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  MobileIcon, 
  ActivityLogIcon, 
  ClockIcon, 
  DrawingPinIcon, 
  SymbolIcon, 
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  RocketIcon,
  CrossCircledIcon,
  BarChartIcon,
  DropdownMenuIcon
} from '@radix-ui/react-icons'

interface Reading {
  id: number
  valor_ppm: number
  estado: string
  created_at: string
  sensor_nombre: string
}

interface SensorReading {
  id: number
  valor: number
  estado: string
  created_at: string
  sensor_nombre: string
  sensor_tipo: string
  unidad: string
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
  sensores_activos?: string[]
  sensor_readings?: { [sensorTipo: string]: SensorReading[] }
  latest_reading?: Reading
  recent_readings?: Reading[]
}

export default function MyDevices() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDevicesData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    
    try {
      const response = await fetch('/api/devices/my-devices')
      const data = await response.json()
      
      if (data.success) {
        // Obtener lecturas recientes para cada dispositivo y cada sensor
        const devicesWithReadings = await Promise.all(
          data.data.map(async (device: Device) => {
            // Si es un dispositivo multi-sensor, obtener lecturas de cada sensor
            if (device.sensores_activos && device.sensores_activos.length > 0) {
              const sensorReadings: { [sensorTipo: string]: SensorReading[] } = {}
              
              // Obtener lecturas para cada sensor activo
              await Promise.all(
                device.sensores_activos.map(async (sensorTipo) => {
                  const readings = await fetchMultiSensorReadings(device.device_id, sensorTipo)
                  sensorReadings[sensorTipo] = readings
                })
              )
              
              return {
                ...device,
                sensor_readings: sensorReadings
              }
            } else {
              // Dispositivo de un solo sensor (compatibilidad hacia atrás)
              const recentReadings = await fetchRecentReadings(device.device_id)
              return {
                ...device,
                recent_readings: recentReadings,
                latest_reading: recentReadings[0] || device.latest_reading
              }
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
      if (showLoading) setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Carga inicial
    fetchDevicesData(true)
    
    // Auto-actualización silenciosa cada 5 segundos
    const interval = setInterval(() => {
      if (!refreshing) {
        fetchDevicesData(false) // Sin mostrar loading
      }
    }, 5000) // Actualizar cada 5 segundos
    
    return () => clearInterval(interval)
  }, [fetchDevicesData, refreshing])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDevicesData(false) // No mostrar loading completo, solo el botón
    setRefreshing(false)
  }



  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'normal': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'precaucion': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'peligro': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'normal': return <ActivityLogIcon className="h-4 w-4 text-green-600" />
      case 'precaucion': return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
      case 'peligro': return <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
      default: return <ActivityLogIcon className="h-4 w-4 text-gray-600" />
    }
  }

  const fetchRecentReadings = async (deviceId: string): Promise<Reading[]> => {
    try {
      // Primero intentar con la API anterior (lecturas_gas)
      const response = await fetch(`/api/sensor/data?limit=5&device_id=${deviceId}`)
      const data = await response.json()
      if (data.success && data.data && data.data.length > 0) {
        return data.data
      }
      
      // Si no hay lecturas en la tabla anterior, obtener del sensor principal (MQ2)
      const multiResponse = await fetch(`/api/sensor/multi-data?device_id=${deviceId}&sensor_tipo=MQ2&limit=5`)
      if (multiResponse.ok) {
        const multiData = await multiResponse.json()
        if (multiData.success && multiData.data) {
          // Convertir solo lecturas MQ2 al formato anterior
          return multiData.data.map((reading: { id: number; valor: number; estado: string; created_at: string; sensor_nombre: string }) => ({
            id: reading.id,
            valor_ppm: Math.round(reading.valor),
            estado: reading.estado,
            created_at: reading.created_at,
            sensor_nombre: reading.sensor_nombre
          }))
        }
      }
      
      return []
    } catch (error) {
      console.error('Error fetching recent readings:', error)
      return []
    }
  }

  const fetchMultiSensorReadings = async (deviceId: string, sensorTipo: string): Promise<SensorReading[]> => {
    try {
      const response = await fetch(`/api/sensor/multi-data?device_id=${deviceId}&sensor_tipo=${sensorTipo}&limit=6`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          return data.data
        }
      }
      return []
    } catch (error) {
      console.error(`Error fetching ${sensorTipo} readings:`, error)
      return []
    }
  }

  const getTrendIcon = (readings: Reading[]) => {
    if (readings.length < 2) return <MinusIcon className="h-3 w-3 text-gray-400" />
    
    const latest = readings[0].valor_ppm
    const previous = readings[1].valor_ppm
    
    if (latest > previous) return <ArrowUpIcon className="h-3 w-3 text-red-500" />
    if (latest < previous) return <ArrowDownIcon className="h-3 w-3 text-green-500" />
    return <MinusIcon className="h-3 w-3 text-gray-400" />
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

  const getSensorIcon = (sensorTipo: string) => {
    switch (sensorTipo) {
      case 'MQ2': return <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" /> // Gas - Peligro
      case 'MQ4': return <CrossCircledIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" /> // CO - Tóxico
      case 'DHT11_temp': return <BarChartIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" /> // Temperatura
      case 'DHT11_hum': return <DropdownMenuIcon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" /> // Humedad
      default: return <ActivityLogIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
    }
  }

  const getSensorName = (sensorTipo: string) => {
    switch (sensorTipo) {
      case 'MQ2': return 'Gas (MQ2)'
      case 'MQ4': return 'Monóxido de Carbono (MQ4)'
      case 'DHT11_temp': return 'Temperatura'
      case 'DHT11_hum': return 'Humedad'
      default: return sensorTipo
    }
  }

  const formatSensorValue = (valor: number, unidad: string) => {
    if (unidad === '°C' || unidad === '%') {
      return `${Math.round(valor * 10) / 10} ${unidad}`
    }
    return `${Math.round(valor)} ${unidad}`
  }

  const getTrendIconForSensor = (readings: SensorReading[]) => {
    if (readings.length < 2) return <MinusIcon className="h-3 w-3 text-gray-400" />
    
    const latest = readings[0].valor
    const previous = readings[1].valor
    
    if (latest > previous) return <ArrowUpIcon className="h-3 w-3 text-red-500" />
    if (latest < previous) return <ArrowDownIcon className="h-3 w-3 text-green-500" />
    return <MinusIcon className="h-3 w-3 text-gray-400" />
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Mis Dispositivos</h2>
            <p className="text-gray-500 dark:text-gray-400">Dispositivos que has reclamado</p>
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="space-y-2 pt-2 border-t">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
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
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
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
          <p className="text-gray-500 dark:text-gray-400">Dispositivos que has reclamado ({devices.length})</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={refreshing}>
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </div>

      {devices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <MobileIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">No tienes dispositivos</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
              Aún no has reclamado ningún dispositivo. Ve a &quot;Reclamar Dispositivo&quot; para agregar uno.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {devices.map((device, deviceIndex) => (
            <div key={device.id} className="space-y-4">
              {/* Separador visual entre dispositivos */}
              {deviceIndex > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="w-full h-px bg-linear-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
                </div>
              )}
              
              {/* Header del dispositivo */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  {device.nickname || device.nombre}
                </h3>
                {device.latest_reading && (
                  <Badge className={`text-xs ${getStatusColor(device.latest_reading.estado)}`}>
                    {device.latest_reading.estado.toUpperCase()}
                  </Badge>
                )}
              </div>

              {/* Grid de sensores cuadrados con orden fijo */}
              {device.sensor_readings ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Orden fijo de sensores para evitar cambios de posición */}
                  {['MQ2', 'MQ4', 'DHT11_temp', 'DHT11_hum'].map((sensorTipo) => {
                    const readings = device.sensor_readings?.[sensorTipo] || []
                    if (!device.sensores_activos?.includes(sensorTipo)) return null
                    
                    return (
                    <Card key={sensorTipo} className="hover:shadow-lg transition-shadow border-2 aspect-square">
                      <CardContent className="p-4 h-full flex flex-col">
                        {/* Header compacto del sensor */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getSensorIcon(sensorTipo)}
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {getSensorName(sensorTipo)}
                              </h4>
                            </div>
                          </div>
                          {readings.length > 0 && (
                            <Badge className={`text-xs ${getStatusColor(readings[0].estado)}`}>
                              {readings[0].estado.charAt(0).toUpperCase()}
                            </Badge>
                          )}
                        </div>

                        {/* Valor principal */}
                        <div className="flex-1 flex flex-col justify-center items-center text-center mb-3">
                          {readings.length > 0 ? (
                            <>
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                                {formatSensorValue(readings[0].valor, readings[0].unidad)}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {formatTimeAgo(readings[0].created_at)}
                              </div>
                            </>
                          ) : (
                            <div className="text-center">
                              <ExclamationTriangleIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                              <p className="text-xs text-gray-500 dark:text-gray-400">Sin datos</p>
                            </div>
                          )}
                        </div>

                        {/* Mini historial (últimas 5 lecturas) */}
                        {readings.length > 1 && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span>Historial</span>
                              {getTrendIconForSensor(readings)}
                            </div>
                            <div className="space-y-1 overflow-hidden">
                              {readings.slice(1, 6).map((reading) => (
                                <div 
                                  key={reading.id} 
                                  className="flex items-center justify-between text-xs p-1 rounded bg-gray-50 dark:bg-gray-800"
                                >
                                  <div className="flex items-center gap-1">
                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                      reading.estado === 'normal' ? 'bg-green-500' :
                                      reading.estado === 'precaucion' ? 'bg-yellow-500' : 'bg-red-500'
                                    }`} />
                                    <span className="font-mono text-xs">
                                      {formatSensorValue(reading.valor, reading.unidad)}
                                    </span>
                                  </div>
                                  <span className="text-gray-400 text-xs">
                                    {formatTimeAgo(reading.created_at)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )})}
                </div>
              ) : (
                // Fallback para dispositivos de un solo sensor (compatibilidad hacia atrás)
                <Card className="hover:shadow-lg transition-shadow border-2">
                  <CardContent className="p-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Columna izquierda: Estado actual */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b pb-2">
                          Estado Actual
                        </h4>
                        {device.latest_reading ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <span className="text-sm font-medium">Nivel de gas:</span>
                              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {device.latest_reading.valor_ppm} PPM
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <ClockIcon className="h-4 w-4" />
                              <span>Última actualización: {new Date(device.latest_reading.created_at).toLocaleString('es-ES')}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <ExclamationTriangleIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">Sin lecturas recientes</p>
                          </div>
                        )}
                      </div>

                      {/* Columna derecha: Lecturas recientes */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            Historial Reciente
                          </h4>
                          {device.recent_readings && device.recent_readings.length > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">Tendencia:</span>
                              {getTrendIcon(device.recent_readings)}
                            </div>
                          )}
                        </div>
                        {device.recent_readings && device.recent_readings.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {device.recent_readings.slice(0, 5).map((reading, index) => (
                              <div 
                                key={reading.id} 
                                className={`flex items-center justify-between p-3 rounded-lg border ${
                                  index === 0 
                                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700' 
                                    : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${
                                    reading.estado === 'normal' ? 'bg-green-500' :
                                    reading.estado === 'precaucion' ? 'bg-yellow-500' : 'bg-red-500'
                                  }`} />
                                  <div>
                                    <span className="font-mono text-sm font-medium">
                                      {reading.valor_ppm} PPM
                                    </span>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatTimeAgo(reading.created_at)}
                                    </p>
                                  </div>
                                </div>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getStatusColor(reading.estado)}`}
                                >
                                  {reading.estado.charAt(0).toUpperCase()}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <ClockIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">Sin historial disponible</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
