import { createContext, useContext, useState } from "react";
import api from "../config/ApiConfig";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  const [loading] = useState(false);

  const register = async (userData) => {
    const res = await api.post("/auth/register", userData);

    if (res.data?.data) {
      const nextUser = res.data.data;
      const nextToken = res.data.token || token;

      setUser(nextUser);
      setToken(nextToken);
      localStorage.setItem("user", JSON.stringify(nextUser));
      if (nextToken) localStorage.setItem("token", nextToken);
    }

    return res.data;
  };

  const login = (userData, authToken = null) => {
    setUser(userData);
    setToken(authToken || token);
    localStorage.setItem("user", JSON.stringify(userData));
    if (authToken) localStorage.setItem("token", authToken);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout error:", err.message);
    }

    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const value = {
    user,
    token,
    register,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to consume AuthContext
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
