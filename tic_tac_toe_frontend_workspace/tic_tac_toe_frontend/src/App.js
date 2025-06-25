import React, { useState, useEffect } from 'react';
import './App.css';

// PUBLIC_INTERFACE
/**
 * Returns the winner ("X" or "O") or null if no winner.
 * @param {string[]} squares - The current board state.
 * @returns {string|null}
 */
function calculateWinner(squares) {
  // Possible winning combinations
  const lines = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6] // diags
  ];
  for (const [a, b, c] of lines) {
    if (
      squares[a] &&
      squares[a] === squares[b] &&
      squares[a] === squares[c]
    ) {
      return squares[a];
    }
  }
  return null;
}

// PUBLIC_INTERFACE
/**
 * Returns true if all squares are filled.
 * @param {string[]} squares 
 * @returns {boolean}
 */
function isBoardFull(squares) {
  return squares.every(square => square);
}

// --- Minimalistic Button component ---
function GameButton({children, onClick, disabled, style, ...rest}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="ttt-btn"
      style={style}
      {...rest}
    >
      {children}
    </button>
  )
}

// --- Square component ---
function Square({ value, onClick, highlight }) {
  return (
    <button
      className={`ttt-square${highlight ? " ttt-square-highlight" : ""}`}
      onClick={onClick}
      aria-label={value ? `Square with ${value}` : 'Empty square'}
      tabIndex={0}
      style={{outline: 'none'}}
    >
      {value}
    </button>
  );
}

