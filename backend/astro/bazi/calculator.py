import math
from datetime import date, timedelta
from .data import (STEMS, BRANCHES, HIDDEN_STEMS, ELEMENT_OF_STEM,
                   MONTH1_STEM, ZI_STEM, PRODUCES, CONTROLS, JIEQI,
                   ANIMAL_EMOJIS, DAY_MASTERS, TEN_GODS, ORGAN_MAP)
from .solar_time import clock_to_solar


def _day_of_year(year: int, month: int, day: int) -> int:
    return (date(year, month, day) - date(year, 1, 1)).days + 1


def _julian_day(year: int, month: int, day: int) -> int:
    a = (14 - month) // 12
    y = year + 4800 - a
    m = month + 12 * a - 3
    return day + (153 * m + 2) // 5 + 365 * y + y // 4 - y // 100 + y // 400 - 32045


def _day_pillar(year: int, month: int, day: int):
    jdn = _julian_day(year, month, day)
    return (jdn + 9) % 10, (jdn + 1) % 12


def _solar_month(greg_month: int, greg_day: int) -> int:
    """Return Chinese solar month index 1-12 based on Jie Qi approximation."""
    for i in range(11, -1, -1):
        jq_month, jq_day = JIEQI[i]
        if i == 11:  # Xiao Han in January next year
            if greg_month == 1 and greg_day >= jq_day:
                return 12
        elif greg_month > jq_month or (greg_month == jq_month and greg_day >= jq_day):
            return i + 1
    return 12  # before Li Chun, still month 12 of previous year


def _year_pillar(year: int, month: int, day: int):
    # Before Li Chun (~Feb 4) -> previous year
    if month < 2 or (month == 2 and day < 4):
        year -= 1
    stem = (year - 4) % 10
    branch = (year - 4) % 12
    return stem, branch


def _month_pillar(year_stem: int, solar_month: int):
    m1 = MONTH1_STEM[year_stem]
    stem = (m1 + solar_month - 1) % 10
    branch = (solar_month + 1) % 12
    return stem, branch


def _hour_pillar(day_stem: int, hour_branch: int):
    zi = ZI_STEM[day_stem]
    stem = (zi + hour_branch) % 10
    return stem, hour_branch


def _hour_branch(solar_hour: float) -> int:
    h = solar_hour % 24
    if h >= 23 or h < 1:
        return 0
    return int((h + 1) / 2)


def _build_pillar(stem_idx: int, branch_idx: int) -> dict:
    s = STEMS[stem_idx]
    b = BRANCHES[branch_idx]
    return {
        "stem": {
            "chinese": s["chinese"],
            "pinyin": s["pinyin"],
            "element": s["element"],
            "element_base": s["element_base"],
            "polarity": s["polarity"],
            "index": stem_idx,
        },
        "branch": {
            "chinese": b["chinese"],
            "pinyin": b["pinyin"],
            "animal": b["animal"],
            "animal_es": b["animal_es"],
            "element_base": b["element_base"],
            "emoji": ANIMAL_EMOJIS.get(b["animal"], ""),
            "index": branch_idx,
        },
    }


def _ten_god(dm_stem: int, other_stem: int) -> str:
    dm_el = ELEMENT_OF_STEM[dm_stem]
    ot_el = ELEMENT_OF_STEM[other_stem]
    dm_pol = dm_stem % 2  # 0=yang, 1=yin
    ot_pol = other_stem % 2
    same_pol = (dm_pol == ot_pol)

    if dm_el == ot_el:
        return "friend" if same_pol else "rob"
    if PRODUCES[dm_el] == ot_el:
        return "eating" if same_pol else "hurting"
    if CONTROLS[dm_el] == ot_el:
        return "i_wealth" if same_pol else "d_wealth"
    if CONTROLS[ot_el] == dm_el:
        return "7_killings" if same_pol else "d_officer"
    if PRODUCES[ot_el] == dm_el:
        return "i_resource" if same_pol else "d_resource"
    return "unknown"


