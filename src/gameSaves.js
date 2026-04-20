import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore/lite";
import { db, isFirebaseConfigured } from "./firebase";

function getGamesCollection(userId) {
  return collection(db, "users", userId, "games");
}

export async function loadGames(userId) {
  if (!userId || !isFirebaseConfigured || !db) {
    return [];
  }

  const snapshot = await getDocs(getGamesCollection(userId));
  return snapshot.docs
    .map((gameDoc) => gameDoc.data())
    .sort((left, right) => (right.lastPlayed ?? 0) - (left.lastPlayed ?? 0));
}

export async function saveGame(game, userId) {
  if (!userId || !isFirebaseConfigured || !db || !game?.id) {
    return;
  }

  const gameRef = doc(db, "users", userId, "games", game.id);
  const now = Date.now();

  await setDoc(
    gameRef,
    {
      ...game,
      userId,
      createdAt: game.createdAt ?? now,
      updatedAt: now,
      lastPlayed: now,
    },
    { merge: true }
  );
}

export async function deleteGame(gameId, userId) {
  if (!userId || !isFirebaseConfigured || !db || !gameId) {
    return;
  }

  await deleteDoc(doc(db, "users", userId, "games", gameId));
}
