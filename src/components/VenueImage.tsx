import Image from "next/image";

export function VenueImage({
  src,
  alt,
  priority = false,
  overlay = false,
  objectPosition = "center",
  className = "",
}: {
  src: string;
  alt: string;
  priority?: boolean;
  overlay?: boolean;
  objectPosition?: string;
  className?: string;
}) {
  return (
    <div className={`venue-frame w-full max-w-full ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover"
        style={{ objectPosition }}
      />
      {overlay ? <div aria-hidden="true" className="venue-frame__overlay" /> : null}
    </div>
  );
}
