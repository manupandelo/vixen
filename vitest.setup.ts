import "@testing-library/jest-dom/vitest";
import { createElement } from "react";
import type { ImgHTMLAttributes } from "react";
import { vi } from "vitest";

type NextImageMockProps = ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  src?: string | { src: string };
};

function normalizeImageSrc(src: NextImageMockProps["src"]): string | undefined {
  if (typeof src === "string" || typeof src === "undefined") {
    return src;
  }

  if (src && typeof src === "object" && typeof src.src === "string") {
    return src.src;
  }

  return undefined;
}

vi.mock("next/image", () => ({
  default: ({
    alt = "",
    fill: _fill,
    priority: _priority,
    sizes: _sizes,
    ...props
  }: NextImageMockProps) =>
    createElement("img", {
      ...props,
      src: normalizeImageSrc(props.src),
      alt,
    }),
}));
