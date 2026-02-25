// 在 POST 處理函式內加入這段：
export async function onRequestPost(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    // 【核心邏輯】檢查網域，如果不是您的官方網域，直接拒絕
    // 這樣即便別人找到 pages.dev 的網址也沒用
    if (url.hostname !== '1page.chan-far.com') {
        return new Response('拒絕存取：請由官方網域進入', { status: 403 });
    }

    // 原本的程式碼... (取得 payload, 寫入資料庫等)
    try {
        const payload = await request.json();
        // ... (執行資料庫寫入)
        return new Response('發布成功', { status: 200 });
    } catch (e) {
        return new Response('發布失敗', { status: 500 });
    }
}
