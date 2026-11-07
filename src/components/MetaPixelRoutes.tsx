"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { metaTrack } from "@/lib/tracking";

/** Navegação dentro do site não recarrega a página: conta cada troca de página como PageView. */
export function MetaPixelRoutes() {
  const path = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; } // a primeira já vem do código base do Pixel
    metaTrack("PageView");
  }, [path]);
  return null;
}
