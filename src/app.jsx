// app.jsx — shell: routing, live-auction simulation, nav, login, my-page, tweaks, i18n

const { useState, useEffect, useRef, useCallback, useMemo } = React;
const LS = {
  get(k, d) {try {const v = localStorage.getItem(k);return v == null ? d : JSON.parse(v);} catch {return d;}},
  set(k, v) {try {localStorage.setItem(k, JSON.stringify(v));} catch {}}
};

// ── login modal ──────────────────────────────────────────────────────────────
function LoginModal({ onClose, onAuth, setCurrency }) {
  const { t } = window.useLang();
  const [tab, setTab] = useState("login");
  const submit = (e) => {e.preventDefault();onAuth();};
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ position: "relative" }}>
        <div className="modal-head">
          <div>
            <h2>{tab === "login" ? t("login.signin") : t("login.signup")}</h2>
            <p className="modal-sub">{tab === "login" ? t("login.sub_in") : t("login.sub_up")}</p>
          </div>
          <button className="modal-x-btn" onClick={onClose}><window.Icons.x size={16} /></button>
        </div>
        <div className="modal-tabs">
          <button className={tab === "login" ? "on" : ""} onClick={() => setTab("login")}>{t("login.tab_in")}</button>
          <button className={tab === "signup" ? "on" : ""} onClick={() => setTab("signup")}>{t("login.tab_up")}</button>
        </div>
        <form onSubmit={submit}>
          {tab === "signup" &&
          <div className="field"><label>{t("login.name")}</label><input placeholder="" defaultValue="" /></div>
          }
          <div className="field"><label>{t("login.email")}</label><input type="email" placeholder="buyer@example.com" defaultValue="" required /></div>
          <div className="field"><label>{t("login.pw")}</label><input type="password" placeholder="••••••••" defaultValue="" required /></div>
          {tab === "signup" &&
          <div className="field-row">
              <div className="field"><label>{t("login.country")}</label>
                <select defaultValue="AE">
                  <option value="AE">{t("country.AE")}</option><option value="RU">{t("country.RU")}</option>
                  <option value="KZ">{t("country.KZ")}</option><option value="KR">{t("country.KR")}</option>
                  <option value="US">{t("country.US")}</option>
                </select>
              </div>
              <div className="field"><label>{t("login.cur")}</label>
                <select defaultValue="USD" onChange={(e) => setCurrency(e.target.value)}>
                  <option value="USD">USD $</option><option value="EUR">EUR €</option>
                  <option value="VND">VND ₫</option>
                  <option value="AED">AED</option><option value="KRW">KRW ₩</option></select>
              </div>
            </div>
          }
          <button className="btn-primary" type="submit">{tab === "login" ? t("login.submit_in") : t("login.submit_up")}</button>
        </form>
        <div className="modal-divider">{t("login.or")}</div>
        <button className="btn-google" onClick={onAuth}>
          <svg className="g-logo" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.3h5.9c-.3 1.4-1 2.5-2.2 3.3v2.8h3.6c2.1-1.9 3.2-4.8 3.2-8.2z" /><path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.6-2.8c-1 .7-2.3 1.1-3.6 1.1-2.8 0-5.1-1.9-6-4.4H2.3v2.9C4.1 20.6 7.8 23 12 23z" /><path fill="#FBBC05" d="M6 14.3c-.2-.7-.4-1.4-.4-2.3s.1-1.6.4-2.3V6.8H2.3C1.5 8.4 1 10.1 1 12s.5 3.6 1.3 5.2L6 14.3z" /><path fill="#EA4335" d="M12 5.4c1.6 0 3 .5 4.1 1.6l3.1-3.1C17.4 2.1 14.9 1 12 1 7.8 1 4.1 3.4 2.3 6.8L6 9.7c.9-2.6 3.2-4.4 6-4.4z" /></svg>
          {t("login.google")}
        </button>
        <div className="modal-foot">
          {tab === "login" ? <>{t("login.foot_in_q")} <button onClick={() => setTab("signup")}>{t("login.tab_up")}</button></> :
          <>{t("login.foot_up_q")} <button onClick={() => setTab("login")}>{t("login.tab_in")}</button></>}
        </div>
      </div>
    </div>);

}

