import { useAuthStore } from "../store/useAuthStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const getAuthHeaders = (): Record<string, string> => {
    const token = useAuthStore.getState().token;
    if (!token) {
        console.warn("JWT 토큰이 없습니다. 인증이 필요한 요청이 거부될 수 있습니다.");
        return {};
    }
    return { Authorization: `Bearer ${token}` };
};

export const registerUser = async (username: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({username, password}),
    });

    return res.json();
};

export const loginUser = async (username: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({username, password}),
    });

    return res.json();
};

export const logoutUser = async () => {
    try{
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: "POST",
            headers: getAuthHeaders(),
        });
        useAuthStore.getState().logout();
    } catch (error) {
        console.error(error);
    }
};

export const getUser = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: getAuthHeaders(),
    });
    return res.json();
    } catch (error) {
        console.error(error);
        return null;
    }
};

export const fetchLinks = async (category?: string) => {
    let url = `${API_BASE_URL}/links/`;
    if (category && category !== "전체") {
        url += `?category=${encodeURIComponent(category)}`;
    }

    const res = await fetch(url, {
        headers: getAuthHeaders(),
    });

    return res.json();
};

export const createLink = async (name: string, url: string, category: string) => {
    const res = await fetch(`${API_BASE_URL}/links/`, {
        method: "POST",
        headers: {"Content-Type": "application/json", ...getAuthHeaders()},
        body: JSON.stringify({name, url, category}),
    });
    return res.json();
};

export const deleteLink = async (linkId: number) => {
    await fetch(`${API_BASE_URL}/links/${linkId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });
};

export const shareLink = async (linkId: number, username: string, permission: string) => {
    const res = await fetch(`${API_BASE_URL}/links/${linkId}/share`, {
        method: "POST",
        headers: {"Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({username, permission}),
    });

    return res.json();
};

export const updateLink = async (linkId: number, name: string, url: string, category: string) => {
    const res = await fetch(`${API_BASE_URL}/links/${linkId}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({name, url, category})
    });

    if (!res.ok) {
        throw new Error("링크 수정 실패");
    }
    
    return res.json();
};

export const searchLinks = async (queryParam: string) => {
    const res = await fetch(`${API_BASE_URL}/links/search?${queryParam}`, {
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        throw new Error("검색 요청 실패");
    }
    return res.json();
};

export const getCategories = async () => {
    const res = await fetch(`${API_BASE_URL}/links/categories`, {
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        throw new Error("카테고리 목록 불러오기 실패");
    }

    return res.json();
};
