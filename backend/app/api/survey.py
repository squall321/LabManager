from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from ..core.database import get_db
from ..models.user import User
from ..models.survey import Survey, SurveyResponse, BirkmanReport, SurveyStatus
from ..schemas.survey import SurveySubmit
from ..services.birkman_engine import calculate_birkman
from ..services.report_service import build_full_report
from ..services import birkman_data as bd
from .deps import get_current_user

router = APIRouter(prefix="/survey", tags=["설문"])


@router.get("/questions/{section}")
def get_questions(section: int, current_user: User = Depends(get_current_user)):
    if section not in bd.SECTIONS:
        raise HTTPException(status_code=404, detail="존재하지 않는 섹션입니다")
    meta = bd.SECTION_META[section]
    return {
        "section": section,
        "total_sections": bd.TOTAL_SECTIONS,
        "total_questions": bd.TOTAL_QUESTIONS,
        "section_title": meta["title"],
        "section_subtitle": meta["subtitle"],
        "questions": bd.SECTIONS[section],
        "scale_labels": bd.SCALE_LABELS,
    }


@router.get("/status")
def get_survey_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    survey = (
        db.query(Survey)
        .filter(Survey.user_id == current_user.id)
        .order_by(Survey.created_at.desc())
        .first()
    )
    if not survey:
        return {"has_survey": False, "total_questions": bd.TOTAL_QUESTIONS}
    return {
        "has_survey": True,
        "id": survey.id,
        "status": survey.status,
        "current_section": survey.current_section,
        "responses_count": len(survey.responses),
        "total_questions": bd.TOTAL_QUESTIONS,
        "completed_at": survey.completed_at,
    }


@router.post("/start")
def start_survey(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = (
        db.query(Survey)
        .filter(Survey.user_id == current_user.id, Survey.status == SurveyStatus.in_progress)
        .first()
    )
    if existing:
        return {"survey_id": existing.id, "current_section": existing.current_section}

    survey = Survey(user_id=current_user.id)
    db.add(survey)
    db.commit()
    db.refresh(survey)
    return {"survey_id": survey.id, "current_section": 1}


@router.post("/submit/{survey_id}")
def submit_section(
    survey_id: int,
    data: SurveySubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    survey = db.query(Survey).filter(Survey.id == survey_id, Survey.user_id == current_user.id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="설문을 찾을 수 없습니다")
    if survey.status == SurveyStatus.completed:
        raise HTTPException(status_code=400, detail="이미 완료된 설문입니다")

    # 현재 섹션의 기존 응답 삭제 후 재저장 (이어하기/재제출 대응)
    q_ids = bd.section_question_ids(data.section)
    db.query(SurveyResponse).filter(
        SurveyResponse.survey_id == survey_id,
        SurveyResponse.question_id.in_(q_ids),
    ).delete(synchronize_session=False)

    for item in data.responses:
        db.add(SurveyResponse(survey_id=survey_id, question_id=item.question_id, response=item.response))

    next_section = data.section + 1
    if next_section > bd.TOTAL_SECTIONS:
        # 전 섹션 완료 → 점수 계산
        all_responses = {r.question_id: r.response for r in survey.responses}
        for item in data.responses:
            all_responses[item.question_id] = item.response

        raw = calculate_birkman(all_responses)
        full_report = build_full_report(raw, current_user.name)

        existing_report = db.query(BirkmanReport).filter(BirkmanReport.user_id == current_user.id).first()
        if existing_report:
            existing_report.report_data = full_report
            existing_report.survey_id = survey_id
            existing_report.updated_at = datetime.utcnow()
        else:
            db.add(BirkmanReport(user_id=current_user.id, survey_id=survey_id, report_data=full_report))

        survey.status = SurveyStatus.completed
        survey.completed_at = datetime.utcnow()
        db.commit()
        return {"status": "completed", "next_section": None}

    survey.current_section = next_section
    db.commit()
    return {"status": "in_progress", "next_section": next_section}
