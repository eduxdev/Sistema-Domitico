'use client'

import DarkVeil from "@/components/DarkVeil";
import Link from "next/link";
import { RainbowButton } from "../ui/rainbow-button";

export default function Hero() {
  return (
    <div className="w-full min-h-screen relative grow">
      <DarkVeil />
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4 sm:px-6 lg:px-8">
        <div className="text-center text-white w-full max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 sm:mb-4 font-serif tracking-wider leading-tight">
            Sistema Domótico
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-mono tracking-tight mb-6 sm:mb-8 max-w-2xl mx-auto">
            Monitoreo inteligente para tu hogar
          </p>
          
          <div className="mt-6 sm:mt-10">
            <Link href="/dashboard">
              <RainbowButton 
                variant="outline" 
                className="font-mono text-base sm:text-lg px-6 sm:px-8 py-2 sm:py-3 transition-all duration-300 hover:scale-105"
              >
                Iniciar
              </RainbowButton>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
