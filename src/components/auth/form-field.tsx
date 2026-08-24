"use client";

import { useId, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthFieldProps = {
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  icon?: LucideIcon;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  error?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  autoFocus?: boolean;
};

/**
 * Premium form field: icon that reacts to focus, animated focus ring, optional
 * password visibility toggle, inline validation error.
 */
export function AuthField({
  label,
  name,
  type = "text",
  icon: Icon,
  placeholder,
  autoComplete,
  required = true,
  minLength,
  error,
  value,
  defaultValue,
  onChange,
  autoFocus,
}: AuthFieldProps) {
  const id = useId();
  const isPassword = type === "password";
  const [show, setShow] = useState(false);
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div className="auth-field">
      <label htmlFor={id} className="auth-label">
        {label}
      </label>
      <div className={cn("auth-input-wrap", error && "auth-input-error")}>
        {Icon && (
          <Icon
            size={17}
            strokeWidth={2}
            className="auth-input-icon"
            aria-hidden="true"
          />
        )}
        <input
          id={id}
          name={name}
          type={inputType}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
          value={value}
          defaultValue={value === undefined ? defaultValue : undefined}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="auth-input"
        />
        {isPassword && (
          <button
            type="button"
            className="auth-eye"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="auth-err-msg" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}