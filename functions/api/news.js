/**
 * 強發金屬有限公司 - API 後端程式碼 (Cloudflare Pages Functions)
 * 功能：
 * 1. GET: 供首頁讀取新聞列表（公開）
 * 2. POST: 供管理後台發布新聞（具備網域檢查與防護）
 */

// 處理 GET 請求：讓所有人都能看新聞
export async function onRequestGet(context) {
    const { env } = context;
    try {
        // 從 D1 抓取新聞，按日期降序排列
        const { results } = await env.DB.prepare(
            "SELECT * FROM news ORDER BY date DESC LIMIT 20"
        ).all();

        return new Response(JSON.stringify(results), {
            headers: { 
                "Content-Type": "application/json;charset=UTF-8",
                "Access-Control-Allow-Origin": "*" 
            },
            status: 200
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: "資料讀取失敗" }), { status: 500 });
    }
}

// 處理 POST 請求：僅限管理員發布新聞
export async function onRequestPost(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    // --- 安全防護 1：防止 pages.dev 後門 ---
    // 檢查請求是否來自您的自訂網域，若透過原生 pages.dev 網址直接拒絕
    if (url.hostname !== '1page.chan-far.com') {
        return new Response("安全性錯誤：請由官方網域進入", { status: 403 });
    }

    try {
        const payload = await request.json();
        const { title, content } = payload;

        // --- 安全防護 2：基本欄位檢查 ---
        if (!title || !content) {
            return new Response("標題與內容不可為空", { status: 400 });
        }

        // 自動生成台灣時間日期 (YYYY-MM-DD)
        const date = new Date().toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\//g, '-');

        // --- 寫入 D1 資料庫 ---
        // 使用參數化查詢預防 SQL 注入
        await env.DB.prepare(
            "INSERT INTO news (title, content, date) VALUES (?, ?, ?)"
        )
        .bind(title, content, date)
        .run();

        return new Response(JSON.stringify({ message: "發布成功" }), {
            headers: { "Content-Type": "application/json" },
            status: 200
        });

    } catch (e) {
        return new Response(JSON.stringify({ error: "伺服器錯誤: " + e.message }), { 
            status: 500 
        });
    }
}

// 處理 OPTIONS 請求 (預檢請求，確保跨域功能正常)
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}
