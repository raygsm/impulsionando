import { ImpulsionitoDock as CoreImpulsionitoDock } from "./ImpulsionitoDock";

/**
 * Transitional presentation wrapper.
 * The dock remains fully functional; only the legacy header close-X is hidden.
 * Minimize/fullscreen controls and keyboard behavior remain untouched.
 */
export function ImpulsionitoDock() {
  return (
    <>
      <style>{`
        [role="dialog"][aria-label="Impulsionito — assistente do Core Impulsionando"]
          button[aria-label="Fechar Impulsionito (Esc)"] {
          display: none !important;
        }
      `}</style>
      <CoreImpulsionitoDock />
    </>
  );
}
