import { Input } from "@/components/ui/input";

interface Props {
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

function format(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  let s = digits;
  if (s.startsWith("591")) s = s.slice(3);
  s = s.slice(0, 8);
  if (!s) return "";
  if (s.length <= 4) return `+591 ${s}`;
  return `+591 ${s.slice(0, 4)}-${s.slice(4)}`;
}

export function PhoneBO({ value, onChange, placeholder }: Props) {
  return (
    <Input
      type="tel"
      inputMode="tel"
      value={value ?? ""}
      onChange={(e) => onChange(format(e.target.value))}
      placeholder={placeholder ?? "+591 7000-0000"}
    />
  );
}
