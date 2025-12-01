'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react'

interface Lectura {
  id: number
  valor_ppm: number
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
  nickname?: string
}

export default function Alerts() {
  const [lecturas, setLecturas] = useState<Lectura[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
    // Actualizar cada 15 segundos para alertas en tiempo real
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Primero obtener los dispositivos del usuario
      const devicesResponse = await fetch('/api/devices/my-devices')
      const devicesData = await devicesResponse.json()
      
      if (!devicesData.success) {
        setError('Error al cargar dispositivos del usuario')
        return
      }
      
      const userDevices = devicesData.devices || []
      setDevices(userDevices)
      
      if (userDevices.length === 0) {
        setLecturas([])
        setError(null)
        return
      }
      
      // Obtener alertas de todos los dispositivos del usuario
      const allAlerts: Lectura[] = []
      
      for (const device of userDevices) {
        try {
          const alertsResponse = await fetch(`/api/sensor/data?limit=10&device_id=${device.device_id}`)
          const alertsData = await alertsResponse.json()
          
          if (alertsData.success && alertsData.data) {
            // Filtrar solo lecturas con alertas (no normales) y agregar info del dispositivo
            const deviceAlerts = alertsData.data
              .filter((lectura: Lectura) => lectura.estado !== 'normal')
              .map((lectura: Lectura) => ({
                ...lectura,
                device_name: device.nickname || device.nombre,
                device_id: device.device_id
              }))
            
            allAlerts.push(...deviceAlerts)
          }
        } catch (err) {
          console.error(`Error fetching alerts for device ${device.device_id}:`, err)
        }
      }
      
      // Ordenar por fecha más reciente
      allAlerts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      setLecturas(allAlerts)
      setError(null)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Error al cargar las alertas')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityFromEstado = (estado: string): 'low' | 'medium' | 'high' => {
    switch (estado) {
      case 'peligro':
        return 'high'
      case 'precaucion':
        return 'medium'
      case 'normal':
        return 'low'
      default:
        return 'medium'
    }
  }

  const getSeverityBadge = (estado: string) => {
    const severity = getSeverityFromEstado(estado)
    switch (severity) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800 text-xs px-2 py-0">PELIGRO</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0">PRECAUCIÓN</Badge>
      case 'low':
        return <Badge className="bg-green-100 text-green-800 text-xs px-2 py-0">NORMAL</Badge>
      default:
        return <Badge className="text-xs px-2 py-0">Sin definir</Badge>
    }
  }

  const getSeverityIcon = (estado: string) => {
    const severity = getSeverityFromEstado(estado)
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-600" />
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Alertas de Mis Dispositivos</h2>
            <p className="text-gray-500">Alertas de los dispositivos que has reclamado</p>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-l-4">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-3 w-full" />
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
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Alertas</h2>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500">{error}</p>
            <button 
              onClick={fetchData}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reintentar
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Alertas de Mis Dispositivos</h2>
          <p className="text-gray-500">Alertas de los dispositivos que has reclamado</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">
            {devices.length} dispositivos
          </Badge>
          <Badge variant={lecturas.length > 0 ? "destructive" : "secondary"}>
            {lecturas.length} alertas activas
          </Badge>
        </div>
      </div>

      {devices.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Info className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No tienes dispositivos reclamados</p>
            <p className="text-sm text-gray-400">
              Ve a &quot;Reclamar Dispositivo&quot; para agregar dispositivos y ver sus alertas aquí.
            </p>
          </CardContent>
        </Card>
      ) : lecturas.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No hay alertas activas</p>
            <p className="text-sm text-gray-400">
              Todos tus dispositivos están funcionando normalmente. Las alertas aparecerán aquí cuando se detecten niveles elevados de gas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {lecturas.map((lectura) => {
            const severity = getSeverityFromEstado(lectura.estado)
            return (
              <Card
                key={lectura.id}
                className={`border-l-4 hover:shadow-md transition-shadow ${
                  severity === 'high'
                    ? 'border-red-500'
                    : severity === 'medium'
                    ? 'border-yellow-500'
                    : 'border-green-500'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(lectura.estado)}
                      <div>
                        <h3 className="font-semibold text-sm">
                          {lectura.device_name || lectura.sensor_nombre || 'Sensor Principal'}
                        </h3>
                        <p className="text-xs text-gray-500 font-mono">
                          {lectura.device_id}
                        </p>
                      </div>
                    </div>
                    {getSeverityBadge(lectura.estado)}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Nivel:</span>
                      <span className="font-bold text-lg">{lectura.valor_ppm} PPM</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{new Date(lectura.created_at).toLocaleString('es-ES', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                      {lectura.estado === 'peligro' && (
                        <span className="text-red-600 font-medium">🚨 Urgente</span>
                      )}
                      {lectura.estado === 'precaucion' && (
                        <span className="text-yellow-600 font-medium">⚠️ Atención</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}