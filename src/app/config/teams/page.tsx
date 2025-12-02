'use client';

import { useMemo } from "react";
import { usePersistentState } from "@/hooks/usePersistentState";
import { TEAM_STORAGE_KEY } from "@/lib/storage";
import type { Player, Team } from "@/lib/types";

const emojiOptions = [
  { emoji: "🎄", label: "Tree", base: "#0b8a3b", glow: "#d1fae5" },
  { emoji: "⭐️", label: "Star", base: "#b8860b", glow: "#ffe29f" },
  { emoji: "🔔", label: "Bell", base: "#b03060", glow: "#ffd6e0" },
  { emoji: "❄️", label: "Snow", base: "#0f4c75", glow: "#b0e0ff" },
  { emoji: "🎁", label: "Gift", base: "#b9001f", glow: "#f7c948" },
];

function makeId(prefix: string) {
  return `${prefix}-${(globalThis.crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2))}`;
}

function createDefaultTeams(): Team[] {
  return [
    {
      id: makeId("team"),
      name: "Fir Spruce",
      score: 0,
      badgeEmoji: emojiOptions[0].emoji,
      accentBase: emojiOptions[0].base,
      accentGlow: emojiOptions[0].glow,
      players: [
        { id: makeId("p"), name: "Player 1" },
        { id: makeId("p"), name: "Player 2" },
        { id: makeId("p"), name: "Player 3" },
      ],
    },
    {
      id: makeId("team"),
      name: "Pepperkake",
      score: 0,
      badgeEmoji: emojiOptions[1].emoji,
      accentBase: emojiOptions[1].base,
      accentGlow: emojiOptions[1].glow,
      players: [
        { id: makeId("p"), name: "Player 1" },
        { id: makeId("p"), name: "Player 2" },
        { id: makeId("p"), name: "Player 3" },
      ],
    },
    {
      id: makeId("team"),
      name: "Reindeer Crew",
      score: 0,
      badgeEmoji: emojiOptions[2].emoji,
      accentBase: emojiOptions[2].base,
      accentGlow: emojiOptions[2].glow,
      players: [
        { id: makeId("p"), name: "Player 1" },
        { id: makeId("p"), name: "Player 2" },
        { id: makeId("p"), name: "Player 3" },
      ],
    },
  ];
}

export default function TeamConfigPage() {
  const [teams, setTeams] = usePersistentState<Team[]>(
    TEAM_STORAGE_KEY,
    useMemo(() => createDefaultTeams(), []),
  );

  const handleTeamNameChange = (teamId: string, name: string) => {
    setTeams((prev) =>
      prev.map((team) => (team.id === teamId ? { ...team, name } : team)),
    );
  };

  const handlePlayerNameChange = (
    teamId: string,
    playerId: string,
    name: string,
  ) => {
    setTeams((prev) =>
      prev.map((team) =>
        team.id === teamId
          ? {
              ...team,
              players: team.players.map((p) =>
                p.id === playerId ? { ...p, name } : p,
              ),
            }
          : team,
      ),
    );
  };

  const addPlayer = (teamId: string) => {
    setTeams((prev) =>
      prev.map((team) =>
        team.id === teamId
          ? {
              ...team,
              players: [
                ...team.players,
                { id: makeId("p"), name: `Player ${team.players.length + 1}` },
              ],
            }
          : team,
      ),
    );
  };

  const removePlayer = (teamId: string, playerId: string) => {
    setTeams((prev) =>
      prev.map((team) =>
        team.id === teamId
          ? {
              ...team,
              players: team.players.filter((p) => p.id !== playerId),
            }
          : team,
      ),
    );
  };

  const addTeam = () => {
    setTeams((prev) => [
      ...prev,
      {
        id: makeId("team"),
        name: `Team ${prev.length + 1}`,
        score: 0,
        badgeEmoji: emojiOptions[prev.length % emojiOptions.length].emoji,
        accentBase: emojiOptions[prev.length % emojiOptions.length].base,
        accentGlow: emojiOptions[prev.length % emojiOptions.length].glow,
        players: [
          { id: makeId("p"), name: "Player 1" },
          { id: makeId("p"), name: "Player 2" },
          { id: makeId("p"), name: "Player 3" },
        ],
      },
    ]);
  };

  const removeTeam = (teamId: string) => {
    setTeams((prev) => prev.filter((team) => team.id !== teamId));
  };

  return (
    <main className="card" style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Teams & Players</h1>
          <p style={{ color: "var(--muted)", marginTop: "6px" }}>
            Aim for 3–5 teams. All changes are saved locally.
          </p>
        </div>
        <button className="button primary" onClick={addTeam}>
          + Add team
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
        }}
      >
        {teams.map((team) => (
          <div
            key={team.id}
            className="card"
            style={{ padding: "16px", borderColor: "rgba(255,255,255,0.14)" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                marginBottom: "12px",
              }}
            >
              <div style={{ flex: 1 }}>
                <label className="label">Team name</label>
                <input
                  className="input"
                  value={team.name}
                  onChange={(e) => handleTeamNameChange(team.id, e.target.value)}
                  placeholder="Team name"
                />
              </div>
              <div style={{ minWidth: "120px" }}>
                <label className="label">Emoji</label>
                <select
                  className="input"
                  value={team.badgeEmoji ?? ""}
                  onChange={(e) => {
                    const choice = emojiOptions.find((opt) => opt.emoji === e.target.value);
                    setTeams((prev) =>
                      prev.map((t) =>
                        t.id === team.id
                          ? {
                              ...t,
                              badgeEmoji: choice?.emoji ?? null,
                              accentBase: choice?.base ?? t.accentBase ?? null,
                              accentGlow: choice?.glow ?? t.accentGlow ?? null,
                            }
                          : t,
                      ),
                    );
                  }}
                >
                  {emojiOptions.map((opt) => (
                    <option key={opt.emoji} value={opt.emoji}>
                      {opt.emoji} {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="button ghost"
                onClick={() => removeTeam(team.id)}
                style={{ paddingInline: "10px" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label className="label">Players</label>
              {team.players.map((player: Player, idx: number) => (
                <div
                  key={player.id}
                  style={{ display: "flex", gap: "8px", alignItems: "center" }}
                >
                  <input
                    className="input"
                    value={player.name}
                    onChange={(e) =>
                      handlePlayerNameChange(team.id, player.id, e.target.value)
                    }
                    placeholder={`Player ${idx + 1}`}
                  />
                  <button
                    className="button ghost"
                    onClick={() => removePlayer(team.id, player.id)}
                    style={{ paddingInline: "10px" }}
                    aria-label={`Remove ${player.name}`}
                  >
                    –
                  </button>
                </div>
              ))}
              <button
                className="button secondary"
                onClick={() => addPlayer(team.id)}
                style={{ width: "fit-content" }}
              >
                + Add player
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
