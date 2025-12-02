'use client';

import type { Question, Team } from "@/lib/types";

type Props = {
  question: Question;
  teams: Team[];
  currentTeamName?: string;
  answeringTeamName?: string;
  mapLocked: boolean;
  setMapLocked: (v: boolean) => void;
  onClose: () => void;
  onRevealAnswer: () => void;
  showAnswer: boolean;
  onCorrect: () => void;
  onWrong: () => void;
  disableActions?: boolean;
};

export function GeoguesserModal({
  question,
  currentTeamName,
  answeringTeamName,
  mapLocked,
  setMapLocked,
  onClose,
  onRevealAnswer,
  showAnswer,
  onCorrect,
  onWrong,
  disableActions,
}: Props) {
  return (
    <div
      className={`flip-inner ${showAnswer ? "flipped" : ""}`}
      style={{
        position: "relative",
        width: "100%",
        minHeight: "360px",
        transformStyle: "preserve-3d",
        transition: "transform 0.5s ease",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backfaceVisibility: "hidden",
        }}
      >
        <div
          className="card"
          style={{
            padding: "22px",
            background: "rgba(10, 12, 18, 0.96)",
            borderColor: "rgba(255,255,255,0.18)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--muted)",
                }}
              >
                {question.category}
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 800 }}>
                {question.points} pts
              </div>
              {answeringTeamName && (
                <div style={{ color: "var(--muted)", marginTop: "2px", fontSize: "0.95rem" }}>
                  Answering: <strong style={{ color: "#81e6d9" }}>{answeringTeamName}</strong>
                </div>
              )}
            </div>
            {question.mapEmbedUrl && (
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
                  Map is {mapLocked ? "locked (view only)" : "unlocked (can move)"}
                </div>
                <button className="button ghost" onClick={() => setMapLocked(!mapLocked)}>
                  {mapLocked ? "Unlock map" : "Lock map"}
                </button>
              </div>
            )}
          </div>
          {question.prompt && (
            <div style={{ fontSize: "1.4rem", lineHeight: 1.45, marginBottom: "10px" }}>
              {question.prompt}
            </div>
          )}
          {question.mapEmbedUrl ? (
            <div
              style={{
                position: "relative",
                borderRadius: "14px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                height: "420px",
              }}
            >
              <iframe
                src={question.mapEmbedUrl}
                style={{
                  width: "100%",
                  height: "900px",
                  border: "0",
                  marginTop: "-220px",
                  pointerEvents: mapLocked ? "none" : "auto",
                }}
                allowFullScreen
                loading="lazy"
              />
            </div>
          ) : (
            <div
              style={{
                padding: "14px",
                borderRadius: "12px",
                border: "1px dashed rgba(255,255,255,0.2)",
                color: "var(--muted)",
              }}
            >
              No Street View embed URL provided.
            </div>
          )}
          <div
            style={{
              marginTop: "18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <button className="button ghost" onClick={onClose}>
              Close
            </button>
            <button className="button primary" onClick={onRevealAnswer}>
              Reveal answer
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
        }}
      >
        <div
          className="card"
          style={{
            padding: "22px",
            background: "rgba(10, 14, 19, 0.96)",
            borderColor: "rgba(255,255,255,0.2)",
          }}
        >
          <div
            style={{
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                textTransform: "uppercase",
                color: "var(--muted)",
                letterSpacing: "0.05em",
                fontWeight: 800,
              }}
            >
              {question.category}
            </div>
            <div style={{ fontWeight: 800, fontSize: "2rem", marginTop: "6px" }}>
              {question.points} pts
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: question.answerImageData ? "1fr 1fr" : "1fr",
              gap: "16px",
              alignItems: "start",
              marginTop: "6px",
            }}
          >
            <div>
              <div
                style={{
                  color: "var(--muted)",
                  marginBottom: "6px",
                  fontSize: "1rem",
                }}
              >
                Answer
              </div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: "2rem",
                  lineHeight: 1.4,
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                }}
              >
                {question.answer || "No answer provided."}
              </div>
              {question.answerLocationUrl && (
                <a
                  href={question.answerLocationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="button ghost"
                  style={{ marginTop: "10px", display: "inline-flex" }}
                >
                  Open in Google Maps
                </a>
              )}
              {question.mapEmbedUrl && (
                <div
                  style={{
                    marginTop: "12px",
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.12)",
                    height: "320px",
                  }}
                >
                  <iframe
                    src={question.mapEmbedUrl}
                    style={{
                      width: "100%",
                      height: "800px",
                      border: "0",
                      marginTop: "-200px",
                      pointerEvents: mapLocked ? "none" : "auto",
                    }}
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              )}
            </div>
            {question.answerImageData && (
              <div
                style={{
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.04)",
                  display: "grid",
                  placeItems: "center",
                  padding: "6px",
                }}
              >
                <img
                  src={question.answerImageData}
                  alt={question.answerImageName || "Answer image"}
                  style={{
                    width: "100%",
                    maxHeight: "520px",
                    height: "auto",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
            )}
          </div>
          <div
            style={{
              marginTop: "18px",
              display: "grid",
              gap: "10px",
            }}
          >
            {answeringTeamName && (
              <div style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
                Answered by: <strong style={{ color: "#81e6d9" }}>{answeringTeamName}</strong>
              </div>
            )}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                className="button secondary"
                onClick={onCorrect}
                disabled={disableActions}
                style={{ opacity: disableActions ? 0.6 : 1 }}
              >
                ✓ Correct
              </button>
              <button
                className="button ghost"
                onClick={onWrong}
                disabled={disableActions}
                style={{ opacity: disableActions ? 0.6 : 1 }}
              >
                ✕ Wrong
              </button>
              <button className="button ghost" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
