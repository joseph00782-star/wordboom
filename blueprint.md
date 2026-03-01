# 💣 [WORDBOOM] 프로젝트 최종 설계서

## 1. 서비스 컨셉
- **슬로건**: "사진 한 장으로 만드는 나만의 단어 시험지와 액션 게임"
- **핵심 흐름**: 사진 업로드 → AI(GPT-4o mini) 데이터 추출 → 시험지/정답지 미리보기 → PDF 저장 및 게임 플레이

## 2. 디자인 시스템: "Sophisticated Vibrant"
- **컨셉**: 유니크하면서도 과하지 않은 세련된 디자인.
- **컬러 팔레트**:
    - Primary: Deep Indigo (#4F46E5)
    - Accent: Neon Cyan (#06B6D4) / Soft Rose (#FB7185)
    - Background: Light Grayish Blue (oklch(97% 0.01 250))
- **UI 특징**: 
    - **Navigation Bar**: 상단 고정, 섹션 간 빠른 이동 지원.
    - **API Settings**: OpenAI API Key 설정을 통한 GPT-4o mini 연동.
    - **Glassmorphism**: 카드 요소에 은은한 블러와 테두리 적용.

## 3. 주요 기능 상세 (User Flow)

### Step 1: GPT-4o mini 기반 스마트 추출 (Input)
- **기능**: 단어장 사진 업로드 및 GPT-4o mini 분석.
- **프롬프트**: "이미지 속 단어와 뜻을 구별해 JSON 구조로 반환하고 오타를 교정해줘."
- **UI**: 추출된 단어를 즉시 수정/추가 가능한 인터랙티브 테이블.

### Step 2: A4 시험지 & 정답지 미리보기 (Preview)
- **기능**: PDF 생성 전 웹에서 시험지 레이아웃 확인.
- **설정**: 시험지 제목 입력, '단어 쓰기' vs '뜻 쓰기' 모드 전환.
- **저장**: jsPDF를 활용한 A4 규격 자동 페이지 분할 PDF 다운로드.

### Step 3: 단어 폭탄 게임 (Play)
- **기능**: 업로드한 단어로 즐기는 타자 방어 게임 (산성비 스타일).
- **디자인**: 퓨즈와 불꽃이 있는 애니메이션 폭탄 오브젝트.
- **방식**: 화면에서 내려오는 단어 폭탄을 정확히 입력하여 폭파.

## 4. 기술 스택
- **Frontend**: HTML5, CSS3 (Modern Baseline), JavaScript (ES Modules)
- **AI**: OpenAI GPT-4o mini (Vision)
- **Libraries**:
    - `jsPDF` / `jspdf-autotable`: PDF 생성
    - `Lucide Icons`: 세련된 아이콘 적용

## 5. 자동 배포 (CI/CD)
- **GitHub Actions**: `main` 브랜치 푸시 시 GitHub Pages 자동 배포.
