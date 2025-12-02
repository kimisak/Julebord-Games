'use client';

import { useMemo, useState } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { QUESTION_STORAGE_KEY, TEAM_STORAGE_KEY } from "@/lib/storage";
import { POINT_VALUES, type Question, type Team } from "@/lib/types";

type ActiveQuestion = Question & { category: string };
type TeamId = string;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function GameBoardPage() {
  const [teams, setTeams] = usePersistentState<Team[]>(TEAM_STORAGE_KEY, []);
  const [questions, setQuestions] = usePersistentState<Question[]>(
    QUESTION_STORAGE_KEY,
    [],
  );
  const [activeQuestion, setActiveQuestion] = useState<ActiveQuestion | null>(
    null,
  );
  const [lyricsRevealed, setLyricsRevealed] = useState<boolean[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [turnOrder, setTurnOrder] = useState<TeamId[]>([]);
  const [boardTurnIndex, setBoardTurnIndex] = useState(0);
  const [lyricsTurnIndex, setLyricsTurnIndex] = useState(0);
  const [lastGuessTeamId, setLastGuessTeamId] = useState<string>("");
  const [mapLocked, setMapLocked] = useState(true);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    questions.forEach((q) => {
      if (!seen.has(q.category)) {
        seen.add(q.category);
        ordered.push(q.category);
      }
    });
    return ordered;
  }, [questions]);

  const sortedTeams = useMemo(
    () => [...teams].sort((a, b) => b.score - a.score),
    [teams],
  );
  const activeTurnOrder = useMemo(
    () => turnOrder.filter((id) => teams.some((t) => t.id === id)),
    [turnOrder, teams],
  );

  const openQuestion = (question: Question) => {
    setActiveQuestion(question);
    setShowAnswer(false);
    if (question.type === "lyrics") {
      const len = question.lyricsSegments?.length ?? 0;
      const arr = new Array(len).fill(false);
      setLyricsRevealed(arr);
    } else {
      setLyricsRevealed([]);
    }
    if (activeTurnOrder.length > 0) {
      const currentId =
        activeTurnOrder[boardTurnIndex % activeTurnOrder.length];
      setSelectedTeamId(currentId);
      setLyricsTurnIndex(boardTurnIndex);
    } else {
      setLyricsTurnIndex(0);
    }
  };

  const closeModal = () => {
    setActiveQuestion(null);
    setShowAnswer(false);
    setSelectedTeamId("");
    setLyricsRevealed([]);
    setLastGuessTeamId("");
    setLyricsTurnIndex(0);
    setMapLocked(true);
  };

  const markAnswered = (correct: boolean) => {
    if (!activeQuestion) return;
    const teamIdToScore =
      lastGuessTeamId ||
      selectedTeamId ||
      (activeTurnOrder.length > 0
        ? activeTurnOrder[boardTurnIndex % activeTurnOrder.length]
        : "");

    if (teamIdToScore) {
      setTeams((prev) =>
        prev.map((team) =>
          team.id === teamIdToScore
            ? {
                ...team,
                score: team.score + (correct ? activeQuestion.points : -activeQuestion.points),
              }
            : team,
        ),
      );
    }
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === activeQuestion.id ? { ...q, answered: true } : q,
      ),
    );
    if (activeTurnOrder.length > 0) {
      setBoardTurnIndex((prev) => (prev + 1) % activeTurnOrder.length);
      setLyricsTurnIndex((prev) => (prev + 1) % activeTurnOrder.length);
    }
    setLastGuessTeamId("");
    closeModal();
  };

  const adjustScore = (teamId: string, delta: number) => {
    setTeams((prev) =>
      prev.map((team) =>
        team.id === teamId ? { ...team, score: team.score + delta } : team,
      ),
    );
  };

  const setScore = (teamId: string, value: number) => {
    setTeams((prev) =>
      prev.map((team) =>
        team.id === teamId ? { ...team, score: value } : team,
      ),
    );
  };

  const startTurnOrder = () => {
    if (teams.length === 0) return;
    const shuffled = shuffle(teams.map((t) => t.id));
    setTurnOrder(shuffled);
    setBoardTurnIndex(0);
    setLyricsTurnIndex(0);
    setSelectedTeamId("");
  };

  const currentTeamId =
    activeTurnOrder.length > 0
      ? activeTurnOrder[boardTurnIndex % activeTurnOrder.length]
      : "";
  const currentTeam = teams.find((t) => t.id === currentTeamId);
  const answeringTeamId =
    lastGuessTeamId || selectedTeamId || currentTeamId;
  const answeringTeam = teams.find((t) => t.id === answeringTeamId);
  const lyricsSegments = activeQuestion?.lyricsSegments ?? [];
  const allLyricsRevealed =
    lyricsSegments.length > 0 &&
    lyricsRevealed.length === lyricsSegments.length &&
    lyricsRevealed.every(Boolean);
  const answerImage =
    activeQuestion?.type === "lyrics"
      ? null
      : activeQuestion?.answerImageData || activeQuestion?.imageData || null;
  const answerImageName =
    activeQuestion?.answerImageName || activeQuestion?.imageName || "Answer image";
  const answerVideoUrl = activeQuestion?.answerVideoUrl || null;

  const advanceToNextTeam = () => {
    if (activeTurnOrder.length === 0) return;
    const currentIdx = lyricsTurnIndex % activeTurnOrder.length;
    const nextIdx = (currentIdx + 1) % activeTurnOrder.length;
    const nextTeamId = activeTurnOrder[nextIdx] ?? "";
    if (nextTeamId) setSelectedTeamId(nextTeamId);
    setLyricsTurnIndex((prev) =>
      activeTurnOrder.length > 0 ? (prev + 1) % activeTurnOrder.length : prev,
    );
  };

  const handleRevealLine = (idx: number) => {
    setLyricsRevealed((prev) => {
      if (prev[idx]) return prev;
      const next = [...prev];
      next[idx] = true;
      return next;
    });
    const guessTeamId =
      selectedTeamId ||
      (activeTurnOrder.length > 0
        ? activeTurnOrder[turnIndex % activeTurnOrder.length]
        : "");
    if (guessTeamId) {
      setLastGuessTeamId(guessTeamId);
    }
    advanceToNextTeam();
  };

  return (
    <main style={{ display: "grid", gap: "18px" }}>
      <section className="card" style={{ padding: "18px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <div>
            <h1 style={{ margin: 0 }}>Game Board</h1>
            <p style={{ color: "var(--muted)", marginTop: "6px" }}>
              Click a tile to show the question modal. Wrong answers subtract
              points; you can correct scores in the leaderboard panel.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
              {turnOrder.length > 0 && currentTeam ? (
                <>
                  Answer order active · Current:{" "}
                  <strong style={{ color: "#f2c14f" }}>{currentTeam.name}</strong>
                </>
              ) : (
                "Set random answer order"
              )}
            </div>
            <button className="button secondary" onClick={startTurnOrder}>
              Randomize answer order
            </button>
          </div>
        </div>

        {categories.length === 0 ? (
          <div className="card" style={{ padding: "16px", color: "var(--muted)" }}>
            Add categories and questions first in the config pages.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${categories.length}, minmax(120px, 1fr))`,
              gap: "8px",
            }}
          >
            {categories.map((category) => (
              <div
                key={category}
                className="card"
                style={{
                  padding: "12px",
                  textAlign: "center",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                  background:
                    "linear-gradient(135deg, rgba(207,45,45,0.5), rgba(28,111,77,0.5))",
                }}
              >
                {category}
              </div>
            ))}

            {POINT_VALUES.map((points) =>
              categories.map((category) => {
                const q = questions.find(
                  (question) =>
                    question.category === category && question.points === points,
                );
                const disabled = q?.answered;
                return (
                  <button
                    key={`${category}-${points}`}
                    disabled={!q || disabled}
                    onClick={() => q && openQuestion(q)}
                    style={{
                      border: "1px solid rgba(255,255,255,0.14)",
                      background: disabled
                        ? "rgba(255,255,255,0.08)"
                        : "linear-gradient(135deg, rgba(0,114,187,0.55), rgba(21,55,105,0.9))",
                      color: disabled ? "var(--muted)" : "#f7f4ec",
                      fontWeight: 800,
                      fontSize: "1.4rem",
                      padding: "18px 10px",
                      borderRadius: "12px",
                      cursor: disabled ? "not-allowed" : "pointer",
                      position: "relative",
                      textShadow: disabled ? "none" : "0 2px 6px rgba(0,0,0,0.35)",
                    }}
                  >
                    {points}
                    {disabled && (
                      <span
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "10px",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        answered
                      </span>
                    )}
                    {!q && (
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.8rem",
                          fontWeight: 500,
                          opacity: 0.8,
                        }}
                      >
                        missing clue
                      </span>
                    )}
                  </button>
                );
              }),
            )}
          </div>
        )}
      </section>

      <section className="card" style={{ padding: "18px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
            gap: "10px",
          }}
        >
          <h2 style={{ margin: 0 }}>Leaderboard</h2>
          <span style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
            Click + / - or type a correction to fix scores.
          </span>
        </div>
        {sortedTeams.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>
            Add teams first in the Teams page.
          </div>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {sortedTeams.map((team, idx) => (
              <div
                key={team.id}
                className="card"
                style={{
                  padding: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "12px",
                    background: "rgba(207,45,45,0.25)",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 800,
                  }}
                >
                  #{idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{team.name}</div>
                  <div style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
                    {team.players.map((p) => p.name).join(", ")}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontWeight: 800,
                    minWidth: "170px",
                  }}
                >
                  <button
                    className="button ghost"
                    onClick={() => adjustScore(team.id, -100)}
                    style={{ paddingInline: "12px" }}
                  >
                    -100
                  </button>
                  <input
                    type="number"
                    value={team.score}
                    onChange={(e) => setScore(team.id, Number(e.target.value))}
                    style={{
                      width: "90px",
                      textAlign: "center",
                      padding: "8px 10px",
                      borderRadius: "10px",
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.05)",
                      color: "var(--foreground)",
                    }}
                  />
                  <button
                    className="button ghost"
                    onClick={() => adjustScore(team.id, 100)}
                    style={{ paddingInline: "12px" }}
                  >
                    +100
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {activeQuestion && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            zIndex: 20,
            padding: "24px 20px 48px",
            pointerEvents: "auto",
            overflowY: "auto",
          }}
          onClick={closeModal}
        >
          <div
            style={{
              position: "relative",
              width: "min(900px, 100%)",
              perspective: "1200px",
              marginTop: "12px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
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
                        {activeQuestion.category}
                      </div>
                      <div style={{ fontSize: "2rem", fontWeight: 800 }}>
                        {activeQuestion.points} pts
                      </div>
                    </div>
                    <div style={{ minWidth: "240px" }}>
                      <label className="label">Answering team</label>
                      {turnOrder.length > 0 && currentTeam ? (
                        <div
                          className="card"
                          style={{
                            padding: "10px 12px",
                            background: "rgba(28,111,77,0.2)",
                            borderColor: "rgba(28,111,77,0.4)",
                            fontWeight: 700,
                          }}
                        >
                          {currentTeam.name}
                        </div>
                      ) : (
                        <select
                          value={selectedTeamId}
                          onChange={(e) => setSelectedTeamId(e.target.value)}
                          className="input"
                        >
                          <option value="">Select team answering</option>
                          {teams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                  {activeQuestion.type === "lyrics" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {activeQuestion.prompt && (
                        <div style={{ fontSize: "1.4rem", lineHeight: 1.45 }}>
                          {activeQuestion.prompt}
                        </div>
                      )}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                          gap: "10px",
                        }}
                      >
                        {(activeQuestion.lyricsSegments ?? []).map((line, idx) => {
                          const revealed = lyricsRevealed[idx];
                          return (
                            <button
                              key={idx}
                              onClick={() => handleRevealLine(idx)}
                              className={`lyrics-tile ${revealed ? "revealed" : "concealed"}`}
                              style={{
                                minHeight: "80px",
                                borderRadius: "12px",
                                border: revealed
                                  ? "1px solid rgba(28,111,77,0.7)"
                                  : "1px solid rgba(255,255,255,0.12)",
                                background: revealed
                                  ? "rgba(28,111,77,0.18)"
                                  : "rgba(255,255,255,0.08)",
                                color: revealed ? "#f5f3ef" : "var(--foreground)",
                                fontWeight: 700,
                                fontSize: revealed ? "1.2rem" : "1rem",
                                padding: "12px",
                                textAlign: "center",
                                cursor: revealed ? "default" : "pointer",
                              }}
                              disabled={revealed}
                            >
                              {revealed ? line || "(blank)" : idx + 1}
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                        <button
                          className="button ghost"
                          onClick={() =>
                            setLyricsRevealed(
                              new Array(activeQuestion.lyricsSegments?.length ?? 0).fill(true),
                            )
                          }
                          disabled={allLyricsRevealed}
                          style={{ opacity: allLyricsRevealed ? 0.6 : 1 }}
                        >
                          Reveal all lines
                        </button>
                      </div>
                    </div>
                  ) : activeQuestion.type === "geoguesser" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {activeQuestion.prompt && (
                        <div style={{ fontSize: "1.4rem", lineHeight: 1.45 }}>
                          {activeQuestion.prompt}
                        </div>
                      )}
                      {activeQuestion.mapEmbedUrl ? (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                          <div style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
                            Map is {mapLocked ? "locked (view only)" : "unlocked (can move)"}
                          </div>
                          <button className="button ghost" onClick={() => setMapLocked((v) => !v)}>
                            {mapLocked ? "Unlock map" : "Lock map"}
                          </button>
                        </div>
                      ) : null}
                      {activeQuestion.mapEmbedUrl ? (
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
                            src={activeQuestion.mapEmbedUrl}
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
                          {mapLocked && (
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                                background: "linear-gradient(180deg, rgba(10,12,18,0.08) 0%, rgba(10,12,18,0.45) 100%)",
                              }}
                            />
                          )}
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
                    </div>
                  ) : activeQuestion.imageData ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.05fr 0.95fr",
                        gap: "16px",
                        alignItems: "start",
                        marginTop: "6px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "2.2rem",
                          lineHeight: 1.35,
                        }}
                      >
                        {activeQuestion.prompt || "No clue entered yet."}
                      </div>
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
                          src={activeQuestion.imageData}
                          alt={activeQuestion.imageName || "Question image"}
                          style={{
                            width: "100%",
                            maxHeight: "520px",
                            height: "auto",
                            objectFit: "contain",
                            display: "block",
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: "2rem", lineHeight: 1.35 }}>
                      {activeQuestion.prompt || "No clue entered yet."}
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
                    <button className="button ghost" onClick={closeModal}>
                      Close
                    </button>
                    <button
                      className="button primary"
                      onClick={() => setShowAnswer(true)}
                    >
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
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <div style={{ textTransform: "uppercase", color: "var(--muted)" }}>
                      {activeQuestion.category}
                    </div>
                    <div style={{ fontWeight: 800 }}>{activeQuestion.points} pts</div>
                  </div>
                  {activeQuestion.type === "lyrics" ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}
                    >
                      <div style={{ color: "var(--muted)", fontSize: "1rem" }}>
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
                        {activeQuestion.answer || "No answer provided."}
                      </div>
                      {answerImage && (
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
                            src={answerImage}
                            alt={answerImageName}
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
                      {answerVideoUrl && (
                        <div
                          style={{
                            borderRadius: "12px",
                            overflow: "hidden",
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: "rgba(255,255,255,0.04)",
                            marginTop: "8px",
                          }}
                        >
                          <iframe
                            src={answerVideoUrl}
                            style={{ width: "100%", height: "240px", border: "0" }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )}
                      {activeQuestion.lyricsSegments && activeQuestion.lyricsSegments.length > 0 && (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                            gap: "10px",
                          }}
                        >
                          {activeQuestion.lyricsSegments.map((line, idx) => (
                            <div
                              key={idx}
                              style={{
                                borderRadius: "12px",
                                border: "1px solid rgba(255,255,255,0.12)",
                                background: "rgba(255,255,255,0.05)",
                                padding: "12px",
                                fontWeight: 700,
                                fontSize: "1.1rem",
                                textAlign: "center",
                              }}
                            >
                              {line}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : activeQuestion.type === "geoguesser" ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: answerImage ? "1fr 1fr" : "1fr",
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
                          {activeQuestion.answer || "No answer provided."}
                        </div>
                        {activeQuestion.answerLocationUrl && (
                          <a
                            href={activeQuestion.answerLocationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="button ghost"
                            style={{ marginTop: "10px", display: "inline-flex" }}
                          >
                            Open in Google Maps
                          </a>
                        )}
                        {activeQuestion.mapEmbedUrl && (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                            <div style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
                              Map is {mapLocked ? "locked (view only)" : "unlocked (can move)"}
                            </div>
                            <button className="button ghost" onClick={() => setMapLocked((v) => !v)}>
                              {mapLocked ? "Unlock map" : "Lock map"}
                            </button>
                          </div>
                        )}
                        {activeQuestion.mapEmbedUrl && (
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
                              src={activeQuestion.mapEmbedUrl}
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
                            {mapLocked && (
                              <div
                                style={{
                                  position: "absolute",
                                  inset: 0,
                                  pointerEvents: "none",
                                  background: "linear-gradient(180deg, rgba(10,12,18,0.08) 0%, rgba(10,12,18,0.45) 100%)",
                                }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                      {answerImage && (
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
                            src={answerImage}
                            alt={answerImageName}
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
                  ) : answerImage ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
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
                          {activeQuestion.answer || "No answer provided."}
                        </div>
                      </div>
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
                          src={answerImage}
                          alt={answerImageName}
                          style={{
                            width: "100%",
                            maxHeight: "520px",
                            height: "auto",
                            objectFit: "contain",
                            display: "block",
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: "2rem", lineHeight: 1.4, fontWeight: 800 }}>
                      <div style={{ color: "var(--muted)", marginBottom: "6px", fontSize: "1.05rem", fontWeight: 600 }}>
                        Answer
                      </div>
                      <div
                        style={{
                          marginTop: "10px",
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {activeQuestion.answer || "No answer provided."}
                      </div>
                    </div>
                  )}
                  {answeringTeam && (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 12px",
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.2)",
                        background: "rgba(255,255,255,0.08)",
                        color: "var(--foreground)",
                        fontSize: "1rem",
                        fontWeight: 800,
                        marginTop: "14px",
                      }}
                    >
                      Answered by: {answeringTeam.name}
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginTop: "20px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      className="button secondary"
                      onClick={() => markAnswered(true)}
                      disabled={
                        !(
                          selectedTeamId ||
                          (turnOrder.length > 0 && currentTeamId)
                        )
                      }
                      style={{
                        opacity:
                          selectedTeamId ||
                          (turnOrder.length > 0 && currentTeamId)
                            ? 1
                            : 0.6,
                      }}
                    >
                      ✓ Correct
                    </button>
                    <button
                      className="button ghost"
                      onClick={() => markAnswered(false)}
                      disabled={
                        !(
                          selectedTeamId ||
                          (turnOrder.length > 0 && currentTeamId)
                        )
                      }
                      style={{
                        opacity:
                          selectedTeamId ||
                          (turnOrder.length > 0 && currentTeamId)
                            ? 1
                            : 0.6,
                      }}
                    >
                      ✕ Wrong
                    </button>
                    <button className="button ghost" onClick={closeModal}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={closeModal}
              style={{
                position: "absolute",
                top: "-10px",
                right: "-10px",
                borderRadius: "50%",
                width: "38px",
                height: "38px",
                border: "1px solid rgba(255,255,255,0.3)",
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                fontWeight: 800,
                cursor: "pointer",
              }}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <style jsx>{`
        .flip-inner.flipped {
          transform: rotateY(180deg);
        }
        .lyrics-tile {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .lyrics-tile.concealed:hover {
          animation: giggle 0.7s ease-in-out infinite;
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.25);
        }
        @keyframes giggle {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          20% {
            transform: translateY(-2px) rotate(-1deg);
          }
          40% {
            transform: translateY(2px) rotate(1deg);
          }
          60% {
            transform: translateY(-3px) rotate(-1.5deg);
          }
          80% {
            transform: translateY(1px) rotate(1deg);
          }
          100% {
            transform: translateY(0) rotate(0deg);
          }
        }
      `}</style>
    </main>
  );
}