def _element_balance(pillars: dict, dm_stem: int) -> dict:
    scores = {"Wood": 0.0, "Fire": 0.0, "Earth": 0.0, "Metal": 0.0, "Water": 0.0}

    for pillar_name in ["year", "month", "day", "hour"]:
        p = pillars[pillar_name]
        stem_el = p["stem"]["element_base"]
        scores[stem_el] += 1.0
        branch_idx = p["branch"]["index"]
        for (s_idx, weight) in HIDDEN_STEMS[branch_idx]:
            scores[ELEMENT_OF_STEM[s_idx]] += weight

    total = sum(scores.values()) or 1
    result = {}
    for el, score in scores.items():
        pct = score / total * 100
        if pct == 0:
            status = "absent"
        elif pct < 10:
            status = "weak"
        elif pct < 20:
            status = "moderate"
        elif pct < 30:
            status = "balanced"
        elif pct < 40:
            status = "strong"
        else:
            status = "dominant"
        result[el.lower()] = {"score": round(score, 2), "percentage": round(pct, 1), "status": status}
    return result


def _hidden_stems_response(pillars: dict) -> dict:
    out = {}
    for pillar_name in ["year", "month", "day", "hour"]:
        branch_idx = pillars[pillar_name]["branch"]["index"]
        stems_list = []
        for (s_idx, weight) in HIDDEN_STEMS[branch_idx]:
            s = STEMS[s_idx]
            stems_list.append({
                "chinese": s["chinese"], "pinyin": s["pinyin"],
                "element": s["element"], "weight": weight,
            })
        out[pillar_name] = stems_list
    return out


def _ten_gods_list(pillars: dict, dm_stem: int) -> list:
    result = []
    for pillar_name in ["year", "month", "hour"]:
        p = pillars[pillar_name]
        stem_idx = p["stem"]["index"]
        god_key = _ten_god(dm_stem, stem_idx)
        god = TEN_GODS.get(god_key, {"cn": "?", "name": god_key, "desc": ""})
        result.append({
            "pillar": pillar_name,
            "stem_chinese": p["stem"]["chinese"],
            "stem_pinyin": p["stem"]["pinyin"],
            "god_key": god_key,
            "god_cn": god["cn"],
            "god_name": god["name"],
            "god_desc": god["desc"],
        })
        # Hidden stems gods
        branch_idx = p["branch"]["index"]
        for (s_idx, weight) in HIDDEN_STEMS[branch_idx]:
            gk = _ten_god(dm_stem, s_idx)
            g = TEN_GODS.get(gk, {"cn": "?", "name": gk, "desc": ""})
            result.append({
                "pillar": f"{pillar_name}_hidden",
                "stem_chinese": STEMS[s_idx]["chinese"],
                "stem_pinyin": STEMS[s_idx]["pinyin"],
                "god_key": gk,
                "god_cn": g["cn"],
                "god_name": g["name"],
                "god_desc": g["desc"],
                "weight": weight,
            })
    return result


