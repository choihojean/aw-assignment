import { create } from "zustand";
import { useEffect } from "react";
import { fetchWithAuth, getUser } from "../services/api";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

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
        fetchWithAuth(`${API_BASE_URL}/auth/me`)
            .then((res) => res.json())
            .then((data) => {
                if (data.username) {
                    console.log("로그인 유지:", data.username);
                    useAuthStore.getState().setToken("logged_in");
                } else {
                    console.log("세션 만료");
                    useAuthStore.getState().logout();
                }
            })
            .catch(() => {
                console.log("인증실패");
                useAuthStore.getState().logout();
            });
    }, []);
}