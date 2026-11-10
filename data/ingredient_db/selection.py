# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 원본별 재료 선정과 이름·구성원 다수결

"""원본 전체의 세 판단을 비교하고 같은 재료를 묶는다."""

import json
import unicodedata
from collections import Counter, defaultdict
from concurrent.futures import FIRST_COMPLETED, ThreadPoolExecutor, wait
from copy import deepcopy
from pathlib import Path

from .runner import AGENTS, write_json

DECISIONS = {"INCLUDE", "EXCLUDE", "UNKNOWN"}
ROW_SCHEMA = {
    "type": "object",
    "properties": {
        "source_id": {"type": "integer"},
        "decision": {"type": "string", "enum": sorted(DECISIONS)},
        "english_name": {"type": "string"},
        "reason": {"type": "string"},
    },
    "required": ["source_id", "decision", "english_name", "reason"],
    "additionalProperties": False,
}
GROUP_SCHEMA = {
    "type": "object",
    "properties": {
        "groups": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "source_ids": {"type": "array", "items": {"type": "integer"}},
                    "english_name": {"type": "string"},
                    "reason": {"type": "string"},
                },
                "required": ["source_ids", "english_name", "reason"],
                "additionalProperties": False,
            },
        },
        "unresolved": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"source_id": {"type": "integer"}, "reason": {"type": "string"}},
                "required": ["source_id", "reason"],
                "additionalProperties": False,
            },
        },
    },
    "required": ["groups", "unresolved"],
    "additionalProperties": False,
}

NAMING_INSTRUCTIONS = """Build each name from the COMPLETE description in two separate passes:
A. KEEP the ingredient's base, independent edible part or meat cut, cooking ingredient form,
   preservation method, and EVERY explicitly stated composition distinction. This includes
   sweetened/unsweetened, with/without salt, no sodium added, lactose-reduced/lactose-free,
   fat level or percentage, reduced calorie, cholesterol-free, fortified/unenriched,
   sulfuring, named added ingredients, and any stated ingredient alternatives.
   These qualifiers are part of the name, not just its reason. A short name must still retain
   them. Do not reduce a composition-specific food to its unqualified base ingredient.
B. REMOVE cultivar, origin, grade, simple heating, thawing, cutting, and meat trimming/doneness
   within the same cut. Fresh, raw, cooked, uncooked, boiled, poached, steamed, or plainly roasted
   do not belong in the name when they describe only the fresh/heated state of the same ingredient.
   'Fresh' is not a composition qualifier: a fresh whole egg and a poached whole egg both use
   'Whole egg', never 'Whole egg, fresh' or 'Poached egg'. Apply this rule to every food.
   Heating removal does NOT remove added ingredients, drying, smoking, canning, fermentation,
   concentration, powder, flour, oil, or starch: those identify form, preservation or composition.

Use a short American English base noun phrase, then comma-separated necessary qualifiers in
their source order. Start with an uppercase letter. Reorder the USDA inverted base into normal
English, omit category prefixes and administrative notes, and do not copy the full USDA title.
Use the same base phrase for the same ingredient. Put remaining form/composition qualifiers
after the base rather than inventing different adjective orders. Do not add redundant words
such as 'spice' to 'Black pepper', or retain 'commercially prepared' as an ingredient distinction.
Examples of applying the two passes:
- Egg, whole, raw, fresh -> Whole egg
- Egg, whole, cooked, poached -> Whole egg
- Ham, honey, smoked, cooked -> Ham, honey, smoked
- Cheese, cottage, lowfat, 1% milkfat, lactose reduced
  -> Cottage cheese, lowfat, 1% milkfat, lactose reduced
- Apples, dried, sulfured, uncooked -> Apple, dried, sulfured
- Cocoa, dry powder, unsweetened -> Cocoa powder, unsweetened
Egg white and egg yolk remain separate from whole egg. Lactose-reduced does not mean lactose-free.
An unstated recipe is not sugar-free, milk-free, egg-free, or unfortified. Preserve explicit
alternatives such as 'sour cream and/or buttermilk'; do not choose an unstated exact recipe.
Never remove a brand, batter, or other excluded feature to turn an excluded product into an
eligible ingredient. Naming happens only AFTER the complete source passes inclusion checks.
"""