// --- Board component ---
function Board({ squares, onSquareClick, winnerLine }) {
  function isHighlighted(idx) {
    return winnerLine && winnerLine.includes(idx);
  }
  return (
    <div className="ttt-board">
      {[0,1,2].map(row =>
        <div className="ttt-board-row" key={row}>
          {[0,1,2].map(col => {
            const idx = row * 3 + col;
            return (
              <Square
                key={idx}
                value={squares[idx]}
                onClick={() => onSquareClick(idx)}
                highlight={isHighlighted(idx)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- AI logic (minimax for unbeatable AI, easy random for demo) ---
function getEmptySquares(squares) {
  return squares.map((sq, i) => sq ? null : i).filter(i => i !== null);
}

// PUBLIC_INTERFACE
/**
 * Get AI move: If easyMode=true, pick random; else, use minimax.
 */
function getAIMove(squares, aiPlayer = "O", easyMode = false) {
  if (easyMode) {
    const empties = getEmptySquares(squares);
    if (empties.length === 0) return null;
    return empties[Math.floor(Math.random() * empties.length)];
  }
  // MiniMax
  function minimax(board, isMaximizing) {
    const winner = calculateWinner(board);
    if (winner === aiPlayer) return { score: 1 };
    if (winner && winner !== aiPlayer) return { score: -1 };
    if (isBoardFull(board)) return { score: 0 };
    const empty = getEmptySquares(board);
    const scores = empty.map(idx => {
      const newBoard = [...board];
      newBoard[idx] = isMaximizing ? aiPlayer : (aiPlayer === "X" ? "O" : "X");
      const result = minimax(newBoard, !isMaximizing);
      return { idx, score: result.score };
    });
    if (isMaximizing) {
      const best = scores.reduce((a, b) => (a.score > b.score) ? a : b);
      return best;
    } else {
      const best = scores.reduce((a, b) => (a.score < b.score) ? a : b);
      return best;
    }
  }
  const res = minimax(squares, true);
  return res.idx;
}

// --- Main Game Component ---
function App() {
  // Theme
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Game State
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [mode, setMode] = useState("2p");
  const [aiThinking, setAIThinking] = useState(false);
  const [aiDifficulty, setAIDifficulty] = useState("unbeatable"); // "easy" or "unbeatable"
  const [status, setStatus] = useState("");
  const [history, setHistory] = useState([]);
  const [winner, setWinner] = useState(null);
  const [winnerLine, setWinnerLine] = useState(null);

  // Capture winning line for highlighting
  function findWinnerAndLine(squares) {
    const lines = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];
    for (const line of lines) {
      const [a, b, c] = line;
      if (
        squares[a] &&
        squares[a] === squares[b] &&
        squares[a] === squares[c]
      ) {
        return { winner: squares[a], line };
      }
    }
    return {winner: null, line: null};
  }

  // Reset game
  // PUBLIC_INTERFACE
  function handleRestart() {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
    setWinner(null);
    setWinnerLine(null);
    setHistory([]);
    setStatus("");
    setAIThinking(false);
  }

  // On play mode change, reset game
  useEffect(() => {
    handleRestart();
  // eslint-disable-next-line
  }, [mode, aiDifficulty]);

  // Game logic effect
  useEffect(() => {
    const { winner, line } = findWinnerAndLine(squares);
    setWinner(winner);
    setWinnerLine(line);

    if (winner) {
      setStatus(`Winner: ${winner} 🎉`);
      setAIThinking(false);
    } else if (isBoardFull(squares)) {
      setStatus("It's a tie! 🤝");
      setAIThinking(false);
    } else if (mode === "1p" && !xIsNext) {
      setAIThinking(true);
      // Let the AI play after a slight delay for UI polish
      setTimeout(() => {
        const idx = getAIMove(
          squares,
          "O",
          aiDifficulty === "easy"
        );
        if (idx !== null) {
          const nextSquares = squares.slice();
          nextSquares[idx] = "O";
          setHistory(hist => [...hist, {player: "O", idx, state: nextSquares}]);
          setSquares(nextSquares);
          setXIsNext(true);
        }
        setAIThinking(false);
      }, 350);
    } else {
      setStatus(`Next: ${xIsNext ? "X" : "O"}`);
    }
    // eslint-disable-next-line
  }, [squares, xIsNext, mode, aiDifficulty]);

  function handleSquareClick(idx) {
    if (aiThinking || squares[idx] || winner) return;
    if (mode === "1p" && !xIsNext) return; // Ignore click on AI turn

    const current = squares.slice();
    current[idx] = xIsNext ? "X" : "O";
    setHistory(hist => [...hist, {player: xIsNext ? "X" : "O", idx, state: current}]);
    setSquares(current);
    setXIsNext(!xIsNext);
  }

  // PUBLIC_INTERFACE
  function toggleTheme() {
    setTheme((prev) => prev === 'light' ? 'dark' : 'light');
  }

  // Boards & Controls styling, color tokens from requirements
  const COLORS = {
    accent: "#27AE60",
    primary: "#2D9CDB",
    secondary: "#56CCF2"
  };

  // Responsive minimal style overrides (inject custom style variables)
  useEffect(() => {
    // Set CSS variables for color adherence
    const root = document.documentElement;
    root.style.setProperty('--ttt-accent', COLORS.accent);
    root.style.setProperty('--ttt-primary', COLORS.primary);
    root.style.setProperty('--ttt-secondary', COLORS.secondary);
    // For dark mode adjust background
    root.style.setProperty('--ttt-bg', theme === 'dark' ? '#1a1a1a' : '#fff');
    root.style.setProperty('--ttt-board-bg', theme === 'dark' ? '#222831' : '#f9fafb');
    root.style.setProperty('--ttt-border', 'rgba(44, 62, 80,.05)');
    root.style.setProperty('--ttt-font-primary', theme === 'dark' ? '#fff' : '#24292F');
    root.style.setProperty('--ttt-font-accent', COLORS.accent);
    root.style.setProperty('--ttt-high', COLORS.accent);
  }, [theme, COLORS]);

  return (
    <div className="App" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--ttt-bg)',
      color: 'var(--ttt-font-primary)',
    }}>
      <header className="App-header" style={{
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--ttt-bg)',
        minHeight: '100vh',
        fontFamily: 'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen,Ubuntu,Cantarell,"Open Sans","Helvetica Neue",sans-serif',
        padding: 0,
      }}>
        {/* Theme Button */}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          style={{
            background: 'var(--ttt-primary)',
            color: '#fff',
            transition: 'background 0.25s',
            position: 'absolute',
            top: 24,
            right: 24,
            zIndex: 3,
          }}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>

        {/* Title */}
        <h1
          style={{
            fontWeight: 800,
            letterSpacing: '-1.5px',
            color: 'var(--ttt-primary)',
            marginTop: 16,
            fontSize: 'clamp(2rem,8vw,2.6rem)',
            marginBottom: 0
          }}
        >Tic Tac Toe</h1>
        <p style={{
          marginTop: 4,
          fontWeight: 400,
          color: 'var(--ttt-font-accent)',
          fontSize: 18,
        }}>Modern. Minimal. Quick Game.</p>

        {/* Mode Select */}
        <div style={{
          display: 'flex',
          gap: 16,
          margin: '24px auto 0 auto',
          justifyContent: 'center',
        }}>
          <GameButton
            onClick={() => setMode("2p")}
            style={{
              background: mode === "2p" ? 'var(--ttt-primary)' : 'var(--ttt-board-bg)',
              color: mode === "2p" ? '#fff' : 'var(--ttt-font-primary)',
              border: mode === "2p" ? 'none' : `1.5px solid var(--ttt-primary)`,
              fontWeight: 600
            }}
          >👥 2 Player</GameButton>
          <GameButton
            onClick={() => setMode("1p")}
            style={{
              background: mode === "1p" ? 'var(--ttt-primary)' : 'var(--ttt-board-bg)',
              color: mode === "1p" ? '#fff' : 'var(--ttt-font-primary)',
              border: mode === "1p" ? 'none' : `1.5px solid var(--ttt-primary)`,
              fontWeight: 600
            }}
          >🤖 vs AI</GameButton>
        </div>

        {/* AI difficulty if in AI mode */}
        {mode === "1p" && (
          <div style={{ marginTop: 10, marginBottom: 10 }}>
            <span style={{fontWeight: 600, color: 'var(--ttt-font-accent)'}}>AI:</span>
            <GameButton
              onClick={() => setAIDifficulty("easy")}
              style={{
                marginLeft: 12,
                marginRight: 4,
                background: aiDifficulty === "easy" ? 'var(--ttt-secondary)' : 'var(--ttt-board-bg)',
                color: aiDifficulty === "easy" ? '#fff' : 'var(--ttt-font-primary)',
                border: aiDifficulty === "easy" ? 'none' : `1.5px solid var(--ttt-secondary)`,
                fontSize: 15,
                fontWeight: 600,
                padding: "4px 16px"
              }}
            >Easy</GameButton>
            <GameButton
              onClick={() => setAIDifficulty("unbeatable")}
              style={{
                background: aiDifficulty === "unbeatable" ? 'var(--ttt-secondary)' : 'var(--ttt-board-bg)',
                color: aiDifficulty === "unbeatable" ? '#fff' : 'var(--ttt-font-primary)',
                border: aiDifficulty === "unbeatable" ? 'none' : `1.5px solid var(--ttt-secondary)`,
                fontSize: 15,
                fontWeight: 600,
                padding: "4px 16px"
              }}
            >Unbeatable</GameButton>
          </div>
        )}

        {/* Board */}
        <div
          style={{
            margin: '32px auto 0 auto',
            width: 'min(94vw,340px)',
            maxWidth: 380,
            boxShadow: theme === 'light' ? '0 6px 24px 0 rgba(32,75,115,.07)' : '0 10px 48px 0 rgba(0,0,0,0.25)',
            padding: 18,
            borderRadius: 18,
            background: 'var(--ttt-board-bg)'
          }}
        >
          <Board
            squares={squares}
            onSquareClick={handleSquareClick}
            winnerLine={winnerLine}
          />
        </div>
        {/* Status and controls */}
        <div style={{
          margin: '20px auto 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}>
          <div
            style={{
              minHeight: 30,
              fontWeight: winner ? 800 : 600,
              fontSize: 22,
              color: winner
                ? 'var(--ttt-accent)'
                : xIsNext
                  ? 'var(--ttt-primary)'
                  : (mode === "1p" && !xIsNext ? 'var(--ttt-secondary)' : 'var(--ttt-accent)'),
              letterSpacing: '-0.5px',
            }}>{status}
            {aiThinking && !winner && <span style={{marginLeft: 10, fontStyle: 'italic', fontSize:13, color: 'var(--ttt-secondary)'}}>AI thinking...</span>}
          </div>
          <GameButton onClick={handleRestart} style={{
            marginTop: 6,
            background: 'var(--ttt-accent)',
            color: '#fff',
            fontWeight: 700,
            border: 'none',
            fontSize: 16,
            padding: '9px 42px',
            borderRadius: 9,
            boxShadow: '0 2px 9px -6px var(--ttt-accent)',
            letterSpacing: '0.25px'
          }}>Restart</GameButton>
        </div>
        {/* Credits */}
        <footer style={{
          marginTop: 40,
          fontSize: 13,
          color: 'var(--ttt-font-accent)',
          textAlign: 'center',
          opacity: 0.7
        }}>
          <span>Made with ♡ using React.</span>
        </footer>
      </header>
      {/* Additional responsive minimalism: hide scroll, no extra chrome */}
      <style>
        {`
        .ttt-btn {
          border: none;
          border-radius: 7px;
          background: var(--ttt-primary);
          color: #fff;
          font-weight: 600;
          padding: 9px 20px;
          font-size: 1rem;
          transition: background 0.2s, color 0.2s;
          line-height: 1.2;
          cursor: pointer;
          box-shadow: 0 2px 8px 0 rgba(32,75,115,0.08);
          outline:none;
        }
        .ttt-btn:disabled {
          opacity: 0.7;
          filter: grayscale(.15);
        }
        .ttt-btn:not(:disabled):hover, .ttt-btn:not(:disabled):focus {
          background: var(--ttt-accent);
        }

        .ttt-board {
          display: flex;
          flex-direction: column;
          gap: 0;
          width: 100%;
        }
        .ttt-board-row {
          display: flex;
          width: 100%;
        }
        .ttt-square {
          flex: 1;
          background: #fff;
          aspect-ratio: 1 / 1;
          min-width: 0;
          font-size: clamp(2rem,4vw,2.7rem);
          font-weight: 700;
          border: 2.5px solid var(--ttt-border);
          color: var(--ttt-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          outline: none;
          margin: 2px;
          border-radius: 12px;
          transition: background .18s,border .19s;
          cursor: pointer;
        }
        .ttt-square:hover:enabled {
          background: var(--ttt-board-bg);
          border-color: var(--ttt-primary);
        }
        .ttt-square-highlight {
          background: var(--ttt-high) !important;
          color: #fff !important;
          border-color: var(--ttt-accent);
          box-shadow: 0 0 0 4px rgba(39,174,96,0.12);
        }
        @media (max-width: 600px) {
          .ttt-board {
            font-size: 1.6rem;
          }
        }
        `}
      </style>
    </div>
  );
}

export default App;
