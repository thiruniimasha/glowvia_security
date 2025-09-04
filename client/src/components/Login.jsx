import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const Login = () => {
  const { loginWithRedirect, isLoading } = useAuth0();
  const { setShowUserLogin } = useAppContext();

  const handleLogin = async () => {
    try {
      await loginWithRedirect({
        appState: { returnTo: window.location.pathname },
      });
      setShowUserLogin(false);
      toast.success("Redirecting to Auth0 login...");
    } catch (error) {
      console.error("Auth0 login error:", error.message);
      toast.error("Login failed");
    }
  };

  if (isLoading) return null;

  return (
    <div
      onClick={() => setShowUserLogin(false)}
      className="fixed top-0 bottom-0 left-0 right-0 z-30 flex items-center justify-center text-sm text-gray-600 bg-black/80"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col gap-6 m-auto items-center p-8 py-12 w-80 sm:w-[400px] rounded-lg shadow-xl border border-gray-200 bg-white"
      >
        <p className="text-2xl font-medium text-center">
          <span className="text-primary">User</span> Login / Signup
        </p>
        <button
          onClick={handleLogin}
          className="bg-primary hover:bg-primary-dull transition-all text-white w-full py-2 rounded-md cursor-pointer"
        >
          Continue with Auth0
        </button>
        <p className="text-gray-500 text-sm text-center">
          You’ll be redirected to Auth0’s secure login page
        </p>
      </div>
    </div>
  );
};

export default Login;
