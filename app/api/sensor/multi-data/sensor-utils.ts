import { UMBRALES, UmbralSimple, UmbralRango } from './config'

/**
 * Determina el estado de un sensor basado en su tipo y valor
 */
export function determinarEstadoSensor(tipo: string, valor: number): string {
  const umbral = UMBRALES[tipo]
  
  if (!umbral) return 'normal'

  switch (tipo) {
    case 'MQ2':
    case 'MQ4':
      const umbralSimple = umbral as UmbralSimple
      if (valor >= umbralSimple.peligro) return 'peligro'
      if (valor >= umbralSimple.seguro) return 'precaucion'
      return 'normal'

    case 'DHT11_temp':
    case 'DHT11_hum':
      const umbralRango = umbral as UmbralRango
      if (valor >= umbralRango.peligro) return 'peligro'
      if (valor < umbralRango.min_seguro || valor > umbralRango.max_seguro) return 'precaucion'
      return 'normal'

    default:
      return 'normal'
  }
}
