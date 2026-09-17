"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

async function copyText(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Запасной вариант для http без HTTPS
  const area = document.createElement("textarea");
  area.value = text;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  area.remove();
}

export function CopyPhone({ phone }: { phone: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleClick() {
    try {
      await copyText(phone);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      className="social-tile social-phone"
      data-track="phone"
      onClick={handleClick}
      aria-label={`Скопировать номер ${phone}`}
    >
      <span className="social-logo">
        <span className="social-phone-icon">
          <Icon name="call" />
        </span>
        <span className="social-phone-number">{phone}</span>
      </span>
      <span className="social-foot" aria-live="polite">
        <span>{copied ? "Номер скопирован" : "Нажмите, чтобы скопировать"}</span>
        <Icon name={copied ? "check" : "content_copy"} />
      </span>
    </button>
  );
}
