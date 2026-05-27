# Render 무료 고정 링크 배포 가이드

이 문서는 `중소기업 전략기술로드맵 AI Agent - 반도체 분야`를 매번 바뀌는 터널 주소가 아니라 같은 `*.onrender.com` 주소로 접속할 수 있게 배포하는 절차입니다.

## 왜 Render로 바꾸는가

`localhost.run` 익명 터널은 로컬 PC와 SSH 세션이 살아 있는 동안만 주소가 유지됩니다. 세션이 끊기면 기존 주소는 `no tunnel here`가 뜹니다.

Render Web Service는 배포 후 고정 `https://서비스명.onrender.com` 주소를 제공합니다. 무료 플랜은 유휴 상태에서 잠들 수 있지만, 주소 자체는 유지됩니다.

## 배포 전 준비

1. GitHub 계정
2. Render 계정
3. 팀원이 각자 사용할 OpenAI API Key

## GitHub에 프로젝트 업로드

이 PC에는 현재 `git` 명령이 설치되어 있지 않습니다. 아래 둘 중 하나로 진행합니다.

### 방법 A. GitHub Desktop 사용

1. GitHub Desktop 설치
2. `C:\Users\user\Documents\BNI Agent` 폴더를 새 repository로 추가
3. repository 이름 예시: `bni-semiconductor-roadmap-agent`
4. Commit 후 Publish repository

### 방법 B. Git 설치 후 PowerShell 사용

```powershell
cd "C:\Users\user\Documents\BNI Agent"
git init
git add .
git commit -m "Deploy semiconductor roadmap agent"
git branch -M main
git remote add origin https://github.com/YOUR_ID/bni-semiconductor-roadmap-agent.git
git push -u origin main
```

## Render에서 배포

1. Render 대시보드에서 **New +** 선택
2. **Web Service** 선택
3. GitHub 저장소 `bni-semiconductor-roadmap-agent` 연결
4. 설정값 입력

| 항목 | 값 |
| --- | --- |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | Free |
| Auto Deploy | Yes |

5. Environment Variables는 선택사항입니다. 팀원이 각자 페이지에서 자기 OpenAI API 키를 입력해 쓰는 구조라면 `OPENAI_API_KEY`는 등록하지 않아도 됩니다.

| Key | Value |
| --- | --- |
| OPENAI_MODEL | `gpt-5` |

6. Deploy 클릭

## 배포 후 접속 주소

배포가 끝나면 Render가 아래 형태의 고정 주소를 제공합니다.

```text
https://bni-semiconductor-roadmap-agent.onrender.com
```

이 주소를 팀원에게 공유하면 됩니다.

## 무료 플랜 상시 유지 설정

무료 Web Service는 요청이 없으면 잠들 수 있으므로, 이 프로젝트에는 GitHub Actions가 10분마다 Render의 상태 확인 주소를 호출하는 워크플로가 포함되어 있습니다.

```text
https://bni-semiconductor-roadmap-agent.onrender.com/health
```

사용 방법:

1. `.github/workflows/keep-render-awake.yml` 파일까지 GitHub에 commit/push합니다.
2. GitHub 저장소의 **Actions** 탭에서 workflows가 활성화되어 있는지 확인합니다.
3. Render 서비스 주소가 다르면 GitHub 저장소 **Settings > Secrets and variables > Actions > Variables**에 아래 변수를 추가합니다.

| Name | Value |
| --- | --- |
| RENDER_KEEPALIVE_URL | `https://실제-render-주소.onrender.com/health` |

수동으로 한 번 확인하려면 Actions 탭에서 **Keep Render Awake** workflow를 선택하고 **Run workflow**를 누르면 됩니다.

## 무료 플랜 주의사항

- 무료 Web Service는 일정 시간 접속이 없으면 잠들 수 있습니다.
- 이 프로젝트는 10분 주기 `/health` 호출로 sleep 진입을 줄이도록 설정되어 있습니다.
- GitHub Actions 스케줄은 GitHub 사정에 따라 몇 분 지연될 수 있습니다.
- 무료 플랜 사용량을 모두 소진하면 Render 서비스가 월초까지 정지될 수 있습니다.
- 잠든 뒤 첫 접속은 30초 이상 걸릴 수 있습니다.
- 업로드 파일은 Render 재시작 또는 재배포 시 사라질 수 있습니다.
- 장기 운영에서는 S3, Google Drive, Supabase Storage 같은 외부 저장소를 붙이는 구성이 필요합니다.
- OpenAI API 키는 사용자의 브라우저에 저장되고 GPT 검색 요청 때 서버로 전달됩니다. 서버는 키를 파일이나 환경변수에 저장하지 않습니다.
