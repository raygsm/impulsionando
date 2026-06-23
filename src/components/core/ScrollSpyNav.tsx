import { useEffect, useState } from "react";

export type ScrollSpySection = { id: string; label: string };

/**
 * Generic in-page sub-nav with active-section highlighting via
 * IntersectionObserver. Tenant-agnostic — pass any section list.
 *
 * Promoted from Rio Med's SectionScrollNav so any tenant can reuse it.
 */
export function ScrollSpyNav({
  sections,
  topOffsetClass = "top-[64px]",
  activeColorVar = "--brand-primary",
}: {
  sections: ScrollSpySection[];
  topOffsetClass?: string;
  /** CSS var (without var()) used for the active accent color. */
  activeColorVar?: string;
}) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((e): e is HTMLElement => !!e);
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive((visible[0].target as HTMLElement).id);
      },
      {
        rootMargin: "-40% 0px -50% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [sections]);

  const accent = `color:var(${activeColorVar})`;

  return (
    <div
      className={`sticky ${topOffsetClass} z-30 bg-white/90 backdrop-blur border-b border-slate-200`}
    >
      <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
        {sections.map((s) => {
          const isActive = active === s.id;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              aria-current={isActive ? "true" : undefined}
              className={[
                "relative px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors",
                isActive
                  ? `text-[${accent}]`
                  : "text-slate-600 hover:text-slate-900",
              ].join(" ")}
            >
              {s.label}
              <span
                className={[
                  "absolute left-3 right-3 bottom-0 h-[3px] rounded-t-full transition-all",
                  isActive
                    ? `bg-[${accent}] opacity-100`
                    : "bg-transparent opacity-0",
                ].join(" ")}
              />
            </a>
          );
        })}
      </div>
    </div>
  );
}
