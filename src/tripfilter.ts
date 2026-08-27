// TripFilter 핵심 도메인 — 타입, mock 부산 관광 후보, 코스 추천 로직.
// 본선 실연동 전까지 TourAPI 호출을 이 mock으로 대체함. 실연동 시 fetchPlaces만 교체함.
// ponytail: 타입 정의는 tripfilter-frontend/src/lib/tripfilter.ts와 이원화됨. 멀티레포 분리의 비용이며
// 계약 정본은 docs/architecture/api-contract.md임. 드리프트는 live-check.mjs가 잡음.
// 공유 패키지(npm workspace·private registry)는 두 레포가 각자 배포 주기를 갖게 된 뒤 도입함.

export type Interest = "food" | "view" | "culture" | "nature" | "shopping" | "activity";

// 사용자 입력(제안서 4p 1단계). 위치는 MVP에서 부산 권역 라벨로 단순화함.
export interface FilterInput {
  area: string; // 출발 권역(예: "해운대")
  timeHours: number; // 2~10
  budget: number; // 1인 예산(원)
  partySize: number;
  interests: Interest[];
  exclude: Interest[];
}

// TourAPI areaBasedList2/detailCommon2 형태를 본뜬 관광 후보. mapx/mapy는 WGS84(경도/위도).
export interface Place {
  contentId: string;
  title: string;
  area: string;
  addr: string;
  mapx: number; // 경도(WGS84)
  mapy: number; // 위도(WGS84)
  interest: Interest;
  avgCost: number; // 1인 예상 비용(원). 무료는 0
  dwellMin: number; // 평균 체류 시간(분)
  indoor: boolean;
  rating: number; // 외부 평판 0~5
  reviewCount: number;
  safetyBadge: "verified" | "info" | "caution"; // 안전·검증 신호
  source: "TourAPI" | "TourAPI+Kakao"; // 데이터 출처(신뢰도)
}

// 추천 근거 카드 3줄(제안서 5단계).
export interface Reason {
  budget: string;
  time: string;
  safety: string;
}

export interface Course {
  id: string;
  title: string;
  places: Place[];
  totalCost: number; // 1인 합계
  totalMin: number; // 이동 포함 소요(분)
  score: number; // 0~100
  reason: Reason;
}

