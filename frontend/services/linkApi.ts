import { fetchWithAuth } from "./api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";


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