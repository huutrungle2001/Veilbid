import {
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export function ContextHelp({
  label,
  title,
  steps,
  note,
  compact = false,
}: {
  label: string;
  title: string;
  steps: readonly string[];
  note?: string;
  compact?: boolean;
}) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [portalStyle, setPortalStyle] = useState<CSSProperties | null>(
    null,
  );

  function helpCard(className = "context-help-card"): ReactNode {
    return (
      <div
        className={className}
        id={tooltipId}
        role="tooltip"
        style={className.includes("portal") ? portalStyle ?? undefined : undefined}
      >
        <strong>{title}</strong>
        <ol>
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {note && <p className="context-help-note">{note}</p>}
      </div>
    );
  }

  function openCompactHelp() {
    if (!compact || !triggerRef.current) return;
    const trigger = triggerRef.current.getBoundingClientRect();
    const preferredWidth = 360;
    const gap = 12;
    const rightSpace = window.innerWidth - trigger.right - gap - 16;
    const opensRight = rightSpace >= 260;
    const width = opensRight
      ? Math.min(preferredWidth, rightSpace)
      : Math.min(preferredWidth, window.innerWidth - 32);
    const left = opensRight ? trigger.right + gap : 16;
    const top = opensRight ? Math.max(16, trigger.top - 4) : trigger.bottom + gap;
    setPortalStyle({
      left,
      maxHeight: Math.max(180, window.innerHeight - top - 16),
      top,
      width,
    });
  }

  function closeCompactHelpAfterHover() {
    if (document.activeElement !== triggerRef.current) {
      setPortalStyle(null);
    }
  }

  return (
    <div className={`context-help${compact ? " compact" : ""}`}>
      <button
        ref={triggerRef}
        className="context-help-trigger"
        type="button"
        aria-label={label}
        aria-describedby={tooltipId}
        onMouseEnter={openCompactHelp}
        onMouseLeave={closeCompactHelpAfterHover}
        onFocus={openCompactHelp}
        onBlur={() => setPortalStyle(null)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            triggerRef.current?.blur();
          }
        }}
      >
        ?
      </button>
      {!compact && helpCard()}
      {compact &&
        portalStyle &&
        createPortal(
          helpCard("context-help-card context-help-portal"),
          document.body,
        )}
    </div>
  );
}
