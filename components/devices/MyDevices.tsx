'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  MapPin, 
  Clock, 
  RefreshCw,
  Eye
} from 'lucide-react'

interface MyDevice {
  id: string
  nickname: string | null
  location: string | null
  added_at: string
  latestReading: {
    id: string
    sensor_value: number
    gas_level: string
    buzzer_activated: boolean
    timestamp: string
  } | null
  device: {
    id: string
    device_id: string
    device_name: string
    device_type: string
    mac_address: string | null
    ip_address: string | null
    is_active: boolean | null
    last_seen: string | null
    created_at: string | null
  }
}

export default function MyDevices() {
  const [devices, setDevices] = useState<MyDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [liveDeviceId, setLiveDeviceId] = useState<string | null>(null)
  type LiveReading = { id: string; sensor_value: number; gas_level: string; buzzer_activated: boolean; timestamp: string }
  const [liveReadings, setLiveReadings] = useState<Record<string, LiveReading[]>>({})

  const fetchMyDevices = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/devices/my-devices')
      const result = await response.json()
      
      if (result.success) {
        setDevices(result.devices)
      } else {
        toast.error('Error al cargar dispositivos', {
          description: result.error
        })
      }
    } catch (error) {
      console.error('Error obteniendo mis dispositivos:', error)
      toast.error('Error al cargar dispositivos')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const isDeviceOnline = (lastSeen: string | null): boolean => {
    if (!lastSeen) return false
    const lastSeenDate = new Date(lastSeen)
    const now = new Date()
    const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60)
    return diffMinutes < 10 // Considerado online si vio actividad en últimos 10 minutos
  }

  const getLastSeenText = (lastSeen: string | null): string => {
    if (!lastSeen) return 'Nunca'
    
    const lastSeenDate = new Date(lastSeen)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Hace menos de un minuto'
    if (diffMinutes < 60) return `Hace ${diffMinutes} minutos`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `Hace ${diffHours} horas`
    
    const diffDays = Math.floor(diffHours / 24)
    return `Hace ${diffDays} días`
  }

  const fetchLiveReadings = async (deviceUuid: string) => {
    try {
      const res = await fetch(`/api/sensor?device_uuid=${deviceUuid}&limit=5`, { cache: 'no-store' })
      const data = await res.json()
      if (data.success) {
        setLiveReadings(prev => ({ ...prev, [deviceUuid]: data.readings || [] }))
      }
    } catch {
      // silenciar errores en polling
    }
  }

  const handleViewData = (deviceUuid: string) => {
    setLiveDeviceId(prev => (prev === deviceUuid ? null : deviceUuid))
    fetchLiveReadings(deviceUuid)
  }

  useEffect(() => {
    fetchMyDevices()
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchMyDevices, 30000)
    return () => clearInterval(interval)
  }, [])

  // Polling cada 5s cuando hay un dispositivo seleccionado
  useEffect(() => {
    if (!liveDeviceId) return
    fetchLiveReadings(liveDeviceId)
    const t = setInterval(() => fetchLiveReadings(liveDeviceId), 5000)
    return () => clearInterval(t)
  }, [liveDeviceId])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Mis Dispositivos</h2>
          <Button disabled>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Cargando...
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Cargando tus dispositivos...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (devices.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Mis Dispositivos</h2>
          <Button onClick={fetchMyDevices} disabled={refreshing}>
            {refreshing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar
              </>
            )}
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500 mb-2">
              No tienes dispositivos reclamados aún.
            </p>
            <p className="text-sm text-gray-400">
              Ve a la sección Dispositivos Disponibles para reclamar tus sensores.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Mis Dispositivos</h2>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {devices.length} {devices.length === 1 ? 'dispositivo' : 'dispositivos'}
          </Badge>
        </div>
        <Button onClick={fetchMyDevices} disabled={refreshing} variant="outline">
          {refreshing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Actualizando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {devices.map((item) => {
          const device = item.device
          const isOnline = isDeviceOnline(device.last_seen)
          
          // Determinar el color del borde basado en el estado del sensor
          const getBorderColor = () => {
            if (!item.latestReading) return isOnline ? 'border-green-500' : 'border-gray-300'
            const gasLevel = item.latestReading.gas_level
            if (gasLevel === 'NORMAL') return 'border-green-500'
            if (gasLevel === 'WARNING') return 'border-yellow-500'
            return 'border-red-500'
          }
          
          return (
            <Card 
              key={item.id} 
              className={`border-l-4 ${getBorderColor()}`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    {item.nickname || device.device_name}
                  </CardTitle>
                  <Badge 
                    variant={isOnline ? "default" : "secondary"}
                    className={isOnline ? "bg-green-100 text-green-800" : ""}
                  >
                    {isOnline ? (
                      <>
                        <Wifi className="mr-1 h-3 w-3" />
                        Online
                      </>
                    ) : (
                      <>
                        <WifiOff className="mr-1 h-3 w-3" />
                        Offline
                      </>
                    )}
                  </Badge>
                </div>
                {item.location && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <MapPin className="h-3 w-3" />
                    {item.location}
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Información del Sensor */}
                {item.latestReading ? (
                  <div className="space-y-2 pb-3 border-b">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Estado del Sensor</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Valor del Sensor:</span>
                        <span className="font-medium text-lg">{item.latestReading.sensor_value}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Nivel de Gas:</span>
                        <span className={`font-medium ${
                          item.latestReading.gas_level === 'NORMAL' ? 'text-green-600' : 
                          item.latestReading.gas_level === 'WARNING' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {item.latestReading.gas_level}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Alarma:</span>
                        <span className={`font-medium ${item.latestReading.buzzer_activated ? 'text-red-600' : 'text-green-600'}`}>
                          {item.latestReading.buzzer_activated ? 'ACTIVADA' : 'DESACTIVADA'}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-500 pt-1">
                        {new Date(item.latestReading.timestamp).toLocaleString('es-ES')}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pb-3 border-b">
                    <p className="text-xs text-gray-500">Sin datos del sensor disponibles</p>
                  </div>
                )}

                {/* Información del Dispositivo */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tipo:</span>
                    <span className="font-medium">{device.device_type}</span>
                  </div>
                  
                  {device.ip_address && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">IP:</span>
                      <span className="font-mono text-xs">{device.ip_address}</span>
                    </div>
                  )}
                  
                  {device.mac_address && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">MAC:</span>
                      <span className="font-mono text-xs">{device.mac_address}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Última actividad:
                    </span>
                    <span className="text-xs text-gray-600">
                      {getLastSeenText(device.last_seen)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Agregado:</span>
                    <span className="text-xs text-gray-600">
                      {new Date(item.added_at).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Activity className={`h-4 w-4 ${isOnline ? 'text-green-500' : 'text-gray-400'}`} />
                    <span className={`text-xs ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                      {isOnline ? 'Dispositivo activo' : 'Sin actividad reciente'}
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleViewData(device.id)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Datos
                </Button>
              </CardFooter>
              {liveDeviceId === device.id && (
                <CardContent className="pt-0">
                  <div className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead>Nivel</TableHead>
                          <TableHead>Alarma</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(liveReadings[device.id] || []).map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>{new Date(r.timestamp).toLocaleString('es-ES')}</TableCell>
                            <TableCell className="text-right">{r.sensor_value}</TableCell>
                            <TableCell>{r.gas_level}</TableCell>
                            <TableCell>{r.buzzer_activated ? 'Sí' : 'No'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableCaption>Últimas 5 lecturas</TableCaption>
                    </Table>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