def build_prompt(batch: list[dict]) -> str:
    """정책의 포함·제외 순서와 원본 전체를 한 선정 요청으로 구성한다."""
    return (
        """Apply the supplied policy independently to EVERY source row, including the last row.
Finish all checks for one complete description before deciding. An allowed food category never
overrides an explicit exclusion. Do not infer eligibility from its first word or category alone.

1. FIRST scan the ENTIRE description for a commercial brand or restaurant identity, including
   names in the middle, at the end, or in parentheses. If present, EXCLUDE and stop for this row.
   This rule takes precedence over ALL ingredient inclusions. Plain, dry, instant, unflavored,
   or unseasoned does not exempt a branded product. Any QUAKER product, including instant plain
   corn grits, is excluded; so are GERBER water, branded cocoa, and branded tofu. Do not delete
   the brand and then include the remaining generic food. Uppercase spelling alone is not proof
   of a brand; use company/product identity. A USDA distribution-program note is not a brand.
2. NEXT exclude completed beverages. Brewed tea and brewed coffee are finished drinks and are
   EXCLUDE even when plain, unsweetened, made only with water, or prepared at home. Ready-to-drink
   and reconstituted coffee/tea are also excluded. Dry tea leaves, coffee beans/grounds, and
   plain dry instant coffee powder are ingredient forms and can be included. Do not treat
   brewing a drink as the simple-cooking exception below. Unflavored water, milk, unsweetened
   plant milk, unsweetened lemon/lime juice, and explicitly identified cooking wine are the
   policy's exceptions; ordinary drinking alcohol remains excluded.
3. Check all other exclusions before applying the inclusion list: finished meals or seasoned
   side dishes, battered foods, snacks/desserts, ready-to-eat breakfast cereal, prepared infant
   foods/formula, supplements, and isolated proteins are excluded. Food additives and isolated
   refined sugars are excluded unless the policy expressly lists them as cooking ingredients;
   table sugar, food gelatin, agar, yeast, and baking powder are expressly allowed.
   The yogurt allowance is ONLY for plain, unflavored yogurt. Vanilla-, fruit-, or otherwise
   flavored/sweetened dessert yogurt is EXCLUDE, even if unbranded, lowfat, or made with a
   low-calorie sweetener. Being in the dairy category does not override this boundary.
4. INCLUDE generic edible raw plants, fungi, animal foods and parts; flour, starch, plain oats
   or grits, unseasoned pasta/dough, tofu, tempeh, dried fruit and ingredient preserves; milk,
   cream, cooking milk powder, cheese, plain yogurt, butter and unsweetened plant milk; oil,
   salt, herbs, spices, sugar, honey, syrup, jam, cocoa and plain chocolate; yeast, baking powder,
   food gelatin, agar and breadcrumbs; sauces, dressings, stock, nut butter, generic baking
   mixes and pickles; unfilled basic bread, baguette, tortilla, bagel, roll and naan;
   ham, bacon and sausage. These are specific ingredient allowances, not permission to include
   all foods made from their bases. Candy with chocolate, filled bread/sandwiches, flavored
   yogurt, and ready-to-eat cereals are not allowed merely because their base is listed.
5. INCLUDE generic cooking condiment products such as ketchup, mayonnaise, soy sauce, and
   bottled salad dressings only when the complete description identifies a cooking ingredient.
   EXCLUDE composite foods described as 'prepared from recipe', 'homemade',
   'home-prepared', or 'home prepared',
   including 'Cheese sauce, prepared from recipe', home-prepared stock, recipe bread, and
   homemade pasta. This exclusion overrides ALL ingredient allowances.
   Never delete a recipe qualifier to turn a prepared food into an ingredient.
   The word 'prepared' alone is not an exclusion: distinguish simple cooking or preparation of
   a single ingredient from a composite recipe. A sauce/dressing name alone is not enough;
   use UNKNOWN if ingredient-product versus recipe-food identity cannot be established.
   Commercial dips/spreads are not automatically sauces: use UNKNOWN unless the complete
   description establishes an explicitly allowed ingredient type.
   Brand exclusion still takes precedence. Do not invent an unspecified product formulation;
   restriction judging must retain that uncertainty. Cooking stock/broth is included when it
   identifies a cooking ingredient; finished soups and homemade composite recipes are excluded.
6. Plain cooking of a single food ingredient does not make it a finished dish. INCLUDE plainly
   poached or boiled eggs and plainly cooked single foods, and REMOVE simple cooking from names.
   Exclude finished meals, side dishes with combined seasonings, soups (except plain stock),
   battered products, snacks/desserts, ready-to-eat breakfast cereal, prepared drinks,
   ordinary drinking alcohol, infant formula, supplements, and other explicit exclusions.
7. INCLUDE identifiable allowed variants such as lactose-reduced cottage cheese.
   Preserve that composition in the name. Do not exclude a food for unfamiliarity or because
   it needs careful restriction judging. Use UNKNOWN only when the source does not establish
   the product type or the distinctions needed to select and name it under the policy.

For INCLUDE, provide the ingredient name. For EXCLUDE or UNKNOWN, use an empty english_name.
Give a brief reason citing the actual source description and the relevant policy boundary.
"""
        + NAMING_INSTRUCTIONS
        + "\nBefore returning, check EACH included row: no brand anywhere, no completed beverage, "
        "no dessert/flavored yogurt or other explicit exclusion, all explicit composition "
        "qualifiers retained in english_name, and fresh/raw/simple cooking removed. "
        "Return rows as an object keyed by the exact decimal source_id strings in the schema. "
        "Each value contains only decision, english_name, and reason. Do not repeat source_id "
        "inside the value. Return every required key exactly once.\nSOURCE_ROWS_JSON:\n"
        + json.dumps(batch, ensure_ascii=False)
    )


