(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/client/app/chatbot/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ChatbotPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/client/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/client/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
const API_URL = ("TURBOPACK compile-time value", "https://sunfast-julee-moaningly.ngrok-free.dev") || "http://localhost:3000";
function ChatbotPage() {
    _s();
    const [question, setQuestion] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [response, setResponse] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [conversationId, setConversationId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    async function sendMessage(e) {
        e.preventDefault();
        setIsLoading(true);
        setResponse("");
        const token = localStorage.getItem("token");
        try {
            const res = await fetch("".concat(API_URL, "/chat"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer ".concat(token)
                },
                body: JSON.stringify({
                    question,
                    conversationId
                })
            });
            if (!res.ok) {
                const errorText = await res.text();
                setResponse("Error: ".concat(res.status, " - ").concat(errorText || "Unable to reach backend."));
                setIsLoading(false);
                return;
            }
            // Extract conversation id from header
            const convHeader = res.headers.get("X-Conversation-Id");
            if (convHeader) {
                setConversationId(Number(convHeader));
            }
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = "";
            let metadataParsed = false;
            while(true){
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, {
                    stream: true
                });
                // Handle metadata if present
                if (!metadataParsed && chunk.includes("METADATA_START:")) {
                    const metadataMatch = chunk.match(/METADATA_START:(.+?):METADATA_END/);
                    if (metadataMatch) {
                        // You can extract sources here if needed
                        // const metadata = JSON.parse(metadataMatch[1]);
                        metadataParsed = true;
                        // Remove metadata from chunk before displaying
                        const cleanChunk = chunk.replace(/METADATA_START:.+?:METADATA_END\n\n/, "");
                        accumulated += cleanChunk;
                    } else {
                        accumulated += chunk;
                    }
                } else {
                    accumulated += chunk;
                }
                setResponse(accumulated);
            }
            setIsLoading(false);
        } catch (error) {
            console.error("Fetch error:", error);
            setResponse("Error: ".concat(error instanceof Error ? error.message : "Network error. Check if server is running."));
            setIsLoading(false);
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-8 max-w-2xl mx-auto",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "text-2xl font-bold mb-6",
                children: "AI Assistant"
            }, void 0, false, {
                fileName: "[project]/client/app/chatbot/page.tsx",
                lineNumber: 88,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-4 text-xs text-gray-500",
                children: [
                    "API URL: ",
                    API_URL,
                    conversationId && " | Conversation ID: ".concat(conversationId)
                ]
            }, void 0, true, {
                fileName: "[project]/client/app/chatbot/page.tsx",
                lineNumber: 91,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                onSubmit: sendMessage,
                className: "flex gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "text",
                        className: "border p-2 flex-1",
                        placeholder: "Ask something...",
                        value: question,
                        onChange: (e)=>setQuestion(e.target.value),
                        disabled: isLoading
                    }, void 0, false, {
                        fileName: "[project]/client/app/chatbot/page.tsx",
                        lineNumber: 97,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400",
                        disabled: isLoading,
                        children: isLoading ? "Sending..." : "Send"
                    }, void 0, false, {
                        fileName: "[project]/client/app/chatbot/page.tsx",
                        lineNumber: 105,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/client/app/chatbot/page.tsx",
                lineNumber: 96,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$client$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-6 whitespace-pre-wrap bg-gray-100 p-4 rounded min-h-[200px]",
                children: response || (isLoading ? "Thinking..." : "")
            }, void 0, false, {
                fileName: "[project]/client/app/chatbot/page.tsx",
                lineNumber: 113,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/client/app/chatbot/page.tsx",
        lineNumber: 87,
        columnNumber: 5
    }, this);
}
_s(ChatbotPage, "YTVtuHWhnVDMuPFKM5Cr3U75Y00=");
_c = ChatbotPage;
var _c;
__turbopack_context__.k.register(_c, "ChatbotPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=client_app_chatbot_page_tsx_25b39bcf._.js.map