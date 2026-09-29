#!/usr/bin/env python3
"""Tiny static-site generator for itech-go.com.

Reads src/layout.html and src/pages/*.html, writes finished pages to the repo root.
Each page fragment starts with metadata comments:
    <!-- title: Page title -->
    <!-- description: Meta description -->
    <!-- slug: about -->          (optional, defaults to file name)
    <!-- body_class: page-home --> (optional)
Run:  python3 build.py
"""
from __future__ import annotations

import hashlib
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
SITE_URL = "https://itech-go.com"

NAV = [
    ("ai-agents", "AI & Agents"),
    ("services", "Services"),
    ("industries", "Industries"),
    ("approach", "Approach"),
    ("insights", "Insights"),
    ("about", "About"),
    ("careers", "Careers"),
]


ASSET_RE = re.compile(r'(?P<attr>(?:href|src)=")(?P<path>/assets/(?:css|js)/[^"?]+)(?P<q>\?[^"]*)?"')


def stamp_assets(html: str) -> str:
    """Append ?v=<content-hash> to local CSS/JS URLs so browsers pick up new builds."""
    def repl(m: re.Match) -> str:
        f = ROOT / m.group("path").lstrip("/")
        if not f.exists():
            return m.group(0)
        h = hashlib.sha1(f.read_bytes()).hexdigest()[:8]
        return f'{m.group("attr")}{m.group("path")}?v={h}"'
    return ASSET_RE.sub(repl, html)


def parse_meta(text: str) -> tuple[dict, str]:
    meta: dict[str, str] = {}
    lines = text.split("\n")
    body_start = 0
    for i, line in enumerate(lines):
        m = re.match(r"\s*<!--\s*(\w+):\s*(.*?)\s*-->\s*$", line)
        if m:
            meta[m.group(1)] = m.group(2)
            body_start = i + 1
        elif line.strip() == "":
            body_start = i + 1
        else:
            break
    return meta, "\n".join(lines[body_start:])


def nav_html(active: str) -> str:
    items = []
    for slug, label in NAV:
        href = "/" if slug == "index" else f"/{slug}.html"
        cls = ' class="active" aria-current="page"' if slug == active else ""
        items.append(f'<li><a href="{href}"{cls}>{label}</a></li>')
    return "\n".join(items)


def build() -> list[str]:
    layout = (SRC / "layout.html").read_text(encoding="utf-8")
    built: list[str] = []
    for frag in sorted((SRC / "pages").rglob("*.html")):
        meta, body = parse_meta(frag.read_text(encoding="utf-8"))
        rel = frag.relative_to(SRC / "pages").with_suffix("")
        slug = meta.get("slug", rel.as_posix())
        out_name = f"{slug}.html"
        path = "/" if slug == "index" else f"/{out_name}"
        nav_active = meta.get("nav", slug.split("/")[0])
        html = (
            layout.replace("{{title}}", meta.get("title", "iTech-Go"))
            .replace("{{description}}", meta.get("description", ""))
            .replace("{{canonical}}", SITE_URL + path)
            .replace("{{body_class}}", meta.get("body_class", f"page-{slug}"))
            .replace("{{nav}}", nav_html(nav_active))
            .replace("{{year}}", str(date.today().year))
            .replace("{{content}}", body)
        )
        html = stamp_assets(html)
        out_path = ROOT / out_name
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(html, encoding="utf-8")
        built.append(out_name)

    # sitemap: every built page except 404
    public = [b[:-5] for b in built if b != "404.html"]
    today = date.today().isoformat()
    urls = "\n".join(
        f"  <url><loc>{SITE_URL}{'/' if s == 'index' else f'/{s}.html'}</loc>"
        f"<lastmod>{today}</lastmod></url>"
        for s in public
    )
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{urls}\n</urlset>\n",
        encoding="utf-8",
    )
    return built


if __name__ == "__main__":
    for name in build():
        print("built", name)
    print("built sitemap.xml")
