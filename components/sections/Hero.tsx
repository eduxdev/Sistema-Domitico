'use client'

import DarkVeil from "@/components/DarkVeil";
import { Terminal, TypingAnimation, AnimatedSpan } from "../ui/terminal";

export default function Hero() {

  return (
    <div className="w-full min-h-screen relative grow overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black">
      <DarkVeil />
      
      <div className="absolute inset-0 flex items-center justify-center px-8 sm:px-16 lg:px-24">
        {/* Contenido centrado */}
        <div className="max-w-3xl z-10 text-white space-y-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            Monitoreo en tiempo real
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent leading-tight text-center">
            Sistema Domótico
          </h1>
          
          <p className="text-xl sm:text-2xl md:text-3xl text-gray-300 mb-8 max-w-xl mx-auto leading-relaxed">
            Monitoreo inteligente y seguro para tu hogar
          </p>

          {/* Features list */}
          <div className="space-y-3 mb-8 flex flex-col items-center">
            {['Alertas en tiempo real', 'Control remoto', 'Análisis de datos'].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span className="text-sm sm:text-base">{feature}</span>
              </div>
            ))}
          </div>

          {/* Terminal Demo */}
          <div className="flex justify-center">
            <Terminal className="max-w-md bg-black/40 backdrop-blur-sm border-white/20 text-left" sequence={true} startOnView={true}>
              <TypingAnimation duration={50} startOnView={true}>{'$ sensor-gas status'}</TypingAnimation>
              <AnimatedSpan className="text-green-400" startOnView={false}>{'✓ Sensores activos'}</AnimatedSpan>
              <AnimatedSpan className="text-gray-400" startOnView={false}>{'→ CO: 0 ppm (Normal)'}</AnimatedSpan>
              <AnimatedSpan className="text-gray-400" startOnView={false}>{'→ CO2: 420 ppm (Normal)'}</AnimatedSpan>
              <TypingAnimation duration={50} startOnView={false}>{'$ monitor --gas-levels'}</TypingAnimation>
              <AnimatedSpan className="text-green-400" startOnView={false}>{'✓ Niveles seguros'}</AnimatedSpan>
              <AnimatedSpan className="text-blue-400" startOnView={false}>{'ℹ Última lectura: hace 1s'}</AnimatedSpan>
            </Terminal>
          </div>
        </div>
      </div>
    </div>
  )
}
