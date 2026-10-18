import { useEffect } from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import api from "../services/api";

function AuthCallback() {
  const [searchParams] =
    useSearchParams();

  const navigate =
    useNavigate();

  useEffect(() => {
    const token =
      searchParams.get("token");

    if (!token) {
      navigate(
        "/login?error=authentication_failed",
        {
          replace: true,
        }
      );

      return;
    }

    const completeLogin =
      async () => {
        try {
          localStorage.setItem(
            "reachinbox_token",
            token
          );

          const response =
            await api.get("/auth/me", {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            });

          const user =
            response.data.user;

          localStorage.setItem(
            "reachinbox_user",
            JSON.stringify(user)
          );

          navigate("/dashboard", {
            replace: true,
          });
        } catch (error) {
          console.error(
            "Authentication callback error:",
            error
          );

          localStorage.removeItem(
            "reachinbox_token"
          );

          localStorage.removeItem(
            "reachinbox_user"
          );

          navigate(
            "/login?error=authentication_failed",
            {
              replace: true,
            }
          );
        }
      };

    completeLogin();
  }, [navigate, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-600 border-t-white" />

        <p className="mt-5 text-sm text-slate-300">
          Completing Google sign in...
        </p>
      </div>
    </div>
  );
}

export default AuthCallback;