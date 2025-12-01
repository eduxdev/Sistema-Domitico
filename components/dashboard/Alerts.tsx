'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react'

interface Notificacion {
  id: string
  tipo: string
  destinatario: string
  asunto: string | null
  mensaje: string
  estado: string
  lectura_id: number | null
  valor_ppm: number | null
  nivel_alerta: string | null
  respuesta_api: string | null
  error_mensaje: string | null
  created_at: string
}

export default function Alerts() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [lecturas, setLecturas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Obtener lecturas recientes
      const notifResponse = await fetch('/api/sensor/data?limit=20')
      
      if (notifResponse.ok) {
        const data = await notifResponse.json()
        
        // Filtrar solo lecturas con alertas (no normales)
        const alertas = data.data?.filter((lectura: { estado: string }) => lectura.estado !== 'normal') || []
        setLecturas(alertas)
      }

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
        return <Badge className="bg-red-100 text-red-800">PELIGRO</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">PRECAUCIÓN</Badge>
      case 'low':
        return <Badge className="bg-green-100 text-green-800">NORMAL</Badge>
      default:
        return <Badge>Sin definir</Badge>
    }
  }

  const getSeverityIcon = (estado: string) => {
    const severity = getSeverityFromEstado(estado)
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'medium':
        return <Info className="h-5 w-5 text-yellow-600" />
      case 'low':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Alertas</h2>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Cargando alertas...</p>
          </CardContent>
        </Card>
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
              onClick={fetchAlerts}
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
        <h2 className="text-2xl font-bold">Alertas del Sensor</h2>
        <Badge variant="secondary">
          {lecturas.length} lecturas con alertas
        </Badge>
      </div>

      {lecturas.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No hay alertas activas</p>
            <p className="text-sm text-gray-400">
              Las alertas se mostrarán aquí cuando el sensor detecte niveles elevados de gas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {lecturas.map((lectura) => {
            const severity = getSeverityFromEstado(lectura.estado)
            return (
              <Card
                key={lectura.id}
                className={`border-l-4 ${
                  severity === 'high'
                    ? 'border-red-500'
                    : severity === 'medium'
                    ? 'border-yellow-500'
                    : 'border-green-500'
                }`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(lectura.estado)}
                      <CardTitle className="text-lg">
                        {lectura.sensor_nombre || 'Sensor Principal'}
                      </CardTitle>
                    </div>
                    <div className="flex gap-2">
                      {getSeverityBadge(lectura.estado)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-2">
                    Nivel de gas detectado: <strong>{lectura.valor_ppm} PPM</strong>
                  </p>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    Estado: <span className={`font-medium ${
                      lectura.estado === 'peligro' ? 'text-red-600' :
                      lectura.estado === 'precaucion' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {lectura.estado.toUpperCase()}
                    </span>
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      📅 {new Date(lectura.created_at).toLocaleString('es-ES')}
                    </span>
                    {lectura.estado === 'peligro' && (
                      <Badge variant="outline" className="bg-red-50 text-red-700">
                        🚨 Requiere atención inmediata
                      </Badge>
                    )}
                    {lectura.estado === 'precaucion' && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                        ⚠️ Monitorear de cerca
                      </Badge>
                    )}
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