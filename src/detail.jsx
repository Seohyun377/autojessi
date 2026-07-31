// detail.jsx — auction detail & live bidding page

function relTime(time, now, t) {
  const diff = now - time;
  if (diff < 15000) return t("rt.now");
  if (diff < 60000) return t("rt.sec", Math.floor(diff / 1000));
  if (diff < 3600000) return t("rt.min", Math.floor(diff / 60000));
  const d = new Date(time);
  return `${window.p2(d.getHours())}:${window.p2(d.getMinutes())}`;
}

function SpecGrid({ v }) {
  const { locale, t } = window.useLang();
  const tv = window.trVehicle(v, locale);
  // deterministic mock plate from VIN
  const plateNum = (v.vin.charCodeAt(4) * 7 % 90 + 10) + "가 " + (v.vin.charCodeAt(8) * 13 % 9000 + 1000);
  const accNone = /무사고/.test(v.inspect.accident);
  const rows = [
    ["spec.plate", plateNum, true], ["spec.maker", tv.maker], ["spec.model", tv.model],
    ["spec.year", t("spec.yearval", v.year)],
    ["spec.color", tv.color], ["spec.mileage", `${v.mileage.toLocaleString("en-US")} km`],
    ["spec.fuel", tv.fuel], ["spec.trans", tv.trans], ["spec.region", tv.region],
    ["spec.accident_y", window.trAccident(v.inspect.accident, locale), false, accNone ? "good" : "warn"],
  ];
  return (
    <div className="specgrid">
      {rows.map(([k, val, mono, tone]) => (
        <div className="spec-item" key={k}>
          <span className="spec-k">{t(k)}</span>
          <span className={`spec-v ${mono ? "mono" : ""} ${tone ? "spec-" + tone : ""}`}>{val}</span>
        </div>
      ))}
      <div className="spec-item spec-vin">
        <span className="spec-k">{t("spec.vin")}</span>
        <span className="spec-v mono">{v.vin}</span>
      </div>
    </div>
  );
}

function InspectionCard({ v }) {
  const { locale, t } = window.useLang();
  const [downloaded, setDownloaded] = React.useState(false);
  const tv = window.trVehicle(v, locale);
  const grades = [["inspect.ext", v.inspect.exterior], ["inspect.int", v.inspect.interior], ["inspect.eng", v.inspect.engine]];
  const accNone = /무사고/.test(v.inspect.accident);
  return (
    <section className="panel inspect">
      <div className="panel-head">
        <h2><window.Icons.shield size={18} /> {t("inspect.title")}</h2>
        <button className={`btn-ghost ${downloaded ? "done" : ""}`} onClick={() => setDownloaded(true)}>
          {downloaded ? <><window.Icons.check size={14} />{t("inspect.done")}</> : <><window.Icons.doc size={14} />{t("inspect.pdf")}</>}
        </button>
      </div>
      <div className="inspect-grades">
        {grades.map(([k, g]) => (
          <div className="ins-grade" key={k}>
            <span className="ins-k">{t(k)}</span>
            <window.GradePill grade={g} />
          </div>
        ))}
        <div className="ins-grade ins-accident">
          <span className="ins-k">{t("inspect.acc")}</span>
          <span className={`acc ${accNone ? "acc-none" : "acc-some"}`}>
            {window.trAccident(v.inspect.accident, locale)}
          </span>
        </div>
      </div>
      <p className="inspect-note">{locale === "ko" ? v.accidentNote : (tv.note || v.accidentNote)}</p>
      <p className="inspect-foot mono">{t("inspect.foot", v.year + 2)}</p>
    </section>
  );
}

function ApprBar({ score }) {
  const cls = score >= 90 ? "g-a" : score >= 75 ? "g-b" : "g-c";
  return (
    <div className="appr-bar">
      <div className={`appr-bar-fill ${cls}`} style={{ width: score + "%" }} />
    </div>
  );
}

