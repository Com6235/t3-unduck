import "./global.css";
import {customBangs} from "./custom-bangs.ts";
import {Bang} from "./types.ts";

async function noSearchDefaultPageRender() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `
    <main>
      <div class="content-container">
        <h1>Und*ck</h1>
        <p>DuckDuckGo's bang redirects are too slow. Add the following URL as a custom search engine to your browser. Enables <a href="https://duckduckgo.com/bang.html" target="_blank">all of DuckDuckGo's bangs.</a></p>
        <div class="url-container">
          <input
            type="text"
            class="url-input"
            value="https://com6235.github.io/t3-unduck?q=%s"
            readonly
          />
          <button class="copy-button">
            <img src="/t3-unduck/clipboard.svg" alt="Copy" />
          </button>
        </div>
        <div class="bang-search">
          <form class="bang-search-search">
            <input type="search" placeholder="Search bangs" class="bang-search-search-input" aria-label="Bang search input field"/>
            <button type="submit" class="bang-search-search-submit" aria-label="Bang search submit button">
              <img src="/t3-unduck/search.svg" class="bang-search-search-img" alt="Bang search submit button icon" />
            </button>
          </form>
          <div class="bang-search-container"></div>
        </div>
      </div>
      <footer class="footer">
        <a href="https://github.com/Com6235/t3-unduck" target="_blank">github</a>
        •
        <a href="https://www.youtube.com/@t3dotgg" target="_blank">theo</a>
        •
        <a href="https://github.com/t3dotgg/unduck" target="_blank">original github (please give it a 🌟)</a>
      </footer>
    </main>
  `;

  const copyButton = app.querySelector<HTMLButtonElement>(".copy-button")!;
  const copyIcon = copyButton.querySelector("img")!;
  const urlInput = app.querySelector<HTMLInputElement>(".url-input")!;

  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(urlInput.value);
    copyIcon.src = "/t3-unduck/clipboard-check.svg";

    setTimeout(() => {
      copyIcon.src = "/t3-unduck/clipboard.svg";
    }, 2000);
  });

  await setupSearch(app)
}

async function setupSearch(app: HTMLDivElement) {
  const searchContainer = app.querySelector<HTMLDivElement>(".bang-search-container")!;
  const searchForm = app.querySelector<HTMLFormElement>(".bang-search-search")!;
  const searchInput = app.querySelector<HTMLInputElement>(".bang-search-search-input")!;

  const bangs: Bang[] = customBangs;

  searchForm.onsubmit = (e) => {
    e.preventDefault();
    const input = searchInput.value.trim();

    const tags = bangs
      .filter((i) => i.s.includes(input) || i.t.includes(input) || i.t.includes(input.slice(1)))
      .map(i => `<div class="bang-search-bang"><span>${i.t}</span><a href="http://${i.d}">${i.s}</a></div>`)
      .join('');

    searchContainer.innerHTML = tags;
  }

  for (const i of [...'abcdefghijklmnopqrstuvwxyz0123456789', 'other']) {
    const ibangs = (await import(`./bangs/${i}.json`)).default as Bang[];
    ibangs.forEach(i => { if (bangs.filter(a => a.t == i.t).length == 0) { bangs.push(i) } })
  }
}

async function getBang(bang: string | undefined): Promise<Bang | undefined> {
  if (!bang) return undefined
  let firstChar = bang.charAt(0)
  if (firstChar.match(/[a-zA-Z0-9]/gm) == null) {
    let bangs: Bang[] = (await import("./bangs/other.json")).default
    return bangs.find(a => a.t == bang)
  } else {

    let bangs = (await import(`./bangs/${firstChar}.json`)).default as Bang[]
    return bangs.find(a => a.t == bang)
  }
}

const DEFAULT_BANG = "ya"
const LS_DEFAULT_BANG = localStorage.getItem("default-bang") ?? DEFAULT_BANG;

async function getDefaultBang() {
  return customBangs.find((b) => b.t === LS_DEFAULT_BANG)
      ?? await getBang(LS_DEFAULT_BANG)
      ?? ((await getBang(DEFAULT_BANG)) as Bang)
}

async function getBangredirectUrl() {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    await noSearchDefaultPageRender();
    return null;
  }

  const match = query.match(/!(\S+)/i);

  const bangCandidate = match?.[1]?.toLowerCase();
  const selectedBang = customBangs.find((b: Bang) => b.t === bangCandidate) ?? await getBang(bangCandidate) ?? await getDefaultBang();

  // Remove the first bang from the query
  const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

  // If the query is just `!gh`, use `github.com` instead of `github.com/search?q=`
  if (cleanQuery === "")
    return selectedBang ? `https://${selectedBang.d}` : null;

  // Format of the url is:
  // https://www.google.com/search?q={{{s}}}
  const searchUrl = selectedBang.u.replace(
      "{{{s}}}",
      // Replace %2F with / to fix formats like "!ghr+t3dotgg/unduck"
      encodeURIComponent(cleanQuery).replace(/%2F/g, "/"),
  );
  if (!searchUrl) return null;

  return searchUrl;
}

async function doRedirect() {
  const searchUrl = await getBangredirectUrl();
  if (!searchUrl) return;
  window.location.replace(searchUrl);
}

doRedirect();
