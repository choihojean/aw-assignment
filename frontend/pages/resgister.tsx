import { useState } from "react";
import { registerUser } from "../services/api";
import { useRouter } from "next/router";

export default function Register() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    const handleRegister = async () => {
        const res = await registerUser(username, password);
        if (res.access_token) {
            localStorage.setItem("token", res.access_token);
            router.push("/dashboard");
        } else {
            alert("회원가입에 실패했습니다");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-2xl font-bold mb-4">회원가입</h1>
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
                onChange={(e) => setPassword(e.target.value)}
            />
            <button className="bg-green-500 text-white p-2" onClick={handleRegister}>
                회원가입
            </button>
        </div>
    );
}