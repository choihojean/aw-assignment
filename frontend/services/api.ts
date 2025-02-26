import { useAuthStore } from "../store/useAuthStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = useAuthStore.getState().token;
    return fetch(`${url}`, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        } 
    });
};

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


export const logoutUser = async () => {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/auth/logout`, { 
            method: "POST",
            credentials: "include"  // ✅ 쿠키 포함
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

export const getUser = async () => {
    try {
        const res = await fetchWithAuth(`${API_BASE_URL}/auth/me`, {method:"GET"});
        return res.json();
    } catch (error) {
        console.error("유저 정보 로드 실패", error);
        return null;
    }
};

export const fetchLinks = async (category?: string) => {
    let url = `${API_BASE_URL}/links/`;
    if (category && category !== "전체") {
        url += `?category=${encodeURIComponent(category)}`;
    }

    const res = await fetchWithAuth(url);
    if (!res.ok) {
        const errorData = await res.json();
        console.error("API 요청 실패:", errorData);
        throw new Error("링크 목록 불러오기 실패");
    }

    return res.json();
};

export const createLink = async (name: string, url: string, category: string) => {
    const res = await fetchWithAuth(`${API_BASE_URL}/links/`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({name, url, category}),
    });
    return res.json();
};

export const deleteLink = async (linkId: number) => {
    await fetchWithAuth(`${API_BASE_URL}/links/${linkId}`, {
        method: "DELETE"
    });
};

export const shareLink = async (linkId: number, username: string, permission: string) => {
    const res = await fetchWithAuth(`${API_BASE_URL}/links/${linkId}/share`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username, permission}),
    });

    return res.json();
};

export const updateLink = async (linkId: number, name: string, url: string, category: string) => {
    const res = await fetchWithAuth(`${API_BASE_URL}/links/${linkId}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({name, url, category})
    });

    if (!res.ok) {
        throw new Error("링크 수정 실패");
    }
    
    return res.json();
};

export const searchLinks = async (queryParam: string) => {
    const res = await fetchWithAuth(`${API_BASE_URL}/links/search?${queryParam}`);

    if (!res.ok) {
        throw new Error("검색 요청 실패");
    }
    return res.json();
};

export const getCategories = async () => {
    const res = await fetchWithAuth(`${API_BASE_URL}/links/categories`);

    if (!res.ok) {
        const errorData = await res.json();
        console.error("API 요청 실패:", errorData);
        throw new Error("카테고리 목록 불러오기 실패");
    }

    return res.json();
};
