import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

type NavigationItem = {
  label: string;
  to: string;
  active: boolean;
};

export function PrimaryNavigation() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const legacyTenderRoute =
    searchParams.has("role") || searchParams.has("tender");
  const isHome = location.pathname === "/" && !legacyTenderRoute;
  const isTenders =
    location.pathname === "/room" || legacyTenderRoute;
  const isEvidence =
    location.pathname === "/docs" && location.hash === "#evidence";
  const isDocs = location.pathname === "/docs" && !isEvidence;
  const items: NavigationItem[] = [
    { label: "TENDERS", to: "/room", active: isTenders },
    { label: "DOCS", to: "/docs", active: isDocs },
    { label: "EVIDENCE", to: "/docs#evidence", active: isEvidence },
  ];

  useEffect(() => {
    if (!location.hash) return;
    const frames = new Set<number>();
    let cancelled = false;
    const scrollToTarget = () => {
      if (cancelled) return;
      const frame = window.requestAnimationFrame(() => {
        frames.delete(frame);
        document
          .getElementById(decodeURIComponent(location.hash.slice(1)))
          ?.scrollIntoView?.({ block: "start" });
      });
      frames.add(frame);
    };
    scrollToTarget();
    const timer = window.setTimeout(scrollToTarget, 300);
    const fontsReady = document.fonts?.ready;
    if (fontsReady) void fontsReady.then(scrollToTarget);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      for (const frame of frames) window.cancelAnimationFrame(frame);
    };
  }, [location.hash, location.pathname]);

  return (
    <header className="topbar">
      <a className="skip-link" href="#main-content">
        SKIP TO CONTENT
      </a>
      <Link
        className={`wordmark${isHome ? " active" : ""}`}
        to="/"
        aria-label="VeilBid home"
        aria-current={isHome ? "page" : undefined}
      >
        VEILBID
      </Link>
      <nav aria-label="Primary navigation">
        {items.map((item) => (
          <Link
            key={item.label}
            className={`primary-nav-link${item.active ? " active" : ""}`}
            to={item.to}
            aria-current={item.active ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="network-pill" aria-label="Network: Ethereum Sepolia">
        <span aria-hidden="true" />
        SEPOLIA
      </div>
    </header>
  );
}
