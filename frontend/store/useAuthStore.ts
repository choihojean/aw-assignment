import { create } from "zustand";
import { useEffect } from "react";

interface AuthState {
    token: string | null;
    setToken: (token: string | null) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    setToken: (token) => {
        if (typeof window !== "undefined") {
            localStorage.setItem("token", token || "");
        }
        set({ token });
    },
    logout: () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("token");
        }
        set({ token: null });
    },
}));

export const useLoadAuth = () => {
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedToken = localStorage.getItem("token");
            if (savedToken) {
                useAuthStore.getState().setToken(savedToken);
            }
        }
    }, []);
};