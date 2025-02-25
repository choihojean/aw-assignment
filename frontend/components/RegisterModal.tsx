import { useState } from "react";
import { registerUser } from "../services/api";
import { useRouter } from "next/router";
import { useAuthStore } from "../store/useAuthStore";

export default function RegisterModal({ onClose }: { onClose: () => void }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const setToken = useAuthStore((state) => state.setToken);
    const router = useRouter();

    const handleRegister = async () => {
        const res = await registerUser(username, password);
        if (res.access_token) {
            setToken(res.access_token);
            onClose();
            router.push("/dashboard");
        } else {
            alert("회원가입에 실패했습니다");
        }
    };

    return (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-md w-80">
                <h2 className="text-xl font-semibold mb-4 text-center">회원가입</h2>
                <input className="border p-2 mb-2 w-full rounded" type="text" placeholder="아이디" value={username} onChange={(e) => setUsername(e.target.value)} />
                <input className="border p-2 mb-2 w-full rounded" type="password" placeholder="패스워드" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button className="bg-green-500 text-white p-2 rounded w-full hover:bg-green-600 transition" onClick={handleRegister}>회원가입</button>
                <button className="bg-gray-500 text-white p-2 rounded w-full mt-2" onClick={onClose}>닫기</button>
            </div>
        </div>
    );
}
