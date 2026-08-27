# tripfilter-backend

부산 트립필터의 추천 API 레포. mock 부산 관광 후보로 Top-3 코스를 계산해 반환한다.

- 스택: Express 5, TypeScript, tsx
- 엔드포인트: `POST /api/v1/recommend`, `GET /health`
- mock 경계: `src/tripfilter.ts`의 `fetchPlaces()` 한 곳. 본선 실연동 시 여기만 TourAPI 호출로 교체한다

## 실행

```bash
npm install
npm run dev        # 5100
```

포트와 CORS 허용 오리진은 `.env.example` 참조(`PORT`, `CORS_ORIGIN`). 실연동 단계의 `TOURAPI_SERVICE_KEY`는 이 레포에만 둔다.

## 검증

```bash
npm run typecheck
npm run build
npm run dev &
BASE_URL=http://localhost:5100 npm run check   # 계약 11 케이스
```

## 문서

응답 계약 정본은 `../docs/architecture/api-contract.md`, 문서 진입점은 `../docs/INDEX.md`다. 이 레포에 `docs/`를 만들지 않는다.
AI 에이전트 작업 규칙은 `../AGENTS.md` 참조.
