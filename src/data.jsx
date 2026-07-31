// data.jsx — mock data + formatting/currency helpers for the car export auction
// Exposes to window: AUCTION (vehicles + helpers), CURRENCIES, fmt*

// ── Currencies (KRW base) ────────────────────────────────────────────────────
const CURRENCIES = {
  KRW: { code: "KRW", symbol: "₩",  perKRW: 1,         locale: "ko-KR", label: "원" },
  USD: { code: "USD", symbol: "$",  perKRW: 1 / 1378,  locale: "en-US", label: "달러" },
  EUR: { code: "EUR", symbol: "€",  perKRW: 1 / 1488,  locale: "de-DE", label: "유로" },
  VND: { code: "VND", symbol: "₫",  perKRW: 18.7,      locale: "vi-VN", label: "동" },
  AED: { code: "AED", symbol: "AED ", perKRW: 1 / 375, locale: "en-US", label: "디르함" },
  RUB: { code: "RUB", symbol: "₽",  perKRW: 1 / 14.6,  locale: "ru-RU", label: "루블" },
};

function fmtKRW(v) {
  return "₩" + Math.round(v).toLocaleString("ko-KR");
}
// short Korean money e.g. 3,850만 / 1억 2,300만
function fmtKRWShort(v) {
  const eok = Math.floor(v / 100000000);
  const man = Math.round((v % 100000000) / 10000);
  if (eok > 0) return `${eok}억${man > 0 ? " " + man.toLocaleString("ko-KR") + "만" : ""}`;
  return `${man.toLocaleString("ko-KR")}만`;
}
function fmtConverted(krw, code) {
  if (code === "KRW" || !CURRENCIES[code]) return null;
  const c = CURRENCIES[code];
  const v = krw * c.perKRW;
  const rounded = v >= 10000 ? Math.round(v / 100) * 100 : Math.round(v);
  return c.symbol + rounded.toLocaleString(c.locale);
}

// ── Vehicles ─────────────────────────────────────────────────────────────────
const MIN = 60, HOUR = 3600, DAY = 86400;

