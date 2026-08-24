"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  ChevronRight,
  X,
  Lock,
  XCircle,
  Info,
  Target,
  CheckCircle,
  AlertCircle,
  BookOpen,
  BarChart3,
  Sparkles,
  ListChecks,
  RefreshCw,
  FileText,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────
// SCORE EXPLORER
//
// One navigation shell, used by all five BIG score cards (Compliance,
// Legitimacy, Leadership & Governance, Operational Strength, Capital
// Appeal). It replaces the stacked-accordion modal where every panel could
// be open at once and a score arrived as one continuous document.
//
// THE MODEL: one screen shows one thing. You move by pushing frames onto a
// stack, and every frame that is not Home carries a back arrow and a
// breadcrumb trail back to it.
//
//   Home ─┬─ 1. About this score ─┬─ 1.1 Definition
//         │                       ├─ 1.2 Assessment areas
//         │                       ├─ 1.3 Score interpretation
//         │                       └─ 1.4 Score weighting
//         │
//         ├─ 2. Your score ── block ── element ─┬─ 2.1 Score breakdown
//         │   (block level is skipped when      ├─ 2.2 Analysis
//         │    there is only one block)         └─ 2.3 Improvements
//         │
//         ├─ 3. Potential points ── item detail
//         └─ Needs attention (only when there is something to attend to)
//
// The three per-element tabs are also reachable without leaving the list:
// each element row carries three buttons that open a pop-out preview.
// The pop-out closes when the cursor leaves it, on ×, on Escape, or on an
// outside click — a peek, not a place you can get stuck.
// ─────────────────────────────────────────────────────────────────────────

export const T = {
  ink: "#4e342e",
  body: "#6d4c41",
  mute: "#8d6e63",
  faint: "#a1887f",
  line: "#e8ddd6",
  line2: "#d7ccc8",
  hair: "#f0e8e0",
  surface: "#faf8f6",
  sand: "#f3e8dc",
  brand: "#8d6e63",
  brandDeep: "#5d4037",
  good: "#1B5E20",
  goodMid: "#2E7D32",
  goodBg: "#e8f5e9",
  goodLine: "#c8e6c9",
  bad: "#B71C1C",
  badText: "#8d3a2e",
  badBg: "#fdecea",
  badLine: "#e6b8ac",
  warn: "#8a5a00",
  warnBg: "#fff8e1",
  warnLine: "#e8d0a8",
};

export const barColor = (s) =>
  s > 90 ? "#1B5E20" : s >= 81 ? "#4CAF50" : s >= 61 ? "#FF9800" : s >= 41 ? "#F44336" : "#B71C1C";

const STATE_STYLE = {
  counted: { dot: "#4CAF50", label: "Counted in full", text: "#2E7D32" },
  partial: { dot: "#FF9800", label: "Partly counted", text: "#EF6C00" },
  missing: { dot: "#F44336", label: "Not captured", text: "#C62828" },
};

const defaultFmtPts = (n) => `+${(Math.round(Number(n || 0) * 10) / 10).toFixed(1)}%`;

const TABS = [
  { key: "breakdown", label: "Score breakdown", short: "Breakdown", icon: BarChart3 },
  { key: "analysis", label: "Analysis", short: "Analysis", icon: Sparkles },
  { key: "improvements", label: "Improvements", short: "Improve", icon: ListChecks },
];

// ═════════════════════════════════════════════════════════════════════════
// Small pieces
// ═════════════════════════════════════════════════════════════════════════

function Pill({ tone = "good", children, icon: Icon }) {
  const c =
    tone === "good"
      ? { fg: T.good, bg: T.goodBg, br: T.goodLine }
      : tone === "bad"
      ? { fg: T.bad, bg: T.badBg, br: T.badLine }
      : tone === "warn"
      ? { fg: T.warn, bg: T.warnBg, br: T.warnLine }
      : { fg: T.mute, bg: "#f5f2f0", br: T.line2 };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        backgroundColor: c.bg,
        color: c.fg,
        border: `1px solid ${c.br}`,
        borderRadius: "5px",
        padding: "2px 8px",
        fontWeight: 800,
        fontSize: "11.5px",
        whiteSpace: "nowrap",
      }}
    >
      {Icon && <Icon size={10} />}
      {children}
    </span>
  );
}

function Bar({ percent, width = 84 }) {
  const p = Math.max(0, Math.min(100, Math.round(percent || 0)));
  return (
    <div
      style={{
        width,
        height: "8px",
        background: T.sand,
        borderRadius: "4px",
        overflow: "hidden",
        border: "1px solid #d6b88a",
        flexShrink: 0,
      }}
    >
      <div style={{ width: `${p}%`, height: "100%", background: barColor(p), transition: "width .3s ease" }} />
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: "10px",
        color: T.mute,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.7px",
        marginBottom: "7px",
      }}
    >
      {children}
    </div>
  );
}

function Prose({ children, style }) {
  return <div style={{ fontSize: "13px", color: T.body, lineHeight: 1.7, ...style }}>{children}</div>;
}

function GoButton({ label, onClick, disabled, small }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: small ? "6px 12px" : "9px 16px",
        background: "linear-gradient(135deg,#5d4037 0%,#4a2c20 100%)",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontWeight: 700,
        fontSize: small ? "11.5px" : "12px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
      }}
    >
      {label} <span style={{ fontSize: "13px" }}>→</span>
    </button>
  );
}

// ── Pop-out ──────────────────────────────────────────────────────────────
// Opens on click, closes on cursor-out (short grace period so a diagonal
// mouse path to the panel does not dismiss it), on ×, on Escape and on an
// outside click. Touch has no mouseleave, so × is the deliberate fallback.

function Popover({ open, onClose, title, children, footer, align = "right" }) {
  const ref = useRef(null);
  const timer = useRef(null);

  const cancel = () => timer.current && clearTimeout(timer.current);
  const schedule = () => {
    cancel();
    timer.current = setTimeout(onClose, 140);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && onClose();
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
      cancel();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      onMouseLeave={schedule}
      onMouseEnter={cancel}
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        [align]: 0,
        width: "300px",
        maxWidth: "78vw",
        background: "white",
        border: `1px solid ${T.line}`,
        borderRadius: "10px",
        boxShadow: "0 12px 32px rgba(78,52,46,0.22)",
        zIndex: 40,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          padding: "9px 10px 9px 12px",
          background: T.surface,
          borderBottom: `1px solid ${T.hair}`,
        }}
      >
        <span style={{ fontSize: "11px", fontWeight: 800, color: T.ink, textTransform: "uppercase", letterSpacing: "0.6px" }}>
          {title}
        </span>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            border: `1px solid ${T.line2}`,
            background: "white",
            color: T.mute,
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            flexShrink: 0,
          }}
        >
          <X size={11} />
        </button>
      </div>
      <div style={{ padding: "11px 12px", fontSize: "12.5px", color: T.body, lineHeight: 1.65, maxHeight: "230px", overflowY: "auto" }}>
        {children}
      </div>
      {footer && <div style={{ padding: "9px 12px", borderTop: `1px solid ${T.hair}`, background: "#fcfbfa" }}>{footer}</div>}
    </div>
  );
}

