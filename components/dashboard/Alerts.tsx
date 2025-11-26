'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react'

interface Alert {
  id: string
  alert_type: string
  message: string
  sensor_value: number | null
  gas_level: string | null
  is_sent: boolean | null
  notification_type: string | null
  warning_start_time: string | null
  notification_sent_at: string | null
  is_resolved: boolean | null
  resolved_at: string | null
  created_at: string
  updated_at: string | null
  device: {
    id: string
    device_name: string
    device_id: string
    device_type: string
  } | null
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      
      // El token está en las cookies httpOnly, no necesitamos enviarlo manualmente
      const response = await fetch('/api/alerts', {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Incluir cookies automáticamente
      })

      if (!response.ok) {
        throw new Error('Error al obtener alertas')
      }

      const data = await response.json()
      setAlerts(data.alerts || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching alerts:', err)
      setError('Error al cargar las alertas')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityFromAlertType = (alertType: string): 'low' | 'medium' | 'high' => {
    switch (alertType) {
      case 'critical':
        return 'high'
      case 'warning':
        return 'medium'
      case 'info':
        return 'low'
      default:
        return 'medium'
    }
  }

  const getSeverityBadge = (alertType: string) => {
    const severity = getSeverityFromAlertType(alertType)
    switch (severity) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">Crítica</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Advertencia</Badge>
      case 'low':
        return <Badge className="bg-blue-100 text-blue-800">Información</Badge>
      default:
        return <Badge>Sin definir</Badge>
    }
  }

  const getSeverityIcon = (alertType: string) => {
    const severity = getSeverityFromAlertType(alertType)
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'medium':
        return <Info className="h-5 w-5 text-yellow-600" />
      case 'low':
        return <Info className="h-5 w-5 text-blue-600" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getGasLevelBadge = (gasLevel: string | null) => {
    if (!gasLevel) return null
    
    switch (gasLevel) {
      case 'DANGER':
        return <Badge className="bg-red-100 text-red-800">PELIGRO</Badge>
      case 'WARNING':
        return <Badge className="bg-yellow-100 text-yellow-800">ADVERTENCIA</Badge>
      case 'NORMAL':
        return <Badge className="bg-green-100 text-green-800">NORMAL</Badge>
      default:
        return <Badge variant="outline">{gasLevel}</Badge>
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

  const activeAlerts = alerts.filter(a => !a.is_resolved)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Alertas</h2>
        <Badge variant="secondary">
          {activeAlerts.length} activas
        </Badge>
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No hay alertas</p>
            <p className="text-sm text-gray-400">
              Las alertas se mostrarán aquí cuando se detecten problemas con los sensores.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const severity = getSeverityFromAlertType(alert.alert_type)
            return (
              <Card
                key={alert.id}
                className={`border-l-4 ${
                  severity === 'high'
                    ? 'border-red-500'
                    : severity === 'medium'
                    ? 'border-yellow-500'
                    : 'border-blue-500'
                } ${alert.is_resolved ? 'opacity-60' : ''}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(alert.alert_type)}
                      <CardTitle className="text-lg">
                        {alert.device?.device_name || 'Dispositivo desconocido'}
                      </CardTitle>
                    </div>
                    <div className="flex gap-2">
                      {getSeverityBadge(alert.alert_type)}
                      {getGasLevelBadge(alert.gas_level)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-2">{alert.message}</p>
                  
                  {alert.sensor_value && (
                    <p className="text-sm text-gray-600 mb-2">
                      Valor del sensor: <span className="font-medium">{alert.sensor_value}</span>
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      {new Date(alert.created_at).toLocaleString('es-ES')}
                    </span>
                    {alert.is_resolved && alert.resolved_at && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Resuelta {new Date(alert.resolved_at).toLocaleString('es-ES')}
                      </Badge>
                    )}
                    {!alert.is_resolved && !alert.is_sent && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                        ⏳ Pendiente (esperando 30s)
                      </Badge>
                    )}
                    {alert.is_sent && alert.notification_sent_at && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        ✅ Alerta procesada {new Date(alert.notification_sent_at).toLocaleString('es-ES')}
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