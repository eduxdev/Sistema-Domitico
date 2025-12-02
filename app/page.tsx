import Header from "@/components/sections/Header";
import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <main className="w-full min-h-screen overflow-x-hidden bg-black font-sans relative">
      <Header />
      <div className="flex flex-col min-h-screen">
        <Hero />
      </div>
      
      <Footer />
    </main>
  );
}
