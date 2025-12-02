'use client';

import { useMemo, useState } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { QUESTION_STORAGE_KEY } from "@/lib/storage";
import { POINT_VALUES, type PointValue, type Question } from "@/lib/types";

const starterCategories = ["Traditions", "Food & Drink", "Music", "Wildcards"];

function makeId(prefix: string) {
  return `${prefix}-${(globalThis.crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2))}`;
}

function buildDefaultQuestions(): Question[] {
  const rows: Question[] = [];
  starterCategories.forEach((category) => {
    POINT_VALUES.forEach((points) => {
      rows.push({
        id: makeId("q"),
        category,
        points,
        prompt: "",
        answer: "",
        answered: false,
        imageData: null,
        imageName: null,
        answerImageData: null,
        answerImageName: null,
        type: "standard",
        lyricsSegments: [],
      });
    });
  });
  return rows;
}

export default function QuestionConfigPage() {
  const [questions, setQuestions] = usePersistentState<Question[]>(
    QUESTION_STORAGE_KEY,
    useMemo(() => buildDefaultQuestions(), []),
  );
  const [newCategory, setNewCategory] = useState("");

  const categories = useMemo(() => {
    const existing = Array.from(new Set(questions.map((q) => q.category)));
    return newCategory && !existing.includes(newCategory)
      ? [...existing, newCategory]
      : existing;
  }, [questions, newCategory]);

  const upsertQuestion = (
    category: string,
    points: PointValue,
    updates: Partial<Question>,
  ) => {
    setQuestions((prev) => {
      const index = prev.findIndex(
        (q) => q.category === category && q.points === points,
      );
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...updates };
        return updated;
      }
      return [
        ...prev,
        {
          id: makeId("q"),
          category,
          points,
          prompt: "",
          answer: "",
          answered: false,
          imageData: null,
          imageName: null,
          answerImageData: null,
          answerImageName: null,
          type: "standard",
          lyricsSegments: [],
          ...updates,
        },
      ];
    });
  };

  const handleNewCategory = () => {
    if (!newCategory.trim()) return;
    const name = newCategory.trim();
    setQuestions((prev) => {
      const hasCategory = prev.some((q) => q.category === name);
      if (hasCategory) return prev;
      const additions = POINT_VALUES.map<Question>((points) => ({
        id: makeId("q"),
        category: name,
        points,
        prompt: "",
        answer: "",
        answered: false,
        imageData: null,
        imageName: null,
        answerImageData: null,
        answerImageName: null,
        type: "standard",
        lyricsSegments: [],
      }));
      return [...prev, ...additions];
    });
    setNewCategory("");
  };

  const deleteCategory = (category: string) => {
    setQuestions((prev) => prev.filter((q) => q.category !== category));
  };

  const resetAnsweredFlags = () => {
    setQuestions((prev) => prev.map((q) => ({ ...q, answered: false })));
  };

  const getQuestion = (category: string, points: PointValue) =>
    questions.find((q) => q.category === category && q.points === points);

  const handleImageChange = (
    category: string,
    points: PointValue,
    file: File | null,
  ) => {
    if (!file) {
      upsertQuestion(category, points, { imageData: null, imageName: null });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert("Image is too large. Please keep it under ~3MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result?.toString() ?? "";
      upsertQuestion(category, points, {
        imageData: result,
        imageName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAnswerImageChange = (
    category: string,
    points: PointValue,
    file: File | null,
  ) => {
    if (!file) {
      upsertQuestion(category, points, {
        answerImageData: null,
        answerImageName: null,
      });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert("Image is too large. Please keep it under ~3MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result?.toString() ?? "";
      upsertQuestion(category, points, {
        answerImageData: result,
        answerImageName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="card" style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          gap: "12px",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Categories & Clues</h1>
          <p style={{ color: "var(--muted)", marginTop: "6px" }}>
            Add categories (columns) and fill in a question + answer for each
            point value.
          </p>
        </div>
        <button className="button ghost" onClick={resetAnsweredFlags}>
          Reset answered flags
        </button>
      </div>

      <div
        className="card"
        style={{
          padding: "16px",
          marginBottom: "16px",
          display: "flex",
          gap: "10px",
          alignItems: "flex-end",
        }}
      >
        <div style={{ flex: 1 }}>
          <label className="label">New category</label>
          <input
            className="input"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="e.g. Local Jokes"
          />
        </div>
        <button className="button secondary" onClick={handleNewCategory}>
          + Add
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {categories.map((category) => (
          <div
            key={category}
            className="card"
            style={{ padding: "16px", borderColor: "rgba(255,255,255,0.16)" }}
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
              <h2 style={{ margin: 0 }}>{category}</h2>
              <button
                className="button ghost"
                onClick={() => deleteCategory(category)}
              >
                Delete category
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "12px",
              }}
            >
              {POINT_VALUES.map((points) => {
                const q = getQuestion(category, points);
                return (
                  <div
                    key={`${category}-${points}`}
                    className="card"
                    style={{
                      padding: "12px",
                      borderColor: "rgba(255,255,255,0.08)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                        <div style={{ fontWeight: 700 }}>{points} pts</div>
                        <select
                          value={q?.type ?? "standard"}
                          onChange={(e) =>
                            upsertQuestion(category, points, {
                              type: e.target.value as Question["type"],
                            })
                          }
                          className="input"
                          style={{ maxWidth: "140px", padding: "0.45rem 0.6rem" }}
                        >
                          <option value="standard">Standard</option>
                          <option value="lyrics">Lyrics grid</option>
                        </select>
                      </div>
                      {q?.answered && (
                        <span style={{ color: "#f2c14f", fontSize: "0.9rem" }}>
                          marked answered
                        </span>
                      )}
                    </div>
                    {(q?.type ?? "standard") === "standard" ? (
                      <>
                        <label className="label">Question</label>
                        <textarea
                          value={q?.prompt ?? ""}
                          onChange={(e) =>
                            upsertQuestion(category, points, {
                              prompt: e.target.value,
                            })
                          }
                          style={{
                            width: "100%",
                            minHeight: "70px",
                            borderRadius: "10px",
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: "rgba(255,255,255,0.04)",
                            color: "var(--foreground)",
                            padding: "10px",
                          }}
                          placeholder="Write the clue"
                        />
                        <label className="label" style={{ marginTop: "8px" }}>
                          Answer
                        </label>
                        <textarea
                          value={q?.answer ?? ""}
                          onChange={(e) =>
                            upsertQuestion(category, points, {
                              answer: e.target.value,
                            })
                          }
                          style={{
                            width: "100%",
                            minHeight: "60px",
                            borderRadius: "10px",
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: "rgba(255,255,255,0.04)",
                            color: "var(--foreground)",
                            padding: "10px",
                          }}
                          placeholder="Write the expected answer"
                        />
                        <label className="label" style={{ marginTop: "8px" }}>
                          Image (optional)
                        </label>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleImageChange(
                                category,
                                points,
                                e.target.files?.[0] ?? null,
                              )
                            }
                            style={{ color: "var(--muted)", maxWidth: "100%" }}
                          />
                          {q?.imageData && (
                            <button
                              className="button ghost"
                              onClick={() =>
                                upsertQuestion(category, points, {
                                  imageData: null,
                                  imageName: null,
                                })
                              }
                            >
                              Remove image
                            </button>
                          )}
                        </div>
                        {q?.imageData && (
                          <div
                            style={{
                              marginTop: "10px",
                              borderRadius: "10px",
                              overflow: "hidden",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                        <img
                          src={q.imageData}
                          alt={q.imageName || "Question image"}
                          style={{
                            width: "100%",
                            height: "auto",
                            display: "block",
                            maxHeight: "240px",
                            objectFit: "contain",
                          }}
                        />
                            {q.imageName && (
                              <div
                                style={{
                                  padding: "6px 10px",
                                  fontSize: "0.9rem",
                                  color: "var(--muted)",
                                  background: "rgba(255,255,255,0.03)",
                                }}
                              >
                                {q.imageName}
                              </div>
                            )}
                          </div>
                        )}
                        <label className="label" style={{ marginTop: "8px" }}>
                          Answer image (optional)
                        </label>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleAnswerImageChange(
                                category,
                                points,
                                e.target.files?.[0] ?? null,
                              )
                            }
                            style={{ color: "var(--muted)", maxWidth: "100%" }}
                          />
                          {q?.answerImageData && (
                            <button
                              className="button ghost"
                              onClick={() =>
                                upsertQuestion(category, points, {
                                  answerImageData: null,
                                  answerImageName: null,
                                })
                              }
                            >
                              Remove answer image
                            </button>
                          )}
                        </div>
                        {q?.answerImageData && (
                          <div
                            style={{
                              marginTop: "10px",
                              borderRadius: "10px",
                              overflow: "hidden",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            <img
                              src={q.answerImageData}
                              alt={q.answerImageName || "Answer image"}
                              style={{
                                width: "100%",
                                height: "auto",
                                display: "block",
                                maxHeight: "240px",
                                objectFit: "contain",
                              }}
                            />
                            {q.answerImageName && (
                              <div
                                style={{
                                  padding: "6px 10px",
                                  fontSize: "0.9rem",
                                  color: "var(--muted)",
                                  background: "rgba(255,255,255,0.03)",
                                }}
                              >
                                {q.answerImageName}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <label className="label">Intro / hint (optional)</label>
                        <textarea
                          value={q?.prompt ?? ""}
                          onChange={(e) =>
                            upsertQuestion(category, points, {
                              prompt: e.target.value,
                            })
                          }
                          style={{
                            width: "100%",
                            minHeight: "60px",
                            borderRadius: "10px",
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: "rgba(255,255,255,0.04)",
                            color: "var(--foreground)",
                            padding: "10px",
                          }}
                          placeholder="Optional intro or clue"
                        />
                        <label className="label" style={{ marginTop: "8px" }}>
                          Lyrics lines (one per line)
                        </label>
                        <textarea
                          value={(q?.lyricsSegments ?? []).join("\n")}
                          onChange={(e) =>
                            upsertQuestion(category, points, {
                              lyricsSegments: e.target.value.split(/\r?\n/),
                            })
                          }
                          style={{
                            width: "100%",
                            minHeight: "110px",
                            borderRadius: "10px",
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: "rgba(255,255,255,0.04)",
                            color: "var(--foreground)",
                            padding: "10px",
                          }}
                          placeholder="Add each lyric line on its own line"
                        />
                        <div style={{ marginTop: "6px", color: "var(--muted)", fontSize: "0.9rem" }}>
                          {q?.lyricsSegments?.length ?? 0} line(s). Players click squares to reveal each line.
                        </div>
                        <label className="label" style={{ marginTop: "8px" }}>
                          Answer
                        </label>
                        <textarea
                          value={q?.answer ?? ""}
                          onChange={(e) =>
                            upsertQuestion(category, points, {
                              answer: e.target.value,
                            })
                          }
                          style={{
                            width: "100%",
                            minHeight: "60px",
                            borderRadius: "10px",
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: "rgba(255,255,255,0.04)",
                            color: "var(--foreground)",
                            padding: "10px",
                          }}
                          placeholder="Expected song title or answer"
                        />
                        <label className="label" style={{ marginTop: "8px" }}>
                          Answer image (optional)
                        </label>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleAnswerImageChange(
                                category,
                                points,
                                e.target.files?.[0] ?? null,
                              )
                            }
                            style={{ color: "var(--muted)", maxWidth: "100%" }}
                          />
                          {q?.answerImageData && (
                            <button
                              className="button ghost"
                              onClick={() =>
                                upsertQuestion(category, points, {
                                  answerImageData: null,
                                  answerImageName: null,
                                })
                              }
                            >
                              Remove answer image
                            </button>
                          )}
                        </div>
                        {q?.answerImageData && (
                          <div
                            style={{
                              marginTop: "10px",
                              borderRadius: "10px",
                              overflow: "hidden",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            <img
                              src={q.answerImageData}
                              alt={q.answerImageName || "Answer image"}
                              style={{
                                width: "100%",
                                height: "auto",
                                display: "block",
                                maxHeight: "240px",
                                objectFit: "contain",
                              }}
                            />
                            {q.answerImageName && (
                              <div
                                style={{
                                  padding: "6px 10px",
                                  fontSize: "0.9rem",
                                  color: "var(--muted)",
                                  background: "rgba(255,255,255,0.03)",
                                }}
                              >
                                {q.answerImageName}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="card" style={{ padding: "16px", color: "var(--muted)" }}>
            Add a category to start entering questions.
          </div>
        )}
      </div>
    </main>
  );
}
