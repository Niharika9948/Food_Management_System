
import React, { createContext, useContext, useState } from "react";
import API from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [loading, setLoading] = useState(false);

    const login = async (email, password) => {
        setLoading(true);

        try {
            const response = await API.post("/auth/login", {
                email,
                password
            });

            const data = response.data;
            const token = data.token || data.data?.token;
            const loggedInUser = data.user || data.data?.user;

            if (!token || !loggedInUser) {
                throw new Error("Invalid login response from server");
            }

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(loggedInUser));

            setUser(loggedInUser);

            return loggedInUser;
        } finally {
            setLoading(false);
        }
    };

    const register = async (formData) => {
        setLoading(true);

        try {
            const response = await API.post("/auth/register", formData);
            return response.data;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{ user, loading, login, register, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