// offsetSec = seconds from the shared auction epoch until this auction ends.
const RAW = [
  {
    id: "carnival_limo",
    maker: "기아", model: "카니발 하이리무진", year: 2024, trim: "에스모터스 9인승 리무진",
    mileage: 18200, fuel: "디젤", trans: "자동", color: "오로라 블랙 펄",
    vin: "KNAME81ADRA512845", region: "서울",
    start: 55000000, current: 62000000, bids: 19, bidders: 8,
    offsetSec: 9 * MIN, // featured live — ends very soon
    inspect: { exterior: "A", interior: "A", engine: "A", accident: "무사고" },
    accidentNote: "법인 1인 운행. 무사고. 하이리무진 개조 정품.",
    img: "images/cars/carnival-limo.png",
    featured: true,
  },
  {
    id: "ev9",
    maker: "기아", model: "EV9", year: 2024, trim: "GT-line 6인승 AWD",
    mileage: 12400, fuel: "전기", trans: "자동", color: "아틀라스 화이트",
    vin: "KNDC34GA9R5012390", region: "경기 화성",
    start: 60000000, current: 68200000, bids: 14, bidders: 6,
    offsetSec: 41 * MIN,
    inspect: { exterior: "A", interior: "A", engine: "A", accident: "무사고" },
    accidentNote: "무사고. 출고 1년 미만 신조차.",
    img: "images/cars/ev9.png",
    featured: true,
  },
  {
    id: "ev6",
    maker: "기아", model: "EV6", year: 2023, trim: "GT-line 롱레인지",
    mileage: 28700, fuel: "전기", trans: "자동", color: "스노우 화이트 펄",
    vin: "KNDC34LA8P5118840", region: "인천",
    start: 38000000, current: 42800000, bids: 11, bidders: 5,
    offsetSec: 2 * HOUR + 10 * MIN,
    inspect: { exterior: "A", interior: "B", engine: "A", accident: "무사고" },
    accidentNote: "무사고. 배터리 점검 이상 없음.",
    img: "images/cars/ev6.png",
  },
  {
    id: "ev4",
    maker: "기아", model: "EV4", year: 2025, trim: "GT-line 롱레인지",
    mileage: 6200, fuel: "전기", trans: "자동", color: "아이스 그레이",
    vin: "KNDC44LA2S5004412", region: "서울",
    start: 37000000, current: 41800000, bids: 8, bidders: 4,
    offsetSec: 3 * HOUR + 20 * MIN,
    inspect: { exterior: "A", interior: "A", engine: "A", accident: "무사고" },
    accidentNote: "무사고. 신차급 컨디션.",
    img: "images/cars/ev4.png",
  },
  {
    id: "ev3",
    maker: "기아", model: "EV3", year: 2024, trim: "어스 롱레인지",
    mileage: 14800, fuel: "전기", trans: "자동", color: "아쿠아 민트",
    vin: "KNDC24LA5R5009921", region: "대구",
    start: 31000000, current: 35800000, bids: 9, bidders: 5,
    offsetSec: 5 * HOUR,
    inspect: { exterior: "A", interior: "A", engine: "A", accident: "무사고" },
    accidentNote: "무사고. 1인 운행.",
    img: "images/cars/ev3.png",
  },
  {
    id: "k9",
    maker: "기아", model: "K9", year: 2021, trim: "3.8 퀀텀 AWD",
    mileage: 51300, fuel: "가솔린", trans: "자동", color: "스노우 화이트 펄",
    vin: "KNALW4128MA098221", region: "서울",
    start: 35000000, current: 39800000, bids: 9, bidders: 4,
    offsetSec: 20 * HOUR,
    inspect: { exterior: "B", interior: "A", engine: "A", accident: "무사고" },
    accidentNote: "무사고. 정기 점검 이력 다수.",
    img: "images/cars/k9.png",
  },
  {
    id: "k8",
    maker: "기아", model: "K8", year: 2023, trim: "2.5 시그니처",
    mileage: 33400, fuel: "가솔린", trans: "자동", color: "마차토 브라운",
    vin: "KNAE541CBPA224190", region: "경기 화성",
    start: 28000000, current: 32800000, bids: 11, bidders: 5,
    offsetSec: 22 * HOUR + 30 * MIN,
    inspect: { exterior: "A", interior: "B", engine: "A", accident: "단순교환 1" },
    accidentNote: "후방 범퍼 1회 교환(주차 접촉). 골격 손상 없음.",
    img: "images/cars/k8.png",
  },
  {
    id: "k7",
    maker: "기아", model: "K7", year: 2017, trim: "3.0 GDI 노블레스",
    mileage: 88600, fuel: "가솔린", trans: "자동", color: "스노우 화이트 펄",
    vin: "KNALN412BHA330145", region: "울산",
    start: 13000000, current: 16800000, bids: 6, bidders: 3,
    offsetSec: 1 * DAY + 4 * HOUR,
    inspect: { exterior: "B", interior: "B", engine: "B", accident: "단순교환 1" },
    accidentNote: "조수석 도어 1회 교환. 골격 이상 없음.",
    img: "images/cars/k7.png",
  },
  {
    id: "k5",
    maker: "기아", model: "K5 DL3", year: 2022, trim: "1.6T 시그니처",
    mileage: 42900, fuel: "가솔린", trans: "자동", color: "실키 실버",
    vin: "KNAG841CBNA220571", region: "광주",
    start: 19000000, current: 23800000, bids: 12, bidders: 6,
    offsetSec: 1 * DAY + 9 * HOUR,
    inspect: { exterior: "A", interior: "B", engine: "A", accident: "무사고" },
    accidentNote: "무사고. 흡연 이력 없음.",
    img: "images/cars/k5.png",
  },
  {
    id: "k3",
    maker: "기아", model: "K3", year: 2021, trim: "1.6 프레스티지",
    mileage: 47100, fuel: "가솔린", trans: "자동", color: "클리어 화이트",
    vin: "KNAB741CBMA551903", region: "대구",
    start: 11000000, current: 15800000, bids: 7, bidders: 4,
    offsetSec: 2 * DAY,
    inspect: { exterior: "B", interior: "B", engine: "A", accident: "무사고" },
    accidentNote: "무사고.",
    img: "images/cars/k3.png",
  },
  {
    id: "sorento",
    maker: "기아", model: "쏘렌토 MQ4", year: 2023, trim: "1.6T 하이브리드 시그니처",
    mileage: 31200, fuel: "하이브리드", trans: "자동", color: "스노우 화이트 펄",
    vin: "KNAPM81GBPK551204", region: "부산",
    start: 32000000, current: 36800000, bids: 13, bidders: 7,
    offsetSec: 18 * HOUR,
    inspect: { exterior: "A", interior: "A", engine: "A", accident: "무사고" },
    accidentNote: "무사고. 법인 1인 운행.",
    img: "images/cars/sorento.png",
  },
  {
    id: "sportage",
    maker: "기아", model: "스포티지 NQ5", year: 2023, trim: "1.6T 노블레스",
    mileage: 38900, fuel: "가솔린", trans: "자동", color: "어비스 그레이",
    vin: "KNAPT81ABPK220588", region: "인천",
    start: 25000000, current: 29800000, bids: 10, bidders: 5,
    offsetSec: 16 * HOUR + 30 * MIN,
    inspect: { exterior: "A", interior: "B", engine: "A", accident: "무사고" },
    accidentNote: "무사고.",
    img: "images/cars/sportage.png",
  },
  {
    id: "mohave",
    maker: "기아", model: "모하비 더 마스터", year: 2021, trim: "3.0 디젤 마스터즈 7인승",
    mileage: 74300, fuel: "디젤", trans: "자동", color: "어비스 블랙",
    vin: "KNHKW81GBMA774820", region: "대구",
    start: 40000000, current: 45800000, bids: 8, bidders: 4,
    offsetSec: 2 * DAY + 6 * HOUR,
    inspect: { exterior: "B", interior: "B", engine: "A", accident: "단순교환 1" },
    accidentNote: "테일게이트 1회 교환. 프레임 정상.",
    img: "images/cars/mohave.png",
  },
  {
    id: "niro",
    maker: "기아", model: "니로 SG2", year: 2023, trim: "1.6 하이브리드 시그니처",
    mileage: 35600, fuel: "하이브리드", trans: "자동", color: "어반 티타늄",
    vin: "KNDCC81GBPA112238", region: "경기 김포",
    start: 22000000, current: 26800000, bids: 7, bidders: 4,
    offsetSec: 1 * DAY + 12 * HOUR,
    inspect: { exterior: "A", interior: "A", engine: "A", accident: "무사고" },
    accidentNote: "무사고. 1인 신조차 운행.",
    img: "images/cars/niro.png",
  },
  {
    id: "rv3",
    maker: "기아", model: "RV3", year: 2024, trim: "1.6 하이브리드 노블레스",
    mileage: 9800, fuel: "하이브리드", trans: "자동", color: "스노우 화이트 펄",
    vin: "KNDRV81GBRA009012", region: "서울",
    start: 23000000, current: 27400000, bids: 6, bidders: 3,
    offsetSec: 1 * DAY + 18 * HOUR,
    inspect: { exterior: "A", interior: "A", engine: "A", accident: "무사고" },
    accidentNote: "무사고. 신차급 컨디션.",
    img: "images/cars/rv3.png",
  },
  {
    id: "staria",
    maker: "현대", model: "스타리아 라운지", year: 2023, trim: "9인승 2.2 디젤",
    mileage: 24500, fuel: "디젤", trans: "자동", color: "쉬머링 실버",
    vin: "KMJWA37KBPU110238", region: "경기 김포",
    start: 31000000, current: 35800000, bids: 7, bidders: 4,
    offsetSec: 2 * DAY + 4 * HOUR,
    inspect: { exterior: "A", interior: "A", engine: "A", accident: "무사고" },
    accidentNote: "무사고. 1인 신조차 운행.",
    img: "images/cars/staria.png",
  },
  {
    id: "avante",
    maker: "현대", model: "아반떼 CN7", year: 2023, trim: "1.6 인스퍼레이션",
    mileage: 33900, fuel: "가솔린", trans: "자동", color: "어비스 화이트",
    vin: "KMHLN41ABPU667014", region: "경기 수원",
    start: 16000000, current: 19800000, bids: 9, bidders: 5,
    offsetSec: 22 * HOUR + 40 * MIN,
    inspect: { exterior: "A", interior: "B", engine: "A", accident: "무사고" },
    accidentNote: "무사고. 흡연 이력 없음.",
    img: "images/cars/avante.png",
  },
  {
    id: "stonic",
    maker: "기아", model: "스토닉", year: 2019, trim: "1.4 디럭스",
    mileage: 61200, fuel: "가솔린", trans: "자동", color: "펜더 그레이",
    vin: "KNADB814BKA330221", region: "광주",
    start: 8500000, current: 11800000, bids: 5, bidders: 3,
    offsetSec: 3 * DAY,
    inspect: { exterior: "B", interior: "B", engine: "B", accident: "단순교환 1" },
    accidentNote: "프론트 펜더 1회 교환. 골격 정상.",
    img: "images/cars/stonic.png",
  },
  {
    id: "soul",
    maker: "기아", model: "쏘울", year: 2018, trim: "1.6 디럭스",
    mileage: 79800, fuel: "가솔린", trans: "자동", color: "클리어 화이트",
    vin: "KNAJX81ABJA440112", region: "부산",
    start: 6800000, current: 9800000, bids: 6, bidders: 3,
    offsetSec: 2 * DAY + 8 * HOUR,
    inspect: { exterior: "B", interior: "B", engine: "B", accident: "무사고" },
    accidentNote: "무사고.",
    img: "images/cars/soul.png",
  },
  {
    id: "ray",
    maker: "기아", model: "레이", year: 2020, trim: "1.0 디럭스",
    mileage: 44600, fuel: "가솔린", trans: "자동", color: "베이지 글로우",
    vin: "KNABM811BLA220871", region: "서울",
    start: 8500000, current: 11500000, bids: 8, bidders: 4,
    offsetSec: 1 * DAY + 2 * HOUR,
    inspect: { exterior: "A", interior: "B", engine: "A", accident: "무사고" },
    accidentNote: "무사고. 1인 운행.",
    img: "images/cars/ray.png",
  },
  {
    id: "morning",
    maker: "기아", model: "모닝", year: 2018, trim: "1.0 디럭스",
    mileage: 72100, fuel: "가솔린", trans: "자동", color: "클리어 화이트",
    vin: "KNABX511BJA118402", region: "대구",
    start: 5800000, current: 8500000, bids: 5, bidders: 3,
    offsetSec: 2 * DAY + 14 * HOUR,
    inspect: { exterior: "B", interior: "B", engine: "B", accident: "무사고" },
    accidentNote: "무사고.",
    img: "images/cars/morning.png",
  },
  {
    id: "forte",
    maker: "기아", model: "포르테", year: 2016, trim: "1.6 럭셔리",
    mileage: 96400, fuel: "가솔린", trans: "자동", color: "스노우 화이트 펄",
    vin: "KNAFK411BGA774001", region: "인천",
    start: 5000000, current: 7800000, bids: 9, bidders: 5,
    offsetSec: -1 * DAY, // ended
    inspect: { exterior: "B", interior: "B", engine: "B", accident: "단순교환 1" },
    accidentNote: "도어 1회 교환. 골격 정상.",
    img: "images/cars/forte.png",
    ended: true,
  },
  {
    id: "pride",
    maker: "기아", model: "프라이드", year: 2016, trim: "1.4 디럭스",
    mileage: 102300, fuel: "가솔린", trans: "수동", color: "브라이트 실버",
    vin: "KNADN412BGA551077", region: "광주",
    start: 4200000, current: 6800000, bids: 6, bidders: 3,
    offsetSec: 3 * DAY + 8 * HOUR,
    inspect: { exterior: "B", interior: "C", engine: "B", accident: "무사고" },
    accidentNote: "무사고. 실주행 차량.",
    img: "images/cars/pride.png",
  },
  {
    id: "carens",
    maker: "기아", model: "카렌스", year: 2014, trim: "2.0 LPI 디럭스 7인승",
    mileage: 118500, fuel: "LPG", trans: "자동", color: "스노우 화이트 펄",
    vin: "KNAJC811BEA009338", region: "대구",
    start: 4500000, current: 7200000, bids: 4, bidders: 2,
    offsetSec: -2 * HOUR, // ended
    inspect: { exterior: "C", interior: "C", engine: "B", accident: "단순교환 2" },
    accidentNote: "범퍼·도어 교환. 골격 정상.",
    img: "images/cars/carens.png",
    ended: true,
  },
  {
    id: "opirus",
    maker: "기아", model: "오피러스", year: 2010, trim: "3.8 GH380 프리미엄",
    mileage: 134800, fuel: "가솔린", trans: "자동", color: "어비스 블랙",
    vin: "KNALD221BAA112005", region: "서울",
    start: 2800000, current: 4800000, bids: 5, bidders: 3,
    offsetSec: 2 * DAY + 20 * HOUR,
    inspect: { exterior: "C", interior: "B", engine: "B", accident: "단순교환 1" },
    accidentNote: "후방 범퍼 1회 교환. 골격 정상.",
    img: "images/cars/opirus.png",
  },
  {
    id: "bongo3",
    maker: "기아", model: "봉고3", year: 2022, trim: "1.2톤 초장축 디젤",
    mileage: 58400, fuel: "디젤", trans: "수동", color: "퓨어 화이트",
    vin: "KNCSA811BNA771230", region: "인천",
    start: 13500000, current: 17800000, bids: 8, bidders: 4,
    offsetSec: 1 * DAY + 6 * HOUR,
    inspect: { exterior: "B", interior: "B", engine: "A", accident: "무사고" },
    accidentNote: "무사고. 적재함 상태 양호.",
    img: "images/cars/bongo3.png",
  },
  {
    id: "carnival",
    maker: "기아", model: "카니발 4세대", year: 2023, trim: "9인승 노블레스",
    mileage: 29800, fuel: "디젤", trans: "자동", color: "패럴랙스 그레이",
    vin: "KNAME81ADPA347712", region: "부산",
    start: 34000000, current: 38800000, bids: 14, bidders: 7,
    offsetSec: 14 * HOUR,
    inspect: { exterior: "A", interior: "A", engine: "A", accident: "무사고" },
    accidentNote: "법인 1인 운행. 무사고.",
    img: "images/cars/carnival.png",
  },
  {
    id: "carnival_new",
    maker: "기아", model: "카니발 4세대 PE", year: 2024, trim: "9인승 시그니처",
    mileage: 16800, fuel: "디젤", trans: "자동", color: "스노우 화이트 펄",
    vin: "KNAME81ADRA512033", region: "경기 화성",
    start: 38000000, current: 42800000, bids: 12, bidders: 6,
    offsetSec: 1 * DAY + 1 * HOUR,
    inspect: { exterior: "A", interior: "A", engine: "A", accident: "무사고" },
    accidentNote: "무사고. 페이스리프트 신형. 1인 운행.",
    img: "images/cars/carnival-cn.png",
  },
];