// ── Rows ─────────────────────────────────────────────────────────────────

function NavTile({ number, title, subtitle, icon: Icon, right, onClick, tone }) {
  const [hover, setHover] = useState(false);
  const accent = tone === "warn" ? T.warn : T.brandDeep;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "14px 14px",
        marginBottom: "9px",
        background: tone === "warn" ? T.warnBg : "white",
        border: `1px solid ${hover ? "#d6b88a" : tone === "warn" ? T.warnLine : T.line}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: "10px",
        cursor: "pointer",
        transition: "border-color .2s ease, transform .15s ease",
        transform: hover ? "translateX(2px)" : "none",
      }}
    >
      {number != null && (
        <span style={{ fontSize: "12px", fontWeight: 800, color: T.faint, minWidth: "14px" }}>{number}</span>
      )}
      {Icon && <Icon size={17} style={{ color: accent, flexShrink: 0 }} />}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontWeight: 700, color: tone === "warn" ? T.warn : T.ink, fontSize: "13.5px" }}>
          {title}
        </span>
        {subtitle && (
          <span style={{ display: "block", fontSize: "11.5px", color: T.mute, marginTop: "2px", lineHeight: 1.5 }}>
            {subtitle}
          </span>
        )}
      </span>
      {right}
      <ChevronRight size={16} style={{ color: T.faint, flexShrink: 0 }} />
    </button>
  );
}

function ItemRow({ item, fmtPts, onNavigate }) {
  const st = STATE_STYLE[item.state] || STATE_STYLE.missing;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "11px" }}>
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          marginTop: "6px",
          flexShrink: 0,
          backgroundColor: st.dot,
        }}
      />
      <span style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ color: T.ink, fontSize: "12.5px" }}>{item.label}</strong>
        <span style={{ color: T.faint, fontSize: "11px" }}>
          {" "}
          · {item.earned}/{item.points} pts · <span style={{ color: st.text, fontWeight: 700 }}>{st.label}</span>
        </span>
        {item.evidence && <span style={{ display: "block", color: T.body, fontSize: "12px" }}>{item.evidence}</span>}
        {item.reason && <span style={{ display: "block", color: T.badText, fontSize: "12px" }}>{item.reason}</span>}
        {!item.claimable && item.withheld > 0 && (
          <span style={{ display: "block", color: T.mute, fontStyle: "italic", fontSize: "11.5px", marginTop: "3px" }}>
            Fixed deduction — follows the financial position, not the form.
          </span>
        )}
        {item.withheld > 0 && item.claimable && item.route && (
          <button
            onClick={() => onNavigate(item.route)}
            style={{
              marginTop: "6px",
              background: "none",
              border: "1px solid #d6b88a",
              color: T.brandDeep,
              borderRadius: "6px",
              padding: "3px 10px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Go to {item.section} →
          </button>
        )}
        {/* A card can attach one extra action to an item — the legitimacy
            appeal ("this verdict is wrong") being the case this exists for. */}
        {item.secondaryAction && (
          <button
            onClick={item.secondaryAction.onClick}
            style={{
              marginTop: "6px",
              marginLeft: item.withheld > 0 && item.claimable && item.route ? "6px" : 0,
              background: "none",
              border: `1px solid ${T.badLine}`,
              color: T.badText,
              borderRadius: "6px",
              padding: "3px 10px",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {item.secondaryAction.label}
          </button>
        )}
      </span>
      {item.withheld > 0 && (
        <Pill tone={item.claimable ? "good" : "neutral"} icon={item.claimable ? undefined : Lock}>
          {fmtPts(item.pointValue)}
        </Pill>
      )}
    </div>
  );
}

// ── Findings from a document that was already read and scored ────────────
//
// Business plan, pitch deck, credit report and financial statements each
// arrive with their own evaluator's reasoning attached. Those findings are
// qualitative — they never carry a point value — so they are visually
// separated from the scored line items and labelled with their source.

const SEVERITY = {
  critical: { fg: "#B71C1C", bg: "#fdecea", br: "#e6b8ac", label: "Critical" },
  high: { fg: "#EF6C00", bg: "#fff3e0", br: "#f0d0a8", label: "High" },
  moderate: { fg: "#8a5a00", bg: "#fff8e1", br: "#e8d0a8", label: "Moderate" },
};

function FindingsPanel({ findings, mode }) {
  if (!findings) return null;
  const weak = findings.weakAreas || [];
  const imps = findings.improvements || [];
  // 2.2 Analysis and 2.1 Score breakdown both show what the evaluation found.
  // 2.3 Improvements shows what it said to do — and falls back to the findings
  // when that evaluation listed no actions, so the tab is never empty when
  // there is something to say.
  const showImps = mode === "improvements";
  const showWeak = mode !== "improvements" || !imps.length;
  const flush = mode === "improvements" || mode === "analysis";

  return (
    <div style={{ marginTop: flush ? 0 : "16px", paddingTop: flush ? 0 : "14px", borderTop: flush ? "none" : `1px dashed ${T.line2}` }}>
      <SectionLabel>
        From your {findings.docLabel || findings.source}
        {findings.headline ? ` · ${findings.headline}` : ""}
      </SectionLabel>

      {findings.summary && <Prose style={{ fontSize: "12.5px", marginBottom: "12px" }}>{findings.summary}</Prose>}

      {showWeak && weak.length > 0 && (
        <>
          <div style={{ fontSize: "11.5px", fontWeight: 700, color: T.ink, marginBottom: "7px" }}>
            Improvement areas the evaluation flagged
          </div>
          {weak.map((w, i) => {
            const sev = SEVERITY[w.severity] || SEVERITY.moderate;
            return (
              <div key={i} style={{ border: `1px solid ${sev.br}`, background: sev.bg, borderRadius: "8px", padding: "9px 11px", marginBottom: "7px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: w.note ? "4px" : 0 }}>
                  <strong style={{ color: sev.fg, fontSize: "12.5px", flex: 1 }}>{w.label}</strong>
                  {w.score && (
                    <span style={{ fontWeight: 800, fontSize: "11.5px", color: sev.fg, whiteSpace: "nowrap" }}>{w.score}</span>
                  )}
                </div>
                {w.note && <Prose style={{ fontSize: "12px", color: T.body }}>{w.note}</Prose>}
              </div>
            );
          })}
        </>
      )}

      {(findings.strongAreas || []).length > 0 && showWeak && (
        <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: T.mute, fontWeight: 700 }}>Scored well:</span>
          {findings.strongAreas.map((s, i) => (
            <span key={i} style={{ fontSize: "11px", color: T.goodMid, background: T.goodBg, border: `1px solid ${T.goodLine}`, borderRadius: "12px", padding: "2px 9px" }}>
              {s.label}
              {s.score ? ` ${s.score}` : ""}
            </span>
          ))}
        </div>
      )}

      {showImps && imps.length > 0 && (
        <div style={{ marginTop: weak.length && showWeak ? "14px" : 0 }}>
          <div style={{ fontSize: "11.5px", fontWeight: 700, color: T.ink, marginBottom: "7px" }}>
            Priority improvements from that evaluation
          </div>
          {imps.map((im, i) => (
            <div key={i} style={{ display: "flex", gap: "9px", marginBottom: "9px" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: T.faint, marginTop: "1px" }}>{i + 1}</span>
              <span>
                <strong style={{ color: T.ink, fontSize: "12.5px" }}>{im.title}</strong>
                {im.body && <Prose style={{ fontSize: "12.5px", marginTop: "2px" }}>{im.body}</Prose>}
              </span>
            </div>
          ))}
        </div>
      )}

      {findings.disclaimer && (
        <Prose style={{ fontSize: "11.5px", fontStyle: "italic", color: T.mute, marginTop: "10px" }}>{findings.disclaimer}</Prose>
      )}
    </div>
  );
}

function ElementRow({ element, fmtPts, onOpen, openPop, setOpenPop }) {
  const pct = Math.round(element.percent || 0);
  const recoverable = (element.improvements || []).reduce((s, i) => s + (i.pointValue || 0), 0);

  const preview = (tab) => {
    if (element.excluded) return <em>Excluded at this tier — it carries no weight and costs nothing.</em>;
    if (tab === "breakdown") {
      const items = element.breakdown || [];
      const counted = items.filter((i) => i.state === "counted").length;
      const partial = items.filter((i) => i.state === "partial").length;
      const missing = items.filter((i) => i.state === "missing").length;
      const weak = element.findings?.weakAreas || [];
      return (
        <>
          <div style={{ marginBottom: "6px" }}>
            <strong>{pct}%</strong> of this element, worth {element.weight}% of its block.
          </div>
          {counted > 0 && <div>✅ {counted} counted in full</div>}
          {partial > 0 && <div>🟠 {partial} partly counted</div>}
          {missing > 0 && <div>🔴 {missing} not captured</div>}
          {!items.length && !weak.length && <em>No line items recorded for this element.</em>}
          {weak.length > 0 && (
            <div style={{ marginTop: "7px", paddingTop: "7px", borderTop: `1px dashed ${T.line2}` }}>
              <strong>{weak.length}</strong> improvement area{weak.length === 1 ? "" : "s"} flagged in your{" "}
              {element.findings.docLabel || element.findings.source}: {weak.slice(0, 3).map((w) => w.label).join("; ")}
              {weak.length > 3 ? "…" : ""}
            </div>
          )}
        </>
      );
    }
    if (tab === "analysis") {
      const a = element.analysis;
      const f = element.findings;
      if (!a && !f) return <em>No analysis loaded yet. Open the full view to generate it.</em>;
      if (a) {
        const text = a.rationale || a.evidence || a.raw || "";
        return text.slice(0, 260) + (text.length > 260 ? "…" : "");
      }
      return (
        <>
          <div style={{ marginBottom: "5px", color: T.mute }}>
            From your {f.docLabel || f.source}
            {f.headline ? ` · ${f.headline}` : ""}
          </div>
          {f.summary
            ? f.summary.slice(0, 220) + (f.summary.length > 220 ? "…" : "")
            : f.weakAreas?.[0]?.note
            ? f.weakAreas[0].note.slice(0, 220) + "…"
            : `${f.weakAreas.length} area${f.weakAreas.length === 1 ? "" : "s"} flagged.`}
        </>
      );
    }
    const imps = element.improvements || [];
    const docImps = element.findings?.improvements || [];
    if (!imps.length && !docImps.length) {
      return element.extraImprovements ? (
        <em>Open the full view — this element's actions are listed there.</em>
      ) : (
        <em>Nothing recoverable here — this element is complete or fixed by the numbers.</em>
      );
    }
    return (
      <>
        {imps.length > 0 && (
          <>
            <div style={{ marginBottom: "6px" }}>
              <strong>{fmtPts(recoverable)}</strong> across {imps.length} action{imps.length === 1 ? "" : "s"}.
            </div>
            {imps.slice(0, 3).map((i) => (
              <div key={i.key} style={{ marginBottom: "3px" }}>
                • {i.label} — <strong style={{ color: T.good }}>{fmtPts(i.pointValue)}</strong>
              </div>
            ))}
            {imps.length > 3 && <div style={{ color: T.mute }}>+{imps.length - 3} more</div>}
          </>
        )}
        {docImps.length > 0 && (
          <div style={{ marginTop: imps.length ? "7px" : 0, paddingTop: imps.length ? "7px" : 0, borderTop: imps.length ? `1px dashed ${T.line2}` : "none" }}>
            <div style={{ color: T.mute, marginBottom: "3px" }}>
              From your {element.findings.docLabel || element.findings.source} — no point value:
            </div>
            {docImps.slice(0, 3).map((i, n) => (
              <div key={n} style={{ marginBottom: "2px" }}>
                • {i.title}
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <div
      style={{
        background: "white",
        border: `1px solid ${element.excluded ? T.line2 : T.hair}`,
        borderRadius: "10px",
        padding: "12px 13px",
        marginBottom: "9px",
        opacity: element.excluded ? 0.72 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "9px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, color: element.excluded ? T.faint : T.ink, fontSize: "13px" }}>
              {element.label}
            </span>
            {element.excluded && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#e53935", background: "#ffebee", borderRadius: "12px", padding: "2px 8px" }}>
                <XCircle size={10} /> excluded
              </span>
            )}
            {!element.excluded && element.reductionNote && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#f57c00", background: "#fff3e0", borderRadius: "12px", padding: "2px 8px" }}>
                <Info size={10} /> reduced weight
              </span>
            )}
            {(element.findings?.weakAreas?.length > 0 || element.findings?.improvements?.length > 0) && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", color: T.body, background: T.sand, border: "1px solid #d6b88a", borderRadius: "12px", padding: "2px 8px" }}>
                <FileText size={10} />
                {element.findings.weakAreas.length || element.findings.improvements.length} flagged in your{" "}
                {element.findings.docLabel || element.findings.source}
              </span>
            )}
          </div>
          <div style={{ fontSize: "11px", color: T.mute, marginTop: "2px" }}>
            {element.excluded
              ? "0% weight"
              : `${element.weight}% weight${element.effectiveWeight ? ` · ${element.effectiveWeight.toFixed(1)} pts of the final score` : ""}`}
          </div>
        </div>
        {!element.excluded && (
          <>
            <Bar percent={pct} width={64} />
            <span style={{ fontWeight: 700, color: T.brandDeep, fontSize: "14px", minWidth: "34px", textAlign: "right" }}>
              {pct}%
            </span>
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {TABS.map((tab) => {
          const id = `${element.key}:${tab.key}`;
          const isOpen = openPop === id;
          const dim = element.excluded && tab.key !== "breakdown";
          return (
            <div key={tab.key} style={{ position: "relative", flex: "1 1 auto" }}>
              <button
                onClick={() => setOpenPop(isOpen ? null : id)}
                style={{
                  width: "100%",
                  padding: "6px 9px",
                  borderRadius: "7px",
                  border: `1px solid ${isOpen ? "#d6b88a" : T.line}`,
                  background: isOpen ? T.sand : T.surface,
                  color: dim ? T.faint : T.brandDeep,
                  fontWeight: 700,
                  fontSize: "11px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                  whiteSpace: "nowrap",
                }}
              >
                <tab.icon size={12} /> {tab.short}
                {tab.key === "improvements" && recoverable > 0 && !element.excluded && (
                  <span style={{ color: T.good, fontWeight: 800 }}>{fmtPts(recoverable)}</span>
                )}
              </button>
              <Popover
                open={isOpen}
                onClose={() => setOpenPop(null)}
                title={tab.label}
                align={tab.key === "improvements" ? "right" : "left"}
                footer={
                  <button
                    onClick={() => {
                      setOpenPop(null);
                      onOpen(tab.key);
                    }}
                    style={{
                      width: "100%",
                      padding: "7px",
                      borderRadius: "7px",
                      border: "none",
                      background: "linear-gradient(135deg,#5d4037 0%,#4a2c20 100%)",
                      color: "white",
                      fontWeight: 700,
                      fontSize: "11.5px",
                      cursor: "pointer",
                    }}
                  >
                    Open full view →
                  </button>
                }
              >
                {preview(tab.key)}
              </Popover>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// The explorer
// ═════════════════════════════════════════════════════════════════════════

export default function ScoreExplorer({
  title,                 // "Capital Appeal"
  score,
  band,                  // { level, color }
  contextLine,           // e.g. "Business stage: Growth"
  badge,                 // optional node (tier badge)
  about,                 // { definition, assessmentAreas[], interpretation[], weighting{} }
  blocks,                // [{ key, label, percent, blockWeight, note, elements[] }]
  potential,             // { available, locked, projected, current, items[], lockedItems[], note }
  attention = [],        // [{ key, headline, detail, chips[], note, cta, route }]
  summary,               // { strongest, weakest, nextStep, final } | null
  onNavigate,            // (route) => void
  onClose,
  onRequestAnalysis,     // () => Promise<void>
  analysisPending,
  analysisTimestamp,
  fmtPts = defaultFmtPts,
}) {
  const [stack, setStack] = useState([{ view: "home" }]);
  const [openPop, setOpenPop] = useState(null);
  // Held at this level on purpose: the view components below are redefined on
  // every render, so state declared inside them would reset on each keystroke.
  const [potentialLimit, setPotentialLimit] = useState(5);
  const bodyRef = useRef(null);

  const frame = stack[stack.length - 1];
  const push = useCallback((f) => {
    setOpenPop(null);
    setStack((s) => [...s, f]);
  }, []);
  const back = () => {
    setOpenPop(null);
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  };
  const jumpTo = (depth) => {
    setOpenPop(null);
    setStack((s) => s.slice(0, depth + 1));
  };

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [stack.length, frame?.view, frame?.key, frame?.tab]);

  const singleBlock = blocks.length === 1;
  const findBlock = (key) => blocks.find((b) => b.key === key);
  const findElement = (blockKey, key) => (findBlock(blockKey)?.elements || []).find((e) => e.key === key);

  const openElement = (blockKey, elementKey, tab) => push({ view: "element", blockKey, key: elementKey, tab });

  // ── Titles for the breadcrumb ──
  const frameTitle = (f) => {
    switch (f.view) {
      case "home": return title;
      case "about": return "About this score";
      case "aboutDetail": return f.label;
      case "blocks": return "Your score";
      case "elements": return singleBlock ? "Your score" : findBlock(f.key)?.label || "Block";
      case "element": return findElement(f.blockKey, f.key)?.label || "Element";
      case "potential": return "Potential points";
      case "potentialItem": return f.item?.label || "Item";
      case "attention": return "Needs attention";
      default: return title;
    }
  };

  // ═══ Views ═════════════════════════════════════════════════════════════

  const HomeView = () => (
    <>
      <div
        style={{
          textAlign: "center",
          padding: "20px",
          background: "linear-gradient(135deg,#fdf8f6 0%,#f3e8dc 100%)",
          borderRadius: "12px",
          border: "1px solid #d6b88a",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "116px",
            height: "116px",
            border: `4px solid ${band.color}`,
            borderRadius: "50%",
            background: "white",
            boxShadow: "0 4px 12px rgba(139,69,19,0.18)",
            marginBottom: "10px",
          }}
        >
          <span style={{ fontSize: "28px", fontWeight: 800, color: T.brandDeep, lineHeight: 1 }}>{score}%</span>
          <span style={{ color: band.color, fontSize: "11px", fontWeight: 700, marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {band.level}
          </span>
        </div>
        {contextLine && <div style={{ fontSize: "13px", color: T.body }}>{contextLine}</div>}
        {badge}
        {potential?.available > 0 && (
          <div style={{ marginTop: "10px" }}>
            <Pill tone="good" icon={Target}>
              {fmtPts(potential.available)} available · could reach {potential.projected}%
            </Pill>
          </div>
        )}
      </div>

      {attention.length > 0 && (
        <NavTile
          title={`Needs attention (${attention.length})`}
          subtitle={attention[0].headline}
          icon={AlertCircle}
          tone="warn"
          onClick={() => push({ view: "attention" })}
        />
      )}

      <NavTile
        number="1"
        title={`About the ${title} score`}
        subtitle="What it measures, how it is weighted, how to read it"
        icon={BookOpen}
        onClick={() => push({ view: "about" })}
      />
      <NavTile
        number="2"
        title="Your score"
        subtitle={
          singleBlock
            ? `${blocks[0].elements.length} elements — breakdown, analysis and improvements for each`
            : `${blocks.length} blocks, ${blocks.reduce((n, b) => n + b.elements.length, 0)} elements`
        }
        icon={BarChart3}
        right={<span style={{ fontWeight: 800, color: T.brandDeep, fontSize: "14px" }}>{score}%</span>}
        onClick={() => push(singleBlock ? { view: "elements", key: blocks[0].key } : { view: "blocks" })}
      />
      <NavTile
        number="3"
        title="Potential points"
        subtitle={
          potential?.items?.length
            ? `${potential.items.length} item${potential.items.length === 1 ? "" : "s"} you can still claim`
            : "Everything that can be captured is captured"
        }
        icon={Target}
        right={potential?.available > 0 ? <Pill tone="good">{fmtPts(potential.available)}</Pill> : null}
        onClick={() => push({ view: "potential" })}
      />

      {summary && (
        <div style={{ marginTop: "14px", background: "white", border: `1px solid ${T.line}`, borderRadius: "10px", padding: "14px" }}>
          <SectionLabel>At a glance</SectionLabel>
          {summary.strongest && (
            <Prose style={{ marginBottom: "6px" }}>
              <strong style={{ color: T.goodMid }}>Strongest:</strong> {summary.strongest}
            </Prose>
          )}
          {summary.weakest && (
            <Prose style={{ marginBottom: "6px" }}>
              <strong style={{ color: T.bad }}>Weakest:</strong> {summary.weakest}
            </Prose>
          )}
          {summary.nextStep && (
            <Prose>
              <strong style={{ color: T.ink }}>Next step:</strong> {summary.nextStep}
            </Prose>
          )}
        </div>
      )}

      {analysisTimestamp && (
        <div style={{ fontSize: "11px", color: T.mute, marginTop: "12px", textAlign: "center" }}>
          Analysis last generated {analysisTimestamp}
        </div>
      )}
    </>
  );

  const AboutView = () => (
    <>
      <NavTile number="1.1" title="Definition" subtitle="What this score is measuring" onClick={() => push({ view: "aboutDetail", key: "definition", label: "Definition" })} />
      <NavTile number="1.2" title="Assessment areas" subtitle={`The ${blocks.reduce((n, b) => n + b.elements.length, 0)} things assessed`} onClick={() => push({ view: "aboutDetail", key: "areas", label: "Assessment areas" })} />
      <NavTile number="1.3" title="Score interpretation" subtitle="What each band means to a funder" onClick={() => push({ view: "aboutDetail", key: "interpretation", label: "Score interpretation" })} />
      <NavTile number="1.4" title="Score weighting" subtitle="How the arithmetic is done" onClick={() => push({ view: "aboutDetail", key: "weighting", label: "Score weighting" })} />
    </>
  );

  const AboutDetailView = ({ which }) => {
    if (which === "definition") {
      return (
        <>
          <Prose style={{ marginBottom: "14px" }}>{about.definition}</Prose>
          {about.definitionNotes?.map((n, i) => (
            <div key={i} style={{ background: "#efebe9", padding: "13px 14px", borderRadius: "8px", borderLeft: `4px solid ${T.brand}`, marginBottom: "10px" }}>
              <div style={{ fontWeight: 700, color: T.body, marginBottom: "5px", fontSize: "12.5px" }}>{n.title}</div>
              <Prose style={{ fontSize: "12.5px" }}>{n.body}</Prose>
            </div>
          ))}
        </>
      );
    }
    if (which === "areas") {
      return (
        <>
          {about.assessmentAreas.map((area) => (
            <div key={area.label} style={{ background: "white", border: `1px solid ${T.hair}`, borderRadius: "9px", padding: "12px 13px", marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "baseline" }}>
                <strong style={{ color: T.ink, fontSize: "12.5px" }}>{area.label}</strong>
                <span style={{ fontSize: "11.5px", color: T.mute, whiteSpace: "nowrap" }}>{area.weightLabel}</span>
              </div>
              <Prose style={{ fontSize: "12.5px", marginTop: "4px" }}>{area.detail}</Prose>
            </div>
          ))}
        </>
      );
    }
    if (which === "interpretation") {
      return (
        <>
          {about.interpretation.map((b) => (
            <div key={b.range} style={{ display: "flex", gap: "11px", alignItems: "flex-start", background: "white", border: `1px solid ${T.hair}`, borderRadius: "9px", padding: "11px 13px", marginBottom: "8px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: b.color, marginTop: "5px", flexShrink: 0 }} />
              <span>
                <strong style={{ color: T.ink, fontSize: "12.5px" }}>{b.range} — {b.label}</strong>
                {b.meaning && <Prose style={{ fontSize: "12.5px", marginTop: "3px" }}>{b.meaning}</Prose>}
              </span>
            </div>
          ))}
        </>
      );
    }
    // weighting
    return (
      <>
        {about.weighting.formula && (
          <div style={{ background: "#efebe9", padding: "14px", borderRadius: "8px", borderLeft: `4px solid ${T.brand}`, marginBottom: "14px" }}>
            <div style={{ fontWeight: 700, color: T.body, marginBottom: "7px", fontSize: "12.5px" }}>How a point value is worked out</div>
            <div style={{ fontFamily: "monospace", fontSize: "11.5px", background: "white", padding: "8px 10px", borderRadius: "6px", border: "1px solid #e0d5c8" }}>
              {about.weighting.formula}
            </div>
            {about.weighting.formulaNote && <Prose style={{ fontSize: "12.5px", marginTop: "8px" }}>{about.weighting.formulaNote}</Prose>}
          </div>
        )}
        {about.weighting.tables.map((tbl) => (
          <div key={tbl.title} style={{ background: "white", border: `1px solid ${T.hair}`, borderRadius: "9px", padding: "13px", marginBottom: "12px" }}>
            <SectionLabel>{tbl.title}</SectionLabel>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ color: T.body }}>
                  <th style={{ textAlign: "left", padding: "4px 6px" }}>{tbl.firstColumn || "Factor"}</th>
                  <th style={{ textAlign: "right", padding: "4px 6px" }}>Weight</th>
                  <th style={{ textAlign: "right", padding: "4px 6px" }}>Now</th>
                </tr>
              </thead>
              <tbody>
                {tbl.rows.map((r) => (
                  <tr key={r.label} style={{ color: r.excluded ? T.faint : T.brandDeep, borderTop: `1px solid ${T.hair}` }}>
                    <td style={{ padding: "5px 6px" }}>{r.label}</td>
                    <td style={{ padding: "5px 6px", textAlign: "right" }}>{r.weight}</td>
                    <td style={{ padding: "5px 6px", textAlign: "right", fontWeight: 700 }}>{r.now}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tbl.note && <Prose style={{ fontSize: "11.5px", fontStyle: "italic", marginTop: "8px" }}>{tbl.note}</Prose>}
          </div>
        ))}
      </>
    );
  };

  const BlocksView = () => (
    <>
      {blocks.map((b) => (
        <NavTile
          key={b.key}
          title={b.label}
          subtitle={
            b.inactive
              ? b.note
              : `${Math.round(b.percent)}% × ${b.blockWeight}% weight = ${Math.round(b.percent * (b.blockWeight / 100) * 10) / 10} pts · ${b.elements.length} elements`
          }
          icon={BarChart3}
          tone={b.inactive ? "warn" : undefined}
          right={!b.inactive && <Bar percent={b.percent} width={56} />}
          onClick={() => push({ view: "elements", key: b.key })}
        />
      ))}
    </>
  );

  const ElementsView = ({ blockKey }) => {
    const b = findBlock(blockKey);
    if (!b) return <Prose>Nothing to show.</Prose>;
    return (
      <>
        {b.note && (
          <div style={{ background: b.inactive ? T.warnBg : T.surface, border: `1px solid ${b.inactive ? T.warnLine : T.line}`, borderRadius: "9px", padding: "11px 13px", marginBottom: "12px" }}>
            <Prose style={{ fontSize: "12.5px", color: b.inactive ? T.warn : T.body }}>{b.note}</Prose>
          </div>
        )}
        <SectionLabel>Tap a button for a quick look, or open the full view</SectionLabel>
        {b.elements.map((el) => (
          <ElementRow
            key={el.key}
            element={el}
            fmtPts={fmtPts}
            openPop={openPop}
            setOpenPop={setOpenPop}
            onOpen={(tab) => openElement(b.key, el.key, tab)}
          />
        ))}
      </>
    );
  };

  const ElementView = ({ blockKey, elementKey, tab }) => {
    const el = findElement(blockKey, elementKey);
    if (!el) return <Prose>Nothing to show.</Prose>;
    const active = tab || "breakdown";
    const setTab = (t) => setStack((s) => [...s.slice(0, -1), { ...s[s.length - 1], tab: t }]);

    return (
      <>
        <div style={{ background: "white", border: `1px solid ${T.line}`, borderRadius: "10px", padding: "13px", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: T.ink, fontSize: "14px" }}>{el.label}</div>
              <div style={{ fontSize: "11.5px", color: T.mute, marginTop: "2px" }}>
                {el.excluded ? "Excluded at this tier — 0% weight" : `${el.weight}% of ${findBlock(blockKey)?.label}${el.effectiveWeight ? ` · ${el.effectiveWeight.toFixed(1)} pts of the final score` : ""}`}
              </div>
            </div>
            {!el.excluded && <span style={{ fontSize: "22px", fontWeight: 800, color: T.brandDeep }}>{Math.round(el.percent)}%</span>}
          </div>
          {el.excluded && el.exclusionNote && (
            <Prose style={{ fontSize: "12.5px", marginTop: "8px", fontStyle: "italic" }}>{el.exclusionNote} It costs you nothing.</Prose>
          )}
          {!el.excluded && el.reductionNote && (
            <Prose style={{ fontSize: "12.5px", marginTop: "8px", color: "#f57c00" }}>{el.reductionNote}</Prose>
          )}
        </div>

        <div style={{ display: "flex", gap: "6px", marginBottom: "13px" }}>
          {TABS.map((t, i) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1,
                padding: "8px 6px",
                borderRadius: "8px",
                border: `1px solid ${active === t.key ? T.brandDeep : T.line}`,
                background: active === t.key ? "linear-gradient(135deg,#5d4037 0%,#4a2c20 100%)" : "white",
                color: active === t.key ? "white" : T.brandDeep,
                fontWeight: 700,
                fontSize: "11.5px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
              }}
            >
              <t.icon size={12} /> {2}.{i + 1} {t.short}
            </button>
          ))}
        </div>

        {active === "breakdown" && (
          <div style={{ background: "white", border: `1px solid ${T.hair}`, borderRadius: "10px", padding: "14px" }}>
            {el.sourceNote && <Prose style={{ fontSize: "12px", fontStyle: "italic", marginBottom: "12px" }}>{el.sourceNote}</Prose>}

            {/* Grouped sub-categories, where an element has them */}
            {(el.groups || []).map((g) => (
              <div key={g.key || g.label} style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "10px", marginBottom: "7px" }}>
                  <strong style={{ color: T.ink, fontSize: "12.5px" }}>{g.label}</strong>
                  <span style={{ fontSize: "11.5px", color: T.mute, whiteSpace: "nowrap" }}>
                    {Math.round(g.percent)}% × {g.weight}% weight
                  </span>
                </div>
                {g.note && <Prose style={{ fontSize: "12px", fontStyle: "italic", marginBottom: "7px" }}>{g.note}</Prose>}
                {(g.items || []).map((it) => <ItemRow key={it.key} item={it} fmtPts={fmtPts} onNavigate={onNavigate} />)}
              </div>
            ))}

            {(el.breakdown || []).map((it) => <ItemRow key={it.key} item={it} fmtPts={fmtPts} onNavigate={onNavigate} />)}

            {/* A card can hand in its own panel for an element the generic
                item list cannot express — the 5.1 → 5.3 board assessment
                being the case this exists for. */}
            {el.extra}

            {!(el.breakdown || []).length && !(el.groups || []).length && !el.extra && (
              <Prose>No line items are recorded for this element.</Prose>
            )}
            <FindingsPanel findings={el.findings} mode="breakdown" />
          </div>
        )}

        {active === "analysis" && (
          <div style={{ background: "white", border: `1px solid ${T.hair}`, borderRadius: "10px", padding: "14px" }}>
            {el.analysis ? (
              <>
                {/* Generic shape: whatever labelled fields the card's prompt
                    produced, in the order it wants them. */}
                {(el.analysis.fields || []).map((f, i) => (
                  <div key={i} style={{ marginBottom: "14px" }}>
                    <SectionLabel>{f.label}</SectionLabel>
                    <Prose style={{ color: f.tone === "bad" ? T.badText : f.tone === "good" ? T.goodMid : T.body }}>{f.text}</Prose>
                  </div>
                ))}
                {el.analysis.evidence && (
                  <>
                    <SectionLabel>What was counted</SectionLabel>
                    <Prose style={{ marginBottom: "14px" }}>{el.analysis.evidence}</Prose>
                  </>
                )}
                {el.analysis.withheld && (
                  <>
                    <SectionLabel>Why points were withheld</SectionLabel>
                    <Prose style={{ marginBottom: "14px", color: T.badText }}>{el.analysis.withheld}</Prose>
                  </>
                )}
                {el.analysis.rationale && (
                  <>
                    <SectionLabel>What a funder reads into this</SectionLabel>
                    <Prose>{el.analysis.rationale}</Prose>
                  </>
                )}
                {!el.analysis.evidence && !el.analysis.rationale && !(el.analysis.fields || []).length && (
                  <Prose>{el.analysis.raw}</Prose>
                )}
                {el.findings && (
                  <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: `1px dashed ${T.line2}` }}>
                    <FindingsPanel findings={el.findings} mode="analysis" />
                  </div>
                )}
              </>
            ) : el.findings ? (
              // The document evaluator's own analysis is already on file. It is
              // the analysis for this element — showing "nothing yet" while it
              // sits in Firestore was the whole problem.
              <>
                <FindingsPanel findings={el.findings} mode="analysis" />
                {onRequestAnalysis && (
                  <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: `1px dashed ${T.line2}` }}>
                    <Prose style={{ fontSize: "12px", color: T.mute, marginBottom: "9px" }}>
                      This is the {el.findings.docLabel || el.findings.source} evaluation. Generate the capital appeal narrative to
                      see how it reads against the rest of your score.
                    </Prose>
                    <button
                      onClick={onRequestAnalysis}
                      disabled={analysisPending}
                      style={{
                        padding: "8px 14px",
                        background: "white",
                        color: T.brandDeep,
                        border: `1px solid ${T.line2}`,
                        borderRadius: "8px",
                        fontWeight: 700,
                        fontSize: "11.5px",
                        cursor: analysisPending ? "not-allowed" : "pointer",
                        opacity: analysisPending ? 0.7 : 1,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "7px",
                      }}
                    >
                      <RefreshCw size={12} className={analysisPending ? "spin" : ""} />
                      {analysisPending ? "Generating…" : "Generate capital appeal narrative"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <Prose style={{ marginBottom: "12px", fontStyle: "italic", color: T.mute }}>
                  No written analysis for this element yet. The score and the point values are already final and do not depend on it.
                </Prose>
                {onRequestAnalysis && (
                  <button
                    onClick={onRequestAnalysis}
                    disabled={analysisPending}
                    style={{
                      padding: "9px 16px",
                      background: T.brandDeep,
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 700,
                      fontSize: "12px",
                      cursor: analysisPending ? "not-allowed" : "pointer",
                      opacity: analysisPending ? 0.7 : 1,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                    }}
                  >
                    <RefreshCw size={13} className={analysisPending ? "spin" : ""} />
                    {analysisPending ? "Generating…" : "Generate analysis"}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {active === "improvements" && (
          <div style={{ background: "white", border: `1px solid ${T.hair}`, borderRadius: "10px", padding: "14px" }}>
            {(el.improvements || []).length ? (
              <>
                <SectionLabel>Point-valued actions</SectionLabel>
                <Prose style={{ marginBottom: "12px" }}>
                  <strong style={{ color: T.good }}>
                    {fmtPts(el.improvements.reduce((s, i) => s + i.pointValue, 0))}
                  </strong>{" "}
                  recoverable here. Each figure is the exact amount the score moves when the item is resolved.
                </Prose>
                {el.improvements.map((it) => (
                  <div key={it.key} style={{ border: `1px solid ${T.hair}`, borderRadius: "9px", padding: "12px", marginBottom: "9px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "6px" }}>
                      <strong style={{ color: T.ink, fontSize: "12.5px", flex: 1 }}>{it.label}</strong>
                      <Pill tone="good">{fmtPts(it.pointValue)}</Pill>
                    </div>
                    {it.reason && <Prose style={{ fontSize: "12.5px", color: T.badText, marginBottom: "6px" }}>{it.reason}</Prose>}
                    <Prose style={{ fontSize: "12.5px", marginBottom: "9px" }}>{it.fix || `Capture this under ${it.section}.`}</Prose>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                      {it.route && <GoButton small label={`Go to ${it.section}`} onClick={() => onNavigate(it.route)} />}
                      {it.secondaryAction && (
                        <button
                          onClick={it.secondaryAction.onClick}
                          style={{ background: "none", border: `1px solid ${T.badLine}`, color: T.badText, borderRadius: "8px", padding: "7px 12px", fontSize: "11.5px", fontWeight: 600, cursor: "pointer" }}
                        >
                          {it.secondaryAction.label}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            ) : el.locked?.length ? (
              <Prose>
                Nothing here can be recovered by editing the profile. {el.locked.map((i) => i.label).join("; ")} follow your actual
                records and balance sheet — they move as the business does.
              </Prose>
            ) : el.findings || el.extraImprovements ? null : (
              <Prose>
                <strong style={{ color: T.goodMid }}>Complete.</strong> Everything captured in this element was counted in full.
              </Prose>
            )}

            {/* A card can hand in its own improvements panel — the board
                evidence gaps being the case this exists for. */}
            {el.extraImprovements}

            {el.findings && (
              <div style={{ marginTop: (el.improvements || []).length || el.locked?.length ? "16px" : 0, paddingTop: (el.improvements || []).length || el.locked?.length ? "14px" : 0, borderTop: (el.improvements || []).length || el.locked?.length ? `1px dashed ${T.line2}` : "none" }}>
                <FindingsPanel findings={el.findings} mode="improvements" />
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  const PotentialView = () => {
    const limit = potentialLimit;
    const items = potential?.items || [];
    if (!items.length) {
      return (
        <div style={{ padding: "14px", background: "#f1f8f1", border: `1px solid ${T.goodLine}`, borderRadius: "9px", color: T.goodMid, lineHeight: 1.7 }}>
          <div style={{ fontWeight: 800, marginBottom: "4px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <CheckCircle size={14} /> Nothing left to claim
          </div>
          Everything that can be captured is captured and counted.
        </div>
      );
    }
    return (
      <>
        <div style={{ padding: "16px", background: "linear-gradient(135deg,#fdf8f6 0%,#e8f5e9 100%)", border: `1px solid ${T.goodLine}`, borderRadius: "10px", marginBottom: "14px", textAlign: "center" }}>
          <div style={{ fontSize: "10px", color: T.good, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.7px" }}>
            Your score could reach
          </div>
          <div style={{ fontSize: "34px", fontWeight: 800, color: T.good, lineHeight: 1.2 }}>{potential.projected}%</div>
          <div style={{ fontSize: "12.5px", color: T.brandDeep }}>
            {potential.current}% today · <strong style={{ color: T.good }}>{fmtPts(potential.available)}</strong> sitting in {items.length} item
            {items.length === 1 ? "" : "s"}
          </div>
        </div>

        {items.slice(0, limit).map((item, i) => (
          <NavTile
            key={item.key}
            number={i + 1}
            title={item.label}
            subtitle={`${item.container} · ${item.state === "missing" ? "Not captured yet" : item.earned > 0 ? "Partly counted" : "Captured — not counting"}`}
            right={<Pill tone="good">{fmtPts(item.pointValue)}</Pill>}
            onClick={() => push({ view: "potentialItem", item })}
          />
        ))}

        {items.length > limit && (
          <button
            onClick={() => setPotentialLimit(limit + 5)}
            style={{ width: "100%", padding: "10px", borderRadius: "9px", border: `1px dashed ${T.line2}`, background: "white", color: T.brandDeep, fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
          >
            Show {Math.min(5, items.length - limit)} more of {items.length}
          </button>
        )}

        {potential.lockedItems?.length > 0 && (
          <div style={{ marginTop: "13px", padding: "12px", background: "#f5f2f0", border: `1px solid ${T.line2}`, borderRadius: "9px", fontSize: "11.5px", color: T.body, lineHeight: 1.65 }}>
            <div style={{ fontWeight: 800, marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "10.5px" }}>
              <Lock size={12} /> {potential.lockedTitle || "Not listed above"}
              {potential.locked > 0 ? ` — ${fmtPts(potential.locked)}` : ""}
            </div>
            {potential.lockedNote || (
              <>
                {potential.lockedItems.map((i) => i.label).join("; ")} — worth {fmtPts(potential.locked)}, but these follow your actual
                records and balance sheet rather than anything you can enter. Left out of the total rather than dressed up as an action.
              </>
            )}
            {potential.lockedNote &&
              potential.lockedItems.map((i) => (
                <div key={i.key || i.label} style={{ display: "flex", alignItems: "flex-start", gap: "10px", background: "white", border: `1px solid ${T.hair}`, borderRadius: "8px", padding: "9px 11px", marginTop: "7px" }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ color: T.ink, fontSize: "12.5px" }}>{i.label}</strong>
                    {i.action && <Prose style={{ fontSize: "11.5px" }}>{i.action}</Prose>}
                  </span>
                  {i.pointValue != null && <Pill tone="neutral">{fmtPts(i.pointValue)}</Pill>}
                </div>
              ))}
          </div>
        )}

        {potential.footnotes?.map((f, i) => (
          <div key={i} style={{ marginTop: "11px", padding: "11px 12px", background: T.surface, border: `1px solid ${T.line}`, borderRadius: "9px" }}>
            <SectionLabel>{f.title}</SectionLabel>
            <Prose style={{ fontSize: "11.5px" }}>{f.body}</Prose>
            {(f.items || []).map((u, n) => (
              <div key={n} style={{ marginTop: "7px", background: "white", border: `1px solid ${T.hair}`, borderRadius: "8px", padding: "9px 11px" }}>
                <strong style={{ color: T.ink, fontSize: "12px" }}>{u.what}</strong>
                <Prose style={{ fontSize: "11.5px" }}>{u.why}</Prose>
              </div>
            ))}
          </div>
        ))}
      </>
    );
  };

  const PotentialItemView = ({ item }) => (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", padding: "16px", background: "linear-gradient(135deg,#f1f8f1 0%,#e8f5e9 100%)", border: `1px solid ${T.goodLine}`, borderRadius: "10px", marginBottom: "14px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "9.5px", color: T.body, textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 700 }}>Now</div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: T.brand, lineHeight: 1.1 }}>{score}%</div>
        </div>
        <div style={{ fontSize: "22px", color: T.good, fontWeight: 800 }}>→</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "9.5px", color: T.good, textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 700 }}>With this resolved</div>
          <div style={{ fontSize: "30px", fontWeight: 800, color: T.good, lineHeight: 1.1 }}>
            {/* item.projected wins when the card measured it by re-running the
                score with the action applied rather than adding it up. */}
            {item.projected != null ? item.projected : Math.round(potential.current + item.pointValue)}%
          </div>
          <div style={{ fontSize: "11px", color: T.goodMid, fontWeight: 700 }}>{fmtPts(item.pointValue)}</div>
        </div>
      </div>

      {item.evidence && (
        <>
          <SectionLabel>Currently recorded</SectionLabel>
          <Prose style={{ marginBottom: "13px" }}>{item.evidence}</Prose>
        </>
      )}
      {item.reason && (
        <div style={{ fontSize: "12.5px", color: T.badText, background: T.badBg, border: `1px solid ${T.badLine}`, borderRadius: "8px", padding: "10px 12px", marginBottom: "13px", lineHeight: 1.65 }}>
          {item.reason}
        </div>
      )}
      {item.importance && (
        <>
          <SectionLabel>Why funders ask for it</SectionLabel>
          <Prose style={{ marginBottom: "13px" }}>{item.importance}</Prose>
        </>
      )}
      <SectionLabel>What to do</SectionLabel>
      <Prose style={{ marginBottom: "14px" }}>{item.fix || `Capture this under ${item.section}.`}</Prose>
      <GoButton label={`Go to ${item.section}`} onClick={() => onNavigate(item.route)} disabled={!item.route} />
    </>
  );

  const AttentionView = () => (
    <>
      {attention.map((n) => (
        <div key={n.key} style={{ padding: "14px 15px", background: T.warnBg, border: `1px solid ${T.warnLine}`, borderRadius: "10px", marginBottom: "11px" }}>
          <div style={{ fontWeight: 800, color: T.warn, marginBottom: "6px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <AlertCircle size={14} /> {n.headline}
          </div>
          <Prose style={{ fontSize: "12.5px", marginBottom: "10px" }}>{n.detail}</Prose>
          {n.chips?.length > 0 && (
            <div style={{ background: "white", border: `1px solid ${T.warnLine}`, borderRadius: "7px", padding: "10px 12px", marginBottom: "10px" }}>
              <SectionLabel>Outstanding</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {n.chips.map((c) => (
                  <span key={c} style={{ fontSize: "11.5px", color: T.warn, background: T.warnBg, border: `1px solid ${T.warnLine}`, borderRadius: "12px", padding: "3px 10px" }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
          {n.note && (
            <div style={{ fontSize: "12px", color: T.goodMid, background: "#f1f8f1", border: `1px solid ${T.goodLine}`, borderRadius: "7px", padding: "9px 11px", marginBottom: "10px", lineHeight: 1.6 }}>
              {n.note}
            </div>
          )}
          {n.cta && <GoButton label={n.cta} onClick={() => onNavigate(n.route)} />}
        </div>
      ))}
    </>
  );

  // ═══ Frame router ══════════════════════════════════════════════════════

  const renderFrame = () => {
    switch (frame.view) {
      case "home": return <HomeView />;
      case "about": return <AboutView />;
      case "aboutDetail": return <AboutDetailView which={frame.key} />;
      case "blocks": return <BlocksView />;
      case "elements": return <ElementsView blockKey={frame.key} />;
      case "element": return <ElementView blockKey={frame.blockKey} elementKey={frame.key} tab={frame.tab} />;
      case "potential": return <PotentialView />;
      case "potentialItem": return <PotentialItemView item={frame.item} />;
      case "attention": return <AttentionView />;
      default: return <HomeView />;
    }
  };

  const atHome = stack.length === 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", maxHeight: "88vh" }}>
      {/* Header — back arrow, title, close */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "14px 16px",
          borderBottom: `1px solid ${T.line}`,
          background: "white",
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
          flexShrink: 0,
        }}
      >
        {!atHome ? (
          <button
            onClick={back}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              border: `1px solid ${T.line2}`,
              background: "white",
              color: T.brandDeep,
              borderRadius: "8px",
              padding: "6px 11px 6px 8px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>
        ) : (
          <span style={{ width: "2px" }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: T.brandDeep, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {frameTitle(frame)}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            background: "white",
            border: `2px solid ${T.line2}`,
            color: T.mute,
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontWeight: "bold",
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Breadcrumb */}
      {!atHome && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            flexWrap: "wrap",
            padding: "8px 16px",
            background: T.surface,
            borderBottom: `1px solid ${T.hair}`,
            fontSize: "11px",
            color: T.mute,
            flexShrink: 0,
          }}
        >
          {stack.map((f, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
              {i > 0 && <ChevronRight size={11} style={{ color: T.faint }} />}
              {i === stack.length - 1 ? (
                <span style={{ color: T.ink, fontWeight: 700 }}>{frameTitle(f)}</span>
              ) : (
                <button
                  onClick={() => jumpTo(i)}
                  style={{ background: "none", border: "none", padding: 0, color: T.brand, fontSize: "11px", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                >
                  {frameTitle(f)}
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Body — one screen, one job */}
      <div ref={bodyRef} style={{ padding: "16px", overflowY: "auto", background: "#f5f2f0", flex: 1 }}>
        {renderFrame()}
      </div>

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}