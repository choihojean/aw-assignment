import { useAuthStore } from "../store/useAuthStore";

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




