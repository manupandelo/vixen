import { PageState } from "@/components/PageState";

export default function TournamentNotFound() {
  return (
    <PageState
      code="404"
      eyebrow="Torneo no encontrado"
      title="Este torneo no está disponible"
      description="El enlace puede estar desactualizado o el torneo ya no está publicado. Consultá los torneos disponibles para volver a la cancha."
      fallbackHref="/futbol/torneos"
      fallbackLabel="Ver todos los torneos"
    />
  );
}
