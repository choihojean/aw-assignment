import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        router.push("/login"); 
    }, []);

    return (
        <div className="flex items-center justify-center h-screen">
            <p className="text-lg">메인 페이지로 이동 중중</p>
        </div>
    );
}
