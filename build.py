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

import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
SITE_URL = "https://itech-go.com"

NAV = [
    ("index", "Home"),
    ("about", "About"),
    ("services", "Services"),
    ("careers", "Careers"),
    ("contact", "Contact"),
]


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
    for frag in sorted((SRC / "pages").glob("*.html")):
        meta, body = parse_meta(frag.read_text(encoding="utf-8"))
        slug = meta.get("slug", frag.stem)
        out_name = f"{slug}.html"
        path = "/" if slug == "index" else f"/{out_name}"
        html = (
            layout.replace("{{title}}", meta.get("title", "iTech-Go"))
            .replace("{{description}}", meta.get("description", ""))
            .replace("{{canonical}}", SITE_URL + path)
            .replace("{{body_class}}", meta.get("body_class", f"page-{slug}"))
            .replace("{{nav}}", nav_html(slug))
            .replace("{{year}}", str(date.today().year))
            .replace("{{content}}", body)
        )
        (ROOT / out_name).write_text(html, encoding="utf-8")
        built.append(out_name)

    # sitemap: public pages only
    public = [s for s, _ in NAV] + ["privacy", "terms"]
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
