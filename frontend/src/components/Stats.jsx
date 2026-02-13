export default function Stats({ stats, currentPlayer }) {
  if (!stats || Object.keys(stats).length === 0) return null;

  return (
    <div className="stats-panel">
      <h4>Player Stats</h4>
      <div className="stats-rows">
        {Object.entries(stats).map(([name, s]) => (
          <div
            key={name}
            className={`stats-row ${name === currentPlayer ? "current-player" : ""}`}
          >
            <span className="stats-name">{name}</span>
            <span className="stats-score">
              {s.wins} W • {s.losses} L • {s.draws} D
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
