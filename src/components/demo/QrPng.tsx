/**
 * <QrPng> — renderiza um QR Code real escaneável a partir de uma URL.
 * Usa o pacote `qrcode` (já instalado) com `toDataURL`. Sem dependências nativas.
 */
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrPng({
  value,
  size = 220,
  alt,
  className,
}: { value: string; size?: number; alt: string; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((url) => { if (mounted) setSrc(url); })
      .catch((e: Error) => { if (mounted) setErr(e.message); });
    return () => { mounted = false; };
  }, [value, size]);

  if (err) {
    return (
      <div
        role="img"
        aria-label={`Falha ao gerar QR Code: ${err}`}
        className={className}
        style={{ width: size, height: size }}
      />
    );
  }
  if (!src) {
    return (
      <div
        role="img"
        aria-label={`Gerando ${alt}`}
        className={`bg-muted animate-pulse rounded ${className ?? ""}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt={alt}
      className={className}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
