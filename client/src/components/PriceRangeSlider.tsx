import { useRef, useCallback, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PriceRangeSliderProps {
  value: number[];
  onChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

const formatRWF = (price: number) =>
  "RWF\u00A0" +
  new Intl.NumberFormat("en-RW", { maximumFractionDigits: 0 }).format(price);

const formatShort = (price: number) => {
  if (price >= 1_000_000)
    return (price / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (price >= 1_000) return (price / 1_000).toFixed(0) + "k";
  return String(price);
};

const playTick = () => {
  try {
    const ctx = new ((window as any).AudioContext ||
      (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 900;
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.04);
  } catch {}
};

const BUMP = 20_000;

export function PriceRangeSlider({
  value,
  onChange,
  min = 0,
  max = 5_000_000,
  step = 10_000,
  className,
}: PriceRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"min" | "max" | null>(null);
  const prevValue = useRef<number[]>(value);
  const [activeHandle, setActiveHandle] = useState<"min" | "max" | null>(null);
  const [minText, setMinText] = useState(String(value[0]));
  const [maxText, setMaxText] = useState(String(value[1]));

  useEffect(() => {
    setMinText(String(value[0]));
  }, [value[0]]);

  useEffect(() => {
    setMaxText(String(value[1]));
  }, [value[1]]);

  const notify = useCallback(
    (next: number[]) => {
      if (
        next[0] !== prevValue.current[0] ||
        next[1] !== prevValue.current[1]
      ) {
        playTick();
        prevValue.current = next;
      }
      onChange(next);
    },
    [onChange]
  );

  const snap = (raw: number) =>
    Math.round(Math.max(min, Math.min(max, raw)) / step) * step;

  const clientToValue = (clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return snap(min + pct * (max - min));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const val = clientToValue(e.clientX);
    const dMin = Math.abs(val - value[0]);
    const dMax = Math.abs(val - value[1]);
    const which = dMin <= dMax ? "min" : "max";
    dragging.current = which;
    setActiveHandle(which);
    e.currentTarget.setPointerCapture(e.pointerId);

    if (which === "min") {
      notify([Math.min(val, value[1] - step), value[1]]);
    } else {
      notify([value[0], Math.max(val, value[0] + step)]);
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const val = clientToValue(e.clientX);
    if (dragging.current === "min") {
      notify([Math.min(val, value[1] - step), value[1]]);
    } else {
      notify([value[0], Math.max(val, value[0] + step)]);
    }
  };

  const onPointerUp = () => {
    dragging.current = null;
    setActiveHandle(null);
  };

  const decreaseMin = () => {
    const next = Math.max(min, value[0] - BUMP);
    if (next !== value[0]) notify([next, value[1]]);
  };

  const increaseMax = () => {
    const next = Math.min(max, value[1] + BUMP);
    if (next !== value[1]) notify([value[0], next]);
  };

  const commitMin = () => {
    const raw = parseInt(minText.replace(/\D/g, ""), 10);
    if (isNaN(raw)) { setMinText(String(value[0])); return; }
    const clamped = snap(Math.min(raw, value[1] - step));
    notify([clamped, value[1]]);
    setMinText(String(clamped));
  };

  const commitMax = () => {
    const raw = parseInt(maxText.replace(/\D/g, ""), 10);
    if (isNaN(raw)) { setMaxText(String(value[1])); return; }
    const clamped = snap(Math.max(raw, value[0] + step));
    notify([value[0], clamped]);
    setMaxText(String(clamped));
  };

  const range = max - min;
  const leftPct = ((value[0] - min) / range) * 100;
  const rightPct = ((value[1] - min) / range) * 100;

  return (
    <div
      className={cn("select-none", className)}
      data-testid="price-range-slider"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={decreaseMin}
          disabled={value[0] <= min}
          data-testid="price-decrease-min"
          aria-label="Decrease minimum price"
          className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold leading-none shadow-md disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 active:scale-95 transition-all duration-150"
        >
          −
        </button>

        <div className="relative flex-1" style={{ height: 56 }}>
          <div
            ref={trackRef}
            className="absolute left-0 right-0 top-1/2 -translate-y-1/2 rounded-full"
            style={{
              height: 6,
              background: "hsl(var(--muted))",
              cursor: "pointer",
              touchAction: "none",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <div
              className="absolute h-full rounded-full"
              style={{
                left: `${leftPct}%`,
                width: `${rightPct - leftPct}%`,
                background:
                  "linear-gradient(90deg, hsl(var(--primary)/0.7), hsl(var(--primary)))",
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Min thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center"
            style={{
              left: `${leftPct}%`,
              background: "hsl(var(--background))",
              border: "2.5px solid hsl(var(--primary))",
              boxShadow:
                activeHandle === "min"
                  ? "0 0 0 5px hsl(var(--primary)/0.2), 0 2px 8px hsl(var(--primary)/0.3)"
                  : "0 1px 6px rgba(0,0,0,0.18)",
              pointerEvents: "none",
              zIndex: 2,
              transition: activeHandle ? "none" : "left 0.05s ease",
            }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "hsl(var(--primary))" }}
            />
          </div>

          {/* Max thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center"
            style={{
              left: `${rightPct}%`,
              background: "hsl(var(--background))",
              border: "2.5px solid hsl(var(--primary))",
              boxShadow:
                activeHandle === "max"
                  ? "0 0 0 5px hsl(var(--primary)/0.2), 0 2px 8px hsl(var(--primary)/0.3)"
                  : "0 1px 6px rgba(0,0,0,0.18)",
              pointerEvents: "none",
              zIndex: 2,
              transition: activeHandle ? "none" : "left 0.05s ease",
            }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "hsl(var(--primary))" }}
            />
          </div>

          {/* Min tooltip */}
          {activeHandle === "min" && (
            <div
              className="absolute -translate-x-1/2 pointer-events-none"
              style={{
                left: `${leftPct}%`,
                bottom: "calc(50% + 18px)",
                zIndex: 10,
              }}
            >
              <div
                className="px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap"
                style={{
                  background: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                  boxShadow: "0 2px 8px hsl(var(--primary)/0.4)",
                }}
              >
                {formatShort(value[0])}
              </div>
              <div
                className="w-0 h-0 mx-auto"
                style={{
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderTop: "5px solid hsl(var(--primary))",
                }}
              />
            </div>
          )}

          {/* Max tooltip */}
          {activeHandle === "max" && (
            <div
              className="absolute -translate-x-1/2 pointer-events-none"
              style={{
                left: `${rightPct}%`,
                bottom: "calc(50% + 18px)",
                zIndex: 10,
              }}
            >
              <div
                className="px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap"
                style={{
                  background: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                  boxShadow: "0 2px 8px hsl(var(--primary)/0.4)",
                }}
              >
                {formatShort(value[1])}
              </div>
              <div
                className="w-0 h-0 mx-auto"
                style={{
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderTop: "5px solid hsl(var(--primary))",
                }}
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={increaseMax}
          disabled={value[1] >= max}
          data-testid="price-increase-max"
          aria-label="Increase maximum price"
          className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold leading-none shadow-md disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 active:scale-95 transition-all duration-150"
        >
          +
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div
          className="flex-1 flex items-center gap-1 rounded-lg px-2.5 py-1.5 ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary/40 transition-all"
          style={{ background: "hsl(var(--primary)/0.06)" }}
        >
          <span
            className="text-[10px] font-medium shrink-0"
            style={{ color: "hsl(var(--primary)/0.6)" }}
          >
            RWF
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={minText}
            onChange={(e) => setMinText(e.target.value)}
            onBlur={commitMin}
            onKeyDown={(e) => { if (e.key === "Enter") { e.currentTarget.blur(); } }}
            data-testid="price-range-min"
            aria-label="Minimum price input"
            className="w-full bg-transparent text-xs font-semibold outline-none min-w-0"
            style={{ color: "hsl(var(--primary))" }}
          />
        </div>

        <div className="flex gap-0.5 shrink-0">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1 h-1 rounded-full"
              style={{ background: "hsl(var(--muted-foreground)/0.35)" }}
            />
          ))}
        </div>

        <div
          className="flex-1 flex items-center gap-1 rounded-lg px-2.5 py-1.5 ring-1 ring-primary/20 focus-within:ring-2 focus-within:ring-primary/40 transition-all"
          style={{ background: "hsl(var(--primary)/0.06)" }}
        >
          <span
            className="text-[10px] font-medium shrink-0"
            style={{ color: "hsl(var(--primary)/0.6)" }}
          >
            RWF
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={maxText}
            onChange={(e) => setMaxText(e.target.value)}
            onBlur={commitMax}
            onKeyDown={(e) => { if (e.key === "Enter") { e.currentTarget.blur(); } }}
            data-testid="price-range-max"
            aria-label="Maximum price input"
            className="w-full bg-transparent text-xs font-semibold outline-none min-w-0"
            style={{ color: "hsl(var(--primary))" }}
          />
        </div>
      </div>
    </div>
  );
}
