"use client";

import { useActionState, useState } from "react";
import { answerQuestion, askQuestion, updateProfile, type SocialState } from "@/app/actions/social";
import { imageUrl } from "@/lib/images-url";
import { Icon } from "./Icon";
import { shrinkInput } from "@/lib/shrink-images";
import { useKeepForm } from "@/lib/use-keep-form";

function Feedback({ s }: { s: SocialState }) {
  if (s?.error) return <p className="alert" role="alert">{s.error}</p>;
  if (s?.ok) return <p className="note">{s.ok}</p>;
  return null;
}

export function AskForm({ listingId }: { listingId: string }) {
  const [state, run, pending] = useActionState(askQuestion.bind(null, listingId), undefined);
  const keepRun = useKeepForm(state, run);
  return (
    <form action={run} {...keepRun} className="stack" style={{ gap: 8 }} key={state?.ok}>
      <textarea className="input" name="body" rows={2} maxLength={500} required placeholder="Pergunte antes de comprar. Ex.: a conta tem e-mail trocável?" aria-label="Sua pergunta" />
      <Feedback s={state} />
      <div><button className="btn btn-ghost btn-sm" type="submit" disabled={pending}><Icon name="chat" />Perguntar</button></div>
    </form>
  );
}

export function AnswerForm({ questionId }: { questionId: string }) {
  const [state, run, pending] = useActionState(answerQuestion.bind(null, questionId), undefined);
  const keepRun = useKeepForm(state, run);
  if (state?.ok) return <Feedback s={state} />;
  return (
    <form action={run} {...keepRun} className="copy-row">
      <input className="input" name="answer" required maxLength={1000} placeholder="Responder publicamente" aria-label="Resposta" />
      <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>Responder</button>
      {state?.error && <span className="error">{state.error}</span>}
    </form>
  );
}

export function GalleryViewer({ ids, alt }: { ids: string[]; alt: string }) {
  const [i, setI] = useState(0);
  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="media">
        <img className="photo fade-in" key={ids[i]} src={imageUrl(ids[i])} alt={alt} />
        {ids.length > 1 && (
          <>
            <button type="button" className="g-nav prev" aria-label="Foto anterior" onClick={() => setI((i - 1 + ids.length) % ids.length)}>‹</button>
            <button type="button" className="g-nav next" aria-label="Próxima foto" onClick={() => setI((i + 1) % ids.length)}>›</button>
            <span className="g-count">{i + 1} / {ids.length}</span>
          </>
        )}
      </div>
      {ids.length > 1 && (
        <div className="gallery">
          {ids.map((id, n) => (
            <button key={id} type="button" className={n === i ? "on" : ""} onClick={() => setI(n)} aria-label={`Foto ${n + 1}`}>
              <img src={imageUrl(id, true)} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProfileForm({ username, storeName, bio, avatarId }: { username: string; storeName: string; bio: string; avatarId: string | null }) {
  const [state, run, pending] = useActionState(updateProfile, undefined);
  const keepRun = useKeepForm(state, run);
  const [preview, setPreview] = useState(avatarId ? imageUrl(avatarId) : null);
  return (
    <form action={run} {...keepRun} className="panel box">
      <div className="seller-mini">
        {preview ? <img className="avatar xl" src={preview} alt="" /> : <span className="avatar xl">{(storeName || username)[0]}</span>}
        <label className="file-drop" style={{ flex: 1 }}>
          <Icon name="camera" />
          <span className="small">Foto de perfil (JPG, PNG ou WEBP · até 3 MB)</span>
          <input type="file" name="avatar" accept="image/jpeg,image/png,image/webp" onChange={async (e) => { const f = await shrinkInput(e.currentTarget); if (f) setPreview(URL.createObjectURL(f)); }} />
        </label>
      </div>
      {avatarId && <label className="check"><input type="checkbox" name="removeAvatar" />Remover foto atual</label>}
      <div className="field">
        <label htmlFor="storeName">Nome da loja</label>
        <input className="input" id="storeName" name="storeName" maxLength={40} defaultValue={storeName} placeholder={username} />
        <span className="hint">Aparece nos anúncios no lugar de “{username}”. Seu link continua /loja/{username}.</span>
      </div>
      <div className="field">
        <label htmlFor="bio">Sobre a loja</label>
        <textarea className="input" id="bio" name="bio" rows={4} maxLength={500} defaultValue={bio} placeholder="O que você vende, como entrega, horários de atendimento…" />
      </div>
      <Feedback s={state} />
      <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar perfil"}</button>
    </form>
  );
}
