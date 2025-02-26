import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { fetchWithAuth  } from "../services/api";
import { fetchLinks, createLink, deleteLink, shareLink, searchLinks, updateLink, getCategories } from "../services/linkApi";
import { getUser, logoutUser } from "../services/authApi";
import { useAuthStore } from "../store/useAuthStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

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
    const [categories, setCategories] = useState<string[]>(["전체"]);
    const [selectedCategory, setSelectedCategory] = useState("전체");
    const [shareUsername, setShareUsername] = useState("");
    const [sharePermission, setSharePermission] = useState("read");
    const [selectedLink, setSelectedLink] = useState<number | null>(null);
    const [editMode, setEditMode] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [editUrl, setEditUrl] = useState("");
    const [editCategory, setEditCategory] = useState("");
    const [permissions, setPermissions] = useState<LinkPermission[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchCategory, setSearchCategory] = useState("");
    const [searchType, setSearchType] = useState("name");
    const [showAddForm, setShowAddForm] = useState(false);
    const router = useRouter();
    const token = useAuthStore((state) => state.token);

    const fetchAllLinks = async () => {
        try {
            const data = await fetchLinks();
            setLinks(data);
    
            //공유된 링크의 권한 정보 가져오기
            const permissionsData = await Promise.all(
                data.map(async (link: LinkResponse) => {
                    const res = await fetchWithAuth(`${API_BASE_URL}/links/${link.id}/permissions`);
                    return res.ok ? res.json() : null;
                })
            );
    
            //권한 정보 업데이트
            setPermissions(permissionsData.flat().filter(Boolean));
        } catch (error) {
            console.error("링크 목록을 불러오는 데 실패했습니다:", error);
        }
    };



    useEffect(() => {
        getUser().then((data) => {
            if (data.username) {
                setUsername(data.username);
                setUserId(data.id);
                fetchCategories();
                fetchAllLinks();
            } else {
                useAuthStore.getState().logout();
                router.push("/login");
            }
        });
    }, []);

    //사용자의 웹 링크 목록에 있는 모든 카테고리를 가져옴
    const fetchCategories = async () => {
        try {
            const categoriesData = await getCategories();
            setCategories(["전체", ...categoriesData]);
        } catch (error) {
            console.error("카테고리 목록을 불러오는 데 실패했습니다:", error);
        }
    };

    //카테고리를 선택하면 해당 카테고리에 해당하는 링크만 가져옴
    const handleCategoryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const category = e.target.value;
        setSelectedCategory(category);

        try {
            const filteredLinks = await fetchLinks(category);
            setLinks(filteredLinks);
        } catch (error) {
            console.error("링크 필터링 실패:", error);
        }
    };

    const handleCreate = async () => {
        if (!name || !url || !category) {
            alert("모든 필드를 입력해야 합니다.");
            return;
        }
    
        try {
            await createLink(name, url, category);
            await fetchAllLinks();
            await fetchCategories();
            setName("");
            setUrl("");
            setCategory("");
        } catch (error) {
            console.error("웹 링크 추가 실패:", error);
            alert("웹 링크 추가에 실패했습니다.");
        }
    };

    const handleDelete = async (id: number, createdBy: number) => {
        try {
            if (createdBy === userId) {
                await deleteLink(id);
            } else {
                await fetchWithAuth(`${API_BASE_URL}/links/${id}/unshare`, {
                    method: "POST",
                });
            }
    
            await fetchAllLinks();
            fetchCategories();
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
    
        if (shareUsername === username) {
            alert("자신에게는 공유할 수 없습니다.");
            return;
        }
    
        try {
            const res = await shareLink(selectedLink, shareUsername, sharePermission);
            alert(res.message || "권한이 성공적으로 변경되었습니다.");
    
            setSelectedLink(null);
            setShareUsername("");
            setSharePermission("read");
            fetchAllLinks();
        } catch (error) {
            console.error("공유 실패:", error);
            alert("공유에 실패했습니다.");
        }
    };
    
    const canShareLink = (linkId: number) => {
        const link = links.find((l) => l.id === linkId);
        return link ? link.created_by === userId || hasWritePermission(linkId) : false;
    };
    
    

    const hasWritePermission = (linkId: number) => {
        if (!userId) return false;
        return permissions.some(
            (perm) => perm.link_id === linkId && perm.user_id === userId && perm.permission === "write"
        );
    };
    

    const handleEdit = (link: LinkResponse) => {
        if (!(link.created_by === userId || hasWritePermission(link.id))) {
            alert("수정 권한이 없습니다");
            return;
        }
        setEditMode(link.id);
        setEditName(link.name);
        setEditUrl(link.url);
        setEditCategory(link.category);
    };

    const handleUpdate = async (linkId: number) => {
        if (!editMode) return;
    
        try {
            await updateLink(linkId, editName, editUrl, editCategory);
            fetchAllLinks();
            setEditMode(null);
        } catch (error) {
            console.error("링크 수정 실패: ", error);
            alert("링크 수정 실패");
        }
    };

    const handleSearch = async () => {
        if (!searchQuery && !searchCategory) {
            alert("검색어를 입력해주세요.");
            return;
        }
    
        try {
            const queryParam = searchType === "name" ? `query=${encodeURIComponent(searchQuery)}` : `category=${encodeURIComponent(searchCategory)}`;
            const searchResult = await searchLinks(queryParam);
            setLinks(searchResult);
        } catch (error) {
            console.error("검색 실패:", error);
            alert("검색에 실패했습니다.");
        }
    };

    const resetSearch = () => {
        fetchAllLinks();
        setSearchQuery("");
        setSearchCategory("");
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">웹 링크보드</h1>
            <p>안녕하세요, {username}님! <button className="bg-red-500 text-white p-1 mt-4 rounded" onClick={handleLogout}>로그아웃</button></p>
            

            <h2 className="text-xl font-semibold mt-6">검색</h2>
            <div className="flex gap-2 mb-4">
                <select className="border p-2" value={searchType} onChange={(e) => setSearchType(e.target.value)}>
                    <option value="name">링크명</option>
                    <option value="category">카테고리</option>
                </select>
                {searchType === "name" ? (
                    <input
                        className="border p-2"
                        placeholder="링크 제목 검색"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                ) : (
                    <input
                        className="border p-2"
                        placeholder="카테고리 검색"
                        value={searchCategory}
                        onChange={(e) => setSearchCategory(e.target.value)}
                    />
                )}
                <button className="bg-blue-500 text-white p-2 rounded" onClick={handleSearch}>검색</button>
                <button className="bg-gray-500 text-white p-2 rounded" onClick={resetSearch}>모든 링크</button>
            </div>

            {/*웹 링크 섹션*/}
            <div className="flex justify-between items-center mt-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold">웹 링크</h2>
                    <select className="border p-2" value={selectedCategory} onChange={handleCategoryChange}>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <button className="bg-blue-500 text-white p-2 rounded" onClick={() => setShowAddForm(!showAddForm)}>
                        {showAddForm ? "닫기" : "새 링크 추가"}
                    </button>
                </div>
            </div>

            {/*웹 링크 추가 폼*/}
            {showAddForm && (
                <div className="flex gap-2 mt-4">
                    <input className="border p-2" placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} />
                    <input className="border p-2" placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} />
                    <input className="border p-2" placeholder="카테고리" value={category} onChange={(e) => setCategory(e.target.value)} />
                    <button className="bg-blue-500 text-white p-2" onClick={handleCreate}>추가</button>
                </div>
            )}

            {/* 웹 링크 목록 */}
            <div className="mt-4">
                {links.length === 0 ? (
                    <p>저장된 링크가 없습니다.</p>
                ) : (
                    links.map((link) => (
                        <div key={link.id} className="border p-3 mb-2 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <a href={link.url} target="_blank" rel="noopener noreferrer"
                                    className="text-lg font-semibold text-blue-600 hover:underline">{link.name}</a>
                                <span className="text-gray-500 text-sm truncate max-w-xs">{link.url}</span>
                                <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm">{link.category}</span>
                            </div>

                            <div className="flex gap-3">
                                <span className="text-gray-500">{link.created_by === userId ? "내 링크" : "공유받은 링크"}</span>
                                <button 
                                    className={`p-1 ${canShareLink(link.id) ? "bg-green-500 text-white rounded" : "bg-gray-300 text-gray-600 rounded cursor-not-allowed"}`}
                                    onClick={() => setSelectedLink(link.id)}
                                    disabled={!canShareLink(link.id)}>공유</button>

                                
                                <button
                                    className={`p-1 ${
                                        link.created_by === userId || hasWritePermission(link.id) ? "bg-yellow-500 text-white rounded" : "bg-gray-300 text-gray-600 cursor-not-allowed rounded"}`}
                                    onClick={() => handleEdit(link)}
                                    disabled={!(link.created_by === userId || hasWritePermission(link.id))}>수정
                                </button>

                                <button className="bg-red-500 text-white p-1 rounded" onClick={() => handleDelete(link.id, link.created_by)}>삭제</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/*공유 모달 UI*/}
            {selectedLink && (
                <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
                        <h3 className="text-lg font-semibold">웹 링크 공유</h3>
                        <input 
                            className="border p-2 w-full mb-2"
                            placeholder="공유할 사용자 입력"
                            value={shareUsername}
                            onChange={(e) => setShareUsername(e.target.value)}
                        />
                        <select className="border p-2 w-full mb-2" value={sharePermission} onChange={(e) => setSharePermission(e.target.value)}>
                            <option value="read">읽기</option>
                            <option value="write">쓰기</option>
                        </select>
                        <div className="flex justify-end">
                            <button className="bg-blue-500 text-white p-2 mr-2" onClick={handleShare}>공유</button>
                            <button className="bg-gray-500 text-white p-2" onClick={() => setSelectedLink(null)}>닫기</button>
                        </div>
                    </div>
                </div>
            )}

            {/*수정 모달 UI*/}
            {editMode && (
                <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
                        <h3 className="text-lg font-semibold">웹 링크 수정</h3>
                        <input 
                            className="border p-2 w-full mb-2"
                            placeholder="이름"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                        />
                        <input 
                            className="border p-2 w-full mb-2"
                            placeholder="URL"
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                        />
                        <input 
                            className="border p-2 w-full mb-2"
                            placeholder="카테고리"
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                        />
                        <div className="flex justify-end">
                            <button className="bg-blue-500 text-white p-2 mr-2" onClick={() => handleUpdate(editMode)}>저장</button>
                            <button className="bg-gray-500 text-white p-2" onClick={() => setEditMode(null)}>닫기</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

