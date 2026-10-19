#!/usr/bin/env python3
"""Build a local, double-clickable preview of the site into ./preview (not committed).

Usage: python3 scripts/preview.py [path/to/hugo]
Then open preview/index.html (or any page's index.html) in a browser.
"""
import os, re, shutil, subprocess, sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(root, "preview")
hugo = sys.argv[1] if len(sys.argv) > 1 else "hugo"
shutil.rmtree(out, ignore_errors=True)
env = dict(os.environ, HUGO_RELATIVEURLS="true", HUGO_ENVIRONMENT="preview")
subprocess.run([hugo, "--gc", "--buildDrafts", "--destination", out], cwd=root, check=True, env=env)

for dirpath, _, files in os.walk(out):
    for f in files:
        if not f.endswith(".html"):
            continue
        path = os.path.join(dirpath, f)
        html = open(path, encoding="utf-8").read()
        # file:// cannot open directories or verify SRI hashes, so point links at index.html
        html = re.sub(r'href="((?:\.\.?/)+(?:[^"#?:]*/)?)"', lambda m: f'href="{m.group(1)}index.html"', html)
        html = re.sub(r'href="(\.\./|\./)?([^":#?]+/)"', lambda m: f'href="{m.group(1) or ""}{m.group(2)}index.html"', html)
        html = re.sub(r'\s+integrity="[^"]*"', "", html)
        html = re.sub(r'<link rel="?preload"?[^>]*>', "", html)
        open(path, "w", encoding="utf-8").write(html)
print("Preview ready:", os.path.join(out, "index.html"))
