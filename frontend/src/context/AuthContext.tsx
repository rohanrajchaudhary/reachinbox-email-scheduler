import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import api from "../services/api";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token =
        localStorage.getItem(
          "reachinbox_token"
        );

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response =
          await api.get("/auth/me");

        const currentUser =
          response.data.user;

        setUser(currentUser);

        localStorage.setItem(
          "reachinbox_user",
          JSON.stringify(currentUser)
        );
      } catch (error) {
        console.error(
          "Failed to restore authentication:",
          error
        );

        localStorage.removeItem(
          "reachinbox_token"
        );

        localStorage.removeItem(
          "reachinbox_user"
        );

        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const logout = () => {
    localStorage.removeItem(
      "reachinbox_token"
    );

    localStorage.removeItem(
      "reachinbox_user"
    );

    setUser(null);

    api
      .post("/auth/logout")
      .catch((error) => {
        console.error(
          "Logout request failed:",
          error
        );
      });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated:
          Boolean(user),
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}