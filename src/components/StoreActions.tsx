"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleFollow } from "@/app/actions/store";
import { Icon } from "./Icon";

/** Seguir a loja e compartilhar o link de divulgação do vendedor. */
export function StoreActions({ sellerId, path, shareUrl, name, following, followers, loggedIn, mine }: { sellerId: string; path: string; shareUrl: string; name: string; following: boolean; followers: number; loggedIn: boolean; mine: boolean }) {
  const [state, setState] = useState({ following, followers, error: "" });
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  const follow = () =>
    start(async () => {
      const r = await toggleFollow(sellerId);
      setState({ following: r.following, followers: r.followers, error: r.error ?? "" });
    });

  async function share() {
    const url = new URL(shareUrl, location.origin).toString();
    try {
      if (navigator.share) await navigator.share({ title: `${name} na Nexo`, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      /* a pessoa fechou o compartilhamento */
    }
  }

  return (
    <div className="store-actions">
      {!mine && (loggedIn ? (
        <button type="button" className={`btn ${state.following ? "btn-ghost" : "btn-primary"} btn-sm`} onClick={follow} disabled={pending} aria-pressed={state.following}>
          <Icon name={state.following ? "check" : "heart"} />{state.following ? "Seguindo" : "Seguir loja"}
        </button>
      ) : (
        <Link className="btn btn-primary btn-sm" href={`/entrar?next=${encodeURIComponent(path)}`}><Icon name="heart" />Seguir loja</Link>
      ))}
      <button type="button" className="btn btn-ghost btn-sm" onClick={share}><Icon name="send" />{copied ? "Link copiado" : "Compartilhar"}</button>
      <span className="muted small" aria-live="polite">{state.followers} {state.followers === 1 ? "seguidor" : "seguidores"}</span>
      {state.error && <span className="small" role="alert" style={{ color: "var(--danger)" }}>{state.error}</span>}
    </div>
  );
}
