import { useState } from "react";
import { fetchLinks, getCategories } from "../services/linkApi";

export const useLinks = () => {
    const [links, setLinks] = useState([]);
    const [categories, setCategories] = useState<string[]>(["전체"]);
    const [selectedCategory, setSelectedCategory] = useState("전체");

    const fetchAllLinks = async () => {
        try {
            const data = await fetchLinks();
            setLinks(data);
        } catch (error) {
            console.error("링크 목록 불러오기 실패:", error);
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(["전체", ...data]);
        } catch (error) {
            console.error("카테고리 목록 불러오기 실패:", error);
        }
    };

    return { links, fetchAllLinks, fetchCategories, categories, selectedCategory, setSelectedCategory };
};
