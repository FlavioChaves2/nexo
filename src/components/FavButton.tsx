"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFavorite } from "@/app/actions/favorites";
import { Icon } from "./Icon";

export function FavButton({ listingId, initial }: { listingId: string; initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <button
      className="fav"
      type="button"
      aria-pressed={on}
      aria-label={on ? "Remover dos favoritos" : "Favoritar"}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await toggleFavorite(listingId);
          if (res.needLogin) {
            router.push(`/entrar?next=${encodeURIComponent(location.pathname + location.search)}`);
            return;
          }
          setOn(res.on);
          router.refresh();
        })
      }
    >
      <Icon name="heart" />
    </button>
  );
}
