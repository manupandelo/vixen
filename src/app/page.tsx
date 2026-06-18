import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Hero } from "@/components/sections/Hero";
import { Disciplines } from "@/components/sections/Disciplines";
import { HighlightBand } from "@/components/sections/HighlightBand";
import { Eventos } from "@/components/sections/Eventos";
import { Sede } from "@/components/sections/Sede";
import { content } from "@/content";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Disciplines />
        <HighlightBand data={content.futbol} tone="accent" />
        <HighlightBand data={content.padel} tone="warm" reverse />
        <Eventos />
        <Sede />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
