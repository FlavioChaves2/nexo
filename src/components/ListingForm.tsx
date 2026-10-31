"use client";

import { useActionState, useEffect, useState } from "react";
import type { Game } from "@prisma/client";
import { createListing, updateListing, type ListingFormState } from "@/app/actions/listings";
import { LISTING_TYPES, TYPE_LABEL, confirmDays, daysLabel } from "@/lib/constants";
import { imageUrl } from "@/lib/images-url";
import { ListingCard } from "./ListingCard";
import { shrinkInput } from "@/lib/shrink-images";
import { Icon } from "./Icon";
import { GamePicker } from "./GamePicker";
import { useKeepForm } from "@/lib/use-keep-form";

const DRAFT_KEY = "nexo-rascunho-anuncio";
const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const reais = (c: number | null | undefined) => (c ? (c / 100).toFixed(2).replace(".", ",") : "");

function toCents(v: string) {
  const s = v.trim();
  const n = Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export type EditableListing = {
  id: string; gameSlug: string; type: string; title: string; description: string; priceCents: number;
  oldPriceCents: number | null; stock: number; autoDelivery: boolean; images: { id: string }[];
};

type Seller = { username: string; storeName: string; avatarId: string | null; verification: string; completedSales: number; ratingSum: number; ratingCount: number };

export function ListingForm({ games, seller, feeBps, edit }: { games: Game[]; seller: Seller; feeBps: number; edit?: EditableListing }) {
  const action = edit ? updateListing.bind(null, edit.id) : createListing;
  const [state, run, pending] = useActionState<ListingFormState, FormData>(action, undefined);
  const keepRun = useKeepForm(state, run);
  const [v, setV] = useState({
    gameSlug: edit?.gameSlug ?? games[0]?.slug ?? "",
    type: edit?.type ?? "CONTA",
    title: edit?.title ?? "",
    price: reais(edit?.priceCents),
    auto: edit?.autoDelivery ?? false,
  });
  const [photo, setPhoto] = useState<string | undefined>(edit?.images[0] ? imageUrl(edit.images[0].id) : undefined);
  // Rascunho do anúncio novo guardado neste aparelho: recarregar a página ou fechar sem querer não perde nada.
  const [draftNote, setDraftNote] = useState(false);
  const saveDraft = () => {
    const f = keepRun.ref.current;
    if (edit || !f) return;
    const d = new FormData(f);
    const draft = { gameSlug: v.gameSlug, type: v.type, title: v.title, price: v.price, description: String(d.get("description") ?? ""), oldPrice: String(d.get("oldPrice") ?? ""), stock: String(d.get("stock") ?? "") };
    try {
      if (draft.title || draft.description || draft.price) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch { /* sem armazenamento: segue sem rascunho */ }
  };
  const dropDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* idem */ }
  };
  useEffect(() => {
    if (edit) return;
    let draft: Record<string, string> | null = null;
    try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null"); } catch { /* rascunho estragado: ignora */ }
    const f = keepRun.ref.current;
    if (!draft || !f) return;
    setV((cur) => ({ ...cur, gameSlug: games.some((g) => g.slug === draft.gameSlug) ? draft.gameSlug : cur.gameSlug, type: draft.type || cur.type, title: draft.title ?? "", price: draft.price ?? "" }));
    for (const k of ["description", "oldPrice", "stock"] as const) {
      const el = f.elements.namedItem(k) as HTMLInputElement | null;
      if (el && draft[k]) el.value = draft[k];
    }
    setDraftNote(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!edit) saveDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v, state]);
  const cents = toCents(v.price);
  const fee = Math.round((cents * feeBps) / 10000);
  const game = games.find((g) => g.slug === v.gameSlug) ?? games[0];

  const preview = {
    id: "preview", sellerId: "", gameSlug: game.slug, game, seller, type: v.type,
    title: v.title || "Título do seu anúncio", description: "", glyph: null, priceCents: cents, oldPriceCents: null,
    stock: 1, autoDelivery: v.auto, featured: false, status: "ATIVO", moderationNote: "", soldCount: 0, reservedForId: null, orbitUntil: null, createdAt: new Date(),
  };

  return (
    <div className="two-col">
      <form action={run} {...keepRun} onSubmit={(e) => { dropDraft(); keepRun.onSubmit(e); }} onInput={saveDraft} className="panel box">
        {draftNote && (
          <div className="note" style={{ marginBottom: 14 }}>
            <Icon name="edit" />
            <span>Recuperamos o rascunho que você começou neste aparelho. <button type="button" className="linkish" onClick={() => { dropDraft(); location.reload(); }}>Começar do zero</button></span>
          </div>
        )}
        <div className="form-grid">
          <div className="field">
            <label htmlFor="gameSlug">Jogo</label>
            <GamePicker id="gameSlug" games={games} name="gameSlug" value={v.gameSlug} onChange={(s) => setV({ ...v, gameSlug: s })} />
          </div>
          <div className="field">
            <label htmlFor="type">Tipo</label>
            <select className="input" id="type" name="type" value={v.type} onChange={(e) => setV({ ...v, type: e.target.value })}>
              {LISTING_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
            </select>
          </div>
          <div className="field full">
            <label htmlFor="title">Título</label>
            <input className="input" id="title" name="title" maxLength={80} required placeholder="Ex.: Conta Valorant Diamante 3 · 22 skins" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} />
          </div>
          <div className="field full">
            <label htmlFor="description">Descrição</label>
            <textarea className="input" id="description" name="description" rows={5} required minLength={20} defaultValue={edit?.description} placeholder="O que vem no anúncio, como é a entrega, regras de garantia…" />
          </div>

          <div className="field full">
            <span className="label">Fotos (até 5 · JPG, PNG ou WEBP · 3 MB cada)</span>
            {edit && edit.images.length > 0 && (
              <>
                <div className="img-grid">
                  {edit.images.map((img) => (
                    <label key={img.id} title="Marque para remover">
                      <img src={imageUrl(img.id, true)} alt="" />
                      <input type="checkbox" name="removeImage" value={img.id} aria-label="Remover esta foto" />
                    </label>
                  ))}
                </div>
                <span className="hint">Marque as fotos que quer remover.</span>
              </>
            )}
            <label className="file-drop">
              <Icon name="camera" />
              <span className="small">Prints da conta, do inventário ou do item</span>
              <input
                type="file"
                name="images"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={async (e) => {
                  const f = await shrinkInput(e.currentTarget);
                  if (f) setPhoto(URL.createObjectURL(f));
                }}
              />
            </label>
          </div>

          <div className="field">
            <label htmlFor="price">Preço (R$)</label>
            <input className="input mono" id="price" name="price" inputMode="decimal" required placeholder="49,90" value={v.price} onChange={(e) => setV({ ...v, price: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="oldPrice">Preço &quot;de&quot; (opcional)</label>
            <input className="input mono" id="oldPrice" name="oldPrice" inputMode="decimal" placeholder="59,90" defaultValue={reais(edit?.oldPriceCents)} />
          </div>
          {!v.auto && (
            <div className="field">
              <label htmlFor="stock">Estoque</label>
              <input className="input mono" id="stock" name="stock" type="number" min={1} max={9999} defaultValue={edit?.stock ?? 1} />
            </div>
          )}
          {v.auto && <input type="hidden" name="stock" value="1" />}
          {!edit && (
            <label className="switch full" htmlFor="autoDelivery">
              <span>
                <b>Entrega automática</b>
                <br />
                <span className="hint">Cole os códigos e a Nexo entrega sozinha assim que o Pix for aprovado.</span>
              </span>
              <input type="checkbox" id="autoDelivery" name="autoDelivery" checked={v.auto} onChange={(e) => setV({ ...v, auto: e.target.checked })} />
            </label>
          )}
          {v.auto && (
            <div className="field full">
              <label htmlFor="codes">{edit ? `Adicionar códigos (estoque atual: ${edit.stock})` : "Códigos (um por linha)"}</label>
              <textarea className="input mono" id="codes" name="codes" rows={4} placeholder={"XXXX-XXXX-XXXX\nYYYY-YYYY-YYYY"} />
              <span className="hint">O estoque é a quantidade de códigos ainda não vendidos. Só o comprador vê o código, depois de pagar.</span>
            </div>
          )}
          <div className="calc full">
            <div><span>Preço de venda</span><span>{BRL.format(cents / 100)}</span></div>
            <div><span>Taxa Nexo ({(feeBps / 100).toString().replace(".", ",")}%)</span><span>−{BRL.format(fee / 100)}</span></div>
            <div className="total"><span>Você recebe por venda</span><span>{BRL.format((cents - fee) / 100)}</span></div>
          </div>
          {state?.error && <p className="alert full" role="alert">{state.error}</p>}
          <button className="btn btn-primary full" type="submit" disabled={pending}>
            {pending ? "Salvando…" : edit ? "Salvar alterações" : <>Publicar anúncio <Icon name="arrow" /></>}
          </button>
        </div>
      </form>
      <aside className="stack buybox">
        <span className="eyebrow dim">Prévia do anúncio</span>
        <ListingCard l={preview} preview previewImage={photo} />
        <div className="note"><Icon name="shield" /><span>Você recebe o valor quando o comprador confirmar a entrega (ou automaticamente após {daysLabel(confirmDays(v.type))} sem disputa).</span></div>
      </aside>
    </div>
  );
}
