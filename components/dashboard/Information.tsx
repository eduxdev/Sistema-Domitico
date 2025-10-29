'use client'

import React, { useEffect, useState } from 'react'
import { SensorReading } from '@/lib/database.types'
import { Button } from '../ui/button'
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '../ui/card'

export default function Information() {
  const [sensorData, setSensorData] = useState<SensorReading | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchSensorData() {
    try {
      setLoading(true)
      const response = await fetch('/api/sensor')
      
      if (!response.ok) {
        throw new Error('Error al obtener datos del sensor')
      }
      
      const result = await response.json()
      setSensorData(result.data)
      setError(null)
    } catch (err) {
      console.error('Error:', err)
      setError('No se pudieron cargar los datos del sensor')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSensorData()

    // Actualizar datos cada 10 segundos
    const interval = setInterval(() => {
      fetchSensorData()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Panel de Control del Sistema Domótico</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {/* Indicador de carga discreto en la esquina superior derecha */}
      {loading && (
        <div className="fixed top-4 right-4 flex items-center bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 shadow-md">
          <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
          <span className="text-xs text-blue-700 font-medium">Actualizando</span>
        </div>
      )}
      
      {sensorData && (
        <div>
          {/* Estado actual - Card destacada */}
          <Card className={`mb-6 border-l-4 ${
            sensorData.gas_level === 'NORMAL' ? 'border-green-500 bg-green-50' : 
            sensorData.gas_level === 'WARNING' ? 'border-yellow-500 bg-yellow-50' : 'border-red-500 bg-red-50'
          }`}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Estado Actual</CardTitle>
                <div className={`h-3 w-3 rounded-full ${
                  sensorData.gas_level === 'NORMAL' ? 'bg-green-500' : 
                  sensorData.gas_level === 'WARNING' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center">
                <div className="mr-3">
                  {sensorData.gas_level === 'NORMAL' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : sensorData.gas_level === 'WARNING' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className={`font-medium ${
                    sensorData.gas_level === 'NORMAL' ? 'text-green-700' : 
                    sensorData.gas_level === 'WARNING' ? 'text-yellow-700' : 'text-red-700'
                  }`}>
                    {sensorData.gas_level === 'NORMAL' ? 'Sistema funcionando correctamente' : 
                     sensorData.gas_level === 'WARNING' ? 'Precaución: Niveles de gas elevados' : 'PELIGRO: Niveles de gas críticos'}
                  </p>
                </div>
              </div>
            </CardContent>
            
            <CardFooter>
              <div className="text-sm text-gray-500">
                Última actualización: {new Date(sensorData.timestamp).toLocaleString()}
              </div>
            </CardFooter>
          </Card>
          
          {/* Grid de cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card de valores del sensor */}
            <Card>
              <CardHeader>
                <CardTitle>Valores del Sensor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Valor del Sensor:</span>
                  <span className="font-medium text-lg">{sensorData.sensor_value}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Nivel de Gas:</span>
                  <span className={`font-medium ${
                    sensorData.gas_level === 'NORMAL' ? 'text-green-600' : 
                    sensorData.gas_level === 'WARNING' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {sensorData.gas_level}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Alarma:</span>
                  <span className={`font-medium ${sensorData.buzzer_activated ? 'text-red-600' : 'text-green-600'}`}>
                    {sensorData.buzzer_activated ? 'ACTIVADA' : 'DESACTIVADA'}
                  </span>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button 
                  variant="outline"
                  onClick={fetchSensorData}
                  className="w-full"
                >
                  Actualizar Datos
                </Button>
              </CardFooter>
            </Card>
            
            {/* Card de detalles adicionales */}
            <Card>
              <CardHeader>
                <CardTitle>Información Adicional</CardTitle>
                <CardDescription>Detalles sobre el estado del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`p-4 rounded-lg ${
                  sensorData.gas_level === 'NORMAL' ? 'bg-green-100 text-green-800' : 
                  sensorData.gas_level === 'WARNING' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }`}>
                  <p className="text-sm">
                    {sensorData.gas_level === 'NORMAL' 
                      ? 'Los niveles de gas están dentro del rango normal. No se requiere ninguna acción.' 
                      : sensorData.gas_level === 'WARNING' 
                      ? 'Los niveles de gas están elevados. Se recomienda ventilar el área.' 
                      : 'ALERTA: Niveles de gas peligrosos. Evacúe el área inmediatamente y contacte a emergencias.'}
                  </p>
                </div>
                
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Recomendaciones:</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {sensorData.gas_level === 'NORMAL' ? (
                      <>
                        <li>Continuar con el monitoreo regular</li>
                        <li>Realizar mantenimiento preventivo mensual</li>
                      </>
                    ) : sensorData.gas_level === 'WARNING' ? (
                      <>
                        <li>Abrir ventanas para ventilar el área</li>
                        <li>Verificar posibles fuentes de fuga</li>
                        <li>Mantener alejadas fuentes de ignición</li>
                      </>
                    ) : (
                      <>
                        <li className="text-red-600 font-medium">EVACUAR INMEDIATAMENTE</li>
                        <li>No encender luces ni equipos eléctricos</li>
                        <li>Llamar a servicios de emergencia</li>
                      </>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
