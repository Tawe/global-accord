import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./Dashboard.css";
import { Auth0Provider } from "@auth0/auth0-react";

// TODO: Replace with your actual Auth0 domain and client ID from environment variables
const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN || "YOUR_AUTH0_DOMAIN";
const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID || "YOUR_AUTH0_CLIENT_ID";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Auth0Provider
      domain={auth0Domain}
      clientId={auth0ClientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);
