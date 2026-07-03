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
    title: "Vixen Club, todo el día.",
    subtitle: "Fútbol 7, pádel y vida de club en Pilar.",
    image: {
      src: "/vixen1.jpg",
      alt: "Vista general del predio de Vixen Club con canchas y sector social",
    },
    primaryCta: {
      label: "Ver actividades",
      href: "/#disciplinas",
      message: "",
    },
    secondaryCta: {
      label: "Reservá pádel",
      href: padelReservationUrl,
      message: "Hola! Quiero reservar una cancha.",
    },
    proof: [
      "Pilar / Del Viso",
      "Pádel",
      "Fútbol 7",
      "Torneos",
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
      "Jugá, reservá cancha o sumate a los torneos de fútbol 7 del club. Formato 7 vs 7, categorías activas y ritmo real de predio.",
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
      {
        title: "Alquiler de canchas",
        body: "Turnos para jugar suelto, entrenar o resolver un partido entre amigos.",
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
      "Canchas profesionales de blindex y césped sintético. Reservá tu turno, tomá clases o anotate en nuestros torneos americanos.",
    facilities: [
      {
        title: "Canchas Profesionales",
        body: "Estructura de blindex panorámico y césped sintético premium para asegurar el mejor pique.",
      },
      { 
        title: "Iluminación LED", 
        body: "Focos de última generación para jugar de noche sin sombras ni reflejos molestos." 
      },
      {
        title: "El Tercer Tiempo",
        body: "Sector exclusivo con bar, mesas y vista panorámica para disfrutar después del partido.",
      },
    ],
    cta: {
      label: "Reservar por ATC",
      message: "Hola! Quiero reservar una cancha de pádel.",
    },
  },
  useCases: {
    futbol: {
      title: "Fútbol 7",
      body: "La parte más competitiva y social del club: resolvés una cancha, armás equipo o entrás al calendario desde un mismo canal.",
      cta: {
        label: "Hablar por WhatsApp",
        href: buildSiteWhatsAppUrl(
          "Hola! Quiero más info sobre fútbol 7 en Vixen Club.",
        ),
      },
    },
    padel: {
      title: "Pádel",
      body: "Más directo y más rápido: resolvés el turno online y el club acompaña clases, americanos y consultas.",
      primaryCta: {
        label: "Reservá pádel",
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
    body: "Una parte real del club para quedarse después de jugar, organizar grupos o sumar una fecha con ritmo propio.",
  },
  sede: {
    title: "La Sede",
    addressLabel: "Las Azucenas 3941, Alberti, Pilar",
    mapQuery: "Las Azucenas 3941, Alberti, Pilar, Buenos Aires",
    amenities: [
      "Wi-Fi",
      "Vestuarios",
      "Estacionamiento",
      "Ayuda médica",
    ],
  },
} as const;
