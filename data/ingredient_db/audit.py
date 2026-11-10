# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 선정 검토 지적을 원래 표와 구분해 보류

"""Apply review decisions separately from the three original votes."""

from .runner import digest


def apply_audit(included, excluded, unresolved, review, audit):
    if not audit:
        return included, excluded, unresolved
    if audit.get("majority_sha256") != digest(review):
        raise ValueError("selection audit belongs to different votes")
    for field in ("reviewer", "scope", "policy_sha256"):
        if not isinstance(audit.get(field), str) or not audit[field].strip():
            raise ValueError("selection audit requires reviewer, scope and policy hash")
    final = audit.get("mode") == "adjudication"
    if final and not str(audit.get("authorization", "")).strip():
        raise ValueError("adjudication requires authorization")
    known = {row["source_id"] for row in review}
    held = {}
    for finding in audit["findings"]:
        sid = finding["source_id"]
        if type(sid) is not int or sid not in known or sid in held:
            raise ValueError("duplicate or unknown audit source")
        if finding.get("action") not in (
            {"INCLUDE", "EXCLUDE"} if final else {"EXCLUDE", "UNKNOWN"}
        ):
            raise ValueError("audit cannot promote a source to an ingredient")
        if not isinstance(finding.get("reason"), str) or not finding["reason"].strip():
            raise ValueError("audit finding requires a reason")
        if final and finding["action"] == "INCLUDE":
            from .selection import is_english_name

            if not is_english_name(finding.get("english_name", "")):
                raise ValueError("adjudication requires an English name")
        held[sid] = {"source_id": sid, "reason": "Selection review hold: " + finding["reason"]}
    if final:
        return (
            [row for row in included if row["source_id"] not in held]
            + [
                {"source_id": f["source_id"], "english_name": f["english_name"]}
                for f in audit["findings"]
                if f["action"] == "INCLUDE"
            ],
            [row for row in excluded if row["source_id"] not in held]
            + [
                {"source_id": f["source_id"], "reason": f["reason"]}
                for f in audit["findings"]
                if f["action"] == "EXCLUDE"
            ],
            [row for row in unresolved if row["source_id"] not in held],
        )
    return (
        [row for row in included if row["source_id"] not in held],
        [row for row in excluded if row["source_id"] not in held],
        [row for row in unresolved if row["source_id"] not in held] + list(held.values()),
    )
