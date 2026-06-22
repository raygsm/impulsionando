import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { getRiomedSiteSettings, trackRiomedWhatsappClick } from "@/lib/riomed-public.functions";

export function FloatingWhatsApp({ pagePath }: { pagePath?: string }) {
  const getSettings = useServerFn(getRiomedSiteSettings);
  const track = useServerFn(trackRiomedWhatsappClick);
  const { data } = useQuery({ queryKey: ["riomed-site-settings"], queryFn: () => getSettings() });
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !data?.settings) return null;
  const s = data.settings;
  const number = (s.whatsapp_official || "").replace(/\D/g, "");
  const url = `https://wa.me/${number}?text=${encodeURIComponent(s.whatsapp_message)}`;

  const onClick = () => {
    track({ data: { pagePath: pagePath ?? (typeof window !== "undefined" ? window.location.pathname : ""), referrer: typeof document !== "undefined" ? document.referrer : "", userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "" } }).catch(() => {});
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      aria-label="WhatsApp RioMed"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-white shadow-2xl hover:scale-105 transition-transform"
      style={{ boxShadow: "0 10px 30px -8px rgba(37,211,102,.5)" }}
    >
      <MessageCircle className="h-5 w-5" />
      <span className="font-semibold hidden sm:inline">WhatsApp</span>
    </a>
  );
}
