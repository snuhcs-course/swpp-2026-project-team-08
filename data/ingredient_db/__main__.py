# AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
# Changed: 재료 생성 단계와 오프라인 검증 명령 제공

"""영어 재료 카탈로그 생성 명령."""

import argparse
import json
from pathlib import Path

from . import selection, source
from .gemini import DEFAULT_MODEL
from .runner import ROOT, AgentRunner, digest, pin_run, write_json


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("stage", choices=("prepare", "select", "judge", "export", "check"))
    parser.add_argument("--work-dir", type=Path, default=ROOT / "work")
    parser.add_argument("--review", type=Path, default=ROOT / "review/catalog.json")
    parser.add_argument("--result-dir", type=Path, default=ROOT / "result")
    parser.add_argument("--policy", type=Path, default=ROOT / "docs/policy.md")
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--archive", type=Path, help="이미 내려받은 SR Legacy CSV ZIP")
    parser.add_argument(
        "--batch-size", type=int, help="select: 기본 16행, 최대 50행; judge: 기본 10재료"
    )
    parser.add_argument(
        "--max-batches", type=int, help="select의 일부 요청만 실행; 최종 결과는 만들지 않음"
    )
    args = parser.parse_args()
    if args.stage in {"export", "check"}:
        from .export import check, export_from_review

        action = check if args.stage == "check" else export_from_review
        print(json.dumps(action(args.review, args.result_dir), ensure_ascii=False, indent=2))
        return
    policy_text = args.policy.read_text(encoding="utf-8")
    if args.stage == "prepare":
        data = source.prepare(args.work_dir, archive_path=args.archive)
    else:
        data = json.loads((args.work_dir / "source.json").read_text(encoding="utf-8"))
    manifest = pin_run(args.work_dir, data, policy_text, args.model)
    if args.stage == "prepare":
        print(json.dumps(manifest, ensure_ascii=False, indent=2))
        return
    runner = AgentRunner(
        args.work_dir,
        policy_text=policy_text,
        source_hash=manifest["source_sha256"],
        model=args.model,
    )
    if args.stage == "select":
        result = selection.run(
            data,
            args.work_dir,
            call_agent=runner.call,
            batch_size=args.batch_size or 16,
            max_batches=args.max_batches,
        )
        if result is None:
            print("Selected batches cached; full selection has not finished.")
        else:
            result["metadata"] = manifest
            write_json(args.work_dir / "selected.json", result)
            print(
                json.dumps(
                    {key: len(result[key]) for key in ("ingredients", "excluded", "unresolved")}
                )
            )
    else:
        from .restrictions import run

        selected = json.loads((args.work_dir / "selected.json").read_text(encoding="utf-8"))
        selected_source = {"metadata": manifest["source"], "rows": selected["sources"]}
        if selected["metadata"] != manifest or digest(selected_source) != manifest["source_sha256"]:
            raise ValueError("selected ingredients belong to a different run")
        result = run(
            args.work_dir / "selected.json",
            args.work_dir,
            call_agent=runner.call,
            batch_size=args.batch_size or 10,
        )
        result["metadata"] = manifest
        write_json(args.review, result)
        print(json.dumps({"ingredients": len(result["ingredients"]), "review": str(args.review)}))


if __name__ == "__main__":
    main()
