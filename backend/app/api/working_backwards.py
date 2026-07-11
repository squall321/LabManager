from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta
from pydantic import BaseModel
from ..core.database import get_db
from ..models.user import User
from ..models.survey import BirkmanReport
from ..models.workcraft import WorkFriction, GrowthMission
from ..models.reflection import CollabReflection
from ..models.working_backwards import (
    WBProject, WBPersona, WBScenario, WBPainCluster, WBPRFAQ, WBFeature, WBValidation,
)
from ..schemas.working_backwards import (
    WBProjectCreate, WBProjectUpdate, WBProjectResponse,
    WBPersonaCreate, WBPersonaUpdate, WBPersonaResponse, WBScenarioIn,
    WBPainCreate, WBPainResponse, WBPRFAQIn, WBPRFAQResponse,
    WBFeatureCreate, WBFeatureUpdate, WBFeatureResponse,
    WBValidationIn, WBValidationResponse, PersonaCandidate,
)
from ..services import wb_data, wb_persona, wb_templates, wb_export, wb_prompts, wb_apply
from ..services.pulse_data import recent_weeks
from .deps import get_current_user

router = APIRouter(prefix="/wb", tags=["Working Backwards"])


# ─────────────── 메타 / 페르소나 후보 ───────────────
@router.get("/meta")
def meta(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return wb_data.meta(db)


@router.get("/persona-candidates", response_model=List[PersonaCandidate])
def persona_candidates(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """공개된 협업 스타일 리포트 = 실제 동료 페르소나 후보."""
    reports = db.query(BirkmanReport).filter(BirkmanReport.is_public == True).all()
    users = {u.id: u for u in db.query(User).all()}
    return wb_persona.candidates_from_reports(reports, users)


# ─────────────── 프로젝트 CRUD ───────────────
@router.get("/projects", response_model=List[WBProjectResponse])
def list_projects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(WBProject).filter(WBProject.user_id == current_user.id)
        .order_by(WBProject.created_at.desc()).all()
    )


@router.post("/projects", response_model=WBProjectResponse)
def create_project(data: WBProjectCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = WBProject(user_id=current_user.id, **data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.post("/projects/from-mission/{mission_id}", response_model=WBProjectResponse)
def create_from_mission(mission_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """WorkCraft 미션 승격 → WB 프로젝트 seed."""
    m = db.query(GrowthMission).filter(
        GrowthMission.id == mission_id, GrowthMission.user_id == current_user.id
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="미션을 찾을 수 없습니다")
    p = WBProject(
        user_id=current_user.id, name=m.title, one_liner=m.goal or "",
        current_problem=m.problem or "", expected_benefit=m.output or "",
        success_criteria=m.success_criteria or "", origin_mission_id=m.id,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def _get_project(pid: int, user: User, db: Session) -> WBProject:
    p = db.query(WBProject).filter(WBProject.id == pid, WBProject.user_id == user.id).first()
    if not p:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다")
    return p


@router.get("/projects/{pid}", response_model=WBProjectResponse)
def get_project(pid: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _get_project(pid, current_user, db)


@router.put("/projects/{pid}", response_model=WBProjectResponse)
def update_project(pid: int, data: WBProjectUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = _get_project(pid, current_user, db)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/projects/{pid}")
def delete_project(pid: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = _get_project(pid, current_user, db)
    db.delete(p)
    db.commit()
    return {"deleted": pid}


# ─────────────── 페르소나 ───────────────
@router.get("/projects/{pid}/personas", response_model=List[WBPersonaResponse])
def list_personas(pid: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_project(pid, current_user, db)
    return db.query(WBPersona).filter(WBPersona.project_id == pid).order_by(WBPersona.id).all()


@router.post("/projects/{pid}/personas", response_model=WBPersonaResponse)
def add_persona(pid: int, data: WBPersonaCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_project(pid, current_user, db)
    payload = data.model_dump()
    # 실제 동료(공개 리포트) 기반이면 스타일 기본값 자동 채움
    if data.source_user_id:
        rep = db.query(BirkmanReport).filter(
            BirkmanReport.user_id == data.source_user_id, BirkmanReport.is_public == True
        ).first()
        u = db.query(User).filter(User.id == data.source_user_id).first()
        if not rep or not u:
            raise HTTPException(status_code=400, detail="공개된 협업 스타일 리포트가 있는 동료만 페르소나로 쓸 수 있어요")
        auto = wb_persona.build_persona_from_report(rep, u, data.role)
        for key in ("name", "style_code", "goals", "fears", "comm_style"):
            if not payload.get(key):
                payload[key] = auto.get(key, "")
    persona = WBPersona(project_id=pid, **payload)
    db.add(persona)
    db.commit()
    db.refresh(persona)
    return persona


def _get_persona(pid: int, persona_id: int, user: User, db: Session) -> WBPersona:
    _get_project(pid, user, db)
    p = db.query(WBPersona).filter(WBPersona.id == persona_id, WBPersona.project_id == pid).first()
    if not p:
        raise HTTPException(status_code=404, detail="페르소나를 찾을 수 없습니다")
    return p


@router.put("/projects/{pid}/personas/{persona_id}", response_model=WBPersonaResponse)
def update_persona(pid: int, persona_id: int, data: WBPersonaUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    persona = _get_persona(pid, persona_id, current_user, db)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(persona, k, v)
    db.commit()
    db.refresh(persona)
    return persona


@router.delete("/projects/{pid}/personas/{persona_id}")
def delete_persona(pid: int, persona_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    persona = _get_persona(pid, persona_id, current_user, db)
    db.delete(persona)
    db.commit()
    return {"deleted": persona_id}


@router.put("/projects/{pid}/personas/{persona_id}/scenarios")
def set_scenarios(pid: int, persona_id: int, scenarios: List[WBScenarioIn],
                  current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    persona = _get_persona(pid, persona_id, current_user, db)
    db.query(WBScenario).filter(WBScenario.persona_id == persona.id).delete()
    for i, s in enumerate(scenarios):
        d = s.model_dump()
        d["order"] = d.get("order", i)
        db.add(WBScenario(persona_id=persona.id, **d))
    db.commit()
    return {"ok": True, "count": len(scenarios)}


# ─────────────── Pain Cluster ───────────────
@router.get("/projects/{pid}/pains", response_model=List[WBPainResponse])
def list_pains(pid: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_project(pid, current_user, db)
    return db.query(WBPainCluster).filter(WBPainCluster.project_id == pid).order_by(WBPainCluster.id).all()


@router.post("/projects/{pid}/pains", response_model=WBPainResponse)
def add_pain(pid: int, data: WBPainCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_project(pid, current_user, db)
    pain = WBPainCluster(project_id=pid, **data.model_dump())
    db.add(pain)
    db.commit()
    db.refresh(pain)
    return pain


@router.delete("/projects/{pid}/pains/{pain_id}")
def delete_pain(pid: int, pain_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_project(pid, current_user, db)
    pain = db.query(WBPainCluster).filter(WBPainCluster.id == pain_id, WBPainCluster.project_id == pid).first()
    if not pain:
        raise HTTPException(status_code=404, detail="찾을 수 없습니다")
    db.delete(pain)
    db.commit()
    return {"deleted": pain_id}


@router.post("/projects/{pid}/pains/import")
def import_pains(pid: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """WorkCraft 실데이터에서 Pain 시드 — 공유 불편함(team_public) + 본인 불편함 + 회고 마찰(익명 카테고리)."""
    _get_project(pid, current_user, db)
    added = 0
    # 1) 공유/본인 불편함
    frictions = db.query(WorkFriction).filter(
        (WorkFriction.visibility == "team_public") | (WorkFriction.user_id == current_user.id)
    ).order_by(WorkFriction.created_at.desc()).limit(20).all()
    existing = {(p.source, p.source_ref) for p in
                db.query(WBPainCluster).filter(WBPainCluster.project_id == pid).all()}
    for f in frictions:
        ref = f"friction:{f.id}"
        if ("friction", ref) in existing:
            continue
        db.add(WBPainCluster(project_id=pid, title=f.title, description=f.description or "",
                             source="friction", source_ref=ref))
        added += 1
    # 2) 회고 마찰 트렌드 (익명 카테고리, 최근 4주, 원활했음 제외)
    weeks = recent_weeks(4)
    rows = (
        db.query(CollabReflection.friction_type, func.count(func.distinct(CollabReflection.user_id)))
        .filter(CollabReflection.week.in_(weeks), CollabReflection.friction_type != "원활했음")
        .group_by(CollabReflection.friction_type).all()
    )
    for cat, cnt in rows:
        ref = f"reflection:{cat}"
        if ("reflection", ref) in existing:
            continue
        db.add(WBPainCluster(project_id=pid, title=cat,
                             description=f"협업 회고에서 최근 반복 관찰 (기여자 {int(cnt)}명)",
                             source="reflection", source_ref=ref))
        added += 1
    db.commit()
    return {"imported": added}


# ─────────────── PR/FAQ ───────────────
@router.get("/projects/{pid}/prfaq", response_model=WBPRFAQResponse)
def get_prfaq(pid: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_project(pid, current_user, db)
    pf = db.query(WBPRFAQ).filter(WBPRFAQ.project_id == pid).first()
    if not pf:
        raise HTTPException(status_code=404, detail="아직 PR/FAQ가 없습니다")
    return pf


@router.put("/projects/{pid}/prfaq", response_model=WBPRFAQResponse)
def upsert_prfaq(pid: int, data: WBPRFAQIn, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_project(pid, current_user, db)
    pf = db.query(WBPRFAQ).filter(WBPRFAQ.project_id == pid).first()
    payload = data.model_dump()
    payload["faq"] = [q.model_dump() if hasattr(q, "model_dump") else q for q in data.faq]
    payload["risks"] = [q.model_dump() if hasattr(q, "model_dump") else q for q in data.risks]
    if pf:
        for k, v in payload.items():
            setattr(pf, k, v)
    else:
        pf = WBPRFAQ(project_id=pid, **payload)
        db.add(pf)
    db.commit()
    db.refresh(pf)
    return pf


# ─────────────── Feature ───────────────
@router.get("/projects/{pid}/features", response_model=List[WBFeatureResponse])
def list_features(pid: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_project(pid, current_user, db)
    return db.query(WBFeature).filter(WBFeature.project_id == pid).order_by(WBFeature.priority, WBFeature.id).all()


@router.post("/projects/{pid}/features", response_model=WBFeatureResponse)
def add_feature(pid: int, data: WBFeatureCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_project(pid, current_user, db)
    f = WBFeature(project_id=pid, **data.model_dump())
    db.add(f)
    db.commit()
    db.refresh(f)
    return f


@router.put("/projects/{pid}/features/{fid}", response_model=WBFeatureResponse)
def update_feature(pid: int, fid: int, data: WBFeatureUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_project(pid, current_user, db)
    f = db.query(WBFeature).filter(WBFeature.id == fid, WBFeature.project_id == pid).first()
    if not f:
        raise HTTPException(status_code=404, detail="찾을 수 없습니다")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(f, k, v)
    db.commit()
    db.refresh(f)
    return f


@router.delete("/projects/{pid}/features/{fid}")
def delete_feature(pid: int, fid: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_project(pid, current_user, db)
    f = db.query(WBFeature).filter(WBFeature.id == fid, WBFeature.project_id == pid).first()
    if not f:
        raise HTTPException(status_code=404, detail="찾을 수 없습니다")
    db.delete(f)
    db.commit()
    return {"deleted": fid}


# ─────────────── Validation ───────────────
@router.get("/projects/{pid}/validation", response_model=WBValidationResponse)
def get_validation(pid: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_project(pid, current_user, db)
    v = db.query(WBValidation).filter(WBValidation.project_id == pid).first()
    if not v:
        raise HTTPException(status_code=404, detail="아직 검증 점수가 없습니다")
    return v


@router.put("/projects/{pid}/validation", response_model=WBValidationResponse)
def upsert_validation(pid: int, data: WBValidationIn, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_project(pid, current_user, db)
    valid_keys = {i["key"] for i in wb_data.VALIDATION_ITEMS}
    scores = {k: max(1, min(5, int(v))) for k, v in data.scores.items() if k in valid_keys}
    total = sum(scores.values())
    verdict = wb_data.verdict_for(total)
    v = db.query(WBValidation).filter(WBValidation.project_id == pid).first()
    if v:
        v.scores, v.total, v.verdict, v.note = scores, total, verdict, data.note
    else:
        v = WBValidation(project_id=pid, scores=scores, total=total, verdict=verdict, note=data.note)
        db.add(v)
    db.commit()
    db.refresh(v)
    return v


@router.get("/projects/{pid}/validation/hints")
def validation_hints(pid: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """데이터 기반 자동 힌트 (반복성/이해관계자 수/데이터 축적 가치)."""
    _get_project(pid, current_user, db)
    persona_n = db.query(func.count(WBPersona.id)).filter(WBPersona.project_id == pid).scalar() or 0
    pain_n = db.query(func.count(WBPainCluster.id)).filter(WBPainCluster.project_id == pid).scalar() or 0
    feature_n = db.query(func.count(WBFeature.id)).filter(WBFeature.project_id == pid).scalar() or 0
    # 회고 트렌드(최근 4주) 최대 기여자 수 → 반복성 힌트
    weeks = recent_weeks(4)
    max_contrib = db.query(func.count(func.distinct(CollabReflection.user_id))).filter(
        CollabReflection.week.in_(weeks), CollabReflection.friction_type != "원활했음"
    ).scalar() or 0
    to5 = lambda n: max(1, min(5, n))
    return {
        "stakeholders": to5(persona_n),          # 이해관계자 수
        "repeatability": to5(max_contrib),        # 반복성(회고 기여자)
        "data_value": to5(pain_n + feature_n),    # 데이터 축적 가치(정의된 문제·기능 양)
        "explain": {
            "stakeholders": f"페르소나 {persona_n}명",
            "repeatability": f"최근 4주 회고 반복 기여자 최대 {max_contrib}명",
            "data_value": f"Pain {pain_n} · 기능 {feature_n}개",
        },
    }


# ─────────────── 생성기 (LLM 불필요) ───────────────
@router.post("/projects/{pid}/generate/today-statements")
def gen_today(pid: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = _get_project(pid, current_user, db)
    personas = db.query(WBPersona).filter(WBPersona.project_id == pid).all()
    for persona in personas:
        persona.today_statement = wb_templates.today_statement(persona, p)
    db.commit()
    return {"generated": len(personas)}


@router.post("/projects/{pid}/generate/prfaq-skeleton", response_model=WBPRFAQResponse)
def gen_prfaq(pid: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = _get_project(pid, current_user, db)
    personas = db.query(WBPersona).filter(WBPersona.project_id == pid).all()
    pains = db.query(WBPainCluster).filter(WBPainCluster.project_id == pid).all()
    skeleton = wb_templates.prfaq_skeleton(p, personas, pains)
    pf = db.query(WBPRFAQ).filter(WBPRFAQ.project_id == pid).first()
    if pf:
        for k, v in skeleton.items():
            setattr(pf, k, v)
    else:
        pf = WBPRFAQ(project_id=pid, **skeleton)
        db.add(pf)
    db.commit()
    db.refresh(pf)
    return pf


# ─────────────── LLM 브릿지: 단계별 프롬프트 생성 / JSON 붙여넣기 반영 ───────────────
class ApplyBody(BaseModel):
    content: str   # LLM이 돌려준 JSON (붙여넣기)


def _scenarios_text(db: Session, pid: int) -> str:
    lines = []
    personas = db.query(WBPersona).filter(WBPersona.project_id == pid).all()
    for p in personas:
        for s in db.query(WBScenario).filter(WBScenario.persona_id == p.id).order_by(WBScenario.order).all():
            if s.activity or s.pain_point:
                lines.append(f"[{p.name}/{s.time_block}] {s.activity} — 문제: {s.pain_point}")
    return "\n".join(lines)


@router.get("/projects/{pid}/prompt/{step}")
def get_prompt(pid: int, step: str, persona_id: int = 0,
               current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """단계별 LLM 프롬프트(JSON 계약 포함) 반환. Claude/ChatGPT/Gemini에 붙여넣기용."""
    p = _get_project(pid, current_user, db)
    personas = db.query(WBPersona).filter(WBPersona.project_id == pid).all()
    pains = db.query(WBPainCluster).filter(WBPainCluster.project_id == pid).all()

    if step == "personas":
        prompt = wb_prompts.personas_prompt(p)
    elif step == "ditl":
        persona = db.query(WBPersona).filter(WBPersona.id == persona_id, WBPersona.project_id == pid).first()
        if not persona:
            raise HTTPException(status_code=400, detail="persona_id가 필요합니다")
        prompt = wb_prompts.ditl_prompt(p, persona)
    elif step == "pains":
        prompt = wb_prompts.pains_prompt(p, personas, _scenarios_text(db, pid))
    elif step == "prfaq":
        prompt = wb_prompts.prfaq_prompt(p, personas, pains)
    elif step == "features":
        prompt = wb_prompts.features_prompt(p, pains)
    else:
        raise HTTPException(status_code=404, detail="지원하지 않는 단계입니다")
    return {"step": step, "prompt": prompt}


@router.post("/projects/{pid}/apply/{step}")
def apply_step(pid: int, step: str, body: ApplyBody, persona_id: int = 0,
               current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """붙여넣은 LLM JSON을 파싱해 해당 단계 데이터로 반영."""
    _get_project(pid, current_user, db)
    try:
        data = wb_apply.parse_json_lenient(body.content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if step == "personas":
        items = wb_apply.extract_personas(data)
        for it in items:
            db.add(WBPersona(project_id=pid, **it))
        db.commit()
        return {"applied": len(items), "kind": "added"}

    if step == "ditl":
        persona = db.query(WBPersona).filter(WBPersona.id == persona_id, WBPersona.project_id == pid).first()
        if not persona:
            raise HTTPException(status_code=400, detail="persona_id가 필요합니다")
        rows = wb_apply.extract_scenarios(data)
        db.query(WBScenario).filter(WBScenario.persona_id == persona.id).delete()
        for r in rows:
            db.add(WBScenario(persona_id=persona.id, **r))
        db.commit()
        return {"applied": len(rows), "kind": "replaced"}

    if step == "pains":
        items = wb_apply.extract_pains(data)
        for it in items:
            db.add(WBPainCluster(project_id=pid, source="llm", **it))
        db.commit()
        return {"applied": len(items), "kind": "added"}

    if step == "features":
        items = wb_apply.extract_features(data)
        for it in items:
            db.add(WBFeature(project_id=pid, **it))
        db.commit()
        return {"applied": len(items), "kind": "added"}

    if step == "prfaq":
        fields = wb_apply.extract_prfaq(data)
        pf = db.query(WBPRFAQ).filter(WBPRFAQ.project_id == pid).first()
        if pf:
            for k, v in fields.items():
                setattr(pf, k, v)
        else:
            db.add(WBPRFAQ(project_id=pid, **fields))
        db.commit()
        return {"applied": 1, "kind": "prfaq"}

    raise HTTPException(status_code=404, detail="지원하지 않는 단계입니다")


# ─────────────── 인터뷰 모드: 전체 프롬프트 / 전체 적용 ───────────────
class InterviewPromptBody(BaseModel):
    transcript: str = ""


@router.post("/projects/{pid}/prompt/interview")
def interview_prompt(pid: int, body: InterviewPromptBody,
                     current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """인터뷰/대화(음성인식 텍스트 등) → WB 전체를 한 번에 정리하는 프롬프트."""
    p = _get_project(pid, current_user, db)
    return {"prompt": wb_prompts.interview_prompt(p, body.transcript)}


# AI가 돌려주는 JSON은 예측 불가 — 과도한 크기/항목 수를 방어한다.
MAX_APPLY_BYTES = 512 * 1024   # 붙여넣는 JSON 상한 (~0.5MB)
MAX_ITEMS_PER_SECTION = 100    # personas/pains/features 섹션당 상한


@router.post("/projects/{pid}/apply-all")
def apply_all(pid: int, body: ApplyBody, replace: bool = False,
              current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """전체 JSON(idea/personas/pains/features/prfaq)을 한 번에 반영.

    전부 성공하거나 전부 롤백되는 원자적 반영 — AI 출력 일부가 어긋나도
    기존 데이터가 부분 삭제/오염되지 않는다.
    """
    project = _get_project(pid, current_user, db)
    if body.content and len(body.content.encode("utf-8")) > MAX_APPLY_BYTES:
        raise HTTPException(status_code=413, detail="붙여넣은 내용이 너무 큽니다. JSON 부분만 붙여넣어 주세요.")
    try:
        data = wb_apply.parse_json_lenient(body.content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not isinstance(data, dict):
        raise HTTPException(status_code=400, detail="객체 형태의 JSON이 필요합니다")

    result = {}
    try:
        # idea — 빈 값이 아닌 필드만 갱신
        idea = data.get("idea")
        if isinstance(idea, dict):
            allowed = {"one_liner", "current_problem", "target_user", "expected_benefit",
                       "current_alternative", "success_criteria", "not_doing"}
            n = 0
            for k, v in idea.items():
                if k in allowed and isinstance(v, str) and v.strip():
                    setattr(project, k, v.strip()); n += 1
            result["idea"] = n

        if "personas" in data:
            items = wb_apply.extract_personas(data["personas"] if isinstance(data.get("personas"), list) else data)[:MAX_ITEMS_PER_SECTION]
            if replace:
                db.query(WBPersona).filter(WBPersona.project_id == pid).delete()
            for it in items:
                db.add(WBPersona(project_id=pid, **it))
            result["personas"] = len(items)

        if "pains" in data:
            items = wb_apply.extract_pains(data["pains"] if isinstance(data.get("pains"), list) else data)[:MAX_ITEMS_PER_SECTION]
            if replace:
                db.query(WBPainCluster).filter(WBPainCluster.project_id == pid).delete()
            for it in items:
                db.add(WBPainCluster(project_id=pid, source="llm", **it))
            result["pains"] = len(items)

        if "features" in data:
            items = wb_apply.extract_features(data["features"] if isinstance(data.get("features"), list) else data)[:MAX_ITEMS_PER_SECTION]
            if replace:
                db.query(WBFeature).filter(WBFeature.project_id == pid).delete()
            for it in items:
                db.add(WBFeature(project_id=pid, **it))
            result["features"] = len(items)

        if isinstance(data.get("prfaq"), dict):
            fields = wb_apply.extract_prfaq(data["prfaq"])
            pf = db.query(WBPRFAQ).filter(WBPRFAQ.project_id == pid).first()
            if pf:
                for k, v in fields.items():
                    setattr(pf, k, v)
            else:
                db.add(WBPRFAQ(project_id=pid, **fields))
            result["prfaq"] = 1

        db.flush()   # 커밋 전에 DB 제약 위반을 여기서 드러내 롤백 가능하게
        db.commit()
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="반영 중 오류가 발생했어요. JSON 구조를 확인해 주세요. (변경사항은 저장되지 않았습니다)")

    if not result:
        raise HTTPException(status_code=400, detail="반영할 내용이 없어요. idea/personas/pains/features/prfaq 중 하나 이상이 필요합니다.")
    return {"applied": result}


# ─────────────── Export (Markdown + LLM 프롬프트) ───────────────
@router.get("/projects/{pid}/export")
def export_markdown(pid: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = _get_project(pid, current_user, db)
    personas = db.query(WBPersona).filter(WBPersona.project_id == pid).all()
    for persona in personas:  # 시나리오 로드
        persona.scenarios
    pains = db.query(WBPainCluster).filter(WBPainCluster.project_id == pid).all()
    prfaq = db.query(WBPRFAQ).filter(WBPRFAQ.project_id == pid).first()
    features = db.query(WBFeature).filter(WBFeature.project_id == pid).all()
    validation = db.query(WBValidation).filter(WBValidation.project_id == pid).first()
    md = wb_export.to_markdown(p, personas, pains, prfaq, features, validation)
    return {"markdown": md, "llm_prompt": wb_export.llm_polish_prompt(md)}
