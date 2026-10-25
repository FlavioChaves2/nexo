"use client";

import type { FormHTMLAttributes } from "react";

/** Formulário GET que reaplica os filtros a cada mudança (sem precisar de botão). */
export function AutoSubmitForm(props: FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form
      {...props}
      onChange={(e) => {
        const target = e.target as unknown as HTMLInputElement;
        if (target.type === "search" || target.type === "number") return; // esses aplicam no Enter
        e.currentTarget.requestSubmit();
      }}
    />
  );
}
