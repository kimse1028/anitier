# AniTier  AniTier

 나만의 애니메이션 랭킹을 만들고 공유하세요!

 ## 📖 프로젝트 소개

 AniTier는 사용자가 자신만의 애니메이션 티어 리스트를 만들고 다른 사람들과 공유할 수 있는 웹 애플리케이션입니다. "국가권력급"부터 "F랭크"까지, 재미있는 등급으로 애니메이션에 대한 당신의 평가를 표현해보세요.

 ## ✨ 주요 기능

 * **간편한 로그인**: Google 계정으로 쉽게 로그인하고 서비스를 이용할 수 있습니다.
 * **드래그 앤 드롭 인터페이스**: 직관적인 드래그 앤 드롭 방식으로 손쉽게 티어 리스트를 만들고 수정할 수 있습니다.
 * **다른 사용자 티어리스트 탐색**: 다른 사용자들은 어떤 애니메이션을 어떻게 평가했는지 구경하고 새로운 애니메이션을 발견할 수 있습니다.
 * **개인 프로필**: 자신만의 프로필 페이지에서 생성한 티어 리스트를 관리하고 다른 사람들에게 공유할 수 있습니다.
 * **다크/라이트 모드**: 사용자의 취향에 맞춰 편안한 환경에서 서비스를 이용할 수 있도록 테마 변경 기능을 제공합니다.

 ## 🛠️ 기술 스택

 * **프레임워크**: Next.js
 * **언어**: TypeScript
 * **UI**: React, Tailwind CSS
 * **백엔드 및 데이터베이스**: Firebase (Authentication, Firestore)
 * **드래그 앤 드롭**: @dnd-kit

 ## 🚀 시작 가이드

 ### 사전 준비

 * Node.js (v18.x 이상)
 * npm 또는 yarn

 ### 설치 및 실행

 1. **프로젝트 클론**

 ```bash
 git clone https://github.com/your-username/anitier.git
 cd anitier
 ```

 2. **의존성 설치**

 ```bash
 npm install
 # 또는
 yarn install
 ```

 3. **Firebase 설정**

  * Firebase 콘솔에서 새 프로젝트를 생성합니다.
  * 웹 앱을 추가하고 Firebase SDK 구성 객체를 복사합니다.
  * 프로젝트 루트에 `.env.local` 파일을 생성하고 아래와 같이 Firebase 환경 변수를 추가합니다.

 ```
 NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
 NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
 NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
 NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
 NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
 NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
 ```

  * Firebase Authentication에서 'Google' 제공업체를 활성화합니다.
  * Firestore Database를 생성하고 보안 규칙을 설정합니다.

 4. **개발 서버 실행**

 ```bash
 npm run dev
 # 또는
 yarn dev
 ```

  브라우저에서 `http://localhost:3000`으로 접속하여 애플리케이션을 확인할 수 있습니다.

 ## 📁 프로젝트 구조

 ```
 .
 ├── app/ # Next.js App Router 기반 페이지
 ├── components/ # 공통 UI 컴포넌트
 ├── contexts/ # React Context (테마 등)
 ├── lib/ # Firebase 설정 등 라이브러리 파일
 ├── public/ # 정적 에셋
 └── ...
 ```
