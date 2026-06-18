export type NavLink = { label: string; href: string };
export type Discipline = {
  id: "futbol" | "padel";
  title: string;
  blurb: string;
  href: string;
};

export const content = {
  site: {
    name: "Vixen Club",
    phoneDisplay: "(011) 15 3773 0713",
    email: "info@vixen.com.ar",
    address: "Las Azucenas 3941, Alberti, Pilar, Buenos Aires",
    whatsappNumber: "5491137730713",
    instagram: "https://instagram.com/vixen.club",
    facebook: "https://facebook.com/vixen.club",
    sponsor: "PUMA",
  },
  nav: [
    { label: "Fútbol", href: "/futbol" },
    { label: "Pádel", href: "/padel" },
    { label: "Eventos", href: "/#eventos" },
    { label: "Sede", href: "/#sede" },
    { label: "Contacto", href: "/#contacto" },
  ] as NavLink[],
  hero: {
    kicker: "Pilar · Buenos Aires",
    title: "Viví el deporte\nen Vixen",
    subtitle:
      "Torneos de fútbol 7 y pádel, clases, alquiler de canchas y eventos. Inscripción temporada 2026 abierta.",
    primaryCta: {
      label: "Inscripción 2026",
      message: "Hola! Quiero inscribirme en la temporada 2026.",
    },
    secondaryCta: {
      label: "Reservar cancha",
      message: "Hola! Quiero reservar una cancha.",
    },
  },
  disciplines: [
    {
      id: "futbol",
      title: "Fútbol 7",
      blurb: "Torneos masculino y femenino, formato 7 vs 7. Sumá tu equipo.",
      href: "/futbol",
    },
    {
      id: "padel",
      title: "Pádel",
      blurb: "Torneos americanos, clases y alquiler de canchas.",
      href: "/padel",
    },
  ] as Discipline[],
  futbol: {
    title: "Fútbol 7",
    intro:
      "Jugá en las mejores canchas de Pilar. Torneos masculino y femenino, formato 7 vs 7, todos los niveles.",
    points: [
      {
        title: "Masculino y Femenino",
        body: "Categorías para todos. Armá tu equipo o sumate a uno.",
      },
      {
        title: "Formato 7 vs 7",
        body: "Partidos dinámicos en canchas de césped sintético.",
      },
      {
        title: "Copas y torneos",
        body: "Fixture organizado, premios y la mejor competencia.",
      },
    ],
    cta: {
      label: "Inscripción 2026",
      message: "Hola! Quiero anotar mi equipo de fútbol 7 para 2026.",
    },
  },
  padel: {
    title: "Pádel",
    intro:
      "Torneos americanos, clases con profes y alquiler de canchas. Para jugar suelto o competir.",
    points: [
      {
        title: "Torneos americanos",
        body: "Diversión y juego asegurado para todos los niveles.",
      },
      { title: "Clases", body: "Mejorá tu juego con nuestros profesores." },
      {
        title: "Alquiler de canchas",
        body: "Reservá tu turno por WhatsApp en segundos.",
      },
    ],
    cta: {
      label: "Reservar cancha",
      message: "Hola! Quiero reservar una cancha de pádel.",
    },
  },
  eventos: {
    title: "Eventos y Bar",
    body: "Cumpleaños, despedidas, after del partido. Nuestro espacio con bar es ideal para juntarte después de jugar.",
    cta: {
      label: "Consultar por un evento",
      message: "Hola! Quiero consultar por un evento.",
    },
  },
  sede: {
    title: "La Sede",
    addressLabel: "Las Azucenas 3941, Alberti, Pilar",
    mapQuery: "Las Azucenas 3941, Alberti, Pilar, Buenos Aires",
    amenities: [
      "Canchas de fútbol 7",
      "Canchas de pádel",
      "Bar y eventos",
      "Estacionamiento",
    ],
  },
} as const;
