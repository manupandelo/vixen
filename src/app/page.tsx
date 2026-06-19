import { Hero } from "@/components/sections/Hero";
import { UseCases } from "@/components/sections/UseCases";
import { Tournaments } from "@/components/sections/Tournaments";
import { Eventos } from "@/components/sections/Eventos";
import { Sede } from "@/components/sections/Sede";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <UseCases />
      <Tournaments />
      <Eventos />
      <Sede />
    </main>
  );
}
