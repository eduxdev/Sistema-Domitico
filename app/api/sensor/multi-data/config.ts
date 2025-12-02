// Configuración de alertas
export const ALERTAS_CONSECUTIVAS_REQUERIDAS = 5
export const USAR_EMAIL = true

// Configuración de cooldown para emails (valores por defecto)
export const DEFAULT_EMAIL_COOLDOWN_MINUTES = 5
export const DEFAULT_MAX_EMAILS_PER_HOUR = 10

// Umbrales de seguridad para cada sensor
export type UmbralSimple = { seguro: number; peligro: number }
export type UmbralRango = { min_seguro: number; max_seguro: number; peligro: number }

export const UMBRALES: Record<string, UmbralSimple | UmbralRango> = {
  MQ2: { seguro: 300, peligro: 600 },
  MQ4: { seguro: 50, peligro: 150 },
  DHT11_temp: { min_seguro: 18, max_seguro: 28, peligro: 35 },
  DHT11_hum: { min_seguro: 30, max_seguro: 70, peligro: 85 }
}
