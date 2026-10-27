# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
"""Run all three suites independently and aggregate coverage counts by responsibility."""

import html
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUNS = {"unit": ["tests/unit"], "integration": ["tests/integration"], "combined": ["tests"]}
COUNTS = ("covered_lines", "num_statements", "covered_branches", "num_branches")


def layer_for(filename):
    path = Path(filename)
    if path.name in {"service.py", "queries.py", "database.py"} or "models" in path.parts:
        return "Services and database"
    if path.name == "generator.py" or "workflow" in path.parts:
        return "Recommendation workflow"
    if (
        path.name in {"main.py", "router.py", "dependencies.py", "security.py"}
        or "api" in path.parts
    ):
        return "API and authentication"
    return "Validation and utilities"


def percent(covered, total):
    return round(100 * covered / total, 2) if total else None


def aggregate(data):
    groups = {}
    for filename, result in sorted(data["files"].items()):
        group = groups.setdefault(layer_for(filename), {**dict.fromkeys(COUNTS, 0), "files": []})
        group["files"].append(filename)
        for key in COUNTS:
            group[key] += result["summary"][key]
    for group in groups.values():
        group["lines_pct"] = percent(group["covered_lines"], group["num_statements"])
        group["branches_pct"] = percent(group["covered_branches"], group["num_branches"])
    for key in COUNTS:
        if sum(group[key] for group in groups.values()) != data["totals"][key]:
            raise ValueError(f"Layer totals do not match report: {key}")
    return groups


def main():
    results = {}
    for kind, targets in RUNS.items():
        directory = ROOT / "coverage" / kind
        directory.mkdir(parents=True, exist_ok=True)
        data_file = f"coverage/{kind}/.coverage"
        commands = [
            ["run", f"--data-file={data_file}", "-m", "pytest", *targets, "-q"],
            ["html", f"--data-file={data_file}", "-d", f"coverage/{kind}/html"],
            ["json", f"--data-file={data_file}", "-o", f"coverage/{kind}/coverage.json"],
        ]
        for command in commands:
            print(f"[{kind}] coverage {' '.join(command)}", flush=True)
            subprocess.run([sys.executable, "-m", "coverage", *command], cwd=ROOT, check=True)
        data = json.loads((directory / "coverage.json").read_text())
        expected = {str(path.relative_to(ROOT)) for path in (ROOT / "app").rglob("*.py")}
        if set(data["files"]) != expected:
            raise ValueError(f"Source inventory mismatch: {set(data['files']) ^ expected}")
        results[kind] = {"totals": data["totals"], "layers": aggregate(data)}
    (ROOT / "coverage/layers.json").write_text(json.dumps(results, indent=2) + "\n")
    tables = []
    for kind, result in results.items():
        rows = []
        for layer, counts in result["layers"].items():
            cells = []
            for covered, total in [
                ("covered_lines", "num_statements"),
                ("covered_branches", "num_branches"),
            ]:
                rate = percent(counts[covered], counts[total])
                label = f"{rate:.2f}%" if rate is not None else "N/A"
                cells.append(f"<td>{label}<small>{counts[covered]} / {counts[total]}</small></td>")
            rows.append(f"<tr><td>{html.escape(layer)}</td>{''.join(cells)}</tr>")
        tables.append(
            f'<h2>{kind.title()}</h2><p><a href="{kind}/html/index.html">File report</a></p>'
            "<table><tr><th>Layer</th><th>Lines</th><th>Branches</th></tr>"
            + "".join(rows)
            + "</table>"
        )
    page = """<!doctype html>
<!-- AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung -->
<html lang="en"><meta charset="utf-8"><title>Server coverage by layer</title>
<style>body{font:16px system-ui;max-width:1000px;margin:36px auto;padding:0 24px;color:#172033}
table{border-collapse:collapse;width:100%}
th,td{border:1px solid #ccd4df;padding:12px;text-align:right}
th:first-child,td:first-child{text-align:left}th{background:#eff3f8}small{display:block;color:#526074}
</style><h1>Server coverage by layer</h1>
<p>All app/**/*.py files, including unimported modules. Counts are covered / total executable
lines or branch exits. Layer percentages use summed counts, not averages of file percentages.</p>
<p>Command: <code>uv run python scripts/coverage_report.py</code></p>
"""
    (ROOT / "coverage/layers.html").write_text(page + "".join(tables) + "</html>\n")
    print(json.dumps(results["combined"]["layers"], indent=2))


if __name__ == "__main__":
    main()