// min bid increment by current price tier
function minIncrement(current) {
  if (current >= 50000000) return 500000;
  if (current >= 30000000) return 300000;
  return 200000;
}

// ── Auction epoch (persists countdowns across refresh, re-anchors when stale) ──
const EPOCH_KEY = "kcea_epoch_v3";
const MAX_FUTURE = 3 * DAY + 12 * HOUR;
function resolveEpoch() {
  const now = Date.now();
  let e = parseInt(localStorage.getItem(EPOCH_KEY) || "0", 10);
  // if everything has ended (epoch too old) or no epoch yet, re-anchor to now
  if (!e || now - e > MAX_FUTURE) {
    e = now;
    localStorage.setItem(EPOCH_KEY, String(e));
  }
  return e;
}
const EPOCH = resolveEpoch();

// seeded pseudo-random for stable bid histories
function seeded(seedStr) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => {
    h += 0x6d2b79f5; let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function anonBidder(rng) {
  const chars = "0123456789ABCDEF";
  return "#" + chars[Math.floor(rng() * 16)] + chars[Math.floor(rng() * 16)] + chars[Math.floor(rng() * 16)];
}

// build initial bid history (most recent first) ending at `current`
function buildHistory(v) {
  const rng = seeded(v.id);
  const inc = minIncrement(v.current);
  const endsAt = EPOCH + v.offsetSec * 1000;
  const n = Math.min(v.bids, 12);
  const items = [];
  let price = v.current;
  let t = (v.ended ? endsAt : Math.min(Date.now(), endsAt)) - 40 * 1000;
  const names = {};
  for (let i = 0; i < n; i++) {
    items.push({ id: v.id + "-h" + i, amount: price, bidder: (names[i] = anonBidder(rng)), time: t, you: false });
    const step = inc * (1 + Math.floor(rng() * 3));
    price -= step;
    t -= (30 + Math.floor(rng() * 220)) * 1000;
  }
  return items;
}

// per-vehicle en/de translations (model/trim/color are proper-ish nouns; de reuses en model/trim)
const VEH_I18N = {
  carnival_limo: { en: { model: "Carnival Hi-Limousine", note: "Single corporate driver. Accident-free. Genuine limousine conversion." } },
  ev9: { en: { model: "EV9", note: "Accident-free. Under one year old." } },
  ev6: { en: { model: "EV6", note: "Accident-free. Battery inspection clear." } },
  ev4: { en: { model: "EV4", note: "Accident-free. Near-new condition." } },
  ev3: { en: { model: "EV3", note: "Accident-free. Single owner." } },
  k9: { en: { model: "K9", note: "Accident-free. Multiple service records." } },
  k8: { en: { model: "K8", note: "Rear bumper replaced once (parking contact). No frame damage." } },
  k7: { en: { model: "K7", note: "Front passenger door replaced once. No frame issues." } },
  k5: { en: { model: "K5 DL3", note: "Accident-free. Non-smoker." } },
  k3: { en: { model: "K3", note: "Accident-free." } },
  sorento: { en: { model: "Sorento MQ4", note: "Accident-free. Single corporate driver." } },
  sportage: { en: { model: "Sportage NQ5", note: "Accident-free." } },
  mohave: { en: { model: "Mohave the Master", note: "Tailgate replaced once. Frame intact." } },
  niro: { en: { model: "Niro SG2", note: "Accident-free. Single owner from new." } },
  rv3: { en: { model: "RV3", note: "Accident-free. Near-new condition." } },
  staria: { en: { model: "Staria Lounge", note: "Accident-free. Single owner from new." } },
  avante: { en: { model: "Avante CN7", note: "Accident-free. Non-smoker." } },
  stonic: { en: { model: "Stonic", note: "Front fender replaced once. Frame intact." } },
  soul: { en: { model: "Soul", note: "Accident-free." } },
  ray: { en: { model: "Ray", note: "Accident-free. Single owner." } },
  morning: { en: { model: "Morning", note: "Accident-free." } },
  forte: { en: { model: "Forte", note: "Door replaced once. Frame intact." } },
  pride: { en: { model: "Pride", note: "Accident-free. Genuine mileage." } },
  carens: { en: { model: "Carens", note: "Bumper and door replaced. Frame intact." } },
  opirus: { en: { model: "Opirus", note: "Rear bumper replaced once. Frame intact." } },
  bongo3: { en: { model: "Bongo III", note: "Accident-free. Bed in good condition." } },
  carnival: { en: { model: "Carnival 4G", note: "Single corporate driver. Accident-free." } },
  carnival_new: { en: { model: "Carnival 4G PE", note: "Accident-free. Facelift model. Single owner." } },
};

function buildVehicle(raw) {
  const endsAt = EPOCH + raw.offsetSec * 1000;
  return {
    ...raw,
    i18n: VEH_I18N[raw.id],
    name: `${raw.year} ${raw.maker} ${raw.model}`,
    endsAt,
    inc: minIncrement(raw.current),
    history: buildHistory(raw),
    appraisal: buildAppraisal(raw),
    options: buildOptions(raw),
    avgSold: buildAvgSold(raw),
    perfSheet: buildPerfSheet(raw),
    accidentRecords: buildAccidentRecords(raw),
  };
}

// ── Options (편의·안전 사양) ───────────────────────────────────────────────────
const OPTION_DEFS = [
  { k: "navi", icon: "pin" }, { k: "blackbox", icon: "shield" }, { k: "smartkey", icon: "bolt" },
  { k: "sunroof", icon: "clock" }, { k: "rearsensor", icon: "check" }, { k: "rearcam", icon: "doc" },
];
function buildOptions(raw) {
  const rng = seeded(raw.id + "opt");
  // premium / newer cars carry more options
  const premium = raw.current >= 40000000 || raw.year >= 2022;
  return OPTION_DEFS.map((o, i) => {
    let has;
    if (o.k === "smartkey" || o.k === "rearcam" || o.k === "rearsensor") has = premium || rng() > 0.3;
    else if (o.k === "sunroof") has = premium && rng() > 0.45;
    else has = rng() > 0.25;
    return { k: o.k, icon: o.icon, has };
  });
}

// ── Recent average hammer price for the same model ────────────────────────────
function buildAvgSold(raw) {
  const rng = seeded(raw.id + "avg");
  const count = 6 + Math.floor(rng() * 22);
  // average sits slightly below current (auction still climbing)
  const avg = Math.round((raw.current * (0.93 + rng() * 0.06)) / 1e5) * 1e5;
  const diff = raw.current - avg;
  const diffPct = Math.round((diff / avg) * 1000) / 10;
  // small recent-sale samples for a sparkline
  const samples = Array.from({ length: 6 }, () =>
    Math.round((avg * (0.9 + rng() * 0.2)) / 1e5) * 1e5);
  return { avg, count, diff, diffPct, samples, periodMonths: 3 };
}

// ── Performance & condition sheet (성능·상태 점검기록부) ─────────────────────────
const PS_STATUS = { good: "good", minor: "minor", bad: "bad", na: "na" };
function buildPerfSheet(raw) {
  const rng = seeded(raw.id + "perf");
  const g = raw.inspect;
  const fromGrade = (gr) => gr === "A" ? "good" : gr === "B" ? "minor" : "bad";
  const accidentFree = /무사고/.test(g.accident);
  const flip = (base, p) => (rng() < p ? "minor" : base);
  return [
    {
      cat: "ps_self", items: [
        { k: "ps_engine_d", status: fromGrade(g.engine) },
        { k: "ps_trans_d", status: flip(fromGrade(g.engine), 0.12) },
      ],
    },
    {
      cat: "ps_skeleton", items: [
        { k: "ps_panel", status: accidentFree ? "good" : "minor" },
        { k: "ps_frame", status: accidentFree ? "good" : flip("good", 0.15) },
      ],
    },
    {
      cat: "ps_leak", items: [
        { k: "ps_engine_oil", status: flip("good", 0.1) },
        { k: "ps_trans_oil", status: "good" },
        { k: "ps_coolant", status: flip("good", 0.08) },
      ],
    },
    {
      cat: "ps_func", items: [
        { k: "ps_drive", status: fromGrade(g.engine) },
        { k: "ps_steer", status: "good" },
        { k: "ps_brake", status: flip("good", 0.1) },
        { k: "ps_electric", status: fromGrade(g.interior) },
      ],
    },
  ];
}

// ── Accident / insurance history ──────────────────────────────────────────────
function buildAccidentRecords(raw) {
  const rng = seeded(raw.id + "acc");
  const m = /단순교환 (\d)/.exec(raw.inspect.accident);
  const repairs = m ? parseInt(m[1], 10) : 0;
  const ownMine = repairs; // 내차 피해(가해 아님) 기준
  const records = [];
  let baseT = EPOCH - (180 + Math.floor(rng() * 400)) * DAY * 1000;
  for (let i = 0; i < ownMine; i++) {
    records.push({
      type: "own", date: baseT,
      amount: Math.round((600000 + rng() * 1400000) / 1e4) * 1e4,
      part: i,
    });
    baseT -= (60 + Math.floor(rng() * 120)) * DAY * 1000;
  }
  return {
    totalLoss: false, flood: false, theft: false,
    ownCount: ownMine, otherCount: 0,
    ownTotal: records.reduce((a, r) => a + r.amount, 0),
    owners: 1 + Math.floor(rng() * 2),
    usageRental: rng() > 0.5,
    records,
  };
}

// ── Appraiser evaluation ─────────────────────────────────────────────────────
// Certified appraisers who post evaluations on each auction.
const APPRAISERS = [
  { name: "김도현", en: "Kim Do-hyun", license: "KAA-20471", org: "한국자동차감정평가원", orgEn: "Korea Auto Appraisal Institute", years: 12 },
  { name: "이수민", en: "Lee Su-min", license: "KAA-18802", org: "오토인증감정", orgEn: "Auto-Cert Appraisal", years: 9 },
  { name: "박재훈", en: "Park Jae-hoon", license: "KAA-21155", org: "한국자동차감정평가원", orgEn: "Korea Auto Appraisal Institute", years: 7 },
  { name: "정유진", en: "Jung Yu-jin", license: "KAA-19640", org: "트러스트오토감정", orgEn: "Trust Auto Appraisal", years: 11 },
];
const gradeScore = { A: 95, B: 80, C: 62 };
// detailed checkpoint definitions (key → i18n key for label)
const APPR_POINTS = [
  { k: "exterior", base: "exterior" }, { k: "interior", base: "interior" },
  { k: "engine", base: "engine" }, { k: "chassis", base: "chassis" },
  { k: "electrics", base: "electrics" }, { k: "tires", base: "tires" },
];

function buildAppraisal(raw) {
  const rng = seeded(raw.id + "appr");
  const appr = APPRAISERS[Math.floor(rng() * APPRAISERS.length)];
  // overall score from inspect grades + slight variance
  const g = raw.inspect;
  const baseAvg = (gradeScore[g.exterior] + gradeScore[g.interior] + gradeScore[g.engine]) / 3;
  const overall = Math.round(Math.min(99, Math.max(55, baseAvg + (rng() * 6 - 3))));
  // per-checkpoint scores
  const points = APPR_POINTS.map((p) => {
    let s;
    if (p.k === "exterior") s = gradeScore[g.exterior];
    else if (p.k === "interior") s = gradeScore[g.interior];
    else if (p.k === "engine") s = gradeScore[g.engine];
    else s = Math.round(baseAvg);
    s = Math.round(Math.min(99, Math.max(50, s + (rng() * 10 - 5))));
    return { k: p.k, score: s };
  });
  // appraisal log (timeline of checks), most recent first
  const accidentFree = /무사고/.test(g.accident);
  const logKeys = [
    accidentFree ? "log_accfree" : "log_accfound",
    "log_diag", "log_underbody", "log_road", "log_received",
  ];
  const dayMs = 86400 * 1000;
  const apprDate = EPOCH - (1 + Math.floor(rng() * 3)) * dayMs;
  const log = logKeys.map((k, i) => ({
    k, time: apprDate - i * (3 * 3600 * 1000 + Math.floor(rng() * 4 * 3600 * 1000)),
  }));
  return {
    appraiser: appr,
    overall,
    points,
    accidentFree,
    date: apprDate,
    log,
    odoVerified: rng() > 0.15,
    summaryKey: overall >= 90 ? "appr_sum_a" : overall >= 75 ? "appr_sum_b" : "appr_sum_c",
  };
}

// ── Auction public disclosures (공시정보) — scheduled auction sessions ──────────
// dayOffset = days from today; vehicles listed by category counts.
const SESSION_RAW = [
  { id: "s-busan-0", dayOffset: 0, time: "14:00", venue: "부산 감만 수출단지", venueEn: "Busan Gamman Export Complex",
    region: "부산", count: 48, cats: { suv: 19, sedan: 14, van: 9, pickup: 6 }, status: "live",
    note: "수출 전용 세션 · 현장/온라인 동시 진행", featured: true },
  { id: "s-incheon-1", dayOffset: 1, time: "11:00", venue: "인천 항동 오토허브", venueEn: "Incheon Hangdong Auto Hub",
    region: "인천", count: 36, cats: { suv: 12, sedan: 15, van: 6, pickup: 3 }, status: "soon",
    note: "프리미엄 세단 특별 출품" },
  { id: "s-pyeongtaek-2", dayOffset: 2, time: "13:30", venue: "평택항 자동차물류센터", venueEn: "Pyeongtaek Port Auto Logistics",
    region: "경기", count: 52, cats: { suv: 21, sedan: 11, van: 13, pickup: 7 }, status: "scheduled",
    note: "RV·승합 대량 출품" },
  { id: "s-seoul-4", dayOffset: 4, time: "10:00", venue: "서울 강서 경매장", venueEn: "Seoul Gangseo Auction House",
    region: "서울", count: 29, cats: { suv: 10, sedan: 13, van: 4, pickup: 2 }, status: "scheduled",
    note: "법인 리스 반납 차량 중심" },
  { id: "s-busan-7", dayOffset: 7, time: "14:00", venue: "부산 감만 수출단지", venueEn: "Busan Gamman Export Complex",
    region: "부산", count: 55, cats: { suv: 22, sedan: 16, van: 10, pickup: 7 }, status: "scheduled",
    note: "월간 대형 세션" },
  { id: "s-daegu-9", dayOffset: 9, time: "11:30", venue: "대구 성서 오토옥션", venueEn: "Daegu Seongseo Auto Auction",
    region: "대구", count: 24, cats: { suv: 9, sedan: 9, van: 4, pickup: 2 }, status: "scheduled",
    note: "" },
];

function buildSession(raw) {
  const base = new Date(EPOCH);
  base.setHours(0, 0, 0, 0);
  const [hh, mm] = raw.time.split(":").map(Number);
  const at = new Date(base.getTime() + raw.dayOffset * 86400 * 1000);
  at.setHours(hh, mm, 0, 0);
  return { ...raw, at: at.getTime() };
}
const SESSIONS = SESSION_RAW.map(buildSession);

// ── Auction disclosures (공고 목록) — court-auction-style lots ─────────────────
// Each lot reads like a Korean court-auction listing: 사건번호 · 감정가 · 최저가(%) · 유찰 · 매각기일.
const DISC_EXTRA = [
  { maker: "현대", model: "그랜저 IG 2.4 프리미엄", year: 2020, mileage: 71200, fuel: "가솔린", trans: "자동",
    region: "부산", accident: "단순교환 1", appraised: 23000000, en: "Grandeur IG 2.4", de: "Grandeur IG 2.4" },
  { maker: "기아", model: "K5 DL3 1.6T 노블레스", year: 2021, mileage: 58400, fuel: "가솔린", trans: "자동",
    region: "인천", accident: "무사고", appraised: 21000000, en: "K5 DL3 1.6T", de: "K5 DL3 1.6T" },
  { maker: "현대", model: "아반떼 CN7 1.6 스마트", year: 2022, mileage: 43900, fuel: "가솔린", trans: "자동",
    region: "경기", accident: "무사고", appraised: 17500000, en: "Avante CN7 1.6", de: "Avante CN7 1.6" },
  { maker: "제네시스", model: "G70 2.0T 스포츠", year: 2020, mileage: 66100, fuel: "가솔린", trans: "자동",
    region: "서울", accident: "단순교환 2", appraised: 26000000, en: "G70 2.0T Sport", de: "G70 2.0T Sport" },
  { maker: "기아", model: "모하비 더 마스터 3.0", year: 2021, mileage: 74300, fuel: "디젤", trans: "자동",
    region: "부산", accident: "무사고", appraised: 38000000, en: "Mohave the Master", de: "Mohave the Master" },
  { maker: "KG모빌리티", model: "티볼리 에어 1.5T", year: 2022, mileage: 39200, fuel: "가솔린", trans: "자동",
    region: "대구", accident: "무사고", appraised: 16000000, en: "Tivoli Air 1.5T", de: "Tivoli Air 1.5T" },
];
const FAIL_PCT = [100, 70, 49]; // 신건 / 유찰1 / 유찰2 → 최저가 = 감정가 × %
const REGION_CODE = { "부산": "BSN", "인천": "ICN", "경기": "GGI", "경기 화성": "GGI", "경기 김포": "GGI",
  "서울": "SEL", "대구": "DGU", "울산": "USN", "광주": "GJU" };

function buildDisclosures() {
  // base lots from real vehicles + extra synthetic lots
  const base = RAW.map((r) => ({
    seedId: r.id, maker: r.maker, model: r.model, year: r.year, mileage: r.mileage,
    fuel: r.fuel, trans: r.trans, region: r.region, accident: r.inspect.accident,
    appraised: Math.round(r.current * 1.16 / 1e5) * 1e5, i18n: VEH_I18N[r.id], img: r.img,
  }));
  const extra = DISC_EXTRA.map((e, i) => ({
    seedId: "x" + i, maker: e.maker, model: e.model, year: e.year, mileage: e.mileage,
    fuel: e.fuel, trans: e.trans, region: e.region, accident: e.accident,
    appraised: e.appraised, i18n: { en: { model: e.en }, de: { model: e.de } },
  }));
  const all = [...base, ...extra];
  const rng = seeded("disclosures");
  return all.map((d, i) => {
    const fails = i % 7 === 0 ? 2 : i % 3 === 0 ? 1 : 0;
    const pct = FAIL_PCT[fails];
    const low = Math.round(d.appraised * pct / 100 / 1e4) * 1e4;
    const sess = SESSIONS[i % SESSIONS.length];
    const seq = String(481 + i * 13).padStart(4, "0");
    const caseNo = `2026-${REGION_CODE[sess.region] || "EXP"}-${seq}`;
    const seedNum = (d.seedId + i).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const views = (3 + Math.floor(rng() * 18)) * 100 + Math.floor(rng() * 99);
    return {
      id: "d" + i, caseNo, ...d,
      fails, lowPct: pct, low,
      saleAt: sess.at, venue: sess.venue, venueEn: sess.venueEn, sessRegion: sess.region,
      status: fails === 0 ? "new" : "passed", seed: seedNum, views,
    };
  });
}
const DISCLOSURES = buildDisclosures();

// nationwide region breakdown — always shown in the 지역 view even on dates with no session
const REGION_STATS = [
  { region: "서울", count: 79 }, { region: "경기", count: 142 }, { region: "인천", count: 107 },
  { region: "부산", count: 130 }, { region: "대구", count: 68 }, { region: "광주", count: 41 },
  { region: "대전", count: 52 }, { region: "울산", count: 38 }, { region: "강원", count: 24 },
  { region: "충북", count: 19 }, { region: "충남", count: 33 }, { region: "전북", count: 27 },
  { region: "전남", count: 22 }, { region: "경북", count: 31 }, { region: "경남", count: 45 },
  { region: "제주", count: 12 },
];

// ── demo filler vehicles (so My Page lists exceed one page) ───────────────────
// cloned from the base set with deterministic variations; all active (future end)
const GEN_REGIONS = ["서울", "경기 수원", "인천", "부산", "대구", "광주", "대전", "울산", "창원", "청주"];
const GEN_COLORS = ["어비스 블랙 펄", "크리미 화이트 펄", "그래비티 블루", "마칼루 그레이", "쉬머링 실버"];
const GEN_VEHICLES = (() => {
  const out = [];
  const N = 18;
  for (let i = 0; i < N; i++) {
    const base = RAW[i % RAW.length];
    const yr = base.year - (i % 3);
    const km = base.mileage + (i * 1700 + 800) % 40000;
    const cur = Math.round((base.current * (0.9 + ((i * 7) % 25) / 100)) / 1e5) * 1e5;
    const start = Math.round(cur * 0.86 / 1e5) * 1e5;
    out.push({
      id: "gen" + i,
      maker: base.maker, model: base.model, year: yr, trim: base.trim,
      mileage: km, fuel: base.fuel, trans: base.trans,
      color: GEN_COLORS[i % GEN_COLORS.length],
      vin: base.vin.slice(0, 11) + String(100 + i),
      region: GEN_REGIONS[i % GEN_REGIONS.length],
      img: base.img,
      start, current: cur, bids: 3 + (i % 14), bidders: 2 + (i % 6),
      offsetSec: (2 + (i % 6)) * HOUR + (i % 5) * DAY + (i * 13 % 60) * MIN,
      inspect: { ...base.inspect },
      accidentNote: base.accidentNote,
    });
  }
  return out;
})();

const VEHICLES = [...RAW, ...GEN_VEHICLES].map(buildVehicle);

// status helper based on remaining ms
function statusOf(endsAt, now) {
  const rem = endsAt - now;
  if (rem <= 0) return "ended";
  if (rem <= DAY * 1000) return "soon";
  return "live";
}

// sale channel per vehicle (deterministic): "auction" (경매) or "tender" (공매)
function saleModeOf(id) {
  const h = String(id).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return h % 3 === 0 ? "tender" : "auction";
}

const FUEL_TYPES = ["가솔린", "디젤", "하이브리드", "전기", "LPG"];
const MAKERS = ["현대", "기아", "제네시스", "KG모빌리티"];
const BODY = ["SUV", "세단", "미니밴", "픽업"];
const bodyOf = (v) => {
  if (/카니발|스타리아|카렌스/.test(v.model)) return "미니밴";
  if (/쏘렌토|스포티지|모하비|니로|스토닉|EV3|EV9|RV3/.test(v.model)) return "SUV";
  if (/봉고/.test(v.model)) return "픽업";
  return "세단";
};

// ── filter helpers ─────────────────────────────────────────────────────────
// base model name (drop trim/engine suffix)
const modelOf = (v) => v.model.split(" ")[0];
// 세부 모델 = trim
const subModelOf = (v) => v.trim;
// base region (경기 화성 → 경기)
const regionBase = (v) => v.region.split(" ")[0];
const REGIONS = ["서울", "경기", "인천", "부산", "대구", "울산", "광주"];
// color family
const COLOR_FAMILIES = ["화이트", "블랙", "그레이", "실버", "블루"];
const colorFamily = (v) => {
  const c = v.color;
  if (/화이트/.test(c)) return "화이트";
  if (/블랙/.test(c)) return "블랙";
  if (/실버/.test(c)) return "실버";
  if (/블루/.test(c)) return "블루";
  if (/그레이|스틸/.test(c)) return "그레이";
  return "기타";
};
const COLOR_HEX = { "화이트": "#eef0f2", "블랙": "#23262b", "그레이": "#8a9099", "실버": "#c4c9cf", "블루": "#2f5db0" };
// paint-repair / accident status: none | panel(단순교환)
const paintStatusOf = (v) => /무사고/.test(v.inspect.accident) ? "none" : "panel";
const YEARS = [...new Set(RAW.map((r) => r.year))].sort((a, b) => b - a);
const MILEAGE_MAX = 100000;

Object.assign(window, {
  CURRENCIES, fmtKRW, fmtKRWShort, fmtConverted,
  VEHICLES, statusOf, saleModeOf, minIncrement, anonBidder,
  FUEL_TYPES, MAKERS, BODY, bodyOf, EPOCH,
  SESSIONS, APPRAISERS, DISCLOSURES, REGION_STATS,
  modelOf, subModelOf, regionBase, REGIONS,
  COLOR_FAMILIES, colorFamily, COLOR_HEX, paintStatusOf, YEARS, MILEAGE_MAX,
  OPTION_DEFS,
  DAY, HOUR, MIN,
});