def build_grouping_prompt(components: list[dict]) -> str:
    return (
        """Independently partition each supplied component's source IDs into ingredient groups.
A component is a set of possible matches, not a decision that its foods are identical.
Compare every complete source description. Split sources whenever the policy preserves a
difference in base ingredient, part/cut, form, preservation, or explicit composition.
Do not merge ordinary and lactose-reduced cottage cheese, sweetened and unsweetened products,
or foods with different named added ingredients merely because their base name is the same.
Plain cooking alone, such as raw versus poached egg, is not a reason to split the same ingredient.
Recheck complete descriptions for exclusion before grouping. A brand or restaurant anywhere in
the description takes precedence over an allowed base ingredient. Completed brewed tea/coffee
remain excluded even when plain; dry tea/coffee ingredients have a different product identity.
Composite foods marked prepared from recipe, homemade, home-prepared, or home prepared are excluded:
sauces, dressings, stock, bread, and pasta. This overrides all ingredient allowances.
Never strip recipe qualifiers to make these eligible ingredients.
Plain yogurt is allowed, but flavored/sweetened dessert yogurt is excluded. All other policy
exclusions, including isolated proteins and prepared meals/snacks, still apply at this stage.
Do not turn an excluded source into a generic ingredient by deleting its disqualifying feature.
If a source cannot be included and named under the supplied policy, put it in unresolved with
the specific reason. Prior inclusion is not permission to ignore a policy violation.
"""
        + NAMING_INSTRUCTIONS
        + "\nFor each group return the complete source_ids, English name, and a short reason "
        "explaining why the members are the same ingredient. Different groups may have one member. "
        "Every input source ID belongs to exactly one group or unresolved in its own component. "
        "Do not combine component IDs and do not see or infer another agent's answer.\n"
        "COMPONENTS_JSON:\n" + json.dumps(components, ensure_ascii=False)
    )


def clean_name(value: str) -> str:
    value = " ".join(unicodedata.normalize("NFC", value).split())
    for index, character in enumerate(value):
        if character.isalpha():
            return value[:index] + character.upper() + value[index + 1 :]
    return value


def name_key(value: str) -> str:
    return clean_name(value).casefold()


def is_english_name(value) -> bool:
    """라틴 문자 이름을 허용하며 제어 문자와 다른 문자권의 글자는 거절한다."""
    if not isinstance(value, str) or not value.strip():
        return False
    has_letter = False
    for character in value:
        if unicodedata.category(character).startswith("C"):
            return False
        if character.isalpha():
            if not unicodedata.name(character, "").startswith("LATIN "):
                return False
            has_letter = True
    return has_letter


def majority(values: list):
    value, count = Counter(values).most_common(1)[0]
    return value if count >= 2 else None


def _nonblank(value) -> bool:
    return isinstance(value, str) and bool(value.strip())


