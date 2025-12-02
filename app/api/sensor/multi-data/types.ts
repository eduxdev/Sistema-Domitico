export interface SensorReading {
  tipo: string
  valor: number
  unidad: string
  nombre: string
}

export interface MultiSensorData {
  device_id: string
  sensores: SensorReading[]
  estado_general: string
  alertas_activas: string
}