def _animal_relationships(pillars: dict) -> dict:
    branches = [pillars[p]["branch"]["index"] for p in ["year", "month", "day", "hour"]]
    branch_names = [pillars[p]["branch"]["animal"] for p in ["year", "month", "day", "hour"]]

    SIX_HARMONIES = {(0,1):"Earth",(2,11):"Wood",(3,10):"Fire",(4,9):"Metal",(5,8):"Water",(6,7):"Fire"}
    CLASHES = [(0,6),(1,7),(2,8),(3,9),(4,10),(5,11)]
    HARMS = [(0,7),(1,6),(2,5),(3,4),(8,11),(9,10)]
    SELF_PUNISH = [0, 6, 9, 11]
    THREE_PUNISH = [(2,5,8),(1,10,7)]

    combinations, clashes, punishments, harms = [], [], [], []
    pillar_names = ["year", "month", "day", "hour"]

    for i in range(4):
        for j in range(i+1, 4):
            pair = tuple(sorted([branches[i], branches[j]]))
            if pair in SIX_HARMONIES:
                combinations.append({
                    "type": "Six Harmony (六合)",
                    "pillars": [pillar_names[i], pillar_names[j]],
                    "animals": [branch_names[i], branch_names[j]],
                    "result_element": SIX_HARMONIES[pair],
                })
            if pair in CLASHES or (pair[1], pair[0]) in CLASHES:
                clashes.append({
                    "type": "Six Clash (六冲)",
                    "pillars": [pillar_names[i], pillar_names[j]],
                    "animals": [branch_names[i], branch_names[j]],
                })
            hp = tuple(sorted([branches[i], branches[j]]))
            if hp in HARMS or (hp[1], hp[0]) in HARMS:
                harms.append({
                    "type": "Harm (六害)",
                    "pillars": [pillar_names[i], pillar_names[j]],
                    "animals": [branch_names[i], branch_names[j]],
                })

    for idx, sp in enumerate(SELF_PUNISH):
        if branches.count(sp) >= 2:
            involved = [pillar_names[i] for i, b in enumerate(branches) if b == sp]
            punishments.append({
                "type": "Self Punishment (自刑)",
                "pillars": involved[:2],
                "animals": [branch_names[branches.index(sp)]],
            })

    for group in THREE_PUNISH:
        if all(b in branches for b in group):
            involved = [pillar_names[branches.index(b)] for b in group]
            punishments.append({
                "type": "Three Punishment (三刑)",
                "pillars": involved,
                "animals": [BRANCHES[b]["animal"] for b in group],
            })

    return {"combinations": combinations, "clashes": clashes, "punishments": punishments, "harms": harms}


def _symbolic_stars(pillars: dict, dm_stem: int) -> list:
    day_branch = pillars["day"]["branch"]["index"]
    stars = []

    PEACH = {(2,6,10): 3, (11,3,7): 0, (5,9,1): 6, (8,0,4): 9}
    for group, star_branch in PEACH.items():
        if day_branch in group:
            stars.append({
                "name": "Peach Blossom (桃花)",
                "description": "Carisma, atracción romántica y popularidad social.",
                "branch_chinese": BRANCHES[star_branch]["chinese"],
                "branch_animal": BRANCHES[star_branch]["animal"],
                "present_in": [p for p in ["year","month","hour"] if pillars[p]["branch"]["index"] == star_branch],
            })

    TRAVEL = {(2,6,10): 8, (11,3,7): 5, (5,9,1): 11, (8,0,4): 2}
    for group, star_branch in TRAVEL.items():
        if day_branch in group:
            stars.append({
                "name": "Travel Horse (驿马)",
                "description": "Movilidad, viajes, cambios y dinamismo. Energía errante.",
                "branch_chinese": BRANCHES[star_branch]["chinese"],
                "branch_animal": BRANCHES[star_branch]["animal"],
                "present_in": [p for p in ["year","month","hour"] if pillars[p]["branch"]["index"] == star_branch],
            })

    NOBLE = {
        (0,4): [1,7], (1,5): [0,8], (2,3): [11,9], (6,7): [2,6], (8,9): [5,3]
    }
    for stems_group, noble_branches in NOBLE.items():
        if dm_stem in stems_group:
            for nb in noble_branches:
                present = [p for p in ["year","month","day","hour"] if pillars[p]["branch"]["index"] == nb]
                if present:
                    stars.append({
                        "name": "Heavenly Noble (天乙贵人)",
                        "description": "Protección divina, ayuda inesperada en momentos difíciles.",
                        "branch_chinese": BRANCHES[nb]["chinese"],
                        "branch_animal": BRANCHES[nb]["animal"],
                        "present_in": present,
                    })

    return stars