// ── my page ────────────────────────────────────────────────────────────────
function MyPage({ vehicles, now, currency, onOpen, watched, toggleWatch, myBids, wins, winFlow, openWinFlow, onLogout, section }) {
  const { locale, t } = window.useLang();
  const bidVehicles = vehicles.filter((v) => myBids[v.id] != null && window.statusOf(v.endsAt, now) !== "ended");
  const wonVehicles = vehicles.filter((v) => wins.has(v.id) && window.statusOf(v.endsAt, now) === "ended");
  const watchVehicles = vehicles.filter((v) => watched.has(v.id));

  const Row = ({ v, won }) => {
    const st = window.statusOf(v.endsAt, now);
    const mine = myBids[v.id];
    const leading = v.youHigh;
    const tv = window.trVehicle(v, locale);
    const seedNum = v.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const done = winFlow[v.id] && winFlow[v.id].status === "completed";
    return (
      <div className="mp-row" onClick={() => won ? openWinFlow(v.id) : onOpen(v.id)}>
        <div className="mp-row-img"><window.VehicleImage seed={seedNum} aspect="4 / 3" label="" img={v.img} /></div>
        <div className="mp-row-main">
          <div className="mp-row-name">
            <span className={`mp-mode ${window.saleModeOf(v.id) === "tender" ? "tender" : "auction"}`}>
              {window.saleModeOf(v.id) === "tender" ? <window.Icons.shield size={10} /> : <window.Icons.gavel size={10} />}
              {t(window.saleModeOf(v.id) === "tender" ? "my.type_tender" : "my.type_auction")}
            </span>
            {tv.name}
          </div>
          <div className="mp-row-meta mono">{v.mileage.toLocaleString("en-US")} km · {tv.fuel} · {tv.region}</div>
        </div>
        {mine != null &&
        <div className="mp-row-bid">
            <span className="apanel-lbl">{won ? t("wf.final") : t("my.mybid")}</span>
            <span className="mono mp-amt">{window.fmtKRW(won ? v.current : mine)}</span>
          </div>
        }
        <div className="mp-row-status">
          {won ?
          <>
              <span className={`wf-statusrow ${done ? "ok" : "pend"}`}>
                {done ? <window.Icons.check size={12} /> : <window.Icons.bolt size={12} />}
                {done ? t("wf.completed") : t("wf.pending")}
              </span>
              <button className="mp-link" onClick={(e) => {e.stopPropagation();openWinFlow(v.id);}}>
                {done ? t("wf.review") : t("wf.process")} →
              </button>
            </> :

          <>
              {st !== "ended" && mine != null && (
            leading ? <span className="lead-yes"><window.Icons.check size={13} />{t("my.leading")}</span> :
            <span className="lead-no"><window.Icons.bolt size={13} />{t("my.outbid")}</span>)
            }
              <window.CountdownInline endsAt={v.endsAt} now={now} />
            </>
          }
        </div>
      </div>);

  };

  const PAGE_SIZE = 20;
  const tab = section || "bidding";
  const [q, setQ] = React.useState("");
  const [mode, setMode] = React.useState("all");
  const [period, setPeriod] = React.useState("all");
  const [sort, setSort] = React.useState("soon");
  const [page, setPage] = React.useState(1);

  const baseList = tab === "bidding" ? bidVehicles : tab === "won" ? wonVehicles : watchVehicles;

  const filtered = React.useMemo(() => {
    const ql = q.trim().toLowerCase();
    let arr = baseList.filter((v) => {
      const tv = window.trVehicle(v, locale);
      if (ql) {
        const hay = `${tv.name} ${tv.maker} ${tv.model} ${tv.region} ${v.maker} ${v.model} ${v.region}`.toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      if (mode !== "all" && window.saleModeOf(v.id) !== mode) return false;
      if (period !== "all") {
        const rem = v.endsAt - now;
        if (period === "7" && !(rem > 0 && rem <= 7 * 864e5)) return false;
        if (period === "30" && !(rem > 0 && rem <= 30 * 864e5)) return false;
        if (period === "ended" && rem > 0) return false;
      }
      return true;
    });
    arr = arr.slice().sort((a, b) => {
      if (sort === "soon") return a.endsAt - b.endsAt;
      if (sort === "recent") return b.endsAt - a.endsAt;
      if (sort === "price_h") return b.current - a.current;
      if (sort === "price_l") return a.current - b.current;
      return 0;
    });
    return arr;
  }, [baseList, q, mode, period, sort, now, locale]);

  React.useEffect(() => { setPage(1); setQ(""); setMode("all"); setPeriod("all"); setSort("soon"); }, [tab]);
  React.useEffect(() => { setPage(1); }, [q, mode, period, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageClamped = Math.min(page, totalPages);
  const pageItems = filtered.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE);

  const periodOpts = [["all", "my.period_all"], ["7", "my.period_7"], ["30", "my.period_30"], ["ended", "my.period_ended"]];
  const modeOpts = [["all", "my.type_all"], ["auction", "my.type_auction"], ["tender", "my.type_tender"]];
  const sortOpts = [["soon", "my.sort_soon"], ["recent", "my.sort_recent"], ["price_h", "my.sort_price_h"], ["price_l", "my.sort_price_l"]];
  const emptyKey = tab === "bidding" ? "my.empty_bid" : tab === "won" ? "my.empty_won" : "my.empty_watch";
  const sectionMeta = {
    bidding: { key: "my.bidding", icon: "gavel", sub: "my.sub_bidding" },
    won: { key: "my.won", icon: "check", sub: "my.sub_won" },
    saved: { key: "my.saved", icon: "heart", sub: "my.sub_saved" },
  }[tab];
  const SecIcon = window.Icons[sectionMeta.icon];

  return (
    <div className="page">
      <div className="mypage-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 className="mp-sec-title"><SecIcon size={22} />{t(sectionMeta.key)}<span className="mp-sec-n mono">{filtered.length}</span></h1>
          <p>{t(sectionMeta.sub)}</p>
        </div>
        <button className="btn-ghost" onClick={onLogout}>{t("my.logout")}</button>
      </div>

      <div className="mp-filterbar">
        <div className="mp-search">
          <window.Icons.search size={15} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("my.search_ph")} />
          {q && <button className="mp-search-clear" onClick={() => setQ("")}><window.Icons.x size={13} /></button>}
        </div>
        <div className="mp-selects">
          <select className="mp-select" value={mode} onChange={(e) => setMode(e.target.value)}>
            {modeOpts.map(([v, k]) => <option key={v} value={v}>{t(k)}</option>)}
          </select>
          <select className="mp-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
            {periodOpts.map(([v, k]) => <option key={v} value={v}>{t(k)}</option>)}
          </select>
          <select className="mp-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            {sortOpts.map(([v, k]) => <option key={v} value={v}>{t(k)}</option>)}
          </select>
        </div>
      </div>

      <div className="mp-resultbar">
        <span className="mp-result-n mono">{t("my.result_n", filtered.length)}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="mp-empty">{baseList.length === 0 ? t(emptyKey) : t("my.no_result")}</div>
      ) : (
        <>
          <div className="mp-list">{pageItems.map((v) => <Row key={v.id} v={v} won={tab === "won"} />)}</div>
          {totalPages > 1 && (
            <div className="mp-pager">
              <button className="mp-page-btn" disabled={pageClamped <= 1} onClick={() => setPage(pageClamped - 1)}>
                <window.Icons.chevronL size={15} />{t("my.prev")}
              </button>
              <span className="mp-page-of mono">{t("my.page_of", { p: pageClamped, t: totalPages })}</span>
              <button className="mp-page-btn" disabled={pageClamped >= totalPages} onClick={() => setPage(pageClamped + 1)}>
                {t("my.next")}<window.Icons.chevron size={15} />
              </button>
            </div>
          )}
        </>
      )}
    </div>);

}

