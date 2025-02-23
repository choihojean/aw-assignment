import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { fetchLinks, createLink, deleteLink, shareLink, updateLink, getUser, logoutUser,  } from "../services/api";
import { useAuthStore } from "../store/useAuthStore";

interface LinkResponse {
    id: number;
    name: string;
    url: string;
    category: string;
    created_by: number;
  }

interface LinkPermission {
    link_id: number;
    user_id: number;
    permission: string;
}

export default function Dashboard() {
    const [userId, setUserId] = useState<number | null>(null);
    const [username, setUsername] = useState("");
    const [links, setLinks] = useState<LinkResponse[]>([]);
    const [name, setName] = useState("");
    const [url, setUrl] = useState("");
    const [category, setCategory] = useState("");
    const [shareUsername, setShareUsername] = useState("");
    const [sharePermission, setSharePermission] = useState("read");
    const [selectedLink, setSelectedLink] = useState<number | null>(null);
    const [editMode, setEditMode] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [editUrl, setEditUrl] = useState("");
    const [editCategory, setEditCategory] = useState("");
    const [permissions, setPermissions] = useState<LinkPermission[]>([]);
    const [viewLink, setViewLink] = useState<LinkResponse | null>(null);
    const router = useRouter();
    const token = useAuthStore((state) => state.token);

    useEffect(() => {
        if (!token) {
            router.push("/login");
            return;
        }

        getUser()
            .then((data) => {
                if (data.username) {
                    setUsername(data.username);
                    setUserId(data.id);
                } else {
                    useAuthStore.getState().logout();
                    router.push("/login");
                }
            })
            .catch((error) => {
                console.error("사용자 정보를 불러오는 데 실패했습니다:", error);
                router.push("/login");
            });

        fetchLinks()
            .then((data) => setLinks(data))
            .catch((error) => {
                console.error("링크 목록을 불러오는 데 실패했습니다:", error);
            });
    }, [token]);

    const handleCreate = async () => {
        if (!name || !url || !category) {
            alert("모든 필드를 입력해야 합니다.");
            return;
        }

        try {
            const newLink = await createLink(name, url, category);
            setLinks((prevLinks) => [...prevLinks, newLink]);
            setName("");
            setUrl("");
            setCategory("");
        } catch (error) {
            console.error("웹 링크 추가 실패:", error);
            alert("웹 링크 추가에 실패했습니다.");
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteLink(id);
            setLinks((prevLinks) => prevLinks.filter((link) => link.id !== id));
        } catch (error) {
            console.error("웹 링크 삭제 실패:", error);
            alert("웹 링크 삭제에 실패했습니다.");
        }
    };
    
    const handleLogout = async () => {
        try {
            await logoutUser();
            router.push("/login");
        } catch (error) {
            console.error("로그아웃 실패:", error);
        }
    };

    const handleShare = async () => {
        if (!selectedLink || !shareUsername) {
            alert("공유할 사용자를 입력하세요");
            return;
        }

        try {
            await shareLink(selectedLink, shareUsername, sharePermission);
            alert("공유되었습니다.");

            setSelectedLink(null);
            setShareUsername("");
            setSharePermission("read");
        } catch (error) {
            console.error("공유 실패:", error);
            alert("공유에 실패했습니다.");
        }
    };

    const hasWritePermission = (linkId: number) => {
        return permissions.some(
            (perm) => perm.link_id === linkId && perm.user_id === userId && perm.permission === "write"
        );
    }

    const handleEdit = (link: LinkResponse) => {
        if (link.created_by !== userId && !hasWritePermission(link.id)) {
            alert("수정 권한이 없습니다");
            return;
        }
        setEditMode(link.id);
        setEditName(link.name);
        setEditUrl(link.url);
        setEditCategory(link.category);
    };

    const handleUpdate = async (linkId: number) => {
        try {
            await updateLink(linkId, editName, editUrl, editCategory);
            setLinks((prevLinks) =>
                prevLinks.map((link) =>
                    link.id === linkId ? { ...link, name: editName, url: editUrl, category: editCategory} : link
                )
            );
            setEditMode(null);
        } catch (error) {
            console.error("링크 수정 실패: ", error)
            alert("링크 수정 실패");
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">대시보드</h1>
            <p>안녕하세요, {username}님!</p>
            <button className="bg-red-500 text-white p-2 mt-4" onClick={handleLogout}>
                로그아웃
            </button>

            <h2 className="text-xl font-semibold mt-6">새 웹 링크 추가</h2>
            <div className="flex gap-2">
                <input className="border p-2" placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} />
                <input className="border p-2" placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} />
                <input className="border p-2" placeholder="카테고리" value={category} onChange={(e) => setCategory(e.target.value)} />
                <button className="bg-blue-500 text-white p-2" onClick={handleCreate}>추가</button>
            </div>

            <h2 className="text-xl font-semibold mt-6">내 웹 링크</h2>
            <div className="mt-4">
                {links.length === 0 ? (
                    <p>저장된 링크가 없습니다.</p>
                ) : (
                    links.map((link) => (
                        <div key={link.id} className="border p-2 mb-2 flex justify-between">
                            {editMode === link.id ? (
                                <>
                                    <input className="border p-2" value={editName} onChange={(e) => setEditName(e.target.value)} />
                                    <input className="border p-2" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} />
                                    <input className="border p-2" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} />
                                    <button className="bg-blue-500 text-white p-1 mr-2" onClick={() => handleUpdate(link.id)}>저장</button>
                                    <button className="bg-gray-500 text-white p-1" onClick={() => setEditMode(null)}>취소</button>
                                </>
                            ) : (
                                <>
                                    <a href={link.url} target="_blank" rel="noopener noreferrer">{link.name}</a>
                                    <div>
                                        <span className="text-gray-500">{link.created_by === userId ? "내 링크" : "공유받은 링크"}</span>
                                        <button className="bg-green-500 text-white p-1 mr-2" onClick={() => setSelectedLink(link.id)}>공유</button>
                                        <button
                                            className={`p-1 mr-2 ${link.created_by === userId || hasWritePermission(link.id) ? "bg-yellow-500 text-white" : "bg-gray-300 text-gray-600 cursor-not-allowed"}`}
                                            onClick={() => handleEdit(link)}
                                            disabled={link.created_by !== userId && !hasWritePermission(link.id)}
                                        >
                                            수정
                                        </button>
                                        <button className="bg-red-500 text-white p-1" onClick={() => handleDelete(link.id)}>삭제</button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>
            
            {selectedLink && (
                <div className="mt-6 p-4 border">
                    <h3 className="text-lg font-semibold">웹 링크 공유</h3>
                    <input className="border p-2 mr-2" placeholder="공유할 사용자 입력" value={shareUsername} onChange={(e) => setShareUsername(e.target.value)} />
                    <select className="border p-2 mr-2" value={sharePermission} onChange={(e) => setSharePermission(e.target.value)}>
                        <option value="read">읽기</option>
                        <option value="write">쓰기</option>
                    </select>
                    <button className="bg-blue-500 text-white p-2" onClick={handleShare}>공유</button>
                    <button className="bg-gray-500 text-white p-2 ml-2" onClick={() => setSelectedLink(null)}>취소</button>
                </div>
            )}
        </div>
    );
}

