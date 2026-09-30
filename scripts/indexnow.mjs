// Prévient Bing, Yandex et les autres moteurs IndexNow que les pages du site
// ont changé (la recherche de ChatGPT s'appuie en grande partie sur Bing).
// Usage, après un déploiement : node scripts/indexnow.mjs
const HOST = "www.rarelyst.co";
const KEY = "873c0d29e8a940b12ad2ce5b9c3c8ee3"; // fichier public/873c0d29e8a940b12ad2ce5b9c3c8ee3.txt
const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
const urls = [...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))];
const r = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls }),
});
console.log(`IndexNow : ${urls.length} adresses envoyées, réponse ${r.status}`);
