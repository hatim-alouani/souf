(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/audit/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AuditPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function AuditPage() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuditPage.useEffect": ()=>{
            async function initAudit() {
                try {
                    // 1️⃣ Try to restore previous audit progress
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    if (user === null || user === void 0 ? void 0 : user.user_id) {
                        var _data_steps;
                        const res = await fetch("/api/audit/resume?user_id=".concat(user.user_id));
                        const data = await res.json();
                        if (data.ok && data.session_id && ((_data_steps = data.steps) === null || _data_steps === void 0 ? void 0 : _data_steps.length) > 0) {
                            console.log('🧠 Resuming audit for user', user.user_id);
                            localStorage.setItem('audit_session', JSON.stringify({
                                session_id: data.session_id,
                                state: data.state,
                                steps: data.steps
                            }));
                        } else {
                            console.log('🆕 No existing audit session, starting fresh.');
                            localStorage.removeItem('audit_session');
                        }
                    }
                } catch (err) {
                    console.warn('⚠️ Resume check failed:', err);
                }
                // 2️⃣ Load Unith assets (once)
                if (document.getElementById('unith-bundle')) return;
                const script = document.createElement('script');
                script.id = 'unith-bundle';
                script.defer = true;
                script.src = 'https://embedded.unith.ai/dist/bundle.js';
                document.body.appendChild(script);
                const msSpeech = document.createElement('script');
                msSpeech.src = 'https://embedded.unith.ai/microsoft-speech-recognition.js';
                document.body.appendChild(msSpeech);
                const css = document.createElement('link');
                css.rel = 'stylesheet';
                css.href = 'https://embedded.unith.ai/dist/bundle.css';
                document.head.appendChild(css);
                const fonts = document.createElement('link');
                fonts.rel = 'stylesheet';
                fonts.href = 'https://gpt-head-assets.unith.ai/fonts/stylesheet.css';
                fonts.media = 'print';
                fonts.onload = ({
                    "AuditPage.useEffect.initAudit": function() {
                        this.media = 'all';
                    }
                })["AuditPage.useEffect.initAudit"];
                document.head.appendChild(fonts);
            }
            initAudit();
        }
    }["AuditPage.useEffect"], []);
    const handleLogout = ()=>{
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('audit_session');
        router.push('/');
    };
    const handleLogoClick = ()=>{
        handleLogout();
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "flex flex-col w-screen h-screen overflow-hidden",
        style: {
            backgroundColor: '#fff'
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                className: "w-full h-16 bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm flex items-center justify-between px-6 z-50",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 cursor-pointer",
                        onClick: handleLogoClick,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg",
                                children: "A"
                            }, void 0, false, {
                                fileName: "[project]/app/audit/page.tsx",
                                lineNumber: 91,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-lg font-semibold tracking-tight text-gray-800",
                                children: "A2X CORP"
                            }, void 0, false, {
                                fileName: "[project]/app/audit/page.tsx",
                                lineNumber: 94,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/audit/page.tsx",
                        lineNumber: 87,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: "/profile",
                                className: "text-gray-700 hover:text-blue-600 transition-all font-medium",
                                children: "Profile"
                            }, void 0, false, {
                                fileName: "[project]/app/audit/page.tsx",
                                lineNumber: 101,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: "/audit",
                                className: "text-gray-700 hover:text-blue-600 transition-all font-medium",
                                children: "Refresh"
                            }, void 0, false, {
                                fileName: "[project]/app/audit/page.tsx",
                                lineNumber: 108,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/audit/page.tsx",
                        lineNumber: 100,
                        columnNumber: 7
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/audit/page.tsx",
                lineNumber: 85,
                columnNumber: 6
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("iframe", {
                src: "https://chat.unith.ai/a2xcorp/ai-audit-19713?api_key=c0fcea77824e4bd38007224654e847d4",
                width: "100%",
                height: "600px",
                allow: "microphone",
                style: {
                    border: 'none'
                }
            }, void 0, false, {
                fileName: "[project]/app/audit/page.tsx",
                lineNumber: 119,
                columnNumber: 6
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/audit/page.tsx",
        lineNumber: 80,
        columnNumber: 5
    }, this);
}
_s(AuditPage, "vQduR7x+OPXj6PSmJyFnf+hU7bg=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = AuditPage;
var _c;
__turbopack_context__.k.register(_c, "AuditPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=app_audit_page_tsx_7f19879e._.js.map