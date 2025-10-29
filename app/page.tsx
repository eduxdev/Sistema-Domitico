import Hero from "@/components/sections/Hero";

export default function Home() {
  return (
    <main className="w-full min-h-screen overflow-x-hidden bg-black font-sans relative">
      <div className="flex flex-col min-h-screen">
        <Hero />
      </div>
    </main>
  );
}
