# 🔍 Git Log AI CLI 도구

Git 레포지토리의 커밋 로그를 분석하고 GPT를 활용하여 경험 위주의 이력서를 자동 생성하는 CLI 도구입니다.

## ✨ 주요 기능

- 🚀 **CLI 모드**: 터미널에서 바로 Git 로그 분석
- 🌐 **웹 서버 모드**: 브라우저에서 UI로 로그 분석
- 📁 **로컬 레포지토리 지원**: 로컬 Git 레포지토리 경로 입력
- 🤖 **GPT 분석**: OpenAI GPT를 활용한 경험 위주 이력서 자동 생성
- 📊 **배치 분석**: 모든 커밋을 배치로 나누어 완전한 분석
- 🎯 **스마트 필터링**: 의미없는 커밋 자동 제거
- 📋 **프로젝트 컨텍스트**: package.json 기반 프로젝트 정보 활용

## 🚀 설치 및 실행

### 1. 의존성 설치
```bash
pnpm install
# 또는
npm install
```

### 2. OpenAI API 키 설정 (GPT 분석 기능 사용 시)
```bash
# .env 파일 생성
cp env.example .env

# .env 파일에서 OPENAI_API_KEY 설정
# https://platform.openai.com/api-keys 에서 발급받으세요
# OPENAI_API_KEY="api key"

```

### 3. CLI 모드 실행
```bash
# 기본 사용법 (현재 디렉토리)
npx tsx git-log-ai.ts --author xxxx@gmail.com

# 특정 레포지토리 지정
npx tsx git-log-ai.ts --repo /path/to/repo --author xxxx@gmail.com

# 시작 날짜 지정
npx tsx git-log-ai.ts --repo /path/to/repo --author xxxx@gmail.com --since 20xx-01-01

# GPT로 이력서 분석 (OpenAI API 키 필요)
npx tsx git-log-ai.ts --repo /path/to/repo --author xxxx@gmail.com --analyze
```

### 4. 웹 서버 모드 실행
```bash
# 기본 포트 (3000)
npx tsx git-log-ai.ts --web

# 커스텀 포트
npx tsx git-log-ai.ts --web --port 8080
```

웹 서버 실행 후 브라우저에서 `http://localhost:3000`을 열어주세요.

## 📋 사용법

### CLI 옵션

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `--repo <path>` | 로컬 Git 레포지토리 경로 | 현재 디렉토리 |
| `--author <email>` | 작성자 | xxxxxx@gmail.com / xxxx |
| `--since <date>` | 시작 날짜 (YYYY-MM-DD) | 2023-05-01 |
| `--web` | 웹 서버 모드로 실행 | - |
| `--port <number>` | 웹 서버 포트 | 3000 |
| `--analyze` | GPT로 커밋 로그 분석 (이력서용) | - |
| `-h, --help` | 도움말 표시 | - |

### 웹 UI 사용법

1. 웹 서버를 실행합니다: `npx tsx git-log-ai.ts --web`
2. 브라우저에서 `http://localhost:3000`을 엽니다
3. 로컬 Git 레포지토리 경로(pwd), 작성자, 분석 시작 날짜를 입력합니다
4. "Git 로그 분석하기" 버튼을 클릭합니다
5. (선택) "🤖 GPT로 이력서 분석하기" 버튼으로 경험 위주 이력서 생성 (OpenAI API 키 필요)
6. (선택) "📋 커밋 정보 복사하기" 버튼으로 커밋 정보를 클립보드에 복사하여 ChatGPT, Claude 등 AI에 그대로 붙여넣기 가능

## 📊 출력 예시

### CLI 출력 (일반 모드)
```
🔍 Git 로그를 분석하는 중...

📁 레포지토리: /path/to/repo
👤 작성자: xxxx@gmail.com
📅 시작일: 2023-05-01

📊 총 5개의 커밋을 찾았습니다:

📅 2023-05-15
👤 이xx (xxxx@gmail.com)
🔗 a1b2c3d
📝 새로운 기능 추가
📄 상세한 커밋 메시지 내용

──────────────────────────────────────────────────

📅 2023-05-10
👤 이xx (xxxx@gmail.com)
🔗 e4f5g6h
📝 버그 수정

──────────────────────────────────────────────────
```