// ── nav ──────────────────────────────────────────────────────────────────────
function Nav({ route, go, currency, setCurrency, loggedIn, watchCount, onLogin, onMyPage, onLogout }) {
  const { t } = window.useLang();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [navOpen, setNavOpen] = React.useState(false);
  const [curOpen, setCurOpen] = React.useState(false);
  const curRef = React.useRef(null);
  React.useEffect(() => {
    if (!curOpen) return;
    const onDoc = (e) => { if (curRef.current && !curRef.current.contains(e.target)) setCurOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [curOpen]);
  const focusSearch = () => { const el = document.querySelector(".hero-search input"); if (el) el.focus(); };
  const goM = (r) => { setNavOpen(false); go(r); };
  const menuRef = React.useRef(null);
  React.useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);
  const pick = (item) => { setMenuOpen(false); if (item.route) { go(item.route); } else { onMyPage(item.k); } };
  const menuItems = [
    { k: "bidding", key: "my.bidding", icon: "gavel" },
    { k: "won", key: "my.won", icon: "check" },
    { k: "saved", key: "my.saved", icon: "heart", badge: watchCount },
    { k: "assets", key: "nav.assets", icon: "doc", route: "assets", sep: true },
    { k: "approvals", key: "nav.approvals", icon: "shield", route: "approvals" },
  ];
  return (
    <nav className="nav" style={{ backgroundColor: "rgb(255, 255, 255)" }}>
      <div className="nav-inner">
        <div className="brand" onClick={() => goM("list")}>
          <img className="brand-logo" src={(window.__resources && window.__resources["assets/CI.svg"]) || "assets/CI.svg"} alt="제시카중고차" />
        </div>
        <div className="nav-links">
          <button className={`nav-link ${(route === "list" || route === "notice") ? "on" : ""}`} onClick={() => go("list")}>{t("nav.auctions")}</button>
          <button className={`nav-link ${route === "tender" ? "on" : ""}`} onClick={() => go("tender")}>{t("nav.tender")}</button>
          <button className={`nav-link ${route === "sell" ? "on" : ""}`} onClick={() => go("sell")}>{t("nav.sell")}</button>
        </div>
        <div className="nav-spacer" />
        <div className="nav-right">
          <button className="nav-ic" onClick={focusSearch} aria-label={t("search.ph")}>
            <window.Icons.search size={20} />
          </button>
          <div className="cur-wrap" ref={curRef}>
            <button className={`nav-ic ${curOpen ? "on" : ""}`} onClick={() => setCurOpen((o) => !o)} aria-label="Currency">
              <window.Icons.globe size={20} />
            </button>
            {curOpen &&
            <div className="cur-menu">
              {["KRW", "USD", "EUR", "VND"].map((c) =>
              <button key={c} className={`cur-menu-item mono ${currency === c ? "on" : ""}`} onClick={() => { setCurrency(c); setCurOpen(false); }}>
                {c}{currency === c && <window.Icons.check size={14} />}
              </button>
              )}
            </div>
            }
          </div>
          {loggedIn ?
          <div className="avatar-wrap" ref={menuRef}>
              <button className={`avatar ${menuOpen ? "on" : ""}`} onClick={() => setMenuOpen((o) => !o)}>B</button>
              {menuOpen &&
              <div className="avatar-menu">
                  <div className="am-label">{t("acct.current")}</div>
                  <div className="am-account">
                    <div className="am-acct-avatar">손</div>
                    <div className="am-acct-info">
                      <div className="am-acct-name">{t("acct.name")}</div>
                      <div className="am-acct-type">{t("acct.type")}</div>
                      <div className="am-acct-email">shtjgus0724@jessica.kr</div>
                    </div>
                    <window.Icons.check size={18} />
                  </div>
                  <div className="am-label am-label-mt">{t("acct.menu")}</div>
                  {menuItems.map((m) => {
                  const MIcon = window.Icons[m.icon];
                  return (
                    <React.Fragment key={m.k}>
                      {m.sep && <div className="avatar-sep" />}
                      <button className="avatar-mi" onClick={() => pick(m)}>
                        <MIcon size={16} />{t(m.key)}
                        {m.badge > 0 && <span className="avatar-mi-badge mono">{m.badge}</span>}
                      </button>
                    </React.Fragment>);

                })}
                  <div className="avatar-sep" />
                  <button className="avatar-mi danger" onClick={() => { setMenuOpen(false); onLogout(); }}>
                    <window.Icons.user size={16} />{t("my.logout")}
                  </button>
                </div>
              }
            </div> :
          <button className="btn-login" onClick={onLogin}><window.Icons.user size={15} />{t("nav.login")}</button>}
          <button className="nav-burger" onClick={() => setNavOpen((o) => !o)} aria-label={t("filter.title")}>
            {navOpen ? <window.Icons.x size={22} /> : <window.Icons.menu size={22} />}
          </button>
        </div>
      </div>
      {navOpen &&
      <div className="nav-mobile">
        <button className={`nav-mlink ${(route === "list" || route === "notice") ? "on" : ""}`} onClick={() => goM("list")}>{t("nav.auctions")}</button>
        <button className={`nav-mlink ${route === "tender" ? "on" : ""}`} onClick={() => goM("tender")}>{t("nav.tender")}</button>
        <button className={`nav-mlink ${route === "sell" ? "on" : ""}`} onClick={() => goM("sell")}>{t("nav.sell")}</button>
        <div className="nav-mcur">
          {["KRW", "USD", "EUR", "VND"].map((c) =>
          <button key={c} className={currency === c ? "on" : ""} onClick={() => setCurrency(c)}>{c}</button>
          )}
        </div>
      </div>
      }
    </nav>);

}

// ── tweak application ──────────────────────────────────────────────────────────
const FONT_STACKS = {
  pretendard: '"Pretendard","Pretendard Variable",-apple-system,system-ui,sans-serif',
  noto: '"Noto Sans KR",sans-serif',
  plex: '"IBM Plex Sans KR",sans-serif'
};
const DENSITY_MIN = { compact: "240px", regular: "280px", comfy: "324px" };

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#2552e0",
  "font": "pretendard",
  "density": "regular",
  "dark": false
} /*EDITMODE-END*/;

