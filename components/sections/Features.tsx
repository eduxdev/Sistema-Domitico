'use client'

import { TextReveal } from "../ui/text-reveal"

export default function Features() {
  return (
    <section id="caracteristicas" className="w-full bg-black dark:bg-black min-h-screen">
      {/* Text Reveal Section */}
      <TextReveal className="bg-black dark:bg-black">
        Monitoreo inteligente de gases en tiempo real para proteger tu hogar
      </TextReveal>
    </section>
  )
}