def selection_schema(source_ids: set[int]) -> dict:
    """원본 ID를 생성할 값이 아니라 반드시 반환할 고정 키로 지정한다."""
    fields = [key for key in ROW_SCHEMA["required"] if key != "source_id"]
    value_schema = {
        "type": "object",
        "properties": {key: ROW_SCHEMA["properties"][key] for key in fields},
        "required": fields,
        "additionalProperties": False,
    }
    keys = [str(source_id) for source_id in sorted(source_ids)]
    return {
        "type": "object",
        "properties": {
            "rows": {
                "type": "object",
                "properties": {key: value_schema for key in keys},
                "required": keys,
                "additionalProperties": False,
            }
        },
        "required": ["rows"],
        "additionalProperties": False,
    }


def decode_selection(payload: dict, source_ids: set[int]) -> list[dict]:
    if not isinstance(payload, dict) or set(payload) != {"rows"}:
        raise ValueError("selection must contain rows keyed by source ID")
    rows = payload["rows"]
    expected_keys = {str(source_id) for source_id in source_ids}
    if not isinstance(rows, dict) or set(rows) != expected_keys:
        raise ValueError(f"selection requires exactly these source keys: {sorted(expected_keys)}")
    decoded = []
    for source_id in sorted(source_ids):
        value = rows[str(source_id)]
        if not isinstance(value, dict) or set(value) != {"decision", "english_name", "reason"}:
            raise ValueError("source-keyed decision has invalid fields")
        decoded.append({"source_id": source_id, **value})
    validate_selection({"rows": decoded}, source_ids)
    return decoded


def validate_selection(payload: dict, source_ids: set[int]) -> None:
    if not isinstance(payload, dict) or set(payload) != {"rows"}:
        raise ValueError("selection must contain rows")
    if not isinstance(payload["rows"], list):
        raise ValueError("rows must be an array")
    seen = set()
    for row in payload["rows"]:
        if not isinstance(row, dict) or set(row) != set(ROW_SCHEMA["required"]):
            raise ValueError("invalid selection fields")
        source_id = row["source_id"]
        if type(source_id) is not int or source_id not in source_ids or source_id in seen:
            raise ValueError(
                f"invalid, unknown or duplicate source ID {source_id!r}; "
                f"required IDs are {sorted(source_ids)}"
            )
        seen.add(source_id)
        if row["decision"] not in DECISIONS or not _nonblank(row["reason"]):
            raise ValueError("invalid decision or missing reason")
        name = row["english_name"]
        if not isinstance(name, str):
            raise ValueError("name must be a string")
        if (row["decision"] == "INCLUDE") != bool(name.strip()):
            raise ValueError("only included foods must have an English name")
        if row["decision"] == "INCLUDE" and not is_english_name(name):
            raise ValueError("ingredient names must use Latin letters without control characters")
    if seen != source_ids:
        raise ValueError(f"selection omitted source IDs {sorted(source_ids - seen)}")


def validate_groups(payload: dict, source_ids: set[int]) -> None:
    if not isinstance(payload, dict) or set(payload) != {"groups", "unresolved"}:
        raise ValueError("group response requires groups and unresolved")
    if not isinstance(payload["groups"], list) or not isinstance(payload["unresolved"], list):
        raise ValueError("groups and unresolved must be arrays")
    members = []
    names = set()
    for group in payload["groups"]:
        if set(group) != {"source_ids", "english_name", "reason"}:
            raise ValueError("invalid group fields")
        ids = group["source_ids"]
        if not isinstance(ids, list) or not ids or any(type(i) is not int for i in ids):
            raise ValueError("group must have integer source IDs")
        if not is_english_name(group["english_name"]) or not _nonblank(group["reason"]):
            raise ValueError("group needs a name and reason")
        key = name_key(group["english_name"])
        if key in names:
            raise ValueError("different groups cannot have the same name")
        names.add(key)
        members.extend(ids)
    for row in payload["unresolved"]:
        if set(row) != {"source_id", "reason"} or not _nonblank(row["reason"]):
            raise ValueError("invalid unresolved row")
        if type(row["source_id"]) is not int:
            raise ValueError("unresolved source ID must be an integer")
        members.append(row["source_id"])
    if len(members) != len(set(members)) or set(members) != source_ids:
        raise ValueError("groups must partition all source IDs exactly once")


