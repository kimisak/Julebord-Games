'use client';

import type { TimelineEvent } from "@/lib/types";

type Props = {
  centerYear: number;
  currentTeamName?: string;
  queue: TimelineEvent[];
  placedLeft: TimelineEvent[];
  placedRight: TimelineEvent[];
  onPlace: (slot: { index: number; onYear?: number | null }) => void;
  onClose: () => void;
  disableActions?: boolean;
  winnerName?: string | null;
  points?: number;
};

export function TimelineModal({
  centerYear,
  currentTeamName,
  queue,
  placedLeft,
  placedRight,
  onPlace,
  onClose,
  disableActions,
  winnerName,
  points,
}: Props) {
  const activeEvent = queue[0];
  const formatYear = (year: number | null | undefined) => {
    if (year === null || year === undefined) return "Unknown";
    if (year < 0) return `${Math.abs(year)} BC`;
    return `${year}`;
  };

  const combined = [
    ...placedLeft.map((e) => ({ ...e, side: "left" as const })),
    { id: "__center", text: "Center", year: centerYear, side: "center" as const },
    ...placedRight.map((e) => ({ ...e, side: "right" as const })),
  ].sort((a, b) => (a.year ?? 0) - (b.year ?? 0));

  const renderDropZone = (slot: { index: number; onYear?: number }, size: "thin" | "wide" = "thin") => (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (!disableActions) onPlace(slot);
      }}
      style={{
        minWidth: size === "wide" ? "20px" : "12px",
        minHeight: "60px",
        border: "1px dashed rgba(255,255,255,0.18)",
        borderRadius: "10px",
        display: "grid",
        placeItems: "center",
        padding: size === "wide" ? "8px" : "4px",
        background: "repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0, rgba(255,255,255,0.06) 8px, rgba(255,255,255,0.03) 8px, rgba(255,255,255,0.03) 16px)",
      }}
    />
  );

  return (
    <div
      className="card"
      style={{
        padding: "20px",
        background: "rgba(10, 12, 18, 0.96)",
        borderColor: "rgba(255,255,255,0.18)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          gap: "10px",
        }}
      >
        <div style={{ display: "grid", gap: "4px" }}>
          <div
            style={{
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--muted)",
            }}
          >
            Timeline
          </div>
          <div style={{ fontWeight: 800, fontSize: "2rem" }}>Year {formatYear(centerYear)}</div>
          {winnerName ? (
            <div style={{ color: "#f2c14f", fontSize: "0.95rem", fontWeight: 700 }}>
              Winner: {winnerName}
            </div>
          ) : currentTeamName ? (
            <div style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
              Guessing: <strong style={{ color: "#f2c14f" }}>{currentTeamName}</strong>
            </div>
          ) : null}
        </div>
        <button className="button ghost" onClick={onClose}>
          Close
        </button>
      </div>

      <div
        style={{
          padding: "12px",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.03)",
          marginBottom: "12px",
          color: "var(--muted)",
        }}
      >
        Drag or click to place the event before or after the center year. Wrong guesses remove the
        event. Final correct placement wins the points.
      </div>

      <div style={{ display: "flex", gap: "12px", alignItems: "stretch", flexWrap: "wrap", justifyContent: "center", marginBottom: "12px" }}>
        {combined.length > 0 && renderDropZone({ index: 0 }, "wide")}
        {combined.map((ev, idx) => (
          <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (!disableActions) onPlace({ index: idx, onYear: ev.year ?? undefined });
              }}
              className="card"
              style={{
                padding: "8px",
                minWidth: "120px",
                textAlign: "center",
                border:
                  ev.side === "center"
                    ? "2px solid rgba(255,255,255,0.3)"
                    : ev.status === "correct"
                      ? "2px solid rgba(28,111,77,0.8)"
                      : ev.status === "wrong"
                        ? "2px solid rgba(185,28,28,0.8)"
                        : "1px solid rgba(255,255,255,0.16)",
                background:
                  ev.side === "center"
                    ? "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.08))"
                    : ev.status === "correct"
                      ? "linear-gradient(135deg, rgba(28,111,77,0.25), rgba(15,90,60,0.4))"
                      : ev.status === "wrong"
                        ? "linear-gradient(135deg, rgba(185,28,28,0.28), rgba(127,29,29,0.4))"
                        : "rgba(255,255,255,0.06)",
                boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
              }}
            >
              <div style={{ fontWeight: 800 }}>{formatYear(ev.year)}</div>
              <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                {ev.side === "center" ? "Center year" : ev.timelineText ?? ev.text}
              </div>
            </div>
            {idx === combined.length - 1
              ? renderDropZone({ index: combined.length }, "wide")
              : renderDropZone({ index: idx + 1 }, "wide")}
          </div>
        ))}
      </div>

      {activeEvent ? (
        <div
      draggable={!disableActions}
      onDragStart={(e) => e.dataTransfer.setData("text/plain", activeEvent.id)}
      style={{
        border: "1px solid rgba(255,255,255,0.16)",
        borderRadius: "12px",
        padding: "12px",
        background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
        boxShadow: "0 8px 16px rgba(0,0,0,0.3)",
        cursor: disableActions ? "not-allowed" : "grab",
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: "6px" }}>Place this event</div>
      <div style={{ fontSize: "1.1rem" }}>{activeEvent.text || "(No description)"}</div>
    </div>
  ) : (
        <div
          style={{
            padding: "12px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            color: "var(--muted)",
          }}
        >
          {winnerName
            ? (
              <span>
                Congrats, <strong style={{ color: "#f2c14f" }}>{winnerName}</strong> earned{" "}
                <strong style={{ color: "#f2c14f" }}>{points ?? 0}</strong> points!
              </span>
            )
            : "No more events to place."}
        </div>
      )}
    </div>
  );
}
