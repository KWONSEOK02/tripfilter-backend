import cors from "cors";
import express from "express";
import { fetchAreas, recommend, type FilterInput } from "./tripfilter.js";

// POST /api/v1/recommend — 입력값으로 Top-3 코스를 반환하는 mock 추천 API.
// 응답 계약 정본은 docs/architecture/api-contract.md임. 실연동 시 recommend() 내부 fetchPlaces만 교체함(계약 불변).
const app = express();
app.use(express.json());
app.use(cors({ origin: (process.env.CORS_ORIGIN ?? "http://localhost:3000").split(",") }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// GET /api/v1/areas — 권역 목록과 기준점의 서버 정본 (ADR-005 Decision 4).
// 화면의 하드코딩 AREAS 배열을 대체하며 표시 라벨과 데이터 키를 분리해 반환함 (D-10).
app.get("/api/v1/areas", (_req, res) => {
  res.json({ ok: true, areas: fetchAreas() });
});

app.post("/api/v1/recommend", (req, res) => {
  const body = (req.body ?? {}) as Partial<FilterInput>;

  const timeHours = Number(body.timeHours);
  const budget = Number(body.budget);
  const partySize = Number(body.partySize);
  if (!(timeHours >= 2 && timeHours <= 10)) {
    res.status(400).json({ error: "invalidTime" });
    return;
  }
  if (!(budget > 0) || !(partySize >= 1)) {
    res.status(400).json({ error: "invalidInput" });
    return;
  }

  const input: FilterInput = {
    area: typeof body.area === "string" ? body.area : "해운대",
    timeHours,
    budget,
    partySize,
    interests: Array.isArray(body.interests) ? body.interests : [],
    exclude: Array.isArray(body.exclude) ? body.exclude : [],
  };

  const courses = recommend(input);
  if (courses.length === 0) {
    res.status(200).json({ error: "noCourse" });
    return;
  }
  res.json({ ok: true, courses });
});

const port = Number(process.env.PORT ?? 5100);
app.listen(port, () => {
  console.log(`tripfilter-backend listening on http://localhost:${port}`);
});
