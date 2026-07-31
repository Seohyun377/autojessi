// listing.jsx — vehicle listing page: expanded LEFT filter rail + auction grid

function CardTimer({ endsAt, now }) {
  const { t } = window.useLang();
  const rem = endsAt - now;
  if (rem <= 0) return <span className="card-cd-badge ended">{t("cd.ended")}</span>;
  const { d, h, m, s } = window.splitRemain(rem);
  const txt = d > 0 ? `${d}${t("cd.day")} ${window.p2(h)}:${window.p2(m)}` : `${window.p2(h)}:${window.p2(m)}:${window.p2(s)}`;
  return <span className="card-cd-badge">{txt}</span>;
}

function VehicleCard({ v, now, currency, onOpen, watched, toggleWatch }) {
  const { locale, t } = window.useLang();
  const tv = window.trVehicle(v, locale);
  const status = window.statusOf(v.endsAt, now);
  const conv = window.fmtConverted(v.current, currency);
  const seedNum = v.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const saved = watched.has(v.id);
  const kmMan = (v.mileage / 10000).toFixed(1).replace(/\.0$/, "");
  const lot = `${(seedNum % 9) + 1}-${String(seedNum % 900 + 100)}`;
  const watchCount = 9 + (seedNum % 41);
  return (
    <article className={`card ${status === "ended" ? "card-ended" : ""}`} onClick={() => onOpen(v.id)}>
      <div className="card-img">
        <window.VehicleSlot slotId={v.id} seed={seedNum} label={t("card.photo")} img={v.img} radius={14} aspect="16 / 11" />
        <CardTimer endsAt={v.endsAt} now={now} />
        <button className={`heart-fab ${saved ? "on" : ""}`}
          onClick={(e) => { e.stopPropagation(); toggleWatch(v.id); }}
          aria-label={t("common.watch")}>
          <window.Icons.heart size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="card-body">
        <div className="card-name">{tv.maker} {tv.model}</div>
        <div className="card-spec">
          <span>{locale === "ko" ? `${v.year}년` : v.year}</span>
          <span className="sep">·</span><span>{locale === "ko" ? `${kmMan}만km` : `${v.mileage.toLocaleString("en-US")} km`}</span>
          <span className="sep">·</span><span>{tv.region}</span>
        </div>
        <div className="card-bidlabel">{t("card.highbid")}</div>
        <div className="card-price-krw mono">{window.fmtKRWShort(v.current)}원</div>
        {conv ? <div className="card-price-conv mono">≈ {conv}</div> : null}
        <div className="card-bids">{t("card.bids", v.bids)}</div>
        <div className="card-lotpill">{t("card.lot")} {lot}</div>
        <div className="card-watch">
          <window.Icons.heart size={15} fill="none" />{watchCount}
        </div>
      </div>
    </article>);
}

// value accessor per checkbox facet key
const facetVal = (v, key) => ({
  makers: v.maker,
  models: window.modelOf(v),
  submodels: window.subModelOf(v),
  years: v.year,
  colors: window.colorFamily(v),
  regions: window.regionBase(v),
  paints: window.paintStatusOf(v),
})[key];

function CheckRow({ active, label, count, onClick, radio, swatch }) {
  return (
    <button className={`frail-opt ${active ? "on" : ""}`} onClick={onClick}>
      <span className={`frail-check ${radio ? "radio" : ""}`}>
        {active && (radio ? <i /> : <window.Icons.check size={11} />)}
      </span>
      {swatch && <span className="frail-swatch" style={{ background: swatch }} />}
      <span className="frail-lbl">{label}</span>
      {count != null && <span className="frail-count mono">{count}</span>}
    </button>);
}

