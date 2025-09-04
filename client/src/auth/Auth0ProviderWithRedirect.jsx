import React from 'react';
import { Auth0Provider } from '@auth0/auth0-react';

// Auth0 configuration
const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

function Auth0ProviderWithRedirect({ children }) {
  const onRedirectCallback = (appState) => {
    window.location.href = appState?.returnTo || window.location.pathname;
  };

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: audience
      }}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
}

export default Auth0ProviderWithRedirect;
