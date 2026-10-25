"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, type FormState } from "@/app/actions/auth";

export function AuthForm({ mode, next }: { mode: "login" | "register"; next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "login" ? login : register, undefined);
  const other = mode === "login" ? "/cadastro" : "/entrar";

  return (
    <form action={action} className="panel box">
      <input type="hidden" name="next" value={next} />
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      {mode === "register" && (
        <div className="field">
          <label htmlFor="username">Nome de usuário</label>
          <input className="input" id="username" name="username" autoComplete="username" required minLength={3} maxLength={20} />
          <span className="hint">Aparece na sua loja e nos anúncios.</span>
        </div>
      )}
      <div className="field">
        <label htmlFor="password">Senha</label>
        <input
          className="input"
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={mode === "register" ? 8 : undefined}
        />
      </div>
      {mode === "login" && <Link className="linkish small" href="/esqueci-senha" style={{ justifySelf: "end" }}>Esqueci a senha</Link>}
      {state?.error && <p className="alert" role="alert">{state.error}</p>}
      <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
        {pending ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
      </button>
      <p className="muted small" style={{ textAlign: "center" }}>
        {mode === "login" ? "Ainda não tem conta? " : "Já tem conta? "}
        <Link className="lime" href={`${other}?next=${encodeURIComponent(next)}`}>
          {mode === "login" ? "Cadastre-se" : "Entrar"}
        </Link>
      </p>
    </form>
  );
}
