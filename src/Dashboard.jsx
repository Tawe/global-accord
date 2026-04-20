import React, { useState, useEffect } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import './Dashboard.css';
import AuthButtons from './AuthButtons'; // Import AuthButtons
import './AuthButtons.css'; // Import AuthButtons styles
import { isFirebaseConfigured } from "./firebase";
import { deleteGame, loadGames } from "./gameSaves";

const MAX_GAMES = 3;
const WIN_TARGET = 3;
const TOTAL_TURNS = 10; // Assuming this constant is available globally or passed

// Helper function to get game outlook based on provided logic
const getOutlook = (game) => {
  if (game.committed >= WIN_TARGET) return "Stable";
  if (game.turn >= TOTAL_TURNS - 2) return "Collapsing"; // If 8 turns passed
  return "Unstable";
};

const Dashboard = ({ onStartNewGame, onResumeGame }) => {
  const { isAuthenticated, user } = useAuth0();
  const [games, setGames] = useState([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null); // Stores game ID to be deleted
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchGames() {
      if (!isAuthenticated || !user?.sub || !isFirebaseConfigured) {
        setGames([]);
        setDashboardError(
          isAuthenticated && user?.sub && !isFirebaseConfigured
            ? "Firebase is not configured yet."
            : ""
        );
        return;
      }

      setIsLoadingGames(true);
      try {
        const storedGames = await loadGames(user.sub);
        if (!cancelled) {
          setGames(storedGames);
          setDashboardError("");
        }
      } catch (error) {
        console.error("Failed to load games from Firestore:", error);
        if (!cancelled) {
          setDashboardError(
            error?.code
              ? `Unable to load negotiations: ${error.code}`
              : "Unable to load negotiations."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingGames(false);
        }
      }
    }

    fetchGames();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  const handleCreateNewGame = () => {
    if (games.length < MAX_GAMES) {
      onStartNewGame(user?.sub); // Pass user ID when starting new game
    }
  };

  const handleDeleteGame = (gameId) => {
    // Show confirmation dialog
    setShowConfirmDelete(gameId);
  };

  const confirmDelete = async () => {
    try {
      await deleteGame(showConfirmDelete, user.sub);
      const updatedGames = games.filter(game => game.id !== showConfirmDelete);
      setGames(updatedGames);
      setShowConfirmDelete(null);
      setDashboardError("");
    } catch (error) {
      console.error("Failed to delete game from Firestore:", error);
      setDashboardError(
        error?.code
          ? `Unable to delete negotiation: ${error.code}`
          : "Unable to delete negotiation."
      );
    }
  };

  const cancelDelete = () => {
    setShowConfirmDelete(null);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Global Accord</h1>
        <AuthButtons />
      </header>

      <main className="dashboard-main">
        {isAuthenticated ? (
          <>
            <h2>Your Negotiations</h2>
            {dashboardError && <p className="max-games-message">{dashboardError}</p>}
            <div className="game-cards-grid">
              {isLoadingGames && (
                <div className="empty-state-card">
                  <p>Loading negotiations...</p>
                </div>
              )}
              {!isLoadingGames && games.length === 0 && (
                <div className="empty-state-card">
                  <p>No negotiations in progress.</p>
                  <button
                    className="create-game-button"
                    onClick={handleCreateNewGame}
                  >
                    Start a New Summit
                  </button>
                </div>
              )}

              {games.map((game) => (
                <div key={game.id} className="game-card">
                  <h3>Game {game.id.substring(0, 4)}...</h3>
                  <p>Turn: {game.turn} / {TOTAL_TURNS}</p>
                  <p>Committed: {game.committed} / {WIN_TARGET}</p>
                  <p>Outlook: <span className={`outlook-${getOutlook(game).toLowerCase()}`}>{getOutlook(game)}</span></p>
                  <p className="last-played">Last Played: {new Date(game.lastPlayed).toLocaleString()}</p>
                  <div className="card-actions">
                    <button
                      className="resume-game-button"
                      onClick={() => onResumeGame(game)}
                    >
                      Resume
                    </button>
                    <button
                      className="delete-game-button"
                      onClick={() => handleDeleteGame(game.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {games.length < MAX_GAMES && games.length > 0 && (
                <button className="create-game-button" onClick={handleCreateNewGame}>
                  Create New Game
                </button>
              )}

              {games.length >= MAX_GAMES && (
                <p className="max-games-message">Maximum active negotiations reached</p>
              )}
            </div>
          </>
        ) : (
          <div className="unauthenticated-message">
            <p>Please log in to manage your negotiations.</p>
            <AuthButtons />
          </div>
        )}
      </main>

      {showConfirmDelete && (
        <div className="confirm-delete-overlay">
          <div className="confirm-delete-dialog">
            <p>End this negotiation? Progress will be lost.</p>
            <div className="dialog-actions">
              <button onClick={confirmDelete}>Confirm</button>
              <button onClick={cancelDelete}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