def _luck_cycles(birth_date_str: str, gender: str, month_stem: int, month_branch: int, year_stem: int) -> list:
    birth = date.fromisoformat(birth_date_str)
    year_yang = (year_stem % 2 == 0)
    male = (gender.lower() in ["male", "masculino", "m"])
    forward = (male and year_yang) or (not male and not year_yang)

    # Find next/prev Jie Qi
    jq_month, jq_day = JIEQI[(month_branch - 2) % 12]  # current month's Jie Qi
    if jq_month == 1:
        jq_year = birth.year + 1
    else:
        jq_year = birth.year

    try:
        jq_date = date(jq_year, jq_month, jq_day)
    except ValueError:
        jq_date = date(jq_year, jq_month, min(jq_day, 28))

    if forward:
        # Find next Jie Qi after birth
        next_jq_idx = (month_branch - 2 + 1) % 12
        nj_month, nj_day = JIEQI[next_jq_idx]
        nj_year = birth.year if (nj_month > birth.month or (nj_month == birth.month and nj_day > birth.day)) else birth.year + 1
        try:
            ref_date = date(nj_year, nj_month, nj_day)
        except ValueError:
            ref_date = date(nj_year, nj_month, min(nj_day, 28))
        days_to_jq = (ref_date - birth).days
    else:
        # Find previous Jie Qi before birth
        prev_jq_idx = (month_branch - 2 - 1) % 12
        pj_month, pj_day = JIEQI[prev_jq_idx]
        pj_year = birth.year if (pj_month < birth.month or (pj_month == birth.month and pj_day <= birth.day)) else birth.year - 1
        try:
            ref_date = date(pj_year, pj_month, pj_day)
        except ValueError:
            ref_date = date(pj_year, pj_month, min(pj_day, 28))
        days_to_jq = (birth - ref_date).days

    start_age = round(days_to_jq / 3)

    cycles = []
    for i in range(8):
        if forward:
            s = (month_stem + i + 1) % 10
            b = (month_branch + i + 1) % 12
        else:
            s = (month_stem - i - 1) % 10
            b = (month_branch - i - 1) % 12

        age_start = start_age + i * 10
        age_end = age_start + 9
        stem_data = STEMS[s]
        branch_data = BRANCHES[b]
        cycles.append({
            "cycle_number": i + 1,
            "age_start": age_start,
            "age_end": age_end,
            "stem": {"chinese": stem_data["chinese"], "pinyin": stem_data["pinyin"], "element": stem_data["element"]},
            "branch": {"chinese": branch_data["chinese"], "pinyin": branch_data["pinyin"],
                       "animal": branch_data["animal"], "animal_es": branch_data["animal_es"],
                       "emoji": ANIMAL_EMOJIS.get(branch_data["animal"], "")},
            "pillar_display": stem_data["chinese"] + branch_data["chinese"],
        })
    return cycles


def _current_year_pillar(year: int) -> dict:
    y_stem, y_branch = _year_pillar(year, 6, 1)  # mid-year safe
    months = []
    for i in range(12):
        ms = (MONTH1_STEM[y_stem] + i) % 10
        mb = (i + 2) % 12
        months.append({
            "month_number": i + 1,
            "pillar_display": STEMS[ms]["chinese"] + BRANCHES[mb]["chinese"],
            "stem": STEMS[ms]["pinyin"],
            "branch": BRANCHES[mb]["pinyin"],
            "animal": BRANCHES[mb]["animal"],
        })
    return {
        "year": year,
        "pillar": STEMS[y_stem]["chinese"] + BRANCHES[y_branch]["chinese"],
        "stem": STEMS[y_stem],
        "branch": BRANCHES[y_branch],
        "months": months,
    }


def _organ_health(element_balance: dict) -> dict:
    result = {}
    for el_lower, data in element_balance.items():
        el = el_lower.capitalize()
        organ_info = ORGAN_MAP.get(el, {})
        result[el_lower] = {
            **organ_info,
            "score": data["score"],
            "percentage": data["percentage"],
            "status": data["status"],
        }
    return result


