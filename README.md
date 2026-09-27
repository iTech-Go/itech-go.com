# itech-go.com

Static marketing site for iTech-Go LLC. No framework, no build toolchain on the host.

## Layout
- `src/layout.html` — shared header/footer/head
- `src/pages/*.html` — page content fragments (metadata in leading HTML comments)
- `build.py` — stitches fragments into finished pages at the repo root
- `assets/` — CSS, JS, images, icons

## Edit and preview
```
python3 build.py
python3 -m http.server 8080
```
Open http://localhost:8080

## Forms
Contact and Careers forms use Web3Forms (free). Create an access key at https://web3forms.com
for accounts@itech-go.com and the key (a651cb84-…) is set via `data-key` in
`src/pages/contact.html` and `src/pages/careers.html`, then rebuild. Until then the forms
fall back to opening the visitor's email client.

## Deploy (GitHub Pages)
1. Push this folder to a GitHub repo; Settings → Pages → Deploy from branch `main`, root.
2. Custom domain: `itech-go.com` (CNAME file is included). Enable "Enforce HTTPS" after DNS resolves.
3. GoDaddy DNS: replace the current A records for `@` with
   185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
   and set `www` CNAME → `<github-user>.github.io`. Do not touch MX/TXT (Google Workspace mail).

## Deploy (Cloudflare Pages alternative)
Connect the repo in Cloudflare Pages with no build command and output directory `/`.
Add custom domain itech-go.com; follow the CNAME instructions Cloudflare shows.
