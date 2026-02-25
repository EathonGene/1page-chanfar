// functions/api/news.js
export async function onRequestGet(context) {
    const { results } = await context.env.DB.prepare("SELECT * FROM news ORDER BY id DESC LIMIT 6").all();
    return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
}

export async function onRequestPost(context) {
    const { title, content, date } = await context.request.json();
    await context.env.DB.prepare("INSERT INTO news (title, content, date) VALUES (?, ?, ?)")
        .bind(title, content, date).run();
    return new Response("OK", { status: 200 });
}
