import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Hero } from "@/components/sections/Hero";
import { TrustBand } from "@/components/sections/TrustBand";
import { UseCases } from "@/components/sections/UseCases";
import { Tournaments } from "@/components/sections/Tournaments";
import { Eventos } from "@/components/sections/Eventos";
import { Sede } from "@/components/sections/Sede";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <TrustBand />
        <UseCases />
        <Tournaments />
        <Eventos />
        <Sede />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
