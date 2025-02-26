import { fetchWithAuth } from "./api";
import { useAuthStore } from "../store/useAuthStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";


//회원가입 API
export const registerUser = async (username: string, password: string) => {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            console.error("회원가입 실패:", errorData);
            throw new Error(errorData.detail || "회원가입 실패");
        }

        return res.json();
    } catch (error) {
        console.error("회원가입 요청 실패:", error);
        throw error;
    }
};

//로그인 API
export const loginUser = async (username: string, password: string) => {
    const res = await fetchWithAuth(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username, password }),
        credentials: "include",
    });

    if (res.ok) {
        const data = await res.json();
        useAuthStore.getState().setToken(data.access_token);
    }

    return res.json();
};

//로그아웃 API
export const logoutUser = async () => {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/auth/logout`, { 
            method: "POST",
            credentials: "include"
        });

        if (!res.ok) {
            const errorData = await res.json();
            console.error("로그아웃 실패:", errorData);
            throw new Error(errorData.detail || "로그아웃 실패");
        }

        useAuthStore.getState().logout();
    } catch (error) {
        console.error("로그아웃 요청 실패:", error);
    }
};

//유저정보 가져오기기
export const getUser = async () => {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/auth/me`, {method:"GET"});
        return res.json();
    } catch (error) {
        console.error("유저 정보 로드 실패", error);
        return null;
    }
};