def _recommendations(element_balance: dict, dm_stem: int) -> dict:
    # Find weakest and strongest elements
    sorted_els = sorted(element_balance.items(), key=lambda x: x[1]["score"])
    weakest = sorted_els[0][0].capitalize() if sorted_els else "Metal"
    strongest = sorted_els[-1][0].capitalize() if sorted_els else "Wood"

    dm_el = ELEMENT_OF_STEM[dm_stem]
    # What produces DM (resource)
    resource_el = next(k for k, v in PRODUCES.items() if v == dm_el)

    weak_organ = ORGAN_MAP.get(weakest, {})
    return {
        "priority_element": weakest,
        "strengthen_with": weak_organ.get("foods", []),
        "healing_sound": weak_organ.get("healing_sound", ""),
        "favorable_colors": [ORGAN_MAP.get(weakest, {}).get("color", ""), ORGAN_MAP.get(resource_el, {}).get("color", "")],
        "favorable_direction": weak_organ.get("direction", ""),
        "avoid_element": strongest,
        "summary": f"Tu elemento más débil es {weakest}. Nutre el {weakest} con los alimentos recomendados y practica el sonido curativo {weak_organ.get('healing_sound','')}. Tu Day Master ({STEMS[dm_stem]['element']}) se fortalece con el elemento {resource_el}.",
    }


def calculate_bazi(
    birth_date: str,
    birth_time: str,
    latitude: float,
    longitude: float,
    timezone_offset: float,
    gender: str,
) -> dict:
    from datetime import date as dt_date

    birth = dt_date.fromisoformat(birth_date)
    clock_h, clock_m = map(int, birth_time.split(":"))
    doy = _day_of_year(birth.year, birth.month, birth.day)

    solar_h, day_shift, total_corr = clock_to_solar(clock_h, clock_m, longitude, timezone_offset, doy)

    # Apply day shift
    calc_date = birth + timedelta(days=day_shift)
    # Early Zi rule: if solar_h >= 23 and day_shift == 0, treat as next day
    if solar_h >= 23 and day_shift == 0:
        calc_date = birth + timedelta(days=1)

    hour_branch_idx = _hour_branch(solar_h)

    y_stem, y_branch = _year_pillar(calc_date.year, calc_date.month, calc_date.day)
    sol_month = _solar_month(calc_date.month, calc_date.day)
    m_stem, m_branch = _month_pillar(y_stem, sol_month)
    d_stem, d_branch = _day_pillar(calc_date.year, calc_date.month, calc_date.day)
    h_stem, h_branch = _hour_pillar(d_stem, hour_branch_idx)

    pillars = {
        "year":  _build_pillar(y_stem, y_branch),
        "month": _build_pillar(m_stem, m_branch),
        "day":   _build_pillar(d_stem, d_branch),
        "hour":  _build_pillar(h_stem, h_branch),
    }

    dm_info = DAY_MASTERS.get(d_stem, {})
    day_master = {
        "chinese": STEMS[d_stem]["chinese"],
        "pinyin": STEMS[d_stem]["pinyin"],
        "element": STEMS[d_stem]["element"],
        "index": d_stem,
        **dm_info,
    }

    el_balance = _element_balance(pillars, d_stem)
    hidden = _hidden_stems_response(pillars)
    ten_gods = _ten_gods_list(pillars, d_stem)
    animal_rels = _animal_relationships(pillars)
    sym_stars = _symbolic_stars(pillars, d_stem)
    luck = _luck_cycles(birth_date, gender, m_stem, m_branch, y_stem)
    current_yr = _current_year_pillar(dt_date.today().year)
    organs = _organ_health(el_balance)
    recs = _recommendations(el_balance, d_stem)

    solar_h_int = int(solar_h)
    solar_m_int = int((solar_h - solar_h_int) * 60)

    return {
        "solar_time": {
            "clock_time": birth_time,
            "solar_time": f"{solar_h_int:02d}:{solar_m_int:02d}",
            "total_correction_min": round(total_corr, 1),
            "solar_day_shift": day_shift,
        },
        "four_pillars": pillars,
        "day_master": day_master,
        "element_balance": el_balance,
        "ten_gods": ten_gods,
        "hidden_stems": hidden,
        "animal_relationships": animal_rels,
        "symbolic_stars": sym_stars,
        "luck_cycles": luck,
        "current_year": current_yr,
        "organ_health": organs,
        "recommendations": recs,
    }
