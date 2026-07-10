# MCP 연결 가이드 — 인터뷰/대화로 Working Backwards 채우기

디지털트윈AX랩은 **MCP(Model Context Protocol) 서버**를 제공합니다.
이걸 연결하면 Claude(데스크톱)·ChatGPT 같은 생성형 AI가 **대화만으로** 이 앱의
Working Backwards 프로젝트를 직접 읽고 채울 수 있어요.

전형적인 흐름:

1. 팀과 인터뷰/회의를 하고, **음성인식으로 대화를 텍스트**로 만든다. (녹음·전사·요약은 생성형 AI가 담당)
2. Claude에게 *"이 인터뷰 내용을 우리 랩 프로젝트로 정리해줘"* 라고 말한다.
3. Claude가 MCP 도구로 프로젝트를 만들거나 골라, 아이디어·페르소나·문제·PR/FAQ·기능을 **한 번에** 채운다.
4. 앱에서 결과를 확인·수정하고 리포트로 내보낸다.

> 녹음·전사·문장 분석은 앱이 하지 않습니다. 앱은 **정리된 내용을 받아 채워 넣는 창구(MCP + JSON 계약)** 만 제공합니다.

---

## 1. 개인 API 토큰 발급

MCP 서버는 **당신의 계정으로만** 동작하는 개인 토큰이 필요합니다.

1. 앱 좌측 하단 **API 토큰** 메뉴로 이동
2. 토큰 이름(예: `내 노트북 Claude`)을 입력하고 **새 토큰 발급**
3. 발급 직후 **한 번만** 보이는 `lmk_...` 값을 안전한 곳에 복사

> 토큰은 해시로만 저장돼 다시 볼 수 없습니다. 잃어버리면 새로 발급하고 예전 것은 해지하세요.

---

## 2. MCP 서버 준비

앱 저장소의 `mcp/` 폴더에 서버가 있습니다.

```bash
cd mcp
python -m venv .venv
# Windows
.venv\Scripts\pip install -r requirements.txt
# macOS/Linux
# .venv/bin/pip install -r requirements.txt
```

동작 확인(선택):

```bash
# Windows PowerShell
$env:LABMGR_TOKEN="lmk_붙여넣기"; $env:LABMGR_API="http://localhost:8010/api"
.venv\Scripts\python server.py    # stdio 서버라 조용히 대기하면 정상 (Ctrl+C 로 종료)
```

| 환경변수 | 설명 | 기본값 |
|---|---|---|
| `LABMGR_TOKEN` | 발급받은 개인 토큰(`lmk_...`) — **필수** | (없음) |
| `LABMGR_API` | 앱 백엔드 API 주소 | `http://localhost:8010/api` |

앱 백엔드(FastAPI)가 `http://localhost:8010` 에서 실행 중이어야 합니다.

---

## 3. Claude Desktop 에 등록

`claude_desktop_config.json` 을 엽니다.

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

`mcpServers` 에 아래를 추가하세요. **경로와 토큰은 본인 것으로 바꾸세요.**

```json
{
  "mcpServers": {
    "labmanager": {
      "command": "C:\\Users\\나\\...\\LabManager\\mcp\\.venv\\Scripts\\python.exe",
      "args": ["C:\\Users\\나\\...\\LabManager\\mcp\\server.py"],
      "env": {
        "LABMGR_TOKEN": "lmk_여기에_발급받은_토큰",
        "LABMGR_API": "http://localhost:8010/api"
      }
    }
  }
}
```

macOS/Linux 예시:

```json
{
  "mcpServers": {
    "labmanager": {
      "command": "/절대경로/LabManager/mcp/.venv/bin/python",
      "args": ["/절대경로/LabManager/mcp/server.py"],
      "env": {
        "LABMGR_TOKEN": "lmk_여기에_발급받은_토큰"
      }
    }
  }
}
```

저장 후 **Claude Desktop 을 완전히 종료했다 다시 실행**하면 `labmanager` 도구가 붙습니다.

---

## 4. 사용 예시

Claude 에게 이렇게 말해보세요:

> "labmanager 에 연결됐어? `whoami` 로 확인해줘."

> "다음은 오늘 팀 인터뷰 녹취야. (…붙여넣기…)
> 새 Working Backwards 프로젝트 '낙하 케이스 자동화' 를 만들고, 이 내용으로 아이디어·페르소나·문제·PR/FAQ·기능을 채워줘."

Claude 는 내부적으로 이렇게 동작합니다:
1. `create_project` — 프로젝트 생성
2. `get_fill_schema` — 채우기용 JSON 스키마·지침 확인
3. `fill_project` — 인터뷰 내용을 프로젝트 전체에 반영
4. `get_project` — 결과 확인

이미 있는 프로젝트에 이어 붙이려면 *"내 프로젝트 목록 보여줘"* (`list_projects`) → *"3번에 이 내용 추가해줘"* 식으로.

---

## 제공 도구 목록

| 도구 | 설명 |
|---|---|
| `whoami` | 토큰 소유 계정 확인(연결 점검) |
| `list_projects` | 내 프로젝트 목록 |
| `create_project` | 새 프로젝트 생성 |
| `get_project` | 프로젝트 전체 내용 읽기 |
| `get_fill_schema` | 한 번에 채우기용 JSON 스키마·지침(인터뷰 포함) |
| `fill_project` | 인터뷰 내용을 프로젝트 전체에 반영 |
| `update_idea` | 아이디어 캔버스 필드 부분 수정 |
| `add_persona` / `add_pain` / `add_feature` | 개별 항목 추가 |
| `export_report` | Markdown 리포트로 내보내기 |

---

## 문제 해결

- **`LABMGR_TOKEN 환경변수가 없습니다`** — config 의 `env.LABMGR_TOKEN` 을 확인하세요.
- **`인증 실패`** — 토큰이 해지됐거나 오타입니다. 앱에서 새로 발급하세요.
- **`요청 실패 (Connection…)`** — 앱 백엔드가 `:8010` 에서 실행 중인지 확인하세요.
- **도구가 안 보임** — Claude Desktop 을 완전히 종료 후 재실행. `command` 경로가 실제 python 실행파일인지 확인.

> 웹앱의 **인터뷰로 채우기** 버튼(Working Backwards 화면 우측 상단)은 MCP 없이도 같은 일을 합니다.
> 프롬프트를 복사해 아무 AI 챗에 붙여넣고, 돌려받은 JSON 을 다시 붙여넣으면 프로젝트가 채워집니다.
