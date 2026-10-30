"use client";

import { useActionState, useState, useTransition } from "react";
import { createTitleAction, deleteTitleAction, grantTitleAction, revokeTitleAction, type AdminState } from "@/app/actions/admin";
import { TitleBadge } from "@/components/SellerBadges";

function Feedback({ s }: { s: AdminState }) {
  if (s?.error) return <p className="alert" role="alert">{s.error}</p>;
  if (s?.ok) return <p className="note">{s.ok}</p>;
  return null;
}

const COLORS = ["#C5F04A", "#F5C542", "#4EA1FF", "#B57BFF", "#FF6B8A", "#3DDC97", "#FF9A3C", "#E6E6E6"];

export function TitleCreate() {
  const [state, run, pending] = useActionState(createTitleAction, undefined);
  const [v, setV] = useState({ name: "", emoji: "🏅", color: COLORS[2], description: "" });
  return (
    <form action={run} className="panel box" key={state?.ok}>
      <h3>Novo título</h3>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="t-name">Nome</label>
          <input className="input" id="t-name" name="name" required maxLength={24} placeholder="Parceiro oficial" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="t-emoji">Emoji</label>
          <input className="input" id="t-emoji" name="emoji" maxLength={4} placeholder="🏅" value={v.emoji} onChange={(e) => setV({ ...v, emoji: e.target.value })} />
        </div>
        <div className="field full">
          <span className="label">Cor</span>
          <div className="title-colors">
            {COLORS.map((c) => (
              <label key={c} style={{ background: c }} className={v.color === c ? "on" : undefined} aria-label={`Cor ${c}`}>
                <input type="radio" name="color" value={c} checked={v.color === c} onChange={() => setV({ ...v, color: c })} />
              </label>
            ))}
          </div>
        </div>
        <div className="field full">
          <label htmlFor="t-desc">Descrição (aparece ao passar o dedo/mouse)</label>
          <input className="input" id="t-desc" name="description" maxLength={120} placeholder="Vendedor parceiro da Nexo" value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} />
        </div>
      </div>
      <div className="row" style={{ justifyContent: "flex-start", gap: 10 }}>
        <span className="muted small">Prévia:</span>
        <TitleBadge t={{ name: v.name || "Nome do título", emoji: v.emoji || "🏅", color: v.color, description: v.description }} />
      </div>
      <Feedback s={state} />
      <div><button className="btn btn-primary" type="submit" disabled={pending}>Criar título</button></div>
    </form>
  );
}

export function TitleGrant({ titles }: { titles: { id: string; name: string; emoji: string; full: boolean }[] }) {
  const [state, run, pending] = useActionState(grantTitleAction, undefined);
  return (
    <form action={run} className="panel box" key={state?.ok}>
      <h3>Dar título para alguém</h3>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="g-user">Usuário ou e-mail</label>
          <input className="input" id="g-user" name="user" required placeholder="nomedousuario" autoComplete="off" />
        </div>
        <div className="field">
          <label htmlFor="g-title">Título</label>
          <select className="input" id="g-title" name="titleId" required>
            {titles.map((t) => <option key={t.id} value={t.id} disabled={t.full}>{t.emoji} {t.name}{t.full ? " (vagas esgotadas)" : ""}</option>)}
          </select>
        </div>
      </div>
      <Feedback s={state} />
      <div><button className="btn btn-primary" type="submit" disabled={pending}>Dar título</button></div>
    </form>
  );
}

export function RevokeTitle({ titleId, userId, username }: { titleId: string; userId: string; username: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  return (
    <button
      type="button"
      className="title-holder"
      disabled={pending}
      title={err || `Tirar o título de ${username}`}
      onClick={() => {
        if (!confirm(`Tirar este título de ${username}?`)) return;
        start(async () => setErr((await revokeTitleAction(titleId, userId))?.error ?? ""));
      }}
    >
      {username} <span aria-hidden="true">×</span>
    </button>
  );
}

export function DeleteTitle({ titleId, name }: { titleId: string; name: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  return (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        disabled={pending}
        onClick={() => {
          if (!confirm(`Apagar o título ${name}? Ele sai de todo mundo que tem.`)) return;
          start(async () => setErr((await deleteTitleAction(titleId))?.error ?? ""));
        }}
      >
        Apagar
      </button>
      {err && <span className="error">{err}</span>}
    </>
  );
}
