// 실행 중인 앱의 mock 추천 API 계약을 검증함. 실연동 후에도 같은 계약을 유지해야 함.
// 사용: npm run dev (다른 셸) 후  BASE_URL=http://localhost:5100 node scripts/live-check.mjs

const BASE = process.env.BASE_URL || "http://localhost:5100";
let pass = 0, fail = 0;

async function post(body) {
  const r = await fetch(`${BASE}/api/v1/recommend`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: r.status, json: await r.json() };
}

function check(name, cond) {
  if (cond) { pass++; console.log(`  ok  ${name}`); }
  else { fail++; console.log(`FAIL  ${name}`); }
}

const base = { area: "해운대", timeHours: 5, budget: 70000, partySize: 2, interests: ["food", "view"], exclude: [] };

// 1. 정상: Top-3 이내, 점수 내림차순, 시간·예산 준수
{
  const { status, json } = await post(base);
  check("정상 추천 200", status === 200 && json.ok === true);
  check("코스 1~3개", json.courses.length >= 1 && json.courses.length <= 3);
  check("점수 내림차순", json.courses.every((c, i, a) => i === 0 || a[i - 1].score >= c.score));
  const budgetTotal = base.budget * base.partySize;
  check("예산 준수", json.courses.every((c) => c.totalCost <= budgetTotal));
  check("시간 준수", json.courses.every((c) => c.totalMin <= base.timeHours * 60));
  check("근거 카드 3줄", json.courses.every((c) => c.reason.budget && c.reason.time && c.reason.safety));

  // ADR-008: 4요소 재정규화 수식과 응답 점수 일치. 배지와 출처 계수가 섞이면 어긋남
  const T = base.timeHours * 60;
  const expected = (c) => {
    const n = c.places.length;
    const fit = c.places.filter((p) => base.interests.includes(p.interest)).length / n;
    const rep = c.places.reduce((s, p) => s + p.rating, 0) / n / 5;
    const costEff = Math.max(0, 1 - c.totalCost / budgetTotal);
    const timeEff = Math.max(0, 1 - Math.abs(T - c.totalMin) / T);
    return Math.round(((fit * 0.3 + rep * 0.2 + costEff * 0.2 + timeEff * 0.15) / 0.85) * 100);
  };
  check("점수 = 4요소 재정규화 수식", json.courses.every((c) => c.score === expected(c)));
  check("점수 0~100 정수", json.courses.every((c) => Number.isInteger(c.score) && c.score >= 0 && c.score <= 100));
  check("근거에 검증·공식 출처 주장 없음", json.courses.every((c) => !/검증 배지|TourAPI|한국관광공사/.test(c.reason.safety)));
}

// 2. 제외 관심사 반영
{
  const { json } = await post({ ...base, interests: ["culture"], exclude: ["food"] });
  const hasFood = json.courses?.some((c) => c.places.some((p) => p.interest === "food"));
  check("제외 관심사(food) 미포함", !hasFood);
}

// 3. 검증: 시간/예산 범위 밖 입력 400
{
  const { status } = await post({ ...base, timeHours: 1 });
  check("시간 범위 밖 400", status === 400);
}
{
  const { status } = await post({ ...base, budget: 0 });
  check("예산 0 → 400", status === 400);
}
{
  const { status } = await post({ ...base, partySize: 0 });
  check("인원 0 → 400", status === 400);
}

// 4. 코스 없음: 시간·예산을 극단으로 좁혀 noCourse 반환
{
  const { status, json } = await post({ ...base, timeHours: 2, budget: 1000, interests: [], exclude: [] });
  check("코스 없음 noCourse", status === 200 && json.error === "noCourse");
}

// 5. 권역 반영 (ADR-005). 이 셋이 통과하기 전에는 D-1 해소로 적지 않는다.
async function getAreas() {
  const r = await fetch(BASE + "/api/v1/areas");
  return { status: r.status, json: await r.json() };
}
const R = 6371, rad = (d) => (d * Math.PI) / 180;
const km = (a, b) => {
  const dLat = rad(b.mapy - a.mapy), dLng = rad(b.mapx - a.mapx);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.mapy)) * Math.cos(rad(b.mapy)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

let AREAS = [];
{
  const { status, json } = await getAreas();
  check("areas 200 + 목록", status === 200 && json.ok && Array.isArray(json.areas) && json.areas.length > 0);
  AREAS = json.areas || [];
  check("areas 필드(key,label,mapx,mapy,origin)", AREAS.every((a) => a.key && a.label && typeof a.mapx === "number" && typeof a.mapy === "number" && a.origin));
}

// area-label-map: 표시 라벨이 데이터 키에 매핑되는가 (D-10)
{
  const seomyeon = AREAS.find((a) => a.label === "서면·전포");
  check("area-label-map: 서면·전포 라벨 존재", !!seomyeon);
  check("area-label-map: 데이터 키는 전포", seomyeon?.key === "전포");
  const { status, json } = await post({ ...base, area: seomyeon?.key });
  check("area-label-map: 서면·전포가 코스를 냄", status === 200 && json.ok && json.courses.length > 0);
}

// area-echo: 코스 첫 장소가 요청 권역 기준점에서 반경 안인가 (D-1)
{
  for (const a of AREAS) {
    const { json } = await post({ ...base, area: a.key });
    if (!json.ok) { check("area-echo: " + a.label + " 코스 있음", false); continue; }
    const first = json.courses[0].places[0];
    check("area-echo: " + a.label + " 첫 장소가 8km 내", km(a, first) <= 8.001);
  }
}

// area-sparse-fallback: 자체 후보 1건 권역이 반경 확대로 성립하는가 (D-1)
{
  const gw = AREAS.find((a) => a.key === "광안리");
  const { status, json } = await post({ ...base, area: gw?.key });
  check("area-sparse-fallback: 광안리가 코스를 냄", status === 200 && json.ok && json.courses.length > 0);
  const mixed = json.ok && json.courses[0].places.some((p) => p.area !== "광안리");
  check("area-sparse-fallback: 인접 권역이 섞임", mixed === true);
  check("area-sparse-fallback: 근거에 범위 확대 표기", json.ok && /밖 \d+곳 포함/.test(json.courses[0].reason.time));
}

// 권역이 결과를 실제로 바꾸는가 (D-1 의 본질)
{
  const ids = [];
  for (const a of AREAS) {
    const { json } = await post({ ...base, area: a.key });
    ids.push(json.ok ? json.courses[0].id : "none:" + a.key);
  }
  check("권역마다 1위 코스가 동일하지 않음", new Set(ids).size > 1);
}


console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