// collapsible rail section
function RailSection({ title, children, defaultOpen = true, count, bulk }) {
  const [open, setOpen] = React.useState(defaultOpen);
  React.useEffect(() => { if (bulk) setOpen(bulk.open); }, [bulk]);
  return (
    <div className="frail-section">
      <button className="frail-title frail-title-btn" onClick={() => setOpen((o) => !o)}>
        <span>{title}{count > 0 && <span className="frail-title-n mono">{count}</span>}</span>
        <window.Icons.chevron size={14} style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", opacity: 0.5, transition: ".15s" }} />
      </button>
      {open && children}
    </div>);
}

function Listing({ vehicles, now, currency, onOpen, watched, toggleWatch, q: qProp, setQ: setQProp }) {
  const { locale, t, sealed } = window.useLang();
  const [qLocal, setQLocal] = React.useState("");
  const q = qProp !== undefined ? qProp : qLocal;
  const setQ = setQProp || setQLocal;
  const [bulk, setBulk] = React.useState(null);
  const [allExpanded, setAllExpanded] = React.useState(true);
  const toggleAll = () => { const open = !allExpanded; setAllExpanded(open); setBulk({ open, n: Date.now() }); };
  const [status, setStatus] = React.useState("all");
  const [sel, setSel] = React.useState({ makers: [], models: [], submodels: [], years: [], colors: [], regions: [], paints: [] });
  const [maxKm, setMaxKm] = React.useState(0); // 0 = all
  const [sort, setSort] = React.useState("soon");
  const [availOnly, setAvailOnly] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(false);

  const toggle = (key, val) => setSel((s) => ({
    ...s, [key]: s[key].includes(val) ? s[key].filter((x) => x !== val) : [...s[key], val]
  }));

  const stOf = (v) => window.statusOf(v.endsAt, now);

  // base set: status + search + mileage (facet counts computed against this)
  const base = React.useMemo(() => vehicles.filter((v) => {
    const st = stOf(v);
    if (status === "all" ? st === "ended" : st !== status) return false;
    if (maxKm > 0 && v.mileage > maxKm) return false;
    if (q) {
      const hay = `${v.name} ${v.model} ${window.trVehicle(v, locale).name}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  }), [vehicles, now, status, q, maxKm, locale]);

  const filtered = React.useMemo(() => {
    let list = base.filter((v) =>
    Object.keys(sel).every((k) => sel[k].length === 0 || sel[k].includes(facetVal(v, k))));
    if (availOnly) list = list.filter((v) => stOf(v) !== "ended");
    const stRank = (v) => ({ soon: 0, live: 1, ended: 2 })[stOf(v)];
    list = [...list].sort((a, b) => {
      if (sort === "soon") return stRank(a) - stRank(b) || a.endsAt - b.endsAt;
      if (sort === "bids") return b.bids - a.bids;
      if (sort === "new") return b.year - a.year;
      if (sort === "low") return a.current - b.current;
      if (sort === "high") return b.current - a.current;
      return 0;
    });
    return list;
  }, [base, sel, sort, now, availOnly]);

  const countFor = (key, val) => base.filter((v) => facetVal(v, key) === val).length;
  const statusCount = (s) => vehicles.filter((v) => s === "all" ? stOf(v) !== "ended" : stOf(v) === s).length;

  const liveCount = vehicles.filter((v) => stOf(v) !== "ended").length;
  const soonCount = vehicles.filter((v) => stOf(v) === "soon").length;
  const selCount = Object.values(sel).reduce((a, x) => a + x.length, 0) + (maxKm > 0 ? 1 : 0);
  const reset = () => { setSel({ makers: [], models: [], submodels: [], years: [], colors: [], regions: [], paints: [] }); setQ(""); setStatus("all"); setMaxKm(0); };

  // dependent option pools
  const modelOpts = React.useMemo(() => {
    const pool = vehicles.filter((v) => sel.makers.length === 0 || sel.makers.includes(v.maker));
    return [...new Set(pool.map(window.modelOf))];
  }, [vehicles, sel.makers]);
  const submodelOpts = React.useMemo(() => {
    const pool = vehicles.filter((v) =>
      (sel.makers.length === 0 || sel.makers.includes(v.maker)) &&
      (sel.models.length === 0 || sel.models.includes(window.modelOf(v))));
    return [...new Set(pool.map(window.subModelOf))];
  }, [vehicles, sel.makers, sel.models]);

  const statusOpts = [["all", "tab.all"], ["live", "tab.live"], ["soon", "tab.soon"], ["ended", "tab.ended"]];

  // checkbox facet definitions for the rail (color rendered inline between years and regions)
  const facetsBefore = [
    { key: "makers", title: t("filter.maker"), opts: window.MAKERS, tr: (o) => window.trMaker(o, locale) },
    { key: "models", title: t("filter.model"), opts: modelOpts, tr: (o) => window.trModel(o, locale) },
    { key: "submodels", title: t("filter.submodel"), opts: submodelOpts, tr: (o) => window.trModel(o, locale), defaultOpen: false },
    { key: "years", title: t("filter.year"), opts: window.YEARS, tr: (o) => locale === "ko" ? `${o}년` : `${o}` },
  ];
  const facetsAfter = [
    { key: "regions", title: t("filter.region"), opts: window.REGIONS, tr: (o) => window.trRegion(o, locale) },
    { key: "paints", title: t("filter.paint"), opts: ["none", "panel"], tr: (o) => o === "none" ? t("filter.paint_none") : t("filter.paint_panel"), defaultOpen: false },
  ];
  const facets = [...facetsBefore, ...facetsAfter];

  const sortOpts = [["soon", "sort.soon"], ["bids", "sort.bids"], ["new", "sort.new"], ["low", "sort.low"], ["high", "sort.high"]].
  map(([k, key]) => ({ value: k, label: t(key) }));

  // active filter chips (incl. mileage)
  const chipLabel = (key, val) => {
    const f = facets.find((x) => x.key === key);
    if (f) return f.tr(val);
    if (key === "colors") return t("color." + val);
    return val;
  };
  const allChips = [];
  Object.keys(sel).forEach((k) => sel[k].forEach((val) => allChips.push({ key: k, val })));

  const kmMan = Math.round(maxKm / 10000);

  return (
    <div className="listing">
      <div className="listing-layout">
        <aside className={`filter-rail ${showFilters ? "open" : ""}`}>
          <div className="frail-head">
            <span className="frail-head-title">{t("filter.title")}</span>
            <button className="frail-expand" onClick={toggleAll}>
              {allExpanded ? t("filter.collapse_all") : t("filter.expand_all")}
            </button>
          </div>
          {/* 진행 상태 */}
          <div className="frail-section">
            <div className="frail-title">{t("filter.status")}</div>
            <div className="frail-opts">
              {statusOpts.map(([k, key]) =>
              <CheckRow key={k} radio active={status === k} label={t(key)} count={statusCount(k)}
              onClick={() => setStatus(k)} />
              )}
            </div>
          </div>

          {/* 최대 주행거리 (slider) */}
          <RailSection title={t("filter.mileage")} count={maxKm > 0 ? 1 : 0} bulk={bulk}>
            <div className="frail-slider">
              <div className="frail-slider-val">
                <span className="mono">{maxKm === 0 ? t("filter.km_all") : t("filter.km_under", kmMan)}</span>
              </div>
              <input type="range" min="0" max={window.MILEAGE_MAX} step="10000" value={maxKm}
                     onChange={(e) => setMaxKm(+e.target.value)} className="km-range" />
              <div className="frail-slider-scale mono"><span>0</span><span>10만km</span></div>
            </div>
          </RailSection>

          {/* 제조사 / 모델 / 세부모델 / 연식 */}
          {facetsBefore.map((f) =>
          <RailSection title={f.title} key={f.key} count={sel[f.key].length} defaultOpen={f.defaultOpen !== false} bulk={bulk}>
              <div className="frail-opts">
                {f.opts.length === 0 ? <span className="frail-none">—</span> : f.opts.map((o) =>
                <CheckRow key={o} active={sel[f.key].includes(o)} label={f.tr(o)} count={countFor(f.key, o)}
                onClick={() => toggle(f.key, o)} />
                )}
              </div>
            </RailSection>
          )}

          {/* 색상 (swatches) */}
          <RailSection title={t("filter.color")} count={sel.colors.length} bulk={bulk}>
            <div className="frail-opts">
              {window.COLOR_FAMILIES.map((c) =>
              <CheckRow key={c} active={sel.colors.includes(c)} label={t("color." + c)} count={countFor("colors", c)}
              swatch={window.COLOR_HEX[c]} onClick={() => toggle("colors", c)} />
              )}
            </div>
          </RailSection>

          {/* 지역 / 도장수리여부 */}
          {facetsAfter.map((f) =>
          <RailSection title={f.title} key={f.key} count={sel[f.key].length} defaultOpen={f.defaultOpen !== false} bulk={bulk}>
              <div className="frail-opts">
                {f.opts.length === 0 ? <span className="frail-none">—</span> : f.opts.map((o) =>
                <CheckRow key={o} active={sel[f.key].includes(o)} label={f.tr(o)} count={countFor(f.key, o)}
                onClick={() => toggle(f.key, o)} />
                )}
              </div>
            </RailSection>
          )}

          {(selCount > 0 || q || status !== "all") &&
          <button className="frail-reset" onClick={reset}><window.Icons.x size={13} />{t("filter.reset")}</button>
          }
        </aside>

        <div className="listing-main">
          <div className="sort-row">
            <div className="result-count">
              {t("result.count", filtered.length)}
              {selCount > 0 && <span className="sel-badge mono">{selCount}</span>}
            </div>
            <button className="filter-toggle" onClick={() => setShowFilters((s) => !s)}>
              <window.Icons.filter size={15} />{t("filter.title")}{selCount > 0 && <span className="pill mono">{selCount}</span>}
            </button>
            <div className="sort-spacer" />
            <label className="avail-toggle">
              <input type="checkbox" checked={availOnly} onChange={(e) => setAvailOnly(e.target.checked)} />
              <span className="avail-switch" />
              <span className="avail-label">{t("sort.avail_only")}</span>
            </label>
            <span className="sort-divider" />
            <div className="sort-control">
              <window.Icons.sort size={16} />
              <Select value={sort} onChange={setSort} options={sortOpts} mono />
            </div>
          </div>

          {(selCount > 0) &&
          <div className="qchips">
              {maxKm > 0 &&
              <button className="qchip" onClick={() => setMaxKm(0)}>{t("filter.km_under", kmMan)}<window.Icons.x size={12} /></button>}
              {allChips.map(({ key, val }) =>
            <button key={key + val} className="qchip" onClick={() => toggle(key, val)}>
                  {chipLabel(key, val)}<window.Icons.x size={12} />
                </button>
            )}
              <button className="qchip-clear" onClick={reset}>{t("filter.reset")}</button>
            </div>
          }

          {filtered.length === 0 ?
          <div className="empty">
              <window.Icons.search size={28} />
              <p>{t("empty.title")}</p>
              <button className="btn-ghost" onClick={reset}>{t("empty.reset")}</button>
            </div> :

          <div className="grid">
              {filtered.map((v) =>
            <VehicleCard key={v.id} v={v} now={now} currency={currency}
            onOpen={onOpen} watched={watched} toggleWatch={toggleWatch} />
            )}
            </div>
          }
        </div>
      </div>
    </div>);
}

function Select({ value, onChange, options, placeholder, mono }) {
  return (
    <div className={`sel ${mono ? "sel-mono" : ""} ${value ? "sel-active" : ""}`}>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ backgroundColor: "rgb(255, 255, 255)" }}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const v = typeof o === "object" ? o.value : o;
          const l = typeof o === "object" ? o.label : o;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
      <window.Icons.chevron size={14} style={{ transform: "rotate(90deg)" }} />
    </div>);
}

Object.assign(window, { Listing, VehicleCard, CheckRow, RailSection });
