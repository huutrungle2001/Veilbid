import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastStatus = "loading" | "success" | "error";

interface ToastItem {
  id: string;
  title: string;
  message: string;
  status: ToastStatus;
}

interface ToastApi {
  start: (title: string, message: string) => string;
  update: (id: string, message: string) => void;
  succeed: (id: string, message: string) => void;
  fail: (id: string, message: string) => void;
  dismiss: (id: string) => void;
}

const fallbackApi: ToastApi = {
  start: () => "toast-unmounted",
  update: () => undefined,
  succeed: () => undefined,
  fail: () => undefined,
  dismiss: () => undefined,
};

const ToastContext = createContext<ToastApi>(fallbackApi);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const sequence = useRef(0);
  const timers = useRef(new Map<string, number>());

  const clearTimer = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      clearTimer(id);
      setItems((current) => current.filter((item) => item.id !== id));
    },
    [clearTimer],
  );

  const start = useCallback(
    (title: string, message: string) => {
      sequence.current += 1;
      const id = `toast-${sequence.current}`;
      setItems((current) => [
        ...current.slice(-3),
        { id, title, message, status: "loading" },
      ]);
      return id;
    },
    [],
  );

  const update = useCallback(
    (id: string, message: string) => {
      clearTimer(id);
      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, message, status: "loading" }
            : item,
        ),
      );
    },
    [clearTimer],
  );

  const settle = useCallback(
    (id: string, message: string, status: "success" | "error") => {
      clearTimer(id);
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, message, status } : item,
        ),
      );
      timers.current.set(
        id,
        window.setTimeout(
          () => dismiss(id),
          status === "success" ? 4_000 : 7_000,
        ),
      );
    },
    [clearTimer, dismiss],
  );

  useEffect(
    () => () => {
      for (const timer of timers.current.values()) {
        window.clearTimeout(timer);
      }
      timers.current.clear();
    },
    [],
  );

  const api = useMemo<ToastApi>(
    () => ({
      start,
      update,
      succeed: (id, message) => settle(id, message, "success"),
      fail: (id, message) => settle(id, message, "error"),
      dismiss,
    }),
    [dismiss, settle, start, update],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <aside
        className="toast-viewport"
        aria-label="Transaction notifications"
      >
        {items.map((item) => (
          <section
            className={`transaction-toast ${item.status}`}
            key={item.id}
            role={item.status === "error" ? "alert" : "status"}
            aria-live={item.status === "error" ? "assertive" : "polite"}
          >
            <span className="toast-status-mark" aria-hidden="true">
              {item.status === "loading"
                ? ""
                : item.status === "success"
                  ? "✓"
                  : "!"}
            </span>
            <span className="toast-copy">
              <strong>{item.title}</strong>
              <span>{item.message}</span>
            </span>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label={`Dismiss ${item.title} notification`}
            >
              ×
            </button>
          </section>
        ))}
      </aside>
    </ToastContext.Provider>
  );
}

export function useToasts() {
  return useContext(ToastContext);
}
