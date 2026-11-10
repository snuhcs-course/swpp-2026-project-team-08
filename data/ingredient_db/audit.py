# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 선정 검토 지적을 원래 표와 구분해 보류

"""Quarantine reviewed sources without replacing the three original votes."""

from .runner import digest


def apply_audit(included, excluded, unresolved, review, audit):
    if not audit:
        return included, excluded, unresolved
    if audit.get("majority_sha256") != digest(review):
        raise ValueError("selection audit belongs to different votes")
    for field in ("reviewer", "scope", "policy_sha256"):
        if not isinstance(audit.get(field), str) or not audit[field].strip():
            raise ValueError("selection audit requires reviewer, scope and policy hash")
    known = {row["source_id"] for row in review}
    held = {}
    for finding in audit["findings"]:
        sid = finding["source_id"]
        if type(sid) is not int or sid not in known or sid in held:
            raise ValueError("duplicate or unknown audit source")
        if finding.get("action") not in {"EXCLUDE", "UNKNOWN"}:
            raise ValueError("audit cannot promote a source to an ingredient")
        if not isinstance(finding.get("reason"), str) or not finding["reason"].strip():
            raise ValueError("audit finding requires a reason")
        held[sid] = {"source_id": sid, "reason": "Selection review hold: " + finding["reason"]}
    return (
        [row for row in included if row["source_id"] not in held],
        [row for row in excluded if row["source_id"] not in held],
        [row for row in unresolved if row["source_id"] not in held] + list(held.values()),
    )
