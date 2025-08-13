import { useState } from "react";
import axios from "../api/axios";
import debounce from "debounce";

export default function SearchBar({ onResults }) {
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(false);

    const doSearch = async (query) => {
        if(!query || query.trim().length === 0) {
            onResults([]);
            return;
        }
        console.log("Searching for:", query);
        setLoading(true);
        try {
            const res = await axios.get(`/files/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem("token")}`
                }
            });
            console.log("Search response:", res.data);
            onResults(res.data.results || []);
        } catch (error) {
            console.error("Error searching files:", error);
            console.error("Error response:", error.response?.data);
            onResults([]);
        } finally {
            setLoading(false);
        }
    };

    // debounce calls to avoid spamming API
    const debounced = debounce(doSearch, 500);

    const onChange = (e) => {
        const val = e.target.value;
        setQ(val);
        debounced(val);
    };

    return (
        <div className="w-full">
            <input
                type="search"
                value={q}
                onChange={onChange}
                placeholder="Search your files..."
                className="w-full border rounded px-3 py-2"
            />
            {loading && <div className="text-sm text-gray-500">Searching...</div>}
        </div>
    );
}