// --- mock 부산 관광 후보(areaCode=6). 실연동 시 TourAPI 응답으로 대체함. ---
export const MOCK_PLACES: Place[] = [
  { contentId: "126508", title: "해운대 해수욕장", area: "해운대", addr: "부산 해운대구 우동", mapx: 129.1603, mapy: 35.1587, interest: "nature", avgCost: 0, dwellMin: 60, indoor: false, rating: 4.6, reviewCount: 21043, safetyBadge: "verified", source: "TourAPI" },
  { contentId: "126509", title: "광안리 해수욕장", area: "광안리", addr: "부산 수영구 광안동", mapx: 129.1186, mapy: 35.1532, interest: "view", avgCost: 0, dwellMin: 60, indoor: false, rating: 4.7, reviewCount: 18820, safetyBadge: "verified", source: "TourAPI" },
  { contentId: "126510", title: "감천문화마을", area: "사하", addr: "부산 사하구 감내2로", mapx: 129.0107, mapy: 35.0975, interest: "culture", avgCost: 0, dwellMin: 90, indoor: false, rating: 4.4, reviewCount: 15201, safetyBadge: "verified", source: "TourAPI" },
  { contentId: "126511", title: "자갈치시장", area: "남포동", addr: "부산 중구 자갈치해안로", mapx: 129.0306, mapy: 35.0966, interest: "food", avgCost: 25000, dwellMin: 75, indoor: true, rating: 4.3, reviewCount: 12044, safetyBadge: "info", source: "TourAPI+Kakao" },
  { contentId: "126512", title: "BIFF 광장 먹거리", area: "남포동", addr: "부산 중구 비프광장로", mapx: 129.0282, mapy: 35.0986, interest: "food", avgCost: 15000, dwellMin: 45, indoor: false, rating: 4.1, reviewCount: 6033, safetyBadge: "caution", source: "TourAPI+Kakao" },
  { contentId: "126513", title: "전포 카페거리", area: "전포", addr: "부산 부산진구 전포대로", mapx: 129.0651, mapy: 35.1568, interest: "shopping", avgCost: 12000, dwellMin: 60, indoor: true, rating: 4.5, reviewCount: 9912, safetyBadge: "verified", source: "TourAPI+Kakao" },
  { contentId: "126514", title: "흰여울문화마을", area: "영도", addr: "부산 영도구 흰여울길", mapx: 129.0466, mapy: 35.0782, interest: "view", avgCost: 0, dwellMin: 75, indoor: false, rating: 4.5, reviewCount: 8821, safetyBadge: "verified", source: "TourAPI" },
  { contentId: "126515", title: "국립해양박물관", area: "영도", addr: "부산 영도구 해양로", mapx: 129.0759, mapy: 35.0776, interest: "culture", avgCost: 0, dwellMin: 90, indoor: true, rating: 4.4, reviewCount: 5402, safetyBadge: "verified", source: "TourAPI" },
  { contentId: "126516", title: "송정 서핑", area: "기장", addr: "부산 해운대구 송정해변로", mapx: 129.2003, mapy: 35.1789, interest: "activity", avgCost: 45000, dwellMin: 120, indoor: false, rating: 4.6, reviewCount: 3120, safetyBadge: "info", source: "TourAPI+Kakao" },
  { contentId: "126517", title: "더베이101 야경", area: "해운대", addr: "부산 해운대구 동백로", mapx: 129.1525, mapy: 35.1546, interest: "view", avgCost: 18000, dwellMin: 60, indoor: true, rating: 4.6, reviewCount: 7740, safetyBadge: "verified", source: "TourAPI+Kakao" },
  { contentId: "126518", title: "부산현대미술관", area: "사하", addr: "부산 사하구 낙동남로", mapx: 128.9433, mapy: 35.1075, interest: "culture", avgCost: 0, dwellMin: 75, indoor: true, rating: 4.2, reviewCount: 2980, safetyBadge: "verified", source: "TourAPI" },
  { contentId: "126519", title: "남포동 국제시장", area: "남포동", addr: "부산 중구 신창동", mapx: 129.0276, mapy: 35.1015, interest: "shopping", avgCost: 20000, dwellMin: 60, indoor: false, rating: 4.2, reviewCount: 10433, safetyBadge: "info", source: "TourAPI+Kakao" },
];

// mock TourAPI 조회. 실연동 시 이 함수만 areaBasedList2/locationBasedList2 호출로 교체함.
export function fetchPlaces(): Place[] {
  return MOCK_PLACES;
}

// --- 권역 정본 (ADR-005 Decision 4, 5) ---
// 화면 표기 라벨과 데이터 키를 분리함. "서면·전포" 라벨이 데이터의 "전포"에 매핑되지 않아
// 항상 noCourse가 되던 문제를 여기서 해소함 (D-10).
export interface Area {
  key: string; // 데이터의 Place.area 값
  label: string; // 화면 표기
  mapx: number; // 기준점 경도(WGS84)
  mapy: number; // 기준점 위도(WGS84)
  origin: "mock-centroid"; // 좌표 출처. 법정동 기준으로 교체 시 값이 바뀜 (ADR-005 Decision 4)
}

const AREA_LABELS: { key: string; label: string }[] = [
  { key: "해운대", label: "해운대" },
  { key: "광안리", label: "광안리" },
  { key: "남포동", label: "남포동" },
  { key: "전포", label: "서면·전포" },
  { key: "영도", label: "영도" },
];

// 기준점은 그 권역 후보들의 좌표 중심점임. 잠정값이며 최종 기준은 ADR-002 법정동 전환과 같은 회차에 정함.
export function fetchAreas(): Area[] {
  const places = fetchPlaces();
  return AREA_LABELS.map(({ key, label }) => {
    const own = places.filter((p) => p.area === key);
    const n = own.length || 1;
    return {
      key,
      label,
      mapx: own.reduce((s, p) => s + p.mapx, 0) / n,
      mapy: own.reduce((s, p) => s + p.mapy, 0) / n,
      origin: "mock-centroid" as const,
    };
  });
}

