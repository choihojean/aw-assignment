import { useState, useEffect } from "react";
import { loginUser } from "../services/api";
import { useRouter } from "next/router";
import { useAuthStore } from "../store/useAuthStore";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();
    const token = useAuthStore((state) => state.token);
    const setToken = useAuthStore((state) => state.setToken);

    useEffect(() => {
        if (token) {
            router.push("/dashboard");
        }
    }, [token, router])

    const handleLogin = async () => {
        const res = await loginUser(username, password);
        if (res.access_token) {
            setToken(res.access_token);
            
            setTimeout(() => {
                router.push("/dashboard");
            }, 100);
        } else {
            alert("로그인에 실패했습니다");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-2xl font-bold mb-4">로그인</h1>
            <input
                className="border p-2 mb-2"
                type="text"
                placeholder="아이디"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <input
                className="border p-2 mb-2"
                type="password"
                placeholder="패스워드"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button className="bg-blue-500 text-white p-2" onClick={handleLogin}>
                로그인
            </button>
        </div>
    );
}