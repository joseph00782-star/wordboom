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
    - **Glassmorphism**: 카드 요소에 은은한 블러와 테두리 적용.
    - **Micro-interactions**: 버튼 호버 시 부드러운 글로우 효과.

## 3. 주요 기능 상세 (User Flow)

### Step 1: AI 기반 스마트 추출 (Input)
- **기능**: 단어장 사진 업로드 및 AI 분석.
- **기술**: (계획) Firebase Storage + Cloud Functions (GPT-4o mini).
- **UI**: 추출된 단어를 즉시 수정/추가 가능한 인터랙티브 테이블.

### Step 2: 시험지 & 정답지 미리보기 (Preview)
- **기능**: PDF 생성 전 웹에서 시험지 레이아웃 확인.
- **설정**: '단어 쓰기' vs '뜻 쓰기' 모드 전환.
- **미리보기**: 시험지(빈칸)와 정답지(빨간색 텍스트) 탭 전환 지원.
- **저장**: jsPDF를 활용한 고품질 PDF 다운로드.

### Step 3: 단어 폭탄 게임 (Play)
- **기능**: 업로드한 단어로 즐기는 타자 방어 게임 (산성비 스타일).
- **모드**: 영단어 입력 vs 뜻 입력.
- **방식**: 화면에서 내려오는(또는 다가오는) 단어를 정확히 입력하여 폭파.

## 4. 기술 스택
- **Frontend**: HTML5, CSS3 (Modern Baseline), JavaScript (ES Modules)
- **Libraries**:
    - `jsPDF` / `jspdf-autotable`: PDF 생성
    - `Lucide Icons`: 세련된 아이콘 적용
- **Backend (Planned)**: Firebase (Auth, Firestore, Storage, Functions), GPT-4o mini API

## 5. 단계별 구현 계획
1. **기본 레이아웃 및 네비게이션 구축**: 현대적인 상단 바와 섹션 구조화.
2. **데이터 테이블 UI 구현**: 추출된 단어 편집 및 관리 최적화.
3. **시험지 미리보기 엔진**: 웹상에서 PDF 레이아웃 시뮬레이션.
4. **단어 폭탄 게임 로직**: 캔버스 기반의 타자 게임 엔진 고도화.
