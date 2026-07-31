// notice.jsx — 공시정보: calendar + venue/region breakdown (top), filtered lot cards (below)

const WD = {
  ko: ["일", "월", "화", "수", "목", "금", "토"],
  en: ["S", "M", "T", "W", "T", "F", "S"],
  de: ["S", "M", "D", "M", "D", "F", "S"],
};
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const midnight = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };

function fmtSelDate(ts, locale) {
  const d = new Date(ts);
  if (locale === "ko") return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${String(d.getDate()).padStart(2, "0")}`;
  return `${MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
const discName = (d, locale) => {
  if (locale === "ko") return `${d.year} ${d.maker} ${d.model}`;
  const maker = window.trMaker(d.maker, locale);
  const model = (d.i18n && d.i18n[locale] && d.i18n[locale].model) || d.model;
  return `${d.year} ${maker} ${model}`;
};
function ddayLabel(at) {
  const diff = Math.round((midnight(at) - midnight(Date.now())) / 86400000);
  return diff <= 0 ? "D-DAY" : `D-${diff}`;
}

// ── month calendar ──
function Calendar({ viewYM, setViewYM, dayData, selDate, setSelDate, todayKey }) {
  const { locale, t } = window.useLang();
  const first = new Date(viewYM.y, viewYM.m, 1);
  const startWd = first.getDay();
  const daysIn = new Date(viewYM.y, viewYM.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWd; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const move = (delta) => {
    let m = viewYM.m + delta, y = viewYM.y;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setViewYM({ y, m });
  };

  return (
    <div className="cal">
      <div className="cal-head">
        <button className="cal-nav" onClick={() => move(-1)}><window.Icons.chevronL size={17} /></button>
        <span className="cal-title mono">{locale === "ko" ? `${viewYM.y}. ${String(viewYM.m + 1).padStart(2, "0")}` : `${MON[viewYM.m]} ${viewYM.y}`}</span>
        <button className="cal-nav" onClick={() => move(1)}><window.Icons.chevron size={17} /></button>
      </div>
      <div className="cal-grid cal-wd">
        {WD[locale].map((w, i) => <span key={i} className={`cal-wdh ${i === 0 ? "sun" : i === 6 ? "sat" : ""}`}>{w}</span>)}
      </div>
      <div className="cal-grid">
        {cells.map((d, i) => {
          if (d == null) return <span key={i} className="cal-cell empty" />;
          const key = new Date(viewYM.y, viewYM.m, d).getTime();
          const info = dayData[key];
          const isToday = key === todayKey;
          const isSel = key === selDate;
          const wd = (startWd + d - 1) % 7;
          return (
            <button key={i} className={`cal-cell ${info ? "has" : ""} ${isSel ? "sel" : ""} ${isToday ? "today" : ""}`}
                    onClick={() => info && setSelDate(key)} disabled={!info}>
              <span className={`cal-d ${wd === 0 ? "sun" : wd === 6 ? "sat" : ""}`}>{d}</span>
              {info && <span className="cal-n mono">{info.count}</span>}
            </button>
          );
        })}
      </div>
      <div className="cal-legend">
        <span><i className="lg-dot today" />{t("notice.cal_today")}</span>
        <span><i className="lg-dot count" />{t("notice.cal_count")}</span>
      </div>
    </div>
  );
}

// ── right panel: venue / region breakdown ──
function BreakdownPanel({ selDate, mode, setMode, pick, setPick, daySessions }) {
  const { locale, t } = window.useLang();
  const isToday = selDate === midnight(Date.now());
  // always show the full nationwide list, regardless of the selected date's sessions
  let items;
  if (mode === "region") {
    items = window.REGION_STATS.map((r) => [r.region, { label: window.trRegion(r.region, locale), count: r.count }]);
  } else {
    const agg = {};
    window.SESSIONS.forEach((s) => {
      const id = s.venue, label = locale === "ko" ? s.venue : s.venueEn;
      agg[id] = agg[id] || { label, count: 0 };
      agg[id].count += s.count;
    });
    items = Object.entries(agg);
  }
  const total = items.reduce((a, [, v]) => a + v.count, 0);

  return (
    <div className="bd-panel">
      <div className="bd-head">
        <div className="bd-date">
          <span className="bd-date-v mono">{fmtSelDate(selDate, locale)}</span>
          {isToday && <span className="bd-today">({t("notice.sel_today")})</span>}
        </div>
        <div className="bd-toggle">
          <button className={mode === "venue" ? "on" : ""} onClick={() => { setMode("venue"); setPick(""); }}>{t("notice.by_venue")}</button>
          <button className={mode === "region" ? "on" : ""} onClick={() => { setMode("region"); setPick(""); }}>{t("notice.by_region")}</button>
        </div>
      </div>
      <div className="bd-grid">
        <button className={`bd-item bd-all ${!pick ? "on" : ""}`} onClick={() => setPick("")}>
          {t("notice.all")} <b className="mono">{total}</b>
        </button>
        {items.map(([id, v]) => (
          <button key={id} className={`bd-item ${pick === id ? "on" : ""}`} onClick={() => setPick(id)}>
            <span className="bd-item-l">{v.label}</span> <b className="mono">{v.count}</b>
          </button>
        ))}
      </div>
      {daySessions.length > 0 && (
        <div className="bd-sessions">
          {daySessions.map((s) => (
            <div className="bd-ses" key={s.id}>
              <window.Icons.clock size={13} />
              <span className="mono">{s.time}</span>
              <span className="bd-ses-venue">{locale === "ko" ? s.venue : s.venueEn}</span>
              <span className="bd-ses-n mono">{t("notice.lots", s.count)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── lot card (matched to selling-now VehicleCard style) ──
function LotCard({ d, watched, toggleWatch, onView }) {
  const { locale, t } = window.useLang();
  const isW = watched.has("disc-" + d.id);
  const dd = ddayLabel(d.saleAt);
  const urgent = dd === "D-DAY" || dd === "D-1";
  const kmMan = (d.mileage / 10000).toFixed(1).replace(/\.0$/, "");
  return (
    <article className="card" onClick={onView}>
      <div className="card-img">
        <window.VehicleSlot slotId={"disc-" + d.id} seed={d.seed} label={t("card.photo")} img={d.img} radius={14} aspect="16 / 11" />
        <span className={`card-cd-badge ${urgent ? "" : "soon"}`}>{dd}</span>
        <button className={`heart-fab ${isW ? "on" : ""}`}
          onClick={(e) => { e.stopPropagation(); toggleWatch("disc-" + d.id); }}
          aria-label={t("common.watch")}>
          <window.Icons.heart size={18} fill={isW ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="card-body">
        <div className="card-name">{discName(d, locale)}</div>
        <div className="card-spec">
          <span>{locale === "ko" ? `${d.year}년` : d.year}</span>
          <span className="sep">·</span><span>{kmMan}만km</span>
          <span className="sep">·</span><span>{window.trFuel(d.fuel, locale)}</span>
        </div>
        <div className="card-bidlabel">{t("notice.min_s")}</div>
        <div className="card-price-krw mono">{window.fmtKRWShort(d.low)}원</div>
        <div className="card-price-conv mono">{t("notice.appraised_s")} {window.fmtKRWShort(d.appraised)}원</div>
        <div className="card-bids">{d.status === "new" ? t("notice.new") : t("notice.fails", d.fails)}</div>
        <div className="card-lotpill">{d.caseNo}</div>
        <div className="card-watch">
          <window.Icons.eye size={15} />{d.views.toLocaleString("en-US")}
        </div>
      </div>
    </article>);
}

function NoticePage({ watched, toggleWatch, onView }) {
  const { locale, t } = window.useLang();
  const todayKey = midnight(Date.now());

  // calendar day aggregation from sessions
  const dayData = React.useMemo(() => {
    const m = {};
    window.SESSIONS.forEach((s) => {
      const k = midnight(s.at);
      m[k] = m[k] || { count: 0, sessions: [] };
      m[k].count += s.count; m[k].sessions.push(s);
    });
    return m;
  }, []);
  const sessionKeys = Object.keys(dayData).map(Number).sort((a, b) => a - b);
  const defaultDate = dayData[todayKey] ? todayKey : sessionKeys[0];

  const [viewYM, setViewYM] = React.useState(() => { const d = new Date(defaultDate); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [selDate, setSelDate] = React.useState(defaultDate);
  const [allDates, setAllDates] = React.useState(true);
  const [mode, setMode] = React.useState("venue");
  const [pick, setPick] = React.useState("");
  const [sort, setSort] = React.useState("low");
  const [sel, setSel] = React.useState({ makers: [], models: [], years: [], paints: [] });
  const [maxKm, setMaxKm] = React.useState(0);
  const [showFilters, setShowFilters] = React.useState(false);

  const daySessions = (dayData[selDate] && dayData[selDate].sessions) || [];
  const toggle = (key, val) => setSel((s) => ({ ...s, [key]: s[key].includes(val) ? s[key].filter((x) => x !== val) : [...s[key], val] }));
  const discPaint = (d) => /무사고/.test(d.accident) ? "none" : "panel";
  const discVal = (d, key) => ({ makers: d.maker, models: window.modelOf(d), years: d.year, paints: discPaint(d) })[key];

  const pickDate = (k) => { setSelDate(k); setAllDates(false); };

  // base pool: date + region/venue (facet counts computed against this)
  const pool = React.useMemo(() => window.DISCLOSURES.filter((d) => {
    if (!allDates && midnight(d.saleAt) !== selDate) return false;
    if (pick) { if (mode === "venue" ? d.venue !== pick : d.sessRegion !== pick) return false; }
    if (maxKm > 0 && d.mileage > maxKm) return false;
    return true;
  }), [selDate, allDates, pick, mode, maxKm]);

  const lots = React.useMemo(() => {
    let list = pool.filter((d) => Object.keys(sel).every((k) => sel[k].length === 0 || sel[k].includes(discVal(d, k))));
    list = [...list].sort((a, b) => sort === "low" ? a.low - b.low : sort === "appr" ? b.appraised - a.appraised : b.views - a.views);
    return list;
  }, [pool, sel, sort]);

  const countFor = (key, val) => pool.filter((d) => discVal(d, key) === val).length;
  const selCount = Object.values(sel).reduce((a, x) => a + x.length, 0) + (maxKm > 0 ? 1 : 0);
  const reset = () => { setSel({ makers: [], models: [], years: [], paints: [] }); setMaxKm(0); };

  // option pools (across all disclosures, models dependent on makers)
  const makerOpts = [...new Set(window.DISCLOSURES.map((d) => d.maker))];
  const modelOpts = [...new Set(window.DISCLOSURES.filter((d) => sel.makers.length === 0 || sel.makers.includes(d.maker)).map(window.modelOf))];
  const yearOpts = [...new Set(window.DISCLOSURES.map((d) => d.year))].sort((a, b) => b - a);
  const kmMan = Math.round(maxKm / 10000);

  const noticeFacets = [
    { key: "makers", title: t("filter.maker"), opts: makerOpts, tr: (o) => window.trMaker(o, locale) },
    { key: "models", title: t("filter.model"), opts: modelOpts, tr: (o) => o },
    { key: "years", title: t("filter.year"), opts: yearOpts, tr: (o) => locale === "ko" ? `${o}년` : `${o}` },
    { key: "paints", title: t("filter.paint"), opts: ["none", "panel"], tr: (o) => o === "none" ? t("filter.paint_none") : t("filter.paint_panel") },
  ];

  return (
    <div className="page notice-page">
      <div className="notice-head">
        <p className="market-desc">{t("market.desc_upcoming")}</p>
      </div>

      {/* lots: filter rail + grid */}
      <div className="notice-lots-layout">
        <aside className={`filter-rail ${showFilters ? "open" : ""}`}>
          <RailSection title={t("filter.mileage")} count={maxKm > 0 ? 1 : 0}>
            <div className="frail-slider">
              <div className="frail-slider-val">
                <span className="mono">{maxKm === 0 ? t("filter.km_all") : t("filter.km_under", kmMan)}</span>
              </div>
              <input type="range" min="0" max={window.MILEAGE_MAX} step="10000" value={maxKm}
                     onChange={(e) => setMaxKm(+e.target.value)} className="km-range" />
              <div className="frail-slider-scale mono"><span>0</span><span>10만km</span></div>
            </div>
          </RailSection>
          {noticeFacets.map((f) =>
          <RailSection title={f.title} key={f.key} count={sel[f.key].length}>
              <div className="frail-opts">
                {f.opts.length === 0 ? <span className="frail-none">—</span> : f.opts.map((o) =>
                <CheckRow key={o} active={sel[f.key].includes(o)} label={f.tr(o)} count={countFor(f.key, o)}
                onClick={() => toggle(f.key, o)} />
                )}
              </div>
            </RailSection>
          )}
          {selCount > 0 &&
          <button className="frail-reset" onClick={reset}><window.Icons.x size={13} />{t("filter.reset")}</button>}
        </aside>

        <div className="listing-main">
          <div className="lots-bar">
            <span className="lots-count">{t("notice.lots_count", lots.length)}</span>
            <button className="filter-toggle" onClick={() => setShowFilters((s) => !s)}>
              <window.Icons.filter size={15} />{t("filter.title")}{selCount > 0 && <span className="pill mono">{selCount}</span>}
            </button>
            <div className="sort-spacer" />
            <div className="sel sel-mono">
              <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ backgroundColor: "rgb(255, 255, 255)" }}>
                <option value="low">{t("notice.sort_low")}</option>
                <option value="appr">{t("notice.sort_appr")}</option>
                <option value="views">{t("notice.views", "")}</option>
              </select>
              <window.Icons.chevron size={14} style={{ transform: "rotate(90deg)" }} />
            </div>
          </div>

          {lots.length === 0 ? (
            <div className="empty"><window.Icons.doc size={28} /><p>{t("notice.no_lots")}</p></div>
          ) : (
            <div className="grid">
              {lots.map((d) => <LotCard key={d.id} d={d} watched={watched} toggleWatch={toggleWatch} onView={onView} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { NoticePage });
