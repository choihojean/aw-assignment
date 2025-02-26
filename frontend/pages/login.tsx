import { useState, useEffect } from "react";
import { fetchWithAuth } from "../services/api";
import { useRouter } from "next/router";
import { useAuthStore } from "../store/useAuthStore";
import RegisterModal from "../components/RegisterModal";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const router = useRouter();
    const token = useAuthStore((state) => state.token);

    useEffect(() => {
        if (token) {
            router.push("/dashboard");
        }
    }, [token, router])

    const handleLogin = async () => {
        const res = await fetchWithAuth(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {"Content-Type": "application/x-www-form-urlencoded"},
            body: new URLSearchParams({username, password}),
        });

        if (res.ok) {
            // 로그인 성공 후 유저 정보 가져오기
            const userData = await fetchWithAuth(`${API_BASE_URL}/auth/me`).then(res => res.json());
            if (userData.username) {
                await useAuthStore.getState().setToken("logged_in");
                router.push("/dashboard");
            } else {
                alert("유저 정보 로드 실패");
            }
        } else {
            alert("로그인 실패");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h1 className="text-6xl font-extrabold text-blue-500 mb-6">워크 포털</h1>

            <div className="bg-white p-8 rounded-lg shadow-md w-80">
                <h2 className="text-2xl font-semibold mb-4 text-center">로그인</h2>
                <input
                    className="border p-2 mb-2 w-full rounded"
                    type="text"
                    placeholder="아이디"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    className="border p-2 mb-2 w-full rounded"
                    type="password"
                    placeholder="패스워드"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                    className="bg-blue-500 text-white p-2 rounded w-full hover:bg-blue-600 transition"
                    onClick={handleLogin}
                >로그인</button>

                <p className="text-center text-gray-600 mt-4">계정이 없으신가요? 
                    <button className="text-blue-500 ml-1 hover:underline" onClick={() => setIsRegisterModalOpen(true)}>
                        회원가입
                    </button>
                </p>
            </div>
            {isRegisterModalOpen && <RegisterModal onClose={() => setIsRegisterModalOpen(false)} />}
        </div>
    );
}