### CLI 출력 (GPT 분석 모드)
#### 사용하는 모델과 prompt에 따라서 출력값이 달라질 수 있습니다.
```
🤖 GPT로 커밋 로그를 분석하는 중...

📋 프로젝트 컨텍스트: 프로젝트명: my-project
설명: React 기반 웹 애플리케이션
주요 의존성: react, typescript, express
개발 의존성: @types/react, jest, eslint

📊 총 303개 커밋을 16개 배치로 나누어 분석합니다. (GPT token limit 회피)
🤖 배치 1/16 분석 중... (20개 커밋)
🤖 배치 2/16 분석 중... (20개 커밋)
...
🤖 배치 16/16 분석 중... (3개 커밋)

# 🎯 개발 경험 분석 보고서

## 📋 요약
React/TypeScript 기반의 대규모 웹 애플리케이션 개발 경험을 보유한 프론트엔드 개발자입니다.
(...)
```

### 웹 UI 특징
- 📱 반응형 디자인으로 모바일에서도 사용 가능
- 🎨 카드 형태의 커밋 표시
- 📊 실시간 통계 정보 제공
- ⚡ 로딩 상태 표시 및 진행 상황 확인
- 🤖 GPT 분석 결과를 마크다운 형식으로 표시
- 🔄 배치별 분석 진행 상황 실시간 업데이트

### GPT 이력서 분석 결과 예시
```
# 🎯 개발 경험 분석 보고서

## 📋 요약
React/TypeScript 기반의 대규모 웹 애플리케이션 개발 경험을 보유한 프론트엔드 개발자입니다. 
성능 최적화와 사용자 경험 개선에 중점을 두고 있으며, 팀 협업과 코드 품질 향상을 위한 
프로세스 개선에 기여한 경험이 있습니다.

## 🏆 주요 성과
1. 대시보드 성능 40% 향상 - 가상화 및 메모이제이션 기법 적용
2. 사용자 이탈률 25% 감소 - UX 개선 및 로딩 최적화
3. 코드 리뷰 프로세스 도입으로 버그 발생률 60% 감소

## 💻 기술적 역량
1. React, TypeScript, Next.js를 활용한 SPA 개발
2. 상태 관리 (Redux, Zustand) 및 API 통합 경험
3. 성능 최적화 (번들 크기 최적화, 지연 로딩, 메모이제이션)

## 💼 비즈니스 임팩트
1. 고객 분석 대시보드 구축으로 데이터 기반 의사결정 지원
2. 매장별 성과 분석 기능으로 영업팀 업무 효율성 향상
3. 실시간 알림 시스템으로 고객 만족도 개선

## 🧩 문제 해결 능력
1. 대용량 데이터 처리를 위한 가상화 기법 도입
2. 메모리 누수 문제 해결을 위한 프로파일링 및 최적화
3. 크로스 브라우저 호환성 이슈 해결
```

## 🛠️ 개발

### 프로젝트 구조
```
cli/
├── git-log-ai.ts      # 메인 CLI 도구
├── public/
│   └── index.html     # 웹 UI
├── package.json
└── README.md
```

### 기술 스택
- **TypeScript**: 타입 안전성과 개발자 경험
- **Node.js**: 크로스 플랫폼 실행 환경
- **Express.js**: 웹 서버 프레임워크
- **OpenAI GPT**: AI 기반 이력서 분석
- **Git**: 버전 관리 시스템

## 🔧 문제 해결

### Git 레포지토리가 아닙니다 오류
```bash
# 현재 디렉토리가 Git 레포지토리인지 확인
git status

# Git 레포지토리 초기화
git init
```

### OpenAI API 키 오류
```bash
# .env 파일 확인
cat .env

# API 키 재설정
echo "OPENAI_API_KEY=your_api_key_here" > .env
```

### 포트가 이미 사용 중입니다
```bash
# 다른 포트 사용
npx tsx git-log-ai.ts --web --port 8080

# 기존 프로세스 종료
pkill -f "tsx git-log-ai.ts"
```

### 토큰 제한 오류
- GPT 분석 시 토큰 제한에 걸리면 자동으로 배치 분석을 수행합니다
- 대용량 커밋 로그의 경우 분석 시간이 오래 걸릴 수 있습니다

## 💰 비용 정보

### GPT 분석 비용 (참고용)
- **약 300개 커밋**: 약 $1.16 (18,395 토큰)
- **토큰당 비용**: $0.000063 (GPT-4 기준)
- **예상 비용**: 커밋 100개당 약 $0.38

### 비용 최적화 팁
- 중요도가 낮은 커밋은 제외하고 분석
- 분석 기간을 제한하여 커밋 수 조절
- 배치 분석으로 토큰 효율성 극대화

## 📝 라이선스

ISC

## 🤝 기여

버그 리포트나 기능 제안은 언제든 환영합니다!

---

**즐거운 Git 로그 분석과 AI 이력서 생성 되세요! 🎉**
