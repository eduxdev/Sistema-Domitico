'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Activity, Gauge, AlertTriangle, CheckCircle } from 'lucide-react'

export default function DashboardHome() {
  const [stats, setStats] = useState({
    totalLecturas: 0,
    ultimaLectura: null as {
      id: number;
      valor_ppm: number;
      estado: string;
      sensor_nombre: string;
      created_at: string;
    } | null,
    alertasActivas: 0,
    sistemaOperativo: true,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      // Obtener últimas lecturas
      const lecturas = await fetch('/api/sensor/data?limit=10')
      const lecturasData = await lecturas.json()
      
      setStats({
        totalLecturas: lecturasData.data?.length || 0,
        ultimaLectura: lecturasData.data?.[0] || null,
        alertasActivas: lecturasData.data?.filter((l: { estado: string }) => l.estado !== 'normal').length || 0,
        sistemaOperativo: true,
      })
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-gray-500">Resumen de tu sistema domótico</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lecturas Recientes</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalLecturas}</div>
            <p className="text-xs text-muted-foreground">
              Últimas 10 lecturas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Lectura</CardTitle>
            <Activity className={`h-4 w-4 ${stats.ultimaLectura?.estado === 'normal' ? 'text-green-500' : 'text-yellow-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.ultimaLectura?.estado === 'normal' ? 'text-green-600' : 'text-yellow-600'}`}>
              {loading ? '...' : (stats.ultimaLectura?.valor_ppm || 'N/A')}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.ultimaLectura?.estado?.toUpperCase() || 'Sin datos'} PPM
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${stats.alertasActivas > 0 ? 'text-yellow-500' : 'text-green-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.alertasActivas > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {loading ? '...' : stats.alertasActivas}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.alertasActivas === 0 ? 'Todo normal' : 'Requieren atención'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado del Sistema</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Operativo</div>
            <p className="text-xs text-muted-foreground">
              Sensor funcionando correctamente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Última lectura detallada */}
      {stats.ultimaLectura && (
        <Card>
          <CardHeader>
            <CardTitle>Última Lectura del Sensor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <p className="text-sm text-gray-500">Valor PPM</p>
                <p className="text-2xl font-bold">{stats.ultimaLectura.valor_ppm}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Estado</p>
                <p className={`text-lg font-semibold ${
                  stats.ultimaLectura.estado === 'normal' ? 'text-green-600' :
                  stats.ultimaLectura.estado === 'precaucion' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {stats.ultimaLectura.estado?.toUpperCase()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Sensor</p>
                <p className="text-lg font-medium">{stats.ultimaLectura.sensor_nombre || 'Principal'}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500">
                Última actualización: {new Date(stats.ultimaLectura.created_at).toLocaleString('es-ES')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}