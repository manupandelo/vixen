export type NavLink = { label: string; href: string };
export type Discipline = {
  id: "futbol" | "padel";
  title: string;
  blurb: string;
  href: string;
};

const phoneNumber = "5491137730713";
const phoneHref = `tel:+${phoneNumber}`;
const whatsappNumber = "5491137730713";
const padelReservationUrl = "https://atcsports.io/venues/vixen-club-gba";
const whatsappUrl = `https://wa.me/${whatsappNumber}`;

function buildSiteWhatsAppUrl(message: string): string {
  return `${whatsappUrl}?text=${encodeURIComponent(message)}`;
}

export const content = {
  site: {
    name: "Vixen Club",
    phoneDisplay: "(011) 15 3773 0713",
    phoneNumber,
    phoneHref,
    email: "info@vixen.com.ar",
    address: "Las Azucenas 3941, Alberti, Pilar, Buenos Aires",
    whatsappNumber,
    whatsappUrl,
    padelReservationUrl,
    instagram: "https://instagram.com/vixen.club",
    facebook: "https://facebook.com/vixen.club",
    sponsors: ["PUMA"],
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
    title: "Club, canchas y torneos en un solo lugar",
    subtitle:
      "Fútbol 7, pádel, eventos y un predio activo para jugar, competir y encontrarte.",
    image: {
      src: "/vixen1.jpg",
      alt: "Vista general del predio de Vixen Club con canchas y sector social",
    },
    primaryCta: {
      label: "Hablar por WhatsApp",
      href: buildSiteWhatsAppUrl("Hola! Quiero más info sobre Vixen Club."),
      message: "Hola! Quiero más info sobre Vixen Club.",
    },
    secondaryCta: {
      label: "Reservá pádel en ATC",
      href: padelReservationUrl,
      message: "Hola! Quiero reservar una cancha.",
    },
    proof: [
      "Pilar / Del Viso",
      "Pádel en ATC",
      "Fútbol 7",
      "Torneos y eventos",
    ],
  },
  trustPills: [
    "Pilar / Del Viso",
    "Pádel",
    "Fútbol 7",
    "Torneos",
    "Estacionamiento",
    "Reservas en ATC",
  ],
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
  useCases: {
    futbol: {
      title: "Fútbol 7",
      body: "Torneos, inscripciones y consultas generales por WhatsApp para resolver rápido con el club.",
      cta: {
        label: "Hablar por WhatsApp",
        href: buildSiteWhatsAppUrl(
          "Hola! Quiero más info sobre fútbol 7 en Vixen Club.",
        ),
      },
    },
    padel: {
      title: "Pádel",
      body: "Reservá tus turnos en ATC y usá WhatsApp para consultas sobre clases, torneos o el predio.",
      primaryCta: {
        label: "Reservá pádel en ATC",
        href: padelReservationUrl,
      },
      secondaryCta: {
        label: "Consultar por WhatsApp",
        href: buildSiteWhatsAppUrl(
          "Hola! Quiero más info sobre pádel en Vixen Club.",
        ),
      },
    },
  },
  tournaments: {
    title: "Copas, torneos y movimiento real",
    body: "Vixen no es solo alquiler de canchas: hay competencia, fechas y una comunidad activa alrededor del club.",
    image: {
      src: "/copas_trofeos.jpg",
      alt: "Copas y trofeos exhibidos en Vixen Club",
    },
    cta: {
      label: "Quiero jugar un torneo",
      href: buildSiteWhatsAppUrl(
        "Hola! Quiero sumarme a un torneo en Vixen Club.",
      ),
    },
  },
  eventos: {
    title: "Eventos y Bar",
    body: "Espacio social para extender la jornada con bar, quincho y formatos privados dentro del club.",
  },
  sede: {
    title: "La Sede",
    addressLabel: "Las Azucenas 3941, Alberti, Pilar",
    mapQuery: "Las Azucenas 3941, Alberti, Pilar, Buenos Aires",
    amenities: [
      "Fútbol 7",
      "Pádel",
      "Wi-Fi",
      "Vestuarios",
      "Estacionamiento",
      "Ayuda médica",
      "Torneos",
      "Eventos privados",
      "Bar",
      "Quincho",
    ],
  },
} as const;
