import { create } from "zustand";
import { useEffect } from "react";
import { getUser } from "../services/api";

interface AuthState {
    token: string | null;
    setToken: (token: string | null) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    setToken: (token) => {
        set({ token });
    },
    logout: () => {
        set({ token: null });
    },
}));

export const useLoadAuth = () => {
    useEffect(() => {
        getUser().then((data) => {
            if (data?.username) {
                useAuthStore.getState().setToken(data.token);
            }
        })
        .catch(() => {
            useAuthStore.getState().logout();
        });
    }, []);
};