# BNI Semiconductor Roadmap AI Agent

중소기업 전략기술로드맵 중 `반도체` 분야 보고서를 분석 단위별 Markdown으로 작성하고, 팀원이 웹 페이지에서 상시 확인할 수 있게 만든 작업 공간입니다.

## 폴더 구조

- `agent/`: AI 에이전트의 역할, 작성 규칙, 프롬프트
- `content/`: 분석 단위별 Markdown 원고와 manifest
- `site/`: 팀 공유용 웹 페이지
- `uploads/`: 분석 단위별로 업로드한 HWP, Word, PDF 원문 파일

## 바로 보기

PowerShell에서 아래 명령을 실행한 뒤 브라우저에서 `http://localhost:8080/site/`를 엽니다.

```powershell
.\Start-Site.ps1
```

GPT 검색까지 사용하려면 실행 전에 OpenAI API 키를 환경변수로 설정합니다.

```powershell
$env:OPENAI_API_KEY="YOUR_API_KEY"
.\Start-Site.ps1
```

기본 모델은 `gpt-5`이며, 필요하면 `$env:OPENAI_MODEL`로 바꿀 수 있습니다.

## 외부 공유용 무료 임시 배포

계정 없이 바로 공유하려면 아래 명령을 실행합니다.

```powershell
.\Start-PublicTunnel.ps1
```

터미널에 `https://*.lhr.life` 형태의 URL이 표시되면 그 주소를 팀원에게 공유합니다. 이 방식은 무료 터널 배포라서 PC, 로컬 서버, PowerShell 창이 켜져 있는 동안 유지됩니다.

## 계정 연결형 무료 배포

서버 기능까지 포함해 배포하려면 Render Web Service에 연결할 수 있도록 `package.json`과 `render.yaml`을 포함했습니다.

자세한 절차는 `DEPLOY_RENDER.md`를 참고합니다. 배포 후 제공되는 `https://*.onrender.com` 주소는 같은 링크로 계속 접속할 수 있습니다.

Render 무료 인스턴스는 유휴 상태에서 잠들 수 있고, 파일 업로드 저장소는 재시작 시 사라질 수 있습니다. 장기 운영에서는 외부 스토리지 연결이 필요합니다.

## 분석 단위

- 마크다운1: 정책 환경 분석
- 마크다운2: 산업 환경 분석
- 마크다운3: 시장 환경 분석
- 마크다운4: 기술 환경 분석
- 마크다운4: 지재권 및 중기부 지원과제 교차 분석
- 마크다운5: 전략품목 후보군 구성
- 마크다운6: 상용화 방안 및 KPI 기반 R&D Dashboard
- 로드맵: 반도체 분야 전략기술로드맵 종합

## 주요 기능

- 분석 단위별 Markdown 원고 조회
- 페이지 내 GPT API 검색 및 결과 확인
- GPT 검색 결과를 현재 Markdown 파일에 반영
- 분석 단위별 HWP, HWPX, DOC, DOCX, PDF 업로드
- 분석 단위별 참고문헌 추가
- 통합 Markdown 및 한글/Word 호환 `.doc` 출력
