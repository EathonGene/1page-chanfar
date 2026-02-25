/**
 * 強發金屬有限公司 - API 後端程式碼 (最終安全優化版)
 * 路徑：/functions/api/news.js
 */

// 1. 處理 GET 請求：讀取新聞列表 (由新到舊)
export async function onRequestGet(context) {
    const { env } = context;
    try {
        // 使用 ORDER BY date DESC, id DESC 確保「最新發布」的永遠排在最上方
        const { results } = await env.DB.prepare(
            "SELECT * FROM news ORDER BY date DESC, id DESC LIMIT 20"
        ).all();

        return new Response(JSON.stringify(results), {
            headers: { 
                "Content-Type": "application/json;charset=UTF-8",
                "Access-Control-Allow-Origin": "*" 
            },
            status: 200
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: "讀取失敗" }), { status: 500 });
    }
}

// 2. 處理 POST 請求：發布新聞 (具備雙重安全檢查)
export async function onRequestPost(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    // --- 安全檢查 A：防止 pages.dev 後門繞過 ---
    // 只有從您的官方自訂網域進來的請求才會被處理
    if (url.hostname !== '1page.chan-far.com') {
        return new Response("安全性錯誤：拒絕存取非官方網域", { status: 403 });
    }

    try {
        const payload = await request.json();
        const { title, content } = payload;

        // --- 安全檢查 B：資料完整性檢查 ---
        if (!title || !content) {
            return new Response("標題與內容為必填項目", { status: 400 });
        }

        // 自動生成台灣時間日期格式 (YYYY-MM-DD)
        const date = new Date().toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            timeZone: 'Asia/Taipei'
        }).replace(/\//g, '-');

        // --- 安全檢查 C：預防 SQL 注入 ---
        // 使用 bind 參數化查詢，確保安全性
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
        return new Response(JSON.stringify({ error: "資料庫寫入失敗: " + e.message }), { 
            status: 500 
        });
    }
}

// 3. 處理 OPTIONS 請求 (解決瀏覽器跨域預檢問題)
export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}
