'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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
            {loading ? (
              <>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.totalLecturas}</div>
                <p className="text-xs text-muted-foreground">
                  Últimas 10 lecturas
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Lectura</CardTitle>
            <Activity className={`h-4 w-4 ${stats.ultimaLectura?.estado === 'normal' ? 'text-green-500' : 'text-yellow-500'}`} />
          </CardHeader>
          <CardContent>
            {loading ? (
              <>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-24" />
              </>
            ) : (
              <>
                <div className={`text-2xl font-bold ${stats.ultimaLectura?.estado === 'normal' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {stats.ultimaLectura?.valor_ppm || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.ultimaLectura?.estado?.toUpperCase() || 'Sin datos'} PPM
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${stats.alertasActivas > 0 ? 'text-yellow-500' : 'text-green-500'}`} />
          </CardHeader>
          <CardContent>
            {loading ? (
              <>
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-3 w-28" />
              </>
            ) : (
              <>
                <div className={`text-2xl font-bold ${stats.alertasActivas > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {stats.alertasActivas}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.alertasActivas === 0 ? 'Todo normal' : 'Requieren atención'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado del Sistema</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-40" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">Operativo</div>
                <p className="text-xs text-muted-foreground">
                  Sensor funcionando correctamente
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Última lectura detallada */}
      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center space-y-2">
                <Skeleton className="h-4 w-20 mx-auto" />
                <Skeleton className="h-8 w-16 mx-auto" />
              </div>
              <div className="text-center space-y-2">
                <Skeleton className="h-4 w-16 mx-auto" />
                <Skeleton className="h-6 w-24 mx-auto" />
              </div>
              <div className="text-center space-y-2">
                <Skeleton className="h-4 w-16 mx-auto" />
                <Skeleton className="h-6 w-28 mx-auto" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <Skeleton className="h-3 w-64" />
            </div>
          </CardContent>
        </Card>
      ) : stats.ultimaLectura && (
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