def reconcile_rows(source_rows: list[dict], responses: dict[str, list[dict]]) -> tuple:
    source_ids = {row["source_id"] for row in source_rows}
    if set(responses) != set(AGENTS):
        raise ValueError("all three agents are required")
    for rows in responses.values():
        validate_selection({"rows": rows}, source_ids)
    indexed = {agent: {row["source_id"]: row for row in rows} for agent, rows in responses.items()}
    included, excluded, unresolved, review = [], [], [], []
    for source_id in sorted(source_ids):
        votes = {agent: indexed[agent][source_id] for agent in AGENTS}
        decision = majority([row["decision"] for row in votes.values()])
        record = {"source_id": source_id, "decision": decision or "UNKNOWN", "votes": votes}
        if decision == "INCLUDE":
            named = [row for row in votes.values() if row["decision"] == "INCLUDE"]
            key = majority([name_key(row["english_name"]) for row in named])
            if key is not None:
                name = sorted(
                    clean_name(row["english_name"])
                    for row in named
                    if name_key(row["english_name"]) == key
                )[0]
                included.append({"source_id": source_id, "english_name": name})
                record["english_name"] = name
            else:
                unresolved.append({"source_id": source_id, "reason": "English names disagree"})
                record["decision"] = "UNKNOWN"
        elif decision == "EXCLUDE":
            excluded.append({"source_id": source_id, "reason": "Excluded by majority"})
        else:
            unresolved.append({"source_id": source_id, "reason": "No inclusion majority"})
        review.append(record)
    return included, excluded, unresolved, review, indexed


def _components(included: list[dict], indexed: dict) -> list[list[int]]:
    """세 응답 어디서든 같은 이름을 제안한 원본을 한 검토 묶음으로 모은다."""
    links = {row["source_id"]: row["source_id"] for row in included}

    def find(source_id):
        while links[source_id] != source_id:
            links[source_id] = links[links[source_id]]
            source_id = links[source_id]
        return source_id

    names = {}
    for source_id in links:
        for agent in AGENTS:
            vote = indexed[agent][source_id]
            if vote["decision"] != "INCLUDE":
                continue
            key = name_key(vote["english_name"])
            if key in names:
                links[find(source_id)] = find(names[key])
            else:
                names[key] = source_id
    components = defaultdict(list)
    for source_id in links:
        components[find(source_id)].append(source_id)
    return sorted((sorted(ids) for ids in components.values()), key=lambda ids: ids[0])


def _initial_groups(ids: list[int], indexed: dict) -> dict[str, dict]:
    result = {}
    for agent in AGENTS:
        groups = defaultdict(list)
        unresolved = []
        for source_id in ids:
            vote = indexed[agent][source_id]
            if vote["decision"] == "INCLUDE":
                groups[name_key(vote["english_name"])].append(vote)
            else:
                unresolved.append({"source_id": source_id, "reason": vote["reason"]})
        result[agent] = {
            "groups": [
                {
                    "source_ids": sorted(row["source_id"] for row in rows),
                    "english_name": clean_name(rows[0]["english_name"]),
                    "reason": "Shared name in independent source decisions",
                }
                for rows in groups.values()
            ],
            "unresolved": unresolved,
        }
    return result


def reconcile_groups(responses: dict[str, dict], source_ids: set[int]) -> tuple[list, list]:
    if set(responses) != set(AGENTS):
        raise ValueError("all three group responses are required")
    counts = Counter()
    examples = {}
    for response in responses.values():
        validate_groups(response, source_ids)
        for group in response["groups"]:
            key = (name_key(group["english_name"]), tuple(sorted(group["source_ids"])))
            counts[key] += 1
            examples.setdefault(key, group)
    groups = []
    covered = set()
    for key, count in sorted(counts.items()):
        if count >= 2:
            if covered.intersection(key[1]):
                raise ValueError("majority groups overlap")
            groups.append(
                {
                    "english_name": clean_name(examples[key]["english_name"]),
                    "source_ids": list(key[1]),
                }
            )
            covered.update(key[1])
    unresolved = [
        {"source_id": source_id, "reason": "No matching name and member-set majority"}
        for source_id in sorted(source_ids - covered)
    ]
    return groups, unresolved


def _finish(groups: list, unresolved: list) -> tuple[list, list]:
    name_counts = Counter(name_key(group["english_name"]) for group in groups)
    accepted, pending = [], list(unresolved)
    for group in groups:
        if name_counts[name_key(group["english_name"])] != 1:
            pending.extend(
                {"source_id": source_id, "reason": "Name collision across reviewed groups"}
                for source_id in group["source_ids"]
            )
        else:
            accepted.append(group)
    accepted.sort(key=lambda group: (name_key(group["english_name"]), group["english_name"]))
    return (
        [{"id": index, **group} for index, group in enumerate(accepted, 1)],
        sorted(pending, key=lambda row: row["source_id"]),
    )


