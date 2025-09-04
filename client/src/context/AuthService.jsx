import { useAuth0 } from "@auth0/auth0-react";

export const useAuthApi = () => {
  const { getAccessTokenSilently } = useAuth0();

  const callApi = async (url, options = {}) => {
    try {
      const token = await getAccessTokenSilently({
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      });

      const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const res = await fetch(url, { ...options, headers });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("API call error:", err);
      throw err;
    }
  };

  return { callApi };
};