# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 최종 재료와 판정 근거를 읽는 로컬 검토 화면

"""Read-only local catalog viewer: python -m data.ingredient_db.viewer."""

import argparse
import json
from collections import defaultdict
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

ROOT = Path(__file__).resolve().parent
DOWNLOADS = {
    "ingredients.jsonl": "result/ingredients.jsonl",
    "ingredients_restrictions.jsonl": "result/ingredients_restrictions.jsonl",
    "review.md": "review/README.md",
}


class CatalogView:
    def __init__(self, root=ROOT):
        self.root = root
        self.summary = json.loads((root / "review/summary.json").read_text())
        review = json.loads((root / "review/catalog.json").read_text())
        self.ingredients = {row["id"]: row for row in review["ingredients"]}
        self.sources = {row["source_id"]: row for row in review["sources"]}
        self.pending = {row["source_id"]: row for row in review["unresolved"]}
        self.selection = {row["source_id"]: row for row in review["selection_review"]}
        final = {
            (r["ingredient_id"], r["restriction_type"]): r["degree"]
            for r in map(
                json.loads,
                (root / "result/ingredients_restrictions.jsonl").read_text().splitlines(),
            )
        }
        edits = {
            (r["ingredient_id"], r["restriction_type"]): r
            for r in review.get("restriction_decisions", {}).get("edits", [])
        }
        self.judgments = defaultdict(list)
        for row in review["restriction_votes"]:
            key = row["ingredient_id"], row["restriction_type"]
            self.judgments[key[0]].append(
                {
                    **row,
                    "majority": row["degree"],
                    "degree": final.get(key, "UNKNOWN"),
                    "review_reason": edits.get(key, {}).get("reason"),
                }
            )

    def search(self, query, mode, kind, degree, page):
        if mode == "pending":
            rows = [
                {"id": sid, "name": self.sources[sid]["description"], "note": row["reason"]}
                for sid, row in sorted(self.pending.items())
            ]
        else:
            rows = []
            for ident, item in self.ingredients.items():
                judgments = self.judgments[ident]
                if kind or degree:
                    if not any(
                        (not kind or r["restriction_type"] == kind)
                        and (not degree or r["degree"] == degree)
                        for r in judgments
                    ):
                        continue
                held = sum(r["degree"] == "UNKNOWN" for r in judgments)
                rows.append(
                    {
                        "id": ident,
                        "name": item["english_name"],
                        "note": f"제한 보류 {held}개" if held else "19개 제한 확정",
                    }
                )
        query = query.casefold().strip()
        rows = [r for r in rows if query in r["name"].casefold() or query == str(r["id"])]
        return {"total": len(rows), "rows": rows[page * 50 : (page + 1) * 50]}

    def detail(self, ident, mode):
        if mode == "pending":
            row = self.pending[ident]
            return {
                "name": self.sources[ident]["description"],
                "id": ident,
                "pending": row["reason"],
                "selection": self.selection[ident],
                "sources": [self.sources[ident]],
            }
        item = self.ingredients[ident]
        return {
            "id": ident,
            "name": item["english_name"],
            "sources": [self.sources[s] for s in item["source_ids"]],
            "judgments": self.judgments[ident],
        }


def handler_for(view):
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            url = urlsplit(self.path)
            params = parse_qs(url.query)

            def arg(key):
                return params.get(key, [""])[0]

            content_type = "application/json; charset=utf-8"
            download = None
            try:
                if url.path == "/":
                    data = (view.root / "viewer.html").read_bytes()
                    content_type = "text/html; charset=utf-8"
                elif url.path == "/api/summary":
                    data = view.summary
                elif url.path == "/api/search":
                    page = max(0, int(arg("page") or "0"))
                    data = view.search(arg("q"), arg("mode"), arg("kind"), arg("degree"), page)
                elif url.path == "/api/detail":
                    data = view.detail(int(arg("id")), arg("mode"))
                elif url.path.startswith("/download/"):
                    download = url.path.removeprefix("/download/")
                    data = (view.root / DOWNLOADS[download]).read_bytes()
                    content_type = "application/octet-stream"
                else:
                    self.send_error(404)
                    return
            except (KeyError, ValueError):
                self.send_error(400, "Invalid request")
                return
            if not isinstance(data, bytes):
                data = json.dumps(data, ensure_ascii=False).encode()
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            if download:
                self.send_header("Content-Disposition", f'attachment; filename="{download}"')
            self.end_headers()
            self.wfile.write(data)

        def log_message(self, *args):
            pass

    return Handler


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), handler_for(CatalogView()))
    print(f"Catalog viewer: http://127.0.0.1:{args.port}/", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
