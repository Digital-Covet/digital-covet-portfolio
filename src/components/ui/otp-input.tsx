"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  numInputs?: number;
  disabled?: boolean;
  hasError?: boolean;
}

export function OtpInput({
  value,
  onChange,
  numInputs = 6,
  disabled = false,
  hasError = false,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focusInput = useCallback((index: number) => {
    const input = inputRefs.current[index];
    if (input) {
      input.focus();
    }
  }, []);

  const handleChange = useCallback(
    (index: number, raw: string) => {
      const digit = raw.slice(-1);
      if (!/^\d$/.test(digit)) return;

      const digits = value.split("");
      digits[index] = digit;
      const nextIndex = Math.min(index + 1, numInputs - 1);
      onChange(digits.join(""));
      focusInput(nextIndex);
    },
    [value, onChange, numInputs, focusInput],
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        const digits = value.split("");
        digits[index] = "";
        const prevIndex = Math.max(index - 1, 0);
        onChange(digits.join(""));
        focusInput(prevIndex);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        focusInput(Math.max(index - 1, 0));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        focusInput(Math.min(index + 1, numInputs - 1));
      }
    },
    [value, onChange, numInputs, focusInput],
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text/plain").replace(/\D/g, "");
      if (!pasted) return;

      const sanitized = pasted.slice(0, numInputs);
      onChange(sanitized);

      const nextIndex = Math.min(sanitized.length, numInputs - 1);
      focusInput(nextIndex);
    },
    [numInputs, onChange, focusInput],
  );

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  }, []);

  useEffect(() => {
    const firstEmpty = value.length;
    if (firstEmpty < numInputs) {
      focusInput(firstEmpty);
    }
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayValue = value.slice(0, numInputs);

  return (
    <div
      className="flex items-center justify-center gap-2"
      role="group"
      aria-label="One-time password input"
    >
      {Array.from({ length: numInputs }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={displayValue[index] ?? ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={handleFocus}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          className={cn(
            "size-10 md:size-12 text-center font-mono text-base md:text-lg font-semibold",
            "rounded-md border transition-colors outline-none",
            disabled && "cursor-not-allowed opacity-50",
            hasError
              ? "border-destructive ring-1 ring-destructive/20"
              : "border-input focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50",
          )}
        />
      ))}
    </div>
  );
}