def validate_selected(selected: dict) -> None:
    """저장된 세 표로 선정 결과를 다시 계산하고 전체 원본의 처리를 확인한다."""
    sources = selected["sources"]
    source_ids = {row["source_id"] for row in sources}
    if len(source_ids) != len(sources):
        raise ValueError("duplicate source ID")
    records = selected["selection_review"]
    if len(records) != len(sources) or {row["source_id"] for row in records} != source_ids:
        raise ValueError("selection review must cover all source rows")
    responses = {agent: [] for agent in AGENTS}
    for record in records:
        if set(record["votes"]) != set(AGENTS):
            raise ValueError("selection requires three votes")
        for agent in AGENTS:
            vote = record["votes"][agent]
            if vote["source_id"] != record["source_id"]:
                raise ValueError("selection vote has wrong source ID")
            responses[agent].append(vote)
    included, excluded, pending, computed, indexed = reconcile_rows(sources, responses)
    if sorted(records, key=lambda row: row["source_id"]) != computed:
        raise ValueError("recorded selection differs from its votes")
    expected = {tuple(ids) for ids in _components(included, indexed)}
    grouping_review = selected["grouping_review"]
    if len(grouping_review) != len(expected):
        raise ValueError("grouping review is incomplete")
    groups, seen = [], set()
    for record in grouping_review:
        ids = record["source_ids"]
        key = tuple(sorted(ids))
        if len(ids) != len(set(ids)) or key not in expected or key in seen:
            raise ValueError("unexpected or duplicate grouping component")
        seen.add(key)
        if len(ids) == 1:
            if record.get("method") != "source_name" or record["votes"] != _initial_groups(
                ids, indexed
            ):
                raise ValueError("singleton must retain source name votes")
        elif record.get("method") != "group_review":
            raise ValueError("merged ingredients require explicit member-set review")
        decided, unresolved = reconcile_groups(record["votes"], set(ids))
        groups.extend(decided)
        pending.extend(unresolved)
    ingredients, unresolved = _finish(groups, pending)
    if selected["ingredients"] != ingredients or selected["excluded"] != excluded:
        raise ValueError("selected ingredients or exclusions differ from votes")
    if selected["unresolved"] != unresolved:
        raise ValueError("unresolved sources differ from votes")
    final_ids = [i for item in ingredients for i in item["source_ids"]]
    final_ids += [row["source_id"] for row in excluded + unresolved]
    if len(final_ids) != len(set(final_ids)) or set(final_ids) != source_ids:
        raise ValueError("each source must be included, excluded or unresolved exactly once")


def _collect_selection_votes(rows, *, pool, call_agent, batch_size, max_batches):
    batches = [rows[start : start + batch_size] for start in range(0, len(rows), batch_size)]
    limit = len(batches) if max_batches is None else max(0, min(max_batches, len(batches)))
    votes = {number: {} for number in range(1, limit + 1)}

    def requests():
        for number, batch in enumerate(batches[:limit], 1):
            ids = {row["source_id"] for row in batch}
            prompt, schema = build_prompt(batch), selection_schema(ids)
            for agent in AGENTS:
                yield number, agent, ids, prompt, schema

    remaining = iter(requests())
    pending = {}

    def submit_next():
        request = next(remaining, None)
        if request is None:
            return
        number, agent, ids, prompt, schema = request
        future = pool.submit(
            call_agent,
            agent,
            f"selection/batch-{number:04d}",
            prompt,
            schema,
            lambda payload, expected=ids: decode_selection(payload, expected),
        )
        pending[future] = number, agent, ids

    completed_rows = 0
    try:
        for _ in AGENTS:
            submit_next()
        while pending:
            completed, _ = wait(pending, return_when=FIRST_COMPLETED)
            for future in completed:
                number, agent, ids = pending.pop(future)
                votes[number][agent] = decode_selection(future.result(), ids)
                if len(votes[number]) == len(AGENTS):
                    completed_rows += len(batches[number - 1])
                    print(f"selection {completed_rows}/{len(rows)}", flush=True)
            for _ in completed:
                submit_next()
    except BaseException:
        for future in pending:
            future.cancel()
        raise
    if limit < len(batches):
        return None
    return {
        agent: [row for number in sorted(votes) for row in votes[number][agent]] for agent in AGENTS
    }


