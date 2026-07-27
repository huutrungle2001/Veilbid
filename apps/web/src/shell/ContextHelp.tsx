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
    const padding = 16;
    const rightSpace = window.innerWidth - trigger.right - gap - padding;
    const leftSpace = trigger.left - gap - padding;
    const sideWidth = 260;
    let width = Math.min(preferredWidth, window.innerWidth - padding * 2);
    let left: number;
    let top: number;
    if (rightSpace >= sideWidth) {
      width = Math.min(width, rightSpace);
      left = trigger.right + gap;
      top = Math.max(padding, trigger.top - 4);
    } else if (leftSpace >= sideWidth) {
      width = Math.min(width, leftSpace);
      left = trigger.left - gap - width;
      top = Math.max(padding, trigger.top - 4);
    } else {
      top = Math.min(
        trigger.bottom + gap,
        Math.max(padding, window.innerHeight - 220),
      );
      left = Math.min(
        Math.max(padding, trigger.left + trigger.width / 2 - width / 2),
        window.innerWidth - padding - width,
      );
    }
    setPortalStyle({
      left,
      maxHeight: Math.max(180, window.innerHeight - top - padding),
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
