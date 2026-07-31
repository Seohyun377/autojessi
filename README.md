# 인증중고차 — Export Auction (autojessi)

수출용 인증중고차 경매 플랫폼 프로토타입. 빌드 과정이 없는 정적 사이트입니다.

## 구조

```
index.html      전체 CSS + 폰트/모듈 로드 (엔트리)
src/            화면 모듈 (JSX, 브라우저에서 Babel 트랜스파일)
  app.jsx         셸: 라우팅, 경매 시뮬레이션, 네비, 로그인
  auth.jsx        로그인 / 회원 유형 / 개인·법인 가입 / 법인 승인 관리
  listing.jsx     경매 목록
  detail.jsx      차량 상세 + 입찰 패널
  notice.jsx      공시정보 (캘린더)
  register.jsx    공시등록 마법사 + 차량 자산 관리
  data.jsx        차량 데이터
  i18n.jsx        ko / en / de
  i18n-vi.jsx     vi
  components.jsx  아이콘, 공용 컴포넌트
  win.jsx         낙찰 플로우
assets/         CI, 아이콘 SVG
fonts/          Pretendard, Spline Sans Mono
images/         차량 사진, 실내 갤러리
vendor/         React, Babel (핀 고정 사본)
```

## 로컬 실행

빌드 불필요. 정적 서버로 띄우면 됩니다.

```
npx serve .
```

## 배포 (Vercel)

프레임워크 프리셋 없음 / 빌드 커맨드 없음 / 출력 디렉터리 `.`

```
vercel --prod
```

## 수정 시 주의

`src/*.jsx`를 수정하면 `index.html`의 해당 `<script src="src/xxx.jsx?v=N">` 캐시버스터 `N`을 올려야 브라우저가 새 버전을 읽습니다.
