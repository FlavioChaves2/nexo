"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";

type Msg = { id: string; senderId: string | null; body: string; at: string };

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

/** Chat do pedido. Busca mensagens novas a cada 4 s (trocar por tempo real depois). */
/** Atalhos de mensagem conforme quem fala e em que ponto o pedido está. */
function quickReplies(role: "buyer" | "seller", status: string) {
  if (role === "buyer") {
    if (status === "PAGO") return ["Olá! Já paguei, pode entregar?", "Qual o prazo de entrega?"];
    if (status === "ENTREGUE") return ["Recebi, obrigado!", "Não consegui acessar, pode me ajudar?"];
    return [];
  }
  if (status === "PAGO") return ["Olá! Já estou preparando sua entrega.", "Entrego em poucos minutos."];
  if (status === "ENTREGUE") return ["Entregue! Confira e confirme, por favor.", "Qualquer dúvida é só chamar."];
  return [];
}

export function Chat({ code, meId, other, role, status, initial }: { code: string; meId: string; other: string; role: "buyer" | "seller"; status: string; initial: Msg[] }) {
  const seen = useRef(new Set(initial.map((m) => m.id)));
  const [msgs, setMsgs] = useState(initial);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const last = useRef(initial.at(-1)?.at ?? "");
  const closed = status === "CANCELADO";

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [msgs.length]);

  useEffect(() => {
    const add = (list: Msg[]) => {
      if (!list.length) return;
      last.current = list.at(-1)!.at;
      setMsgs((m) => [...m, ...list.filter((n) => !m.some((x) => x.id === n.id))]);
    };

    // Tempo real (SSE). Se o navegador ou a rede não suportar, cai para consulta a cada 4 s.
    let poll: ReturnType<typeof setInterval> | undefined;
    const startPolling = () => {
      if (poll) return;
      poll = setInterval(async () => {
        if (document.hidden) return;
        const res = await fetch(`/api/pedidos/${code}/mensagens?after=${encodeURIComponent(last.current)}`, { cache: "no-store" });
        if (!res.ok) return;
        const data: { messages: Msg[]; status: string } = await res.json();
        add(data.messages);
        if (data.status !== status) router.refresh();
      }, 4000);
    };

    if (typeof EventSource === "undefined") {
      startPolling();
      return () => clearInterval(poll);
    }
    let failures = 0;
    const es = new EventSource(`/api/pedidos/${code}/stream?after=${encodeURIComponent(last.current)}`);
    es.addEventListener("message", (e) => {
      failures = 0;
      add([JSON.parse((e as MessageEvent).data)]);
    });
    es.addEventListener("status", (e) => {
      if (JSON.parse((e as MessageEvent).data) !== status) router.refresh();
    });
    es.onerror = () => {
      if (++failures >= 3) {
        es.close();
        startPolling();
      }
    };
    return () => {
      es.close();
      clearInterval(poll);
    };
  }, [code, status, router]);

  async function send(e: React.FormEvent, preset?: string) {
    e.preventDefault();
    const body = (preset ?? text).trim();
    if (!body) return;
    setText("");
    setError("");
    const res = await fetch(`/api/pedidos/${code}/mensagens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "Não foi possível enviar. Tente de novo.");
      if (!preset) setText(body);
      return;
    }
    const msg: Msg = await res.json();
    last.current = msg.at;
    setMsgs((m) => [...m, msg]);
  }

  return (
    <div className="panel chat">
      <div className="chat-head">
        <span className="avatar chat-avatar">{other[0]}</span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <b>{other}</b> <span className="online" aria-hidden="true" />
          <div className="muted" style={{ fontSize: 12 }}>{role === "buyer" ? "Vendedor" : "Comprador"} · conversa gravada para sua segurança</div>
        </div>
        <span className="chip chat-safe"><Icon name="shield" />Protegido</span>
      </div>
      <div className="msgs" ref={box} aria-live="polite">
        {msgs.map((m) => {
          const kind = m.senderId === null ? "sys" : m.senderId === meId ? "me" : "them";
          const fresh = !seen.current.has(m.id);
          return (
            <div key={m.id} className={`msg ${kind}${fresh ? " fresh" : ""}`}>
              {kind === "sys" && <Icon name="shield" />}
              <span>{m.body}</span>
              <time>{hhmm(m.at)}</time>
            </div>
          );
        })}
      </div>
      {!closed && quickReplies(role, status).length > 0 && (
        <div className="quick">
          {quickReplies(role, status).map((q) => (
            <button key={q} type="button" onClick={(e) => send(e, q)}>{q}</button>
          ))}
        </div>
      )}
      <form className="chat-form" onSubmit={send}>
        <input
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={closed ? "Pedido cancelado" : `Escreva para ${other}…`}
          maxLength={1000}
          disabled={closed}
          aria-label="Mensagem"
        />
        <button className="btn btn-primary" type="submit" aria-label="Enviar" disabled={closed || !text.trim()}><Icon name="send" /></button>
      </form>
      {error && <p className="error" style={{ padding: "0 12px 12px" }}>{error}</p>}
    </div>
  );
}
