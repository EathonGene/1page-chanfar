export async function onRequestGet(context) {
    const { env } = context;
    try {
        const { results } = await env.DB.prepare(
            "SELECT * FROM news ORDER BY id DESC LIMIT 20"
        ).all();
        return new Response(JSON.stringify(results), {
            headers: { "Content-Type": "application/json;charset=UTF-8", "Access-Control-Allow-Origin": "*" },
            status: 200
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: "讀取失敗" }), { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    if (url.hostname !== '1page.chan-far.com') {
        return new Response("安全性錯誤", { status: 403 });
    }

    try {
        // 使用 FormData 解析包含檔案的內容
        const formData = await request.formData();
        const title = formData.get('title');
        const content = formData.get('content');
        const imageFile = formData.get('image'); // 這是圖片檔案

        if (!title || !content) return new Response("標題內容必填", { status: 400 });

        let image_url = "";

        // 如果有上傳圖片，處理 R2 儲存
        if (imageFile && imageFile.size > 0) {
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
            await env.R2.put(fileName, imageFile);
            // 這裡請改成你剛才在 R2 設定的自訂網域
            image_url = `https://cdn.chan-far.com/${fileName}`;
        }

        const date = new Date().toLocaleDateString('zh-TW', {
            year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Taipei'
        }).replace(/\//g, '-');

        await env.DB.prepare(
            "INSERT INTO news (title, content, date, image_url) VALUES (?, ?, ?, ?)"
        )
        .bind(title, content, date, image_url)
        .run();

        return new Response(JSON.stringify({ message: "發布成功" }), { status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}
