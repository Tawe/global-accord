import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import './AuthButtons.css'; // Assuming we'll create this CSS file

const AuthButtons = () => {
  const { loginWithRedirect, logout, isAuthenticated, user, isLoading } = useAuth0();

  if (isLoading) {
    return <div className="auth-loading">Loading authentication...</div>;
  }

  return (
    <div className="auth-buttons-container">
      {isAuthenticated ? (
        <>
          <span className="user-greeting">Welcome, {user.name || user.nickname}!</span>
          <button
            className="auth-button logout-button"
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          >
            Log Out
          </button>
        </>
      ) : (
        <button className="auth-button login-button" onClick={() => loginWithRedirect()}>
          Log In
        </button>
      )}
    </div>
  );
};

export default AuthButtons;