def run(
    source: dict,
    work_dir: Path,
    *,
    call_agent,
    batch_size: int = 40,
    max_batches: int | None = None,
) -> dict | None:
    if batch_size < 1 or batch_size > 50:
        raise ValueError("selection batch size must be between 1 and 50")
    rows = source["rows"]
    with ThreadPoolExecutor(max_workers=3) as pool:
        all_votes = _collect_selection_votes(
            rows,
            pool=pool,
            call_agent=call_agent,
            batch_size=batch_size,
            max_batches=max_batches,
        )
        if all_votes is None:
            return None
        included, excluded, unresolved, review, indexed = reconcile_rows(rows, all_votes)
        sources_by_id = {row["source_id"]: row for row in rows}
        groups, grouping_review, pending_groups = [], [], []
        for group_no, ids in enumerate(_components(included, indexed), 1):
            responses = _initial_groups(ids, indexed)
            decided, pending = reconcile_groups(responses, set(ids))
            if len(ids) > 1:
                pending_groups.append({"component_id": group_no, "source_ids": ids})
            else:
                groups.extend(decided)
                unresolved.extend(pending)
                grouping_review.append(
                    {"source_ids": ids, "votes": responses, "method": "source_name"}
                )
        for batch_no, start in enumerate(range(0, len(pending_groups), 20), 1):
            batch = pending_groups[start : start + 20]
            expected = {item["component_id"]: set(item["source_ids"]) for item in batch}
            allowed_ids = sorted(set().union(*expected.values()))
            component_schema = deepcopy(GROUP_SCHEMA)
            component_schema["properties"]["component_id"] = {
                "type": "integer",
                "enum": sorted(expected),
            }
            component_schema["required"].append("component_id")
            component_schema["properties"]["groups"]["items"]["properties"]["source_ids"]["items"][
                "enum"
            ] = allowed_ids
            component_schema["properties"]["unresolved"]["items"]["properties"]["source_id"][
                "enum"
            ] = allowed_ids
            batch_schema = {
                "type": "object",
                "properties": {"components": {"type": "array", "items": component_schema}},
                "required": ["components"],
                "additionalProperties": False,
            }

            def validate_batch(payload, expected=expected):
                if not isinstance(payload, dict) or set(payload) != {"components"}:
                    raise ValueError("group batch must contain components")
                if not isinstance(payload["components"], list):
                    raise ValueError("components must be an array")
                seen = set()
                for item in payload["components"]:
                    component_id = item.get("component_id")
                    if type(component_id) is not int or component_id not in expected:
                        raise ValueError("unknown component ID")
                    if component_id in seen:
                        raise ValueError("duplicate component ID")
                    seen.add(component_id)
                    validate_groups(
                        {key: value for key, value in item.items() if key != "component_id"},
                        expected[component_id],
                    )
                if seen != set(expected):
                    raise ValueError("missing component")

            prompt = build_grouping_prompt(
                [
                    {
                        "component_id": item["component_id"],
                        "sources": [sources_by_id[i] for i in item["source_ids"]],
                    }
                    for item in batch
                ]
            )
            tasks = {
                agent: pool.submit(
                    call_agent,
                    agent,
                    f"grouping/batch-{batch_no:04d}",
                    prompt,
                    batch_schema,
                    validate_batch,
                )
                for agent in AGENTS
            }
            responses = {
                agent: {
                    item["component_id"]: {
                        key: value for key, value in item.items() if key != "component_id"
                    }
                    for item in future.result()["components"]
                }
                for agent, future in tasks.items()
            }
            for component in batch:
                component_id, ids = component["component_id"], component["source_ids"]
                votes = {agent: responses[agent][component_id] for agent in AGENTS}
                decided, pending = reconcile_groups(votes, set(ids))
                groups.extend(decided)
                unresolved.extend(pending)
                grouping_review.append(
                    {"source_ids": ids, "votes": votes, "method": "group_review"}
                )
            print(
                f"grouping {min(start + 20, len(pending_groups))}/{len(pending_groups)}", flush=True
            )
    ingredients, unresolved = _finish(groups, unresolved)
    result = {
        "metadata": source["metadata"],
        "sources": rows,
        "ingredients": ingredients,
        "excluded": excluded,
        "unresolved": unresolved,
        "selection_review": review,
        "grouping_review": grouping_review,
    }
    validate_selected(result)
    write_json(work_dir / "selected.json", result)
    return result
