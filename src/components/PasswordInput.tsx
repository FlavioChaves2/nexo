"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Icon } from "./Icon";

/** Campo de senha com o olho para mostrar ou esconder o que foi digitado. */
export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [show, setShow] = useState(false);
  return (
    <div className="pass-wrap">
      <input {...props} className={props.className ?? "input"} type={show ? "text" : "password"} autoCapitalize="none" spellCheck={false} />
      <button type="button" className={`pass-eye${show ? " on" : ""}`} onClick={() => setShow(!show)} aria-label={show ? "Esconder senha" : "Mostrar senha"} aria-pressed={show}>
        <Icon name="eye" />
      </button>
    </div>
  );
}
