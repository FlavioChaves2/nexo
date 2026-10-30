"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SupportMsg } from "@/lib/support";
import { Icon } from "./Icon";

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const QUICK_USER = ["Ainda estou aqui", "Resolvido, obrigado!"];
const QUICK_STAFF = ["Olá! Sou da equipe Nexo, já estou vendo seu caso.", "Pode me mandar o código do pedido?", "Mais alguma dúvida?"];

/** Chat com o suporte, nos dois lados (cliente e equipe). Busca mensagens novas a cada 4 s com a aba visível. */
export function SupportChat({ ticketId, staffView, open, initial, customer }: { ticketId: string; staffView: boolean; open: boolean; initial: SupportMsg[]; customer: string }) {
  const seen = useRef(new Set(initial.map((m) => m.id)));
  const [msgs, setMsgs] = useState(initial);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const last = useRef(initial.at(-1)?.at ?? "");

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [msgs.length]);

  useEffect(() => {
    if (!open) return;
    let busy = false;
    const check = async () => {
      if (document.hidden || busy) return;
      busy = true;
      try {
        const res = await fetch(`/api/suporte/${ticketId}/mensagens?after=${encodeURIComponent(last.current)}`, { cache: "no-store" });
        if (!res.ok) return;
        const data: { messages: SupportMsg[]; status: string } = await res.json();
        if (data.messages.length) {
          last.current = data.messages.at(-1)!.at;
          setMsgs((m) => [...m, ...data.messages.filter((n) => !m.some((x) => x.id === n.id))]);
        }
        if (data.status !== "ABERTO") router.refresh();
      } catch {
        /* sem internet: tenta no próximo ciclo */
      } finally {
        busy = false;
      }
    };
    const poll = setInterval(check, 4000);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(poll);
      document.removeEventListener("visibilitychange", check);
    };
  }, [ticketId, open, router]);

  async function send(e: React.FormEvent, preset?: string) {
    e.preventDefault();
    const body = (preset ?? text).trim();
    if (!body) return;
    setText("");
    setError("");
    const res = await fetch(`/api/suporte/${ticketId}/mensagens`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "Não foi possível enviar. Tente de novo.");
      if (!preset) setText(body);
      return;
    }
    const msg: SupportMsg = await res.json();
    last.current = msg.at;
    setMsgs((m) => (m.some((x) => x.id === msg.id) ? m : [...m, msg]));
  }

  const quick = staffView ? QUICK_STAFF : QUICK_USER;
  return (
    <div className="panel chat sup-chat">
      <div className="chat-head">
        {staffView ? <span className="avatar chat-avatar">{customer[0]}</span> : <span className="sup-av" aria-hidden="true"><Icon name="headset" /></span>}
        <div style={{ minWidth: 0, flex: 1 }}>
          <b>{staffView ? customer : "Suporte Nexo"}</b> {open && <span className="online" aria-hidden="true" />}
          <div className="muted" style={{ fontSize: 12 }}>{staffView ? "Cliente · responda como Equipe Nexo" : open ? "Atendimento humano · conversa gravada" : "Conversa encerrada"}</div>
        </div>
        <span className="chip chat-safe"><Icon name="shield" />Oficial</span>
      </div>
      <div className="msgs" ref={box} aria-live="polite">
        {msgs.map((m) => {
          const fromTeam = m.senderId === null || m.staff;
          const mine = staffView ? fromTeam && m.senderId !== null : !fromTeam;
          const kind = m.senderId === null ? "sys" : mine ? "me" : "them";
          return (
            <div key={m.id} className={`msg ${kind}${seen.current.has(m.id) ? "" : " fresh"}`}>
              {kind === "sys" && <Icon name="spark" />}
              <span>
                {kind === "them" && m.staff && <b className="sup-name">Equipe Nexo</b>}
                {m.body}
              </span>
              <time>{hhmm(m.at)}</time>
            </div>
          );
        })}
      </div>
      {open && (
        <>
          <div className="quick">
            {quick.map((q) => <button key={q} type="button" onClick={(e) => send(e, q)}>{q}</button>)}
          </div>
          <form className="chat-form" onSubmit={send}>
            <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={staffView ? `Responder ${customer}…` : "Escreva para o suporte…"} maxLength={1500} aria-label="Mensagem" />
            <button className="btn btn-primary" type="submit" aria-label="Enviar" disabled={!text.trim()}><Icon name="send" /></button>
          </form>
        </>
      )}
      {error && <p className="error" style={{ padding: "0 12px 12px" }}>{error}</p>}
    </div>
  );
}
