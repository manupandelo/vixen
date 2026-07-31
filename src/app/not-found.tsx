import { PageState } from "@/components/PageState";

export default function NotFound() {
  return (
    <PageState
      code="404"
      eyebrow="Página no encontrada"
      title="No encontramos esta página"
      description="La dirección puede estar mal escrita o la página ya no está disponible. Volvé al inicio para seguir recorriendo Vixen Club."
      fallbackHref="/"
      fallbackLabel="Volver al inicio"
    />
  );
}
