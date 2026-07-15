import { useState, useCallback } from "react";
import { Calculator, X, Minus } from "lucide-react";

export function CalculatorWidget() {
  const [open, setOpen] = useState(false);
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<string | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [waitNew, setWaitNew] = useState(false);

  const press = useCallback((val: string) => {
    if (val === "C") {
      setDisplay("0"); setPrev(null); setOp(null); setWaitNew(false);
      return;
    }
    if (val === "±") {
      setDisplay(d => String(-parseFloat(d)));
      return;
    }
    if (val === "%") {
      setDisplay(d => String(parseFloat(d) / 100));
      return;
    }
    if (["+", "−", "×", "÷"].includes(val)) {
      setPrev(display); setOp(val); setWaitNew(true);
      return;
    }
    if (val === "=") {
      if (!prev || !op) return;
      const a = parseFloat(prev), b = parseFloat(display);
      let res: number;
      if (op === "+") res = a + b;
      else if (op === "−") res = a - b;
      else if (op === "×") res = a * b;
      else if (op === "÷") res = b !== 0 ? a / b : 0;
      else res = b;
      const str = String(parseFloat(res.toFixed(10)));
      setDisplay(str); setPrev(null); setOp(null); setWaitNew(true);
      return;
    }
    if (val === ".") {
      if (waitNew) { setDisplay("0."); setWaitNew(false); return; }
      if (display.includes(".")) return;
      setDisplay(d => d + ".");
      return;
    }
    // digit
    if (waitNew) { setDisplay(val); setWaitNew(false); return; }
    setDisplay(d => d === "0" ? val : d.length < 12 ? d + val : d);
  }, [display, prev, op, waitNew]);

  const formatDisplay = (s: string) => {
    if (s.includes(".")) return s;
    const n = parseFloat(s);
    if (isNaN(n)) return s;
    return new Intl.NumberFormat("id-ID").format(n);
  };

  const btns = [
    ["C", "±", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "−"],
    ["1", "2", "3", "+"],
    ["0", ".", "="],
  ];

  const isOp = (v: string) => ["÷", "×", "−", "+", "="].includes(v);

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-primary-foreground rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center group"
        title="Kalkulator"
      >
        {open
          ? <Minus className="w-5 h-5" />
          : <Calculator className="w-6 h-6" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-72 bg-card border border-card-border rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Calculator className="w-4 h-4" /> Kalkulator
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Display */}
          <div className="px-5 pb-3">
            <div className="bg-muted/60 rounded-2xl px-4 py-3 text-right">
              {op && prev && (
                <div className="text-xs text-muted-foreground mb-1 truncate">{formatDisplay(prev)} {op}</div>
              )}
              <div className="text-3xl font-bold text-foreground tracking-tight truncate leading-tight">
                {formatDisplay(display)}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="px-4 pb-5 space-y-2">
            {btns.map((row, ri) => (
              <div key={ri} className={`grid gap-2 ${row.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
                {row.map((btn) => {
                  const isZero = btn === "0" && row.length === 3;
                  return (
                    <button
                      key={btn}
                      onClick={() => press(btn)}
                      className={`
                        ${isZero ? "col-span-1" : ""}
                        h-14 rounded-2xl text-base font-semibold transition-all active:scale-95
                        ${btn === "=" ? "bg-primary text-primary-foreground shadow-md" :
                          isOp(btn) ? "bg-secondary text-secondary-foreground" :
                          btn === "C" ? "bg-destructive/15 text-destructive" :
                          "bg-muted hover:bg-muted/80 text-foreground"}
                      `}
                    >
                      {btn}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