const SAFETY_TRUST: Record<Place["safetyBadge"], number> = { verified: 1, info: 0.7, caution: 0.4 };
const SOURCE_TRUST: Record<Place["source"], number> = { TourAPI: 1, "TourAPI+Kakao": 0.9 };

// 좌표 한 쌍. Place와 Area 기준점을 같은 함수로 다루기 위함.
interface Coord {
  mapx: number;
  mapy: number;
}

// 두 좌표 간 직선 거리(km) — Haversine. mock 이동시간 추정에 사용함.
function distanceKm(a: Coord, b: Coord): number {
  const R = 6371;
  const dLat = ((b.mapy - a.mapy) * Math.PI) / 180;
  const dLng = ((b.mapx - a.mapx) * Math.PI) / 180;
  const lat1 = (a.mapy * Math.PI) / 180;
  const lat2 = (b.mapy * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ponytail: 도심 평균 20km/h 가정한 단순 이동시간. 실연동 시 Kakao Directions로 교체함.
function travelMin(a: Coord, b: Coord): number {
  return Math.round((distanceKm(a, b) / 20) * 60) + 5; // 환승·도보 버퍼 5분
}

// 출발 기준점에서 첫 장소까지의 구간을 포함함 (ADR-005 Decision 3).
// origin이 없으면 예전처럼 장소 사이만 합산함.
function courseMinutes(places: Place[], origin?: Coord): number {
  let min = 0;
  for (let i = 0; i < places.length; i++) {
    min += places[i].dwellMin;
    if (i > 0) min += travelMin(places[i - 1], places[i]);
    else if (origin) min += travelMin(origin, places[0]);
  }
  return min;
}

function courseCost(places: Place[], partySize: number): number {
  return places.reduce((s, p) => s + p.avgCost, 0) * partySize;
}

// 제안서 4단계 점수화 — 취향·평판·가격효율·이동효율·데이터신뢰도 가중합(0~100).
function scoreCourse(places: Place[], input: FilterInput, origin?: Coord): number {
  const budgetTotal = input.budget * input.partySize;
  const cost = courseCost(places, input.partySize);
  const min = courseMinutes(places, origin);
  const timeBudget = input.timeHours * 60;

  const fit = places.filter((p) => input.interests.includes(p.interest)).length / places.length; // 취향 적합도
  const rep = places.reduce((s, p) => s + p.rating, 0) / places.length / 5; // 외부 평판
  const costEff = budgetTotal === 0 ? 1 : Math.max(0, 1 - cost / budgetTotal); // 가격 효율(예산 대비 여유)
  const timeEff = Math.max(0, 1 - Math.abs(timeBudget - min) / timeBudget); // 이동 효율(시간 적합)
  const trust =
    places.reduce((s, p) => s + SAFETY_TRUST[p.safetyBadge] * SOURCE_TRUST[p.source], 0) / places.length; // 데이터 신뢰도

  const score = fit * 0.3 + rep * 0.2 + costEff * 0.2 + timeEff * 0.15 + trust * 0.15;
  return Math.round(score * 100);
}

function reasonFor(places: Place[], input: FilterInput, origin?: Coord, area?: Area): Reason {
  const cost = courseCost(places, input.partySize);
  const min = courseMinutes(places, origin);
  const budgetTotal = input.budget * input.partySize;
  const verified = places.filter((p) => p.safetyBadge === "verified").length;

  // 범위가 넓어진 사실을 결과가 숨기지 않음 (ADR-005 Decision 6).
  // 표기 형태는 UX 실증 근거 없이 우리 판단으로 정한 것임.
  let outsideNote = "";
  if (area && origin) {
    const outside = places.filter((p) => p.area !== area.key);
    if (outside.length > 0) {
      const far = Math.max(...outside.map((p) => travelMin(origin, p)));
      outsideNote = ` · ${area.label} 밖 ${outside.length}곳 포함(최대 ${far}분)`;
    }
  }

  return {
    budget: cost === 0 ? `무료 코스 (예산 ${budgetTotal.toLocaleString()}원 내)` : `1인 ${(cost / input.partySize).toLocaleString()}원 · 예산의 ${Math.round((cost / budgetTotal) * 100)}%`,
    time: `약 ${Math.floor(min / 60)}시간 ${min % 60}분 (가용 ${input.timeHours}시간 내)${outsideNote}`,
    safety: `검증 배지 ${verified}/${places.length} · 출처 한국관광공사 TourAPI`,
  };
}

// 후보지에서 시간·예산을 만족하는 코스를 만들어 Top-3 반환함.
// 반경 단계 (ADR-005 Decision 8). 기본 5km, 후보가 2곳 미만이면 8km로 한 번만 넓힘.
// 검증된 최선이 아니라 선례가 있는 출발점임 — 실연동 후 재측정 대상.
const RADIUS_STEPS_KM = [5, 8];
const MIN_PLACES_PER_COURSE = 2;

export function recommend(input: FilterInput): Course[] {
  const excluded = fetchPlaces().filter((p) => !input.exclude.includes(p.interest));

  // 출발 권역의 기준점을 찾음. 알 수 없는 권역이면 반경을 적용하지 않고 전 후보를 씀.
  const area = fetchAreas().find((a) => a.key === input.area || a.label === input.area);
  const origin: Coord | undefined = area ? { mapx: area.mapx, mapy: area.mapy } : undefined;

  // 반경으로 후보를 좁힘 (ADR-005 Decision 2). 라벨 문자열 일치로 거르지 않음.
  let pool = excluded;
  if (origin) {
    for (const km of RADIUS_STEPS_KM) {
      const within = excluded.filter((p) => distanceKm(origin, p) <= km);
      if (within.length >= MIN_PLACES_PER_COURSE) {
        pool = within;
        break;
      }
      pool = within; // 마지막 단계까지 부족하면 그대로 두고 아래에서 noCourse로 떨어짐
    }
  }

  // 시드 정렬 — 취향 일치 우선, 그다음 출발점에서 가까운 순, 마지막이 평판
  const seeds = [...pool].sort((a, b) => {
    const af = input.interests.includes(a.interest) ? 1 : 0;
    const bf = input.interests.includes(b.interest) ? 1 : 0;
    if (bf !== af) return bf - af;
    if (origin) {
      const d = distanceKm(origin, a) - distanceKm(origin, b);
      if (Math.abs(d) > 0.01) return d;
    }
    return b.rating - a.rating;
  });

  const timeBudget = input.timeHours * 60;
  const budgetTotal = input.budget * input.partySize;
  const courses: Course[] = [];
  const usedKey = new Set<string>();

  for (const seed of seeds) {
    const places: Place[] = [seed];
    for (const p of seeds) {
      if (places.includes(p)) continue;
      const next = [...places, p];
      if (courseMinutes(next, origin) <= timeBudget && courseCost(next, input.partySize) <= budgetTotal) {
        places.push(p);
      }
      if (places.length >= 4) break;
    }
    if (places.length < MIN_PLACES_PER_COURSE) continue;
    const key = places.map((p) => p.contentId).sort().join("-");
    if (usedKey.has(key)) continue;
    usedKey.add(key);
    courses.push({
      id: key,
      title: `${area ? area.label : places[0].area} 출발 ${places.map((p) => p.title.split(" ")[0]).join(" · ")}`,
      places,
      totalCost: courseCost(places, input.partySize),
      totalMin: courseMinutes(places, origin),
      score: scoreCourse(places, input, origin),
      reason: reasonFor(places, input, origin, area),
    });
  }

  return courses.sort((a, b) => b.score - a.score).slice(0, 3);
}

// INTERESTS, DEFAULT_INPUT, mapLinks는 화면 표시 전용이라 tripfilter-frontend에만 둠.
