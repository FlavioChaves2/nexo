"use client";

import Link from "next/link";
import { startTransition, useActionState, useState, type FormEvent } from "react";
import { login, register, type FormState } from "@/app/actions/auth";
import { shrinkInput } from "@/lib/shrink-images";
import { Icon } from "./Icon";

export function AuthForm({ mode, next }: { mode: "login" | "register"; next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "login" ? login : register, undefined);
  const other = mode === "login" ? "/cadastro" : "/entrar";
  const [preview, setPreview] = useState<string | null>(null);
  // Envia sem deixar o React limpar o formulário: se der erro, o que a pessoa digitou (e a foto) continua lá.
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };

  return (
    <form action={action} onSubmit={submit} className="panel box">
      <input type="hidden" name="next" value={next} />
      {mode === "register" && (
        <div className="seller-mini">
          {preview ? <img className="avatar xl" src={preview} alt="" /> : <span className="avatar xl"><Icon name="camera" /></span>}
          <label className="file-drop" style={{ flex: 1 }}>
            <Icon name="camera" />
            <span className="small">{preview ? "Trocar foto" : "Foto de perfil (opcional)"} · JPG, PNG ou WEBP</span>
            <input type="file" name="avatar" accept="image/jpeg,image/png,image/webp" onChange={async (e) => { const f = await shrinkInput(e.currentTarget); setPreview(f ? URL.createObjectURL(f) : null); }} />
          </label>
        </div>
      )}
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