// ── app ────────────────────────────────────────────────────────────────────────
function App() {
  const now = window.useNow(1000);
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // demo seed: applied whenever the user has no saved bids yet (robust to stale flags)
  const STORED_BIDS = LS.get("kcea_mybids", null);
  const STORED_WINS = LS.get("kcea_wins", null);
  const NEEDS_SEED = !STORED_BIDS || Object.keys(STORED_BIDS).length === 0;
  // demo bids on the generated filler vehicles so 참여 중인 경매 exceeds one page (20+)
  const GEN_BIDS = {};
  window.VEHICLES.forEach((v) => { if (v.id.startsWith("gen")) GEN_BIDS[v.id] = Math.round(v.current * 0.97 / 1e5) * 1e5; });
  const SEED = {
    auth: true,
    mybids: { forte: 7800000, carens: 7200000, sorento: 36800000, k9: 39800000, ...GEN_BIDS },
    wins: ["forte", "carens"], // persisted → shows in 낙찰 내역 on every load
    watch: ["carnival", "staria"]
  };
  // always keep the demo gen bids + won-vehicle bids present (bids are append-only — never removed in-app),
  // while preserving any real bids the user placed on top
  const DEMO_WON_BIDS = { forte: 7800000, carens: 7200000 };
  const effectiveBids = NEEDS_SEED ? SEED.mybids : { ...GEN_BIDS, ...DEMO_WON_BIDS, ...STORED_BIDS };
  // wins survive reloads; always include the demo wins so 낙찰 내역 stays populated
  const initialWins = STORED_WINS != null ?
  [...new Set([...STORED_WINS, ...SEED.wins])] :
  SEED.wins.filter((id) => effectiveBids[id] != null);
  const [wins, setWins] = useState(() => new Set(initialWins));
  const winsRef = useRef(wins);winsRef.current = wins;
  useEffect(() => LS.set("kcea_wins", [...wins]), [wins]);

  // win-flow state (shipping + docs per won vehicle) + which win modal is open
  const [winFlow, setWinFlow] = useState(() => LS.get("kcea_winflow", {}));
  useEffect(() => LS.set("kcea_winflow", winFlow), [winFlow]);
  const [winModalId, setWinModalId] = useState(null);
  // wins already celebrated this session (avoid auto-popping the seeded win on load)
  const seenWinsRef = useRef(new Set(initialWins));

  const saved = LS.get("kcea_route", { route: "list", selectedId: null });
  const [route, setRoute] = useState("list");
  const [marketTab, setMarketTab] = useState("selling");
  const [listQ, setListQ] = useState("");
  const [tenderQ, setTenderQ] = useState("");
  const [sealed, setSealed] = useState(false);
  const [mypageSection, setMypageSection] = useState("bidding");
  const [selectedId, setSelectedId] = useState(saved.selectedId || null);
  const [currency, setCurrency] = useState(() => LS.get("kcea_cur", "KRW"));
  const [loggedIn, setLoggedIn] = useState(() => NEEDS_SEED ? SEED.auth : LS.get("kcea_auth", false));
  const [showLogin, setShowLogin] = useState(false);
  const [watched, setWatched] = useState(() => new Set(NEEDS_SEED ? SEED.watch : LS.get("kcea_watch", [])));
  const [reminded, setReminded] = useState(() => new Set(LS.get("kcea_remind", [])));
  const [myBids, setMyBids] = useState(() => effectiveBids);
  const [toasts, setToasts] = useState([]);

  // locale derives from selected currency
  const locale = window.LOCALE_FOR_CUR[currency] || "ko";
  const tr = useMemo(() => window.makeT(locale), [locale]);
  const trRef = useRef(tr);trRef.current = tr;
  const localeRef = useRef(locale);localeRef.current = locale;

  // live auction state per vehicle
  const [liveMap, setLiveMap] = useState(() => {
    const m = {};
    window.VEHICLES.forEach((v) => {
      const seedHigh = wins.has(v.id);
      m[v.id] = { current: v.current, bids: v.bids, bidders: v.bidders,
        history: v.history, endsAt: v.endsAt, youHigh: !!seedHigh, outbid: false };
    });
    return m;
  });
  const [autoBidMap, setAutoBidMap] = useState({});

  const liveRef = useRef(liveMap);liveRef.current = liveMap;
  const autoRef = useRef(autoBidMap);autoRef.current = autoBidMap;
  const selRef = useRef(selectedId);selRef.current = selectedId;
  const routeRef = useRef(route);routeRef.current = route;

  // persistence
  useEffect(() => LS.set("kcea_route", { route, selectedId }), [route, selectedId]);
  useEffect(() => LS.set("kcea_cur", currency), [currency]);
  useEffect(() => LS.set("kcea_auth", loggedIn), [loggedIn]);
  useEffect(() => LS.set("kcea_watch", [...watched]), [watched]);
  useEffect(() => LS.set("kcea_remind", [...reminded]), [reminded]);
  useEffect(() => LS.set("kcea_mybids", myBids), [myBids]);

  // apply tweaks + lang
  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty("--accent", t.accent);
    r.style.setProperty("--font", FONT_STACKS[t.font] || FONT_STACKS.pretendard);
    r.style.setProperty("--card-min", DENSITY_MIN[t.density] || DENSITY_MIN.regular);
    r.setAttribute("data-theme", t.dark ? "dark" : "light");
  }, [t]);
  useEffect(() => {document.documentElement.lang = locale;}, [locale]);

  // capture wins: any ended auction where you're the highest bidder
  useEffect(() => {
    const m = liveRef.current;
    let add = null;
    Object.keys(m).forEach((id) => {
      if (m[id].youHigh && m[id].endsAt - Date.now() <= 0 && !winsRef.current.has(id)) {
        (add = add || []).push(id);
      }
    });
    if (add) {
      setWins((w) => {const n = new Set(w);add.forEach((id) => n.add(id));return n;});
      // auto-open the celebration for the first newly-won auction
      const fresh = add.find((id) => !seenWinsRef.current.has(id));
      if (fresh) {seenWinsRef.current.add(fresh);setWinModalId(fresh);}
    }
  }, [now]);

  const openWinFlow = useCallback((id) => {seenWinsRef.current.add(id);setWinModalId(id);}, []);
  const completeWinFlow = useCallback((id, data) => {
    setWinFlow((wf) => ({ ...wf, [id]: data }));
    addToast("toast.winflow", null, "good");
  }, [addToast]);
  const closeWinModal = useCallback((toMy) => {
    setWinModalId(null);
    if (toMy === true) {setRoute("mypage");window.scrollTo(0, 0);}
  }, []);

  // addToast(key, vars, kind) — localized at creation time
  const addToast = useCallback((key, vars, kind = "good") => {
    const id = Math.random().toString(36).slice(2);
    const text = trRef.current(key, vars);
    setToasts((ts) => [...ts, { id, text, kind }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 2800);
  }, []);

  const toggleWatch = useCallback((id) => {
    setWatched((w) => {const n = new Set(w);n.has(id) ? n.delete(id) : n.add(id);return n;});
  }, []);

  const toggleRemind = useCallback((id) => {
    setReminded((w) => { const n = new Set(w); if (n.has(id)) { n.delete(id); } else { n.add(id); addToast("toast.reminded", null, "good"); } return n; });
  }, [addToast]);

  const applyUserBid = useCallback((id, amount, auto = false) => {
    setLiveMap((prev) => {
      const s = prev[id];if (!s) return prev;
      const entry = { id: id + "-u" + Date.now(), amount, bidder: "나", time: Date.now(), you: true };
      return { ...prev, [id]: { ...s, current: amount, bids: s.bids + 1,
          bidders: s.history.some((h) => h.you) ? s.bidders : s.bidders + 1,
          youHigh: true, outbid: false, history: [entry, ...s.history] } };
    });
    setMyBids((m) => ({ ...m, [id]: amount }));
    if (auto) addToast("toast.autohold", null, "good");
  }, [addToast]);

  const placeBid = useCallback((amount) => {
    const id = selRef.current;
    applyUserBid(id, amount);
    addToast("toast.bid", null, "good");
    setLiveMap((prev) => {
      const s = prev[id];if (!s) return prev;
      const rem = s.endsAt - Date.now();
      if (rem > 0 && rem <= 5 * 60 * 1000) {
        return { ...prev, [id]: { ...s, endsAt: Date.now() + 5 * 60 * 1000 } };
      }
      return prev;
    });
  }, [applyUserBid, addToast]);

  const setAutoBid = useCallback((next) => {
    const id = selRef.current;
    setAutoBidMap((m) => ({ ...m, [id]: next }));
    if (next.enabled) addToast("toast.autoset", window.fmtIncShort(next.max, localeRef.current), "good");
  }, [addToast]);

  // competitor simulation
  useEffect(() => {
    const tick = setInterval(() => {
      const live = liveRef.current;
      const eligible = window.VEHICLES.filter((v) => live[v.id].endsAt - Date.now() > 0);
      if (!eligible.length) return;
      let target;
      const openId = routeRef.current === "detail" ? selRef.current : null;
      if (openId && live[openId] && live[openId].endsAt - Date.now() > 0 && Math.random() < 0.62) {
        target = window.VEHICLES.find((v) => v.id === openId);
      } else if (Math.random() < 0.55) {
        target = eligible[Math.floor(Math.random() * eligible.length)];
      }
      if (!target) return;
      const id = target.id;
      const s = live[id];
      const inc = window.minIncrement(s.current);
      const step = inc * (1 + Math.floor(Math.random() * 2));
      const newCur = s.current + step;
      const wasMine = s.youHigh;
      const auto = autoRef.current[id];

      setLiveMap((prev) => {
        const cur = prev[id];
        const entry = { id: id + "-c" + Date.now(), amount: newCur, bidder: window.anonBidder(Math.random), time: Date.now(), you: false };
        return { ...prev, [id]: { ...cur, current: newCur, bids: cur.bids + 1,
            bidders: Math.random() < 0.3 ? cur.bidders + 1 : cur.bidders,
            youHigh: false, outbid: wasMine ? true : cur.outbid, history: [entry, ...cur.history] } };
      });

      if (wasMine && openId === id) addToast("toast.outbid", null, "live");

      if (auto && auto.enabled && wasMine) {
        const next = newCur + inc;
        if (next <= auto.max) setTimeout(() => applyUserBid(id, next, true), 1100);else
        if (openId === id) setTimeout(() => addToast("toast.autolimit", null, "live"), 1100);
      }
    }, 2600);
    return () => clearInterval(tick);
  }, [applyUserBid, addToast]);

  const vehicles = useMemo(() => window.VEHICLES.map((v) => ({ ...v, ...liveMap[v.id] })), [liveMap]);
  const selected = vehicles.find((v) => v.id === selectedId);
  const liveCount = vehicles.filter((v) => window.statusOf(v.endsAt, now) !== "ended").length;
  const upcomingLots = window.DISCLOSURES.length;

  const go = (r) => {
    if (r === "list") setSealed(false);
    else if (r === "tender") setSealed(true);
    setRoute(r); window.scrollTo(0, 0);
  };
  const openVehicle = (id) => {setSelectedId(id);setRoute("detail");window.scrollTo(0, 0);};
  const requireLogin = () => setShowLogin(true);
  const onAuth = () => {setLoggedIn(true);setShowLogin(false);addToast("toast.signedin", null, "good");};
  const onLogout = () => {setLoggedIn(false);go("list");addToast("toast.signedout");};

  return (
    <window.LangCtx.Provider value={{ locale, t: tr, sealed }}>
      <div className="app">
        <Nav route={route} go={go} currency={currency} setCurrency={setCurrency}
        loggedIn={loggedIn} watchCount={watched.size}
        onLogin={() => setShowLogin(true)}
        onMyPage={(section) => { setMypageSection(section); go("mypage"); }}
        onLogout={onLogout} />

        {route === "list" &&
        <div className="wrap">
            <div className="hero-search">
              <input value={listQ} onChange={(e) => setListQ(e.target.value)} placeholder={tr("search.ph")} />
              <window.Icons.search size={22} />
            </div>
            <div className="market-tabs">
              <button className={marketTab === "selling" ? "on" : ""} onClick={() => setMarketTab("selling")}>
                {tr("market.tab_selling")}
                <span className="market-tab-n mono">{liveCount}</span>
              </button>
              <button className={marketTab === "upcoming" ? "on" : ""} onClick={() => setMarketTab("upcoming")}>
                {tr("market.tab_upcoming")}
                <span className="market-tab-n mono">{upcomingLots}</span>
              </button>
            </div>
            {marketTab === "selling" ?
            <div className="page">
                <window.Listing vehicles={vehicles} now={now} currency={currency} onOpen={openVehicle}
            watched={watched} toggleWatch={toggleWatch} q={listQ} setQ={setListQ} />
              </div> :
            <window.NoticePage reminded={reminded} toggleRemind={toggleRemind}
          watched={watched} toggleWatch={toggleWatch} onView={() => setMarketTab("selling")} />
            }
          </div>
        }

        {route === "tender" &&
        <div className="wrap">
            <div className="hero-search">
              <input value={tenderQ} onChange={(e) => setTenderQ(e.target.value)} placeholder={tr("search.ph")} />
              <window.Icons.search size={22} />
            </div>
            <div className="page">
              <window.Listing vehicles={vehicles} now={now} currency={currency} onOpen={openVehicle}
                watched={watched} toggleWatch={toggleWatch} q={tenderQ} setQ={setTenderQ} />
            </div>
          </div>
        }

        {route === "detail" && selected &&
        <div className="wrap">
            <window.Detail v={selected} ls={liveMap[selected.id]} now={now} currency={currency}
          setCurrency={setCurrency} onBack={() => go(sealed ? "tender" : "list")}
          loggedIn={loggedIn} onRequireLogin={requireLogin} placeBid={placeBid}
          autoBid={autoBidMap[selected.id] || { enabled: false, max: 0 }} setAutoBid={setAutoBid}
          watched={watched} toggleWatch={toggleWatch}
          winState={winFlow[selected.id]} openWinFlow={openWinFlow} />
          </div>
        }

        {route === "mypage" &&
        <div className="wrap">
            <MyPage vehicles={vehicles} now={now} currency={currency} onOpen={openVehicle}
          watched={watched} toggleWatch={toggleWatch} myBids={myBids} wins={wins}
          winFlow={winFlow} openWinFlow={openWinFlow} onLogout={onLogout} section={mypageSection} />
          </div>
        }

        {route === "sell" &&
        <div className="wrap">
            <window.RegisterPage onDone={() => addToast("toast.listed", null, "good")} openNotice={() => go("list")}
              onOpen={openVehicle} currency={currency} now={now} watched={watched} toggleWatch={toggleWatch} />
          </div>
        }

        {route === "approvals" &&
        <div className="wrap">
            <window.ApprovalsPage onToast={(k) => addToast(k, null, "good")} />
          </div>
        }

        {route === "assets" &&
        <div className="wrap">
            <window.VehicleAssetPage onToast={(k) => addToast(k, null, "good")} />
          </div>
        }

        {winModalId && (() => {
          const wv = vehicles.find((v) => v.id === winModalId);
          return wv ? <window.WinModal vehicle={wv} currency={currency} existing={winFlow[winModalId]}
          onClose={closeWinModal} onComplete={completeWinFlow} /> : null;
        })()}

        {showLogin && <window.AuthModal onClose={() => setShowLogin(false)} onAuth={onAuth} setCurrency={setCurrency} onToast={(k) => addToast(k, null, "good")} />}

        <div className="toasts">
          {toasts.map((to) =>
          <div key={to.id} className={`toast ${to.kind}`}>
              {to.kind === "live" ? <window.Icons.bolt size={15} fill="currentColor" /> : <window.Icons.check size={15} />}
              {to.text}
            </div>
          )}
        </div>

        <TweaksPanel title="Tweaks">
          <TweakSection label="브랜드" />
          <TweakColor label="액센트" value={t.accent}
          options={["#2552e0", "#1f7a4d", "#c02a3b", "#6a3df0", "#1c1c22"]}
          onChange={(v) => setTweak("accent", v)} />
          <TweakSelect label="서체" value={t.font}
          options={[{ value: "pretendard", label: "Pretendard" }, { value: "noto", label: "Noto Sans KR" }, { value: "plex", label: "IBM Plex Sans KR" }]}
          onChange={(v) => setTweak("font", v)} />
          <TweakSection label="레이아웃" />
          <TweakRadio label="카드 밀도" value={t.density} options={["compact", "regular", "comfy"]}
          onChange={(v) => setTweak("density", v)} />
          <TweakSection label="테마" />
          <TweakToggle label="다크 모드" value={t.dark} onChange={(v) => setTweak("dark", v)} />
        </TweaksPanel>
      </div>
    </window.LangCtx.Provider>);

}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);