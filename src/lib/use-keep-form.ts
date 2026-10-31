"use client";

import { startTransition, useEffect, useRef, type FormEvent } from "react";

/**
 * Por padrão o React limpa o formulário depois de cada envio, até quando dá erro, e a pessoa
 * perde o que digitou (descrição do anúncio, fotos, códigos…). Com isto, o formulário só é
 * limpo quando o envio dá certo; no erro tudo continua lá para corrigir.
 * Uso: const keep = useKeepForm(state, run); <form action={run} {...keep}>
 */
export function useKeepForm(state: unknown, run: (data: FormData) => void) {
  const ref = useRef<HTMLFormElement>(null);
  const last = useRef(state);
  useEffect(() => {
    if (state === last.current) return;
    last.current = state;
    if (state && !(state as { error?: unknown }).error) ref.current?.reset();
  }, [state]);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
    startTransition(() => run(data));
  };
  return { ref, onSubmit };
}
