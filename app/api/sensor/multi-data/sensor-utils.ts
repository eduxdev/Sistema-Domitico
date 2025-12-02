import { UMBRALES, UmbralSimple, UmbralRango } from './config'

/**
 * Determina el estado de un sensor basado en su tipo y valor
 * Solo retorna 'normal' o 'peligro'
 */
export function determinarEstadoSensor(tipo: string, valor: number): string {
  const umbral = UMBRALES[tipo]
  
  if (!umbral) return 'normal'

  switch (tipo) {
    case 'MQ2':
    case 'MQ4':
      const umbralSimple = umbral as UmbralSimple
      if (valor >= umbralSimple.peligro) return 'peligro'
      return 'normal'

    case 'DHT11_temp':
    case 'DHT11_hum':
      const umbralRango = umbral as UmbralRango
      if (valor <= umbralRango.min_peligro || valor >= umbralRango.max_peligro) return 'peligro'
      return 'normal'

    default:
      return 'normal'
  }
}
