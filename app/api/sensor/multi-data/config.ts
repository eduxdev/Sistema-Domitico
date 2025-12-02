// Configuración de alertas
export const ALERTAS_CONSECUTIVAS_REQUERIDAS = 5
export const USAR_EMAIL = true

// Configuración de cooldown para emails (valores por defecto)
export const DEFAULT_EMAIL_COOLDOWN_MINUTES = 5
export const DEFAULT_MAX_EMAILS_PER_HOUR = 10

// Umbrales de seguridad para cada sensor (solo peligro)
export type UmbralSimple = { peligro: number }
export type UmbralRango = { min_peligro: number; max_peligro: number }

export const UMBRALES: Record<string, UmbralSimple | UmbralRango> = {
  MQ2: { peligro: 600 },
  MQ4: { peligro: 150 },
  DHT11_temp: { min_peligro: 10, max_peligro: 35 },
  DHT11_hum: { min_peligro: 20, max_peligro: 85 }
}
