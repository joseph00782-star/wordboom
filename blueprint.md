# 💣 [WORDBOOM] 프로젝트 최종 설계서

## 1. 서비스 컨셉
- **슬로건**: "사진 한 장으로 만드는 나만의 단어 시험지와 액션 게임"
- **핵심 흐름**: 사진 업로드 → Firebase Cloud Functions (GPT-4o mini) 데이터 추출 → 시험지/정답지 미리보기 → PDF 저장 및 게임 플레이

## 2. 디자인 시스템: "Sophisticated Vibrant"
- **컨셉**: 유니크하면서도 과하지 않은 세련된 디자인.
- **컬러 팔레트**: Deep Indigo (#4F46E5), Neon Cyan (#06B6D4), Background (oklch(97% 0.01 250))
- **UI 특징**: 상단 고정 네비게이션, 글래스모피즘 카드 UI, 부드러운 애니메이션 피드백.

## 3. 주요 기능 상세 (User Flow)

### Step 1: 자동 AI 스마트 추출 (Input)
- **기능**: 사용자가 단어장 사진을 업로드하면 즉시 분석 시작.
- **백엔드**: Firebase Cloud Functions (`extractWords` 함수).
- **AI**: OpenAI GPT-4o mini (Vision) - API 키는 서버측 Secret Manager에서 관리.
- **프롬프트**: "JSON 구조로만 대답해라"는 강제성을 부여한 전문 프롬프트 적용.

### Step 2: A4 시험지 & 정답지 미리보기 (Preview)
- **기능**: PDF 생성 전 웹에서 시험지 레이아웃 확인 및 제목 편집.
- **설정**: 시험지 제목 입력, '단어 쓰기' vs '뜻 쓰기' 모드 전환.
- **저장**: jsPDF를 활용한 A4 규격 자동 페이지 분할 PDF 다운로드.

### Step 3: 단어 폭탄 게임 (Play)
- **기능**: 업로드한 단어로 즐기는 타자 방어 게임 (산성비 스타일).
- **디자인**: 퓨즈와 불꽃이 있는 애니메이션 폭탄 오브젝트.

## 4. 기술 스택
- **Frontend**: HTML5, CSS3, JavaScript (ES Modules), Firebase SDK
- **Backend**: Firebase Cloud Functions (Node.js)
- **AI**: OpenAI GPT-4o mini (Vision)
- **Libraries**: `jsPDF`, `jspdf-autotable`, `Lucide Icons`

## 5. 보안 및 배포
- **보안**: OpenAI API Key를 클라이언트 코드에 노출하지 않고 Firebase Secrets Manager를 통해 서버에서만 사용.
- **CI/CD**: GitHub Actions를 통한 GitHub Pages 자동 배포.
