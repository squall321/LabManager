# LabManager MCP 서버

디지털트윈AX랩의 **Working Backwards** 프로젝트를 생성형 AI(Claude/ChatGPT)가
대화만으로 읽고 채울 수 있게 해주는 MCP(Model Context Protocol) 서버입니다.

앱의 REST API(`:8010`)를 얇게 감싸며, 인증은 앱에서 발급한 개인 토큰(`lmk_...`)을 씁니다.

## 빠른 시작

```bash
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt   # Windows
# .venv/bin/pip install -r requirements.txt      # macOS/Linux
```

환경변수:

- `LABMGR_TOKEN` (필수): 앱 **API 토큰** 페이지에서 발급한 `lmk_...`
- `LABMGR_API` (선택): 기본 `http://localhost:8010/api`

Claude Desktop 등록·사용법은 저장소 루트의 [`docs/MCP_GUIDE.md`](../docs/MCP_GUIDE.md) 를 참고하세요.

## 도구

`whoami`, `list_projects`, `create_project`, `get_project`, `get_fill_schema`,
`fill_project`, `update_idea`, `add_persona`, `add_pain`, `add_feature`, `export_report`

`fill_project` 는 앱 백엔드와 **동일한 JSON 계약**(idea/personas/pains/features/prfaq)을 사용합니다.