function AppraiserCard({ v }) {
  const { locale, t } = window.useLang();
  const a = v.appraisal;
  if (!a) return null;
  const ap = a.appraiser;
  const name = locale === "ko" ? ap.name : ap.en;
  const org = locale === "ko" ? ap.org : ap.orgEn;
  const initial = ap.name.charAt(0);
  const scoreCls = a.overall >= 90 ? "ring-a" : a.overall >= 75 ? "ring-b" : "ring-c";
  const apprDate = new Date(a.date);
  const dateStr = `${apprDate.getFullYear()}.${window.p2(apprDate.getMonth() + 1)}.${window.p2(apprDate.getDate())}`;
  const logTime = (time) => {
    const d = new Date(time);
    return `${window.p2(d.getMonth() + 1)}.${window.p2(d.getDate())} ${window.p2(d.getHours())}:${window.p2(d.getMinutes())}`;
  };
  return (
    <section className="panel appraiser">
      <div className="panel-head">
        <h2><window.Icons.user size={18} /> {t("appr.title")}</h2>
        <span className="appr-date mono">{t("appr.date")} {dateStr}</span>
      </div>

      {/* appraiser identity + overall */}
      <div className="appr-top">
        <div className="appr-id">
          <div className="appr-avatar">{initial}</div>
          <div className="appr-id-txt">
            <div className="appr-name">{name}<span className="appr-cert"><window.Icons.shield size={12} />{t("appr.certified")}</span></div>
            <div className="appr-org mono">{org} · {t("appr.exp", ap.years)}</div>
            <div className="appr-lic mono">{t("appr.license")} {ap.license}</div>
          </div>
        </div>
        <div className={`appr-score ${scoreCls}`}>
          <span className="appr-score-n mono">{a.overall}</span>
          <span className="appr-score-lbl">{t("appr.overall")}</span>
        </div>
      </div>

      <p className="appr-summary">{t("appr." + a.summaryKey)}</p>

      <div className={`appr-odo ${a.odoVerified ? "ok" : "no"}`}>
        {a.odoVerified ? <window.Icons.check size={14} /> : <window.Icons.bolt size={14} />}
        {a.odoVerified ? t("appr.odo_ok") : t("appr.odo_no")}
        <span className="appr-odo-v mono">{v.mileage.toLocaleString("en-US")} km</span>
      </div>

      {/* checkpoint scores */}
      <div className="appr-points">
        <div className="appr-sub-head">{t("appr.points")}</div>
        {a.points.map((p) => (
          <div className="appr-point" key={p.k}>
            <span className="appr-pt-lbl">{t("appr.pt_" + p.k)}</span>
            <ApprBar score={p.score} />
            <span className="appr-pt-score mono">{p.score}</span>
          </div>
        ))}
      </div>

      {/* evaluation log */}
      <div className="appr-log">
        <div className="appr-sub-head">{t("appr.log")}</div>
        <ul className="appr-log-list">
          {a.log.map((l) => (
            <li key={l.k}>
              <span className="appr-log-dot" />
              <span className="appr-log-txt">{t("appr.log_" + l.k.replace("log_", ""))}</span>
              <span className="appr-log-time mono">{logTime(l.time)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function CurrencyToggle({ currency, setCurrency }) {
  const opts = ["KRW", "USD", "EUR", "AED"];
  return (
    <div className="cur-toggle">
      {opts.map((c) => (
        <button key={c} className={currency === c ? "on" : ""} onClick={() => setCurrency(c)}>{c}</button>
      ))}
    </div>
  );
}

function AuctionPanel(props) {
  const { v, ls, now, currency, setCurrency, loggedIn, onRequireLogin, placeBid, autoBid, setAutoBid, winState, openWinFlow, watched, toggleWatch } = props;
  const { locale, t } = window.useLang();
  const tv = window.trVehicle(v, locale);
  const status = window.statusOf(v.endsAt, now);
  const ended = status === "ended";
  const inc = window.minIncrement(ls.current);
  const minNext = ls.current + inc;
  const [amount, setAmount] = React.useState(minNext);
  const [err, setErr] = React.useState("");
  const [showAuto, setShowAuto] = React.useState(autoBid.enabled);

  React.useEffect(() => { setAmount((a) => (a < minNext ? minNext : a)); }, [minNext]);

  const conv = window.fmtConverted(ls.current, currency);
  const quick = [inc, inc * 2, inc * 5];
  const seedNum = v.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const lot = `${(seedNum % 9) + 1}-${String(seedNum % 900 + 100)}`;
  const kmMan = (v.mileage / 10000).toFixed(1).replace(/\.0$/, "");
  const regFee = Math.round((ls.current * 0.036) / 1000) * 1000;
  const totalCost = ls.current + regFee;
  const won = (x) => x.toLocaleString("ko-KR") + t("buy.won");
  const isWatched = watched && watched.has(v.id);

  const submit = () => {
    if (!loggedIn) { onRequireLogin(); return; }
    if (amount < minNext) { setErr(t("panel.minerr", window.fmtKRW(minNext))); return; }
    setErr("");
    placeBid(amount);
    setAmount(amount + inc);
  };

  if (ended) {
    return (
      <div className="apanel">
        {ls.youHigh ? (
          <div className="won">
            <div className="won-badge"><window.Icons.gavel size={18} />{t("won.badge")}</div>
            <p className="won-sub">{t("won.sub")}</p>
            <div className="won-price">
              <span className="apanel-lbl">{t("won.final")}</span>
              <span className="apanel-krw mono">{window.fmtKRW(ls.current)}</span>
              {conv && <span className="apanel-conv mono">≈ {conv}</span>}
            </div>
            <div className="won-actions">
              <button className="btn-process" onClick={() => openWinFlow && openWinFlow(v.id)}>
                {winState && winState.status === "completed"
                  ? <><window.Icons.check size={16} />{t("wf.review")}</>
                  : <><window.Icons.gavel size={16} />{t("wf.process")}</>}
              </button>
              {winState && winState.status === "completed" && (
                <span className="wf-statusrow ok" style={{ alignSelf: "center" }}>
                  <window.Icons.check size={12} />{t("wf.completed")}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="ended-box">
            <window.StatusBadge status="ended" size="lg" />
            <div className="won-price">
              <span className="apanel-lbl">{t("won.final")}</span>
              <span className="apanel-krw mono">{window.fmtKRW(ls.current)}</span>
              {conv && <span className="apanel-conv mono">≈ {conv}</span>}
            </div>
            <p className="ended-note">{t("ended.note")}</p>
          </div>
        )}
        <BidHistory ls={ls} now={now} />
      </div>
    );
  }

  return (
    <div className="apanel buypanel">
      <div className="buy-head">
        <span className="buy-lot mono">{t("card.lot")} {lot}</span>
      </div>
      <h3 className="buy-name">{tv.name}</h3>
      <div className="buy-specline">{v.year}년 · {kmMan}만km · {tv.region}</div>

      <window.CountdownBig endsAt={v.endsAt} now={now} />
      {status === "soon" && (
        <p className="snipe-note"><window.Icons.shield size={13} />{t("panel.snipe")}</p>
      )}

      {ls.outbid && (
        <div className="outbid"><window.Icons.bolt size={15} fill="currentColor" />{t("panel.outbid")}</div>
      )}
      {ls.youHigh && !ls.outbid && (
        <div className="youhigh"><window.Icons.check size={15} />{t("panel.youhigh")}</div>
      )}

      <div className="buy-cost">
        <div className="buy-cost-head">{t("buy.title")}</div>
        <div className="buy-crow"><span>{t("buy.highbid")}</span><b className="mono">{won(ls.current)}</b></div>
        <div className="buy-crow"><span>{t("buy.regfee")}</span><b className="mono">{won(regFee)}</b></div>
        <div className="buy-crow total"><span>{t("buy.total")}</span><b className="mono">{won(totalCost)}</b></div>
        {conv && <div className="buy-conv mono">≈ {conv}</div>}
      </div>

      <div className="apanel-stats">
        <div><span className="mono">{ls.bids}</span><label>{t("panel.totbids")}</label></div>
        <div><span className="mono">{ls.bidders}</span><label>{t("panel.bidders")}</label></div>
        <div><span className="mono">{window.fmtIncShort(inc, locale)}</span><label>{t("panel.mininc")}</label></div>
      </div>

      <div className="buy-actions2">
        <button className="btn-ghost"><window.Icons.doc size={14} />{t("buy.inspect_doc")}</button>
        <button className={`btn-ghost ${isWatched ? "done" : ""}`} onClick={() => toggleWatch && toggleWatch(v.id)}>
          <window.Icons.heart size={14} fill={isWatched ? "currentColor" : "none"} />{isWatched ? t("common.watched") : t("common.watch")}
        </button>
      </div>

      <div className="bidform">
        <div className="quick">
          {quick.map((q) => (
            <button key={q} onClick={() => setAmount(ls.current + q)}>+{window.fmtIncShort(q, locale)}</button>
          ))}
        </div>
        <div className={`bidinput ${err ? "err" : ""}`}>
          <span className="won-sym mono">₩</span>
          <input type="text" inputMode="numeric" value={amount.toLocaleString("en-US")}
                 onChange={(e) => { const n = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10); setAmount(isNaN(n) ? 0 : n); setErr(""); }} />
        </div>
        <div className="bidhint">
          {err ? <span className="hint-err">{err}</span>
               : <span>{t("panel.nextmin")} <b className="mono">{window.fmtKRW(minNext)}</b></span>}
        </div>
        <button className="btn-bid" onClick={submit}>
          {loggedIn ? <><window.Icons.gavel size={17} />{t("panel.bid")}</> : <><window.Icons.user size={16} />{t("panel.loginbid")}</>}
        </button>
      </div>

      <div className="autobid">
        <button className="autobid-head" onClick={() => setShowAuto((s) => !s)}>
          <span><window.Icons.bolt size={14} />{t("auto.title")}{autoBid.enabled && <i className="auto-on mono">ON</i>}</span>
          <window.Icons.chevron size={15} style={{ transform: showAuto ? "rotate(90deg)" : "none", transition: ".2s" }} />
        </button>
        {showAuto && (
          <div className="autobid-body">
            <p>{t("auto.desc")}</p>
            <div className="autobid-row">
              <div className="bidinput sm">
                <span className="won-sym mono">₩</span>
                <input type="text" inputMode="numeric"
                       value={(autoBid.max || minNext).toLocaleString("en-US")}
                       onChange={(e) => { const n = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10); setAutoBid({ ...autoBid, max: isNaN(n) ? 0 : n }); }} />
              </div>
              <button className={`btn-auto ${autoBid.enabled ? "on" : ""}`}
                      onClick={() => { if (!loggedIn) { onRequireLogin(); return; } setAutoBid({ ...autoBid, enabled: !autoBid.enabled }); }}>
                {autoBid.enabled ? t("auto.stop") : t("auto.set")}
              </button>
            </div>
          </div>
        )}
      </div>

      <BidHistory ls={ls} now={now} />
    </div>
  );
}

function BidHistory({ ls, now }) {
  const { t } = window.useLang();
  return (
    <div className="history">
      <div className="history-head">
        <h3>{t("hist.title")}</h3>
        <span className="mono muted">{t("hist.count", ls.bids)}</span>
      </div>
      <ul className="history-list">
        {ls.history.map((h, i) => (
          <li key={h.id} className={`${h.you ? "me" : ""} ${i === 0 ? "top" : ""}`}>
            <span className="h-who">
              {h.you ? <b>{t("hist.me")}</b> : `${t("hist.bidder")} ${h.bidder}`}
              {i === 0 && <span className="h-top mono">{t("hist.top")}</span>}
            </span>
            <span className="h-amt mono">{window.fmtKRW(h.amount)}</span>
            <span className="h-time mono">{relTime(h.time, now, t)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Gallery({ v }) {
  const { t } = window.useLang();
  const [idx, setIdx] = React.useState(0);
  const seedNum = v.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const labels = [t("g.front"), t("g.side"), t("g.rear"), t("g.int"), t("g.engine"), t("g.wheel")];
  return (
    <div className="gallery">
      <div className="gallery-main">
        <window.VehicleSlot slotId={`${v.id}-${idx}`} seed={seedNum + idx} label={labels[idx]} index={`${idx + 1} / ${labels.length}`} radius={16} img={idx === 0 ? v.img : undefined} />
      </div>
      <div className="gallery-thumbs">
        {labels.map((l, i) => (
          <button key={i} className={`thumb ${i === idx ? "on" : ""}`} onClick={() => setIdx(i)}>
            <window.VehicleImage seed={seedNum + i} label="" aspect="4 / 3" img={i === 0 ? v.img : undefined} />
            <span className="thumb-lbl">{l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Options (옵션 정보) ─────────────────────────────────────────────────────
function OptionsCard({ v }) {
  const { t } = window.useLang();
  const opts = v.options || [];
  const count = opts.filter((o) => o.has).length;
  return (
    <section className="panel">
      <div className="panel-head">
        <h2><window.Icons.bolt size={18} /> {t("opt.title")}</h2>
        <span className="opt-count mono">{t("opt.included", count)}</span>
      </div>
      <div className="opt-grid">
        {opts.map((o) => {
          const IconC = window.Icons[o.icon] || window.Icons.check;
          return (
            <div className={`opt-item ${o.has ? "on" : "off"}`} key={o.k}>
              <span className="opt-ic">{o.has ? <window.Icons.check size={15} /> : <window.Icons.x size={14} />}</span>
              <span className="opt-lbl">{t("opt." + o.k)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Recent average hammer price for same model (동일차량 평균 낙찰가) ────────────
function AvgSoldCard({ v }) {
  const { t } = window.useLang();
  const a = v.avgSold;
  if (!a) return null;
  const above = a.diff >= 0;
  const max = Math.max(...a.samples, a.avg);
  const min = Math.min(...a.samples, a.avg) * 0.96;
  return (
    <section className="panel">
      <div className="panel-head">
        <h2><window.Icons.gavel size={18} /> {t("avg.title")}</h2>
        <span className="avg-period mono">{t("avg.period", a.periodMonths)} · {t("avg.count", a.count)}</span>
      </div>
      <div className="avg-top">
        <div className="avg-main">
          <span className="avg-krw mono">{window.fmtKRW(a.avg)}</span>
          <span className={`avg-delta ${above ? "up" : "down"}`}>
            {above ? <window.Icons.arrowDown size={13} style={{ transform: "rotate(180deg)" }} /> : <window.Icons.arrowDown size={13} />}
            {above ? t("avg.above", a.diffPct) : t("avg.below", a.diffPct)}
          </span>
        </div>
        <div className="avg-cur">
          <span className="apanel-lbl">{t("avg.cur")}</span>
          <span className="avg-cur-v mono">{window.fmtKRW(v.current)}</span>
        </div>
      </div>
      <div className="avg-spark">
        <span className="avg-spark-lbl">{t("avg.trend")}</span>
        <div className="avg-bars">
          {a.samples.map((s, i) => (
            <div className="avg-bar" key={i} style={{ height: `${28 + ((s - min) / (max - min)) * 44}px` }} title={window.fmtKRW(s)} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Performance & condition sheet (성능점검표) ──────────────────────────────────
function PerfDot({ status }) {
  const { t } = window.useLang();
  return <span className={`ps-dot ps-${status}`}>{t("ps.status_" + status)}</span>;
}
function PerfSheetCard({ v }) {
  const { t } = window.useLang();
  const [dl, setDl] = React.useState(false);
  const sheet = v.perfSheet || [];
  return (
    <section className="panel">
      <div className="panel-head">
        <h2><window.Icons.doc size={18} /> {t("ps.title")}</h2>
        <button className={`btn-ghost ${dl ? "done" : ""}`} onClick={() => setDl(true)}>
          {dl ? <><window.Icons.check size={14} />{t("inspect.done")}</> : <><window.Icons.doc size={14} />{t("ps.download")}</>}
        </button>
      </div>
      <div className="ps-legend">
        <span><i className="ps-lg good" />{t("ps.legend_good")}</span>
        <span><i className="ps-lg minor" />{t("ps.legend_minor")}</span>
        <span><i className="ps-lg bad" />{t("ps.legend_bad")}</span>
      </div>
      <div className="ps-table">
        {sheet.map((row) => (
          <div className="ps-row" key={row.cat}>
            <span className="ps-cat">{t("ps.cat_" + row.cat)}</span>
            <div className="ps-items">
              {row.items.map((it) => (
                <div className="ps-item" key={it.k}>
                  <span className="ps-item-k">{t("ps." + it.k)}</span>
                  <PerfDot status={it.status} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Accident / insurance history (사고 이력) ────────────────────────────────────
function AccidentCard({ v }) {
  const { locale, t } = window.useLang();
  const a = v.accidentRecords;
  if (!a) return null;
  const clean = a.ownCount === 0 && a.otherCount === 0 && !a.totalLoss && !a.flood && !a.theft;
  const fmtDate = (ts) => { const d = new Date(ts); return `${d.getFullYear()}.${window.p2(d.getMonth() + 1)}`; };
  const flags = [
    ["acc.own", a.ownCount, a.ownCount > 0], ["acc.other", a.otherCount, a.otherCount > 0],
    ["acc.totalloss", a.totalLoss, a.totalLoss], ["acc.flood", a.flood, a.flood], ["acc.theft", a.theft, a.theft],
  ];
  return (
    <section className="panel">
      <div className="panel-head">
        <h2><window.Icons.shield size={18} /> {t("acc.title")}</h2>
      </div>

      {clean ? (
        <div className="acc-clean">
          <span className="acc-clean-ic"><window.Icons.check size={20} /></span>
          <div>
            <b>{t("acc.clean")}</b>
            <span>{t("acc.clean_sub")}</span>
          </div>
        </div>
      ) : (
        <div className="acc-flags">
          {flags.map(([k, val, danger]) => (
            <div className={`acc-flag ${danger ? "danger" : "ok"}`} key={k}>
              <span className="acc-flag-k">{t(k)}</span>
              <span className="acc-flag-v">
                {typeof val === "number" ? (val > 0 ? t("acc.count_amt", val) : t("acc.none")) : (val ? "Y" : t("acc.none"))}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* meta row */}
      <div className="acc-meta">
        <span><window.Icons.user size={13} />{t("acc.owners", a.owners)}</span>
        <span className="sep">·</span>
        <span>{a.usageRental ? t("acc.usage_rental") : t("acc.usage_none")}</span>
      </div>

      {/* claim records */}
      {a.records.length > 0 && (
        <div className="acc-records">
          <div className="acc-rec-head">
            <span>{t("acc.records")}</span>
            <span className="acc-rec-total mono">{t("acc.summary_total")} {window.fmtKRW(a.ownTotal)}</span>
          </div>
          <ul className="acc-rec-list">
            {a.records.map((r, i) => (
              <li key={i}>
                <span className="acc-rec-date mono">{fmtDate(r.date)}</span>
                <span className="acc-rec-type">{t("acc.repair_at", r.part + 1)}</span>
                <span className="acc-rec-amt mono">{window.fmtKRW(r.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

// ── Hero image with studio bg + category tabs (외부/내부/시동영상) ──────────────
function DetailHero({ v }) {
  const { t } = window.useLang();
  const [cat, setCat] = React.useState("ext");
  const [idx, setIdx] = React.useState(0);
  const seedNum = v.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const groups = {
    ext: [t("g.front"), t("g.side"), t("g.rear"), t("g.wheel")],
    int: [t("g.int"), t("g.dash"), t("g.engine")],
    video: [t("g.video_hint")],
  };
  const labels = groups[cat];
  const n = labels.length;
  const isVideo = cat === "video";
  const safeIdx = Math.min(idx, n - 1);
  const pickCat = (c) => { setCat(c); setIdx(0); };
  const prev = () => setIdx((i) => (i - 1 + n) % n);
  const next = () => setIdx((i) => (i + 1) % n);
  const tabs = [["ext", "g.cat_ext"], ["int", "g.cat_int"], ["video", "g.cat_video"]];
  const intImgs = ["images/gallery/interior-dash.png", "images/gallery/interior-seats.png", "images/gallery/interior-trunk.png"];
  // exterior shot 0 uses the real photo; interior uses studio placeholders; video poster = car photo
  let heroImg;
  if (cat === "ext") heroImg = safeIdx === 0 ? v.img : undefined;
  else if (cat === "int") heroImg = intImgs[safeIdx];
  else heroImg = v.img;
  const heroSeed = seedNum + (cat === "ext" ? safeIdx : cat === "int" ? 20 + safeIdx : 40);
  return (
    <div className="dherowrap">
      <div className="dhero">
        <window.VehicleImage seed={heroSeed} aspect="16 / 9" label={labels[safeIdx]} img={heroImg} />
        {isVideo && <button className="dhero-playbig" aria-label="play"><window.Icons.play size={30} /></button>}
        <div className="dhero-tabs">
          {tabs.map(([k, key]) => (
            <button key={k} className={`dhero-tab ${cat === k ? "on" : ""}`} onClick={() => pickCat(k)}>
              {k === "video" && <window.Icons.play size={12} />}{t(key)}
            </button>
          ))}
        </div>
        {!isVideo && n > 1 && <>
          <button className="dhero-nav prev" onClick={prev} aria-label="prev"><window.Icons.chevronL size={20} /></button>
          <button className="dhero-nav next" onClick={next} aria-label="next"><window.Icons.chevron size={20} /></button>
          <div className="dhero-dots">
            {labels.map((_, i) => <button key={i} className={i === safeIdx ? "on" : ""} onClick={() => setIdx(i)} aria-label={"image " + (i + 1)} />)}
          </div>
        </>}
        <button className="dhero-fs" aria-label="fullscreen"><window.Icons.expand size={18} /></button>
      </div>
    </div>
  );
}

// ── Left spec box (heydealer-style key/value) ───────────────────────────────
function BuySpecBox({ v }) {
  const { locale, t } = window.useLang();
  const tv = window.trVehicle(v, locale);
  const regDate = new Date(window.EPOCH - ((window.EPOCH / 1) % 1) - (2026 - v.year) * 365 * 86400000);
  const regStr = `${v.year}.${window.p2(((v.vin.charCodeAt(6) % 12) + 1))}.${window.p2(((v.vin.charCodeAt(7) % 27) + 1))}`;
  const isEV = v.fuel === "전기";
  const intColor = /화이트|실버|그레이/.test(v.color) ? (locale === "ko" ? "그레이 투톤" : "Gray two-tone") : (locale === "ko" ? "블랙 원톤" : "Black one-tone");
  const rows = [
    ["spec.reg", regStr], ["spec.mileage", `${v.mileage.toLocaleString("en-US")} km`],
    ["spec.fuel", tv.fuel], ["spec.disp", isEV ? "—" : `${(1.6 + (v.vin.charCodeAt(5) % 12) / 10).toFixed(1)}L`],
    ["spec.color", tv.color], ["spec.intcolor", intColor],
    ["spec.body", window.bodyOf(v)], ["spec.seats", t("spec.seatval", /카니발|스타리아|카렌스|모하비/.test(v.model) ? 9 : 5)],
  ];
  return (
    <div className="bspec">
      {rows.map(([k, val]) => (
        <div className="bspec-item" key={k}>
          <span className="bspec-k">{t(k)}</span>
          <span className="bspec-v">{val}</span>
        </div>
      ))}
    </div>
  );
}

// ── Average hammer-price line chart (차량 평균낙찰가) ─────────────────────────
function AvgChart({ v }) {
  const { t } = window.useLang();
  const a = v.avgSold;
  if (!a) return null;
  const pts = a.samples;
  const nowD = new Date(window.EPOCH);
  const months = pts.map((_, i) => {
    const d = new Date(nowD.getFullYear(), nowD.getMonth() - (pts.length - 1 - i), 1);
    return `${d.getMonth() + 1}월`;
  });
  const vmax = Math.max(...pts), vmin = Math.min(...pts);
  const top = Math.ceil((vmax * 1.04) / 1e6) * 1e6;
  const bot = Math.floor((vmin * 0.96) / 1e6) * 1e6;
  const man = (x) => Math.round(x / 10000).toLocaleString("ko-KR");
  const W = 720, H = 300, padL = 84, padR = 30, padT = 44, padB = 44;
  const x = (i) => padL + (i / (pts.length - 1)) * (W - padL - padR);
  const y = (val) => padT + (1 - (val - bot) / (top - bot || 1)) * (H - padT - padB);
  const line = pts.map((p, i) => `${x(i)},${y(p)}`).join(" ");
  const area = `${x(0)},${H - padB} ${line} ${x(pts.length - 1)},${H - padB}`;
  const ticks = [bot, (bot + top) / 2, top];
  return (
    <section className="avgsec">
      <h2 className="dsec-title">차량 평균낙찰가</h2>
      <div className="avgsec-body">
        <div className="avgchart">
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
            {ticks.map((tk, i) => (
              <g key={i}>
                <line x1={padL} y1={y(tk)} x2={W - padR} y2={y(tk)} stroke="#EDEDED" strokeWidth="1" />
                <text x={padL - 10} y={y(tk)} textAnchor="end" dominantBaseline="middle" fontSize="15" fontWeight="600" fill="#6b7280" fontFamily="var(--mono)">{man(tk)}</text>
              </g>
            ))}
            <polygon points={area} fill="rgba(57,110,255,0.08)" />
            <polyline points={line} fill="none" stroke="#396EFF" strokeWidth="2" strokeLinejoin="round" />
            {pts.map((p, i) => (
              <g key={i}>
                <circle cx={x(i)} cy={y(p)} r="3.5" fill="#fff" stroke="#396EFF" strokeWidth="2" />
                <text x={x(i)} y={y(p) - 15} textAnchor="middle" fontSize="17" fontWeight="800" fill="#1a1d24" fontFamily="var(--mono)">{man(p)}</text>
                <text x={x(i)} y={H - padB + 22} textAnchor="middle" fontSize="15" fontWeight="600" fill="#6b7280" fontFamily="var(--mono)">{months[i]}</text>
              </g>
            ))}
            <text x={padL - 10} y={padT - 12} textAnchor="end" fontSize="12" fill="#9aa0ab" fontFamily="var(--mono)">만원</text>
          </svg>
        </div>
        <div className="avgnow">
          <span className="avgnow-lbl">{t("jessi.recent")}</span>
          <span className="avgnow-v">{window.fmtKRWShort(a.avg)}{t("buy.won")}</span>
          <span className="avgnow-sub mono">{t("avg.count", a.count)}</span>
        </div>
      </div>
    </section>
  );
}

// ── Options icon grid (옵션 정보) ───────────────────────────────────────────
function OptionsGrid({ v }) {
  const { t } = window.useLang();
  const opts = (v.options || []).filter((o) => o.has);
  return (
    <section className="optsec">
      <div className="dsec-head">
        <h2 className="dsec-title">{t("opt.title")}</h2>
        <button className="dsec-more">{t("opt.more")}<window.Icons.chevron size={14} /></button>
      </div>
      <div className="optgrid">
        {opts.map((o) => {
          const IconC = window.Icons[o.icon] || window.Icons.check;
          return (
            <div className="optcell" key={o.k}>
              <span className="optcell-ic"><IconC size={22} /></span>
              <span className="optcell-lbl">{t("opt." + o.k)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Diagnosis summary box (주요 진단결과) ────────────────────────────────────
function DiagnosisBox({ v }) {
  const { locale, t } = window.useLang();
  const seed = v.vin.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const accNone = /무사고/.test(v.inspect.accident);
  const pass = {
    interior_ext: 3 + (seed % 5), consum: 4 + (seed % 6),
    tire: 2 + (seed % 5), chassis: 1 + (seed % 6),
  };
  const notice = {
    interior_ext: seed % 4, tire: (seed >> 2) % 3, chassis: (seed >> 1) % 2,
  };
  return (
    <section className="diagsec">
      <h2 className="dsec-title">{t("diag.title")}</h2>
      <div className="diagbox">
        <div className="diagrow">
          <span className="diag-ic"><window.Icons.shield size={22} /></span>
          <span className="diag-lbl">{t("diag.accident")}</span>
          <span className={`diag-val ${accNone ? "ok" : "warn"}`}>{accNone ? t("diag.none") : t("diag.simple")}</span>
        </div>
        <div className="diagrow">
          <span className="diag-ic"><window.Icons.check size={22} /></span>
          <span className="diag-lbl">{t("diag.pass")}</span>
          <div className="diag-counts">
            <span><i>{t("diag.interior_ext")}</i><b className="mono">{t("diag.unit", pass.interior_ext)}</b></span>
            <span><i>{t("diag.consum")}</i><b className="mono">{t("diag.unit", pass.consum)}</b></span>
            <span><i>{t("diag.tire")}</i><b className="mono">{t("diag.unit", pass.tire)}</b></span>
            <span><i>{t("diag.chassis")}</i><b className="mono">{t("diag.unit", pass.chassis)}</b></span>
          </div>
        </div>
        <div className="diagrow">
          <span className="diag-ic"><window.Icons.bolt size={22} /></span>
          <span className="diag-lbl">{t("diag.notice")}</span>
          <div className="diag-counts">
            <span><i>{t("diag.interior_ext")}</i><b className="mono">{t("diag.unit", notice.interior_ext)}</b></span>
            <span><i>{t("diag.tire")}</i><b className="mono">{t("diag.unit", notice.tire)}</b></span>
            <span><i>{t("diag.chassis")}</i><b className="mono">{t("diag.unit", notice.chassis)}</b></span>
          </div>
        </div>
      </div>
      <div className="dsec-btns">
        <button className="dbtn">{t("diag.kcar")}</button>
        <button className="dbtn">{t("diag.perfdoc")}</button>
      </div>
    </section>
  );
}

// ── Past history + previous owner (주요 과거이력) ────────────────────────────
function HistoryBoxes({ v }) {
  const { locale, t } = window.useLang();
  const a = v.accidentRecords || { ownTotal: 0, ownCount: 0, owners: 1, usageRental: false };
  const tv = window.trVehicle(v, locale);
  const months = 2 + (v.vin.charCodeAt(9) % 22);
  return (
    <section className="histsec">
      <div className="histgrid">
        <div className="histcol">
          <div className="histcol-head">
            <h2 className="dsec-title">{t("hist2.title")}</h2>
            <span className="hist-note"><window.Icons.bolt size={12} />{t("hist2.notice")}</span>
          </div>
          <div className="histbox">
            <div className="histrow">
              <span className="hist-k">{t("hist2.damage")}</span>
              <span className={`hist-v ${a.ownCount > 0 ? "warn" : ""}`}>
                {a.ownCount > 0 ? t("hist2.damage_val", window.fmtKRW(a.ownTotal), a.ownCount) : t("acc.none")}
              </span>
            </div>
            <div className="histrow">
              <span className="hist-k">{t("hist2.owner_change")}</span>
              <span className="hist-v">{t("hist2.owner_val", a.owners)}</span>
            </div>
            <div className="histrow">
              <span className="hist-k">{t("hist2.caution")}</span>
              <span className={`hist-v ${a.usageRental ? "warn" : ""}`}>{a.usageRental ? t("hist2.special") : t("hist2.special_none")}</span>
            </div>
          </div>
        </div>
        <div className="histcol">
          <div className="histcol-head">
            <h2 className="dsec-title">{t("hist2.prev_owner")}</h2>
          </div>
          <div className="histbox">
            <div className="ownrow">
              <span className="own-ic"><window.Icons.pin size={18} /></span>
              <span className="own-txt">{t("hist2.registered", tv.region)}</span>
            </div>
            <div className="ownrow">
              <span className="own-ic"><window.Icons.clock size={18} /></span>
              <span className="own-txt">{t("hist2.driven", months)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="dsec-btns">
        <button className="dbtn">{t("hist2.all_history")}</button>
        <button className="dbtn">{t("hist2.all_insurance")}</button>
      </div>
    </section>
  );
}

// ── Footer ──────────────────────────────────────────────────────────────────
function DetailFooter() {
  const { t } = window.useLang();
  return (
    <footer className="dfooter">
      <div className="dfooter-inner">
        <div className="dfooter-cols">
          <div className="dfooter-col">
            <div className="dfooter-h">{t("ft.services")}</div>
            <a>{t("ft.s1")}</a><a>{t("ft.s2")}</a><a>{t("ft.s3")}</a><a>{t("ft.s4")}</a>
          </div>
          <div className="dfooter-col">
            <div className="dfooter-h">{t("ft.company")}</div>
            <a>{t("ft.c1")}</a><a>{t("ft.c2")}</a><a>{t("ft.c3")}</a>
          </div>
        </div>
        <div className="dfooter-legal">
          <div className="dfooter-brand">{t("ft.legal")}</div>
          <p className="dfooter-fine mono">사업자등록번호 565-86-03060 · 통신판매업 제2025-인천서구-3216호 · 인천광역시 서구 봉수대로 47-15 · contact@jessicar.kr</p>
          <p className="dfooter-copy mono">{t("ft.copyright")}</p>
        </div>
      </div>
    </footer>
  );
}

function Detail(props) {
  const { v, now, onBack, watched, toggleWatch } = props;
  const { locale, t } = window.useLang();
  const tv = window.trVehicle(v, locale);
  const status = window.statusOf(v.endsAt, now);
  return (
    <div className="detail2">
      <div className="detail-bar">
        <button className="back" onClick={onBack}>
          <img className="back-ic" src={(window.__resources && window.__resources["assets/back-button.svg"]) || "assets/back-button.svg"} alt="" />
          {t("detail.back")}
        </button>
      </div>

      <DetailHero v={v} />

      <div className="detail2-top">
        <div className="detail2-left">
          <div className="d2-title">
            <h1>{v.year} {tv.maker} {tv.model}</h1>
            <p className="d2-trim">{tv.trim}</p>
          </div>
          <BuySpecBox v={v} />
          <AvgChart v={v} />
          <OptionsGrid v={v} />
          <DiagnosisBox v={v} />
          <HistoryBoxes v={v} />
        </div>
        <aside className="detail2-right">
          <AuctionPanel {...props} status={status} />
        </aside>
      </div>

      <DetailFooter />
    </div>
  );
}

Object.assign(window, { Detail, AuctionPanel, relTime });
