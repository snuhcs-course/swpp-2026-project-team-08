# AI-generated with GPT-6, 2026-10-31, reviewed by Haechan Jung
"""Run all tests once and retain a layer report and test log."""

import html
import json
import re
import shutil
import subprocess
import sys
import tempfile
import tomllib
from datetime import datetime
from fnmatch import fnmatchcase
from importlib.metadata import version
from pathlib import Path
from zoneinfo import ZoneInfo

import coverage

ROOT = Path(__file__).resolve().parents[1]
COUNTS = ("covered_lines", "num_statements", "covered_branches", "num_branches")


LAYER_PATTERNS = {
    "HTTP API": (
        "app/main.py",
        "app/api/*.py",
        "app/features/*/router.py",
        "app/features/*/dependencies.py",
    ),
    "Schemas and serialization": (
        "app/features/*/dto.py",
        "app/features/*/*_dto.py",
        "app/features/*/serialization.py",
    ),
    "Services and rules": (
        "app/features/*/service.py",
        "app/features/*/validation.py",
    ),
    "Recommendation workflow": (
        "app/features/*/generator.py",
        "app/features/*/workflow/*.py",
    ),
    "Database and persistence": (
        "app/models/*.py",
        "app/core/database.py",
        "app/features/*/queries.py",
    ),
    "Core and security": (
        "app/core/config.py",
        "app/core/errors.py",
        "app/core/timezone.py",
        "app/features/*/security.py",
        "app/features/*/codes.py",
        "app/features/*/consent_version.py",
        "app/__init__.py",
        "app/core/__init__.py",
        "app/features/__init__.py",
        "app/features/*/__init__.py",
    ),
}


def layer_for(filename):
    name = Path(filename).as_posix()
    matches = [
        layer
        for layer, patterns in LAYER_PATTERNS.items()
        if any(fnmatchcase(name, pattern) for pattern in patterns)
    ]
    if len(matches) > 1:
        raise ValueError(
            f"Expected exactly one layer for {name}, got {matches}; update LAYER_PATTERNS"
        )
    return matches[0] if matches else "Others"


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
    return {layer: groups[layer] for layer in [*LAYER_PATTERNS, "Others"] if layer in groups}


def render(data, groups, metadata, exit_code, summary):
    rows = []
    for name, counts in [*groups.items(), ("Total", data["totals"])]:
        cells = []
        for covered, total in [
            ("covered_lines", "num_statements"),
            ("covered_branches", "num_branches"),
        ]:
            rate = percent(counts[covered], counts[total])
            label = f"{rate:.2f}%" if rate is not None else "N/A"
            cells.append(f"<td>{label}<small>{counts[covered]} / {counts[total]}</small></td>")
        rows.append(f"<tr><th>{html.escape(name)}</th>{''.join(cells)}</tr>")
    other_files = groups.get("Others", {}).get("files", [])
    others = (
        "<ul>"
        + "".join(f"<li><code>{html.escape(name)}</code></li>" for name in other_files)
        + "</ul>"
        if other_files
        else "<p>No files.</p>"
    )
    status = "PASSED" if exit_code == 0 else "FAILED"
    return f"""<!doctype html>
<!-- AI-generated with GPT-6, 2026-10-31, reviewed by Haechan Jung -->
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Server test coverage</title><style>
body{{font:16px/1.5 system-ui;max-width:1100px;margin:32px auto;padding:0 24px;color:#172033}}
table{{border-collapse:collapse;width:100%}}
th,td{{border:1px solid #d9e0e8;padding:10px 14px;text-align:right}}
th:first-child{{text-align:left}}thead{{background:#eff3f8}}small{{display:block;color:#526074}}
pre{{white-space:pre-wrap;overflow-wrap:anywhere;background:#f3f5f8;padding:16px}}
</style></head><body><h1>Server test coverage</h1>
<p>Test process: {status} (exit {exit_code})</p>
<h2>Run information</h2><pre>{html.escape(metadata)}</pre>
<h2>Coverage by architectural layer</h2>
<p>Counts show covered / total. Files matching the configured coverage omissions are excluded.</p>
<table><thead><tr><th>Layer</th><th>Lines</th><th>Branches</th></tr></thead>
<tbody>{"".join(rows)}</tbody></table>
<h2>Files in Others</h2>
<p>Measured files that do not match a named layer (paths relative to server/).</p>
{others}
<h2>Test results</h2><pre>{html.escape(summary)}</pre>
<p><a href="tests.log">Full test output, including failures and skips</a></p>
</body></html>\n"""


def main():
    directory = ROOT / "coverage"
    directory.mkdir(exist_ok=True)
    for name in ["unit", "integration", "combined", "layers.json", "layers.html", "tests.log"]:
        target = directory / name
        if target.is_dir():
            shutil.rmtree(target)
        else:
            target.unlink(missing_ok=True)
    commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    dirty = subprocess.check_output(["git", "status", "--porcelain"], cwd=ROOT, text=True)
    tree_state = "modified (commit alone does not reproduce this run)" if dirty else "clean"
    started_at = datetime.now(ZoneInfo("Asia/Seoul")).isoformat(timespec="seconds")
    metadata = "\n".join(
        [
            f"Date (Asia/Seoul): {started_at}",
            f"Commit: {commit}",
            f"Working tree: {tree_state}",
            f"Python: {sys.version.split()[0]}; coverage.py: {coverage.__version__}; "
            f"pytest: {version('pytest')}",
            "Command: uv run python scripts/coverage_report.py",
            "Test command: python -m coverage run -m pytest tests -v -ra",
        ]
    )
    with tempfile.TemporaryDirectory(prefix="server-coverage-") as temporary:
        data_file = str(Path(temporary) / ".coverage")
        command = [
            sys.executable,
            "-m",
            "coverage",
            "run",
            f"--data-file={data_file}",
            "-m",
            "pytest",
            "tests",
            "-v",
            "-ra",
        ]
        output = []
        with (directory / "tests.log").open("w") as log:
            log.write(metadata + "\n\n")
            with subprocess.Popen(
                command, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True
            ) as process:
                for line in process.stdout:
                    print(line, end="", flush=True)
                    log.write(line)
                    output.append(line)
                exit_code = process.wait()
        report = subprocess.run(
            [sys.executable, "-m", "coverage", "json", f"--data-file={data_file}", "-o", "-"],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=True,
        )
        data = json.loads(report.stdout)
        settings = tomllib.loads((ROOT / "pyproject.toml").read_text())
        omissions = settings["tool"]["coverage"]["run"].get("omit", [])
        expected = {
            path.relative_to(ROOT).as_posix()
            for path in (ROOT / "app").rglob("*.py")
            if not any(fnmatchcase(path.relative_to(ROOT).as_posix(), rule) for rule in omissions)
        }
        if set(data["files"]) != expected:
            raise ValueError(f"Source inventory mismatch: {set(data['files']) ^ expected}")
        groups = aggregate(data)
        summaries = [
            line.strip("= \n")
            for line in output
            if re.match(r"^=+ .*\b(passed|failed|error|errors|skipped|no tests ran)\b", line)
        ]
        summary = summaries[-1] if summaries else "Summary unavailable; see tests.log."
        (directory / "layers.html").write_text(render(data, groups, metadata, exit_code, summary))
    print("Reports: coverage/layers.html, coverage/tests.log")
    return exit_code if exit_code >= 0 else 1


if __name__ == "__main__":
    sys.exit(main())
