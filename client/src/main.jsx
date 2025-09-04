import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Auth0Provider } from '@auth0/auth0-react'
import { BrowserRouter } from 'react-router-dom'
import { AppContextProvider } from './context/AppContext.jsx'

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

// Debug environment variables
console.log('Auth0 Environment Variables:', {
  domain: domain ? 'SET' : 'MISSING',
  clientId: clientId ? 'SET' : 'MISSING', 
  audience: audience ? 'SET' : 'MISSING'
});

const onRedirectCallback = (appState) => {
  console.log('Auth0 redirect callback triggered:', appState);
  window.location.href = appState?.returnTo || window.location.pathname;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Auth0Provider
        domain={domain}
        clientId={clientId}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: audience,
          scope: "openid profile email"
        }}
        onRedirectCallback={onRedirectCallback}
        useRefreshTokens={true}
        cacheLocation="localstorage"
      >
        <AppContextProvider>
          <App />
        </AppContextProvider>
      </Auth0Provider>
    </BrowserRouter>
  </StrictMode>
)