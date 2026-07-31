// register.jsx — 차량 등록 관리 dashboard + 신규 입찰 공고 등록 wizard (2-step)

function RField({ label, required, children, error }) {
  return (
    <div className={`field ${error ? "field-err" : ""}`}>
      <label>{label}{required && <i className="req-star">*</i>}</label>
      {children}
    </div>
  );
}

// styled select with 선택 placeholder
function NLSelect({ value, onChange, options, error, allLabel }) {
  const { t } = window.useLang();
  return (
    <div className={`nl-sel ${error ? "err" : ""} ${!value ? "is-empty" : ""}`}>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{allLabel || t("nl.select")}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <window.Icons.chevron size={15} style={{ transform: "rotate(90deg)" }} />
    </div>
  );
}

// ── new-listing wizard (STEP 1 공고 정보 → STEP 2 차량 등록) ────────────────────
// convert the wizard's collected listing + vehicles into a real disclosure object
function buildWizardDisclosure(listing, cars, current) {
  const V = window.VEHICLES;
  const allCars = [...cars, ...(current ? [current] : [])];
  const reserve = Number(String(listing.reserve).replace(/[^0-9]/g, "")) || 0;
  const sess = window.SESSIONS.find((s) => s.id === listing.venue) || window.SESSIONS[0];
  const accMap = { none: "무사고", simple: "단순교환 1", frame: "단순교환 2" };
  const vehicles = allCars.map((c, i) => {
    const modelBase = (c.model || "").split(" ")[0];
    const base = V.find((v) => v.maker === c.maker && window.modelOf(v) === modelBase)
      || V.find((v) => v.maker === c.maker) || V[0];
    const mileage = Number(String(c.mileage).replace(/[^0-9]/g, "")) || base.mileage;
    const start = reserve || base.start;
    return {
      ...base,
      id: `${listing.regNo}-${i + 1}`,
      maker: c.maker || base.maker,
      model: c.model || base.model,
      trim: c.submodel || base.trim,
      year: Number(c.year) || base.year,
      mileage,
      fuel: c.fuel || base.fuel,
      trans: c.trans || base.trans,
      color: c.color || base.color,
      vin: c.vin || base.vin,
      i18n: null,
      accidentNote: c.notes || base.accidentNote,
      inspect: { ...base.inspect, accident: accMap[c.accident] || base.inspect.accident },
      start, current: start, bids: 0, bidders: 0,
      endsAt: Date.now() + 3 * window.DAY * 1000,
      name: `${c.year || base.year} ${c.maker || base.maker} ${c.model || base.model}`,
    };
  });
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, ".");
  return {
    id: listing.regNo,
    title: `신규 공시 · ${sess.venue}`,
    titleEn: `New disclosure · ${sess.venueEn}`,
    sess,
    date: listing.startDate ? listing.startDate.replace(/-/g, ".") : today,
    status: "listed",
    mode: listing.method === "sealed" ? "tender" : "auction",
    vehicles, soldIds: [],
  };
}

function NewListingWizard({ onClose, onDone, onComplete }) {
  const { locale, t } = window.useLang();
  const [step, setStep] = React.useState(0);
  const [err, setErr] = React.useState(false);

  // step 1: listing
  const [listing, setListing] = React.useState({
    regNo: "DC-2606-042", venue: "", startDate: "2026-06-10", startTime: "10:00",
    endDate: "2026-06-12", endTime: "17:00", lots: "", method: "", reserve: "",
    contactName: "", contactPhone: "", address: "", memo: "",
  });
  // step 2: vehicles (multiple) + the in-progress vehicle being edited
  const EMPTY_CAR = { maker: "", model: "", submodel: "", year: "", plate: "", vin: "", mileage: "", color: "", fuel: "", trans: "", accident: "", flood: "", notes: "" };
  const [cars, setCars] = React.useState([]);
  const [assetOpen, setAssetOpen] = React.useState(true);
  const [openCar, setOpenCar] = React.useState(null);
  const [pickedAssets, setPickedAssets] = React.useState(() => new Set());
  const assetPool = React.useMemo(() => buildAssets().filter((a) => a.regStatus === "ready"), []);
  const togglePick = (id) => setPickedAssets((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const addPickedAssets = () => {
    const add = assetPool.filter((a) => pickedAssets.has(a.id)).map((a) => ({
      maker: a.maker, model: a.model, submodel: a.trim || "", year: a.year,
      plate: a.plate || `${(a.vin.charCodeAt(4) % 90) + 10}가 ${(a.vin.charCodeAt(8) % 9000) + 1000}`,
      vin: a.vin, mileage: String(a.mileage), color: a.color, fuel: a.fuel, trans: a.trans,
      accident: (a.inspect && a.inspect.accident) || "무사고", flood: "없음", notes: a.accidentNote || "",
      shots: { ext: [], int: [], video: false },
    }));
    setCars((cs) => [...cs, ...add]);
    setPickedAssets(new Set());
    setAssetOpen(false);
    window.scrollTo(0, 0);
  };
  // per-added-vehicle photo handlers (photos are added here, in the disclosure step)
  const carAddShot = (ci, k) => setCars((cs) => cs.map((c, i) => i === ci ? { ...c, shots: { ...c.shots, [k]: [...c.shots[k], (c.shots[k][c.shots[k].length - 1] || 0) + 1] } } : c));
  const carRemoveShot = (ci, k, id) => setCars((cs) => cs.map((c, i) => i === ci ? { ...c, shots: { ...c.shots, [k]: c.shots[k].filter((x) => x !== id) } } : c));
  const carToggleVideo = (ci) => setCars((cs) => cs.map((c, i) => i === ci ? { ...c, shots: { ...c.shots, video: !c.shots.video } } : c));
  const [shots, setShots] = React.useState({ ext: [], int: [], video: false });
  const [car, setCar] = React.useState(EMPTY_CAR);

  const lset = (k, v) => setListing((s) => ({ ...s, [k]: v }));
  const cset = (k, v) => setCar((s) => ({ ...s, [k]: v }));
  const addShot = (k) => setShots((s) => ({ ...s, [k]: [...s[k], (s[k][s[k].length - 1] || 0) + 1] }));
  const removeShot = (k, id) => setShots((s) => ({ ...s, [k]: s[k].filter((x) => x !== id) }));

  const venueOpts = window.SESSIONS.map((s) => ({ value: s.id, label: locale === "ko" ? s.venue : s.venueEn }));
  const methodOpts = [["open", "nl.method_open"], ["sealed", "nl.method_sealed"], ["direct", "nl.method_direct"]].map(([v, k]) => ({ value: v, label: t(k) }));
  const validOpts = [["3", "nl.valid_3"], ["5", "nl.valid_5"], ["7", "nl.valid_7"], ["14", "nl.valid_14"]].map(([v, k]) => ({ value: v, label: t(k) }));
  const makerOpts = window.MAKERS.map((m) => ({ value: m, label: window.trMaker(m, locale) }));
  const modelOpts = [...new Set(window.VEHICLES.filter((v) => !car.maker || v.maker === car.maker).map(window.modelOf))].map((m) => ({ value: m, label: m }));
  const yearOpts = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map((y) => ({ value: String(y), label: locale === "ko" ? `${y}년` : String(y) }));
  const colorOpts = window.COLOR_FAMILIES.map((c) => ({ value: c, label: t("color." + c) }));
  const fuelOpts = window.FUEL_TYPES.map((f) => ({ value: f, label: window.trFuel(f, locale) }));
  const transOpts = [{ value: "자동", label: window.trTrans("자동", locale) }, { value: "수동", label: window.trTrans("수동", locale) }];
  const accOpts = [["none", "nl.acc_none"], ["simple", "nl.acc_simple"], ["frame", "nl.acc_frame"]].map(([v, k]) => ({ value: v, label: t(k) }));
  const floodOpts = [["none", "nl.flood_none"], ["yes", "nl.flood_yes"]].map(([v, k]) => ({ value: v, label: t(k) }));

  const validListing = listing.regNo && listing.venue && listing.startDate && listing.endDate
    && listing.lots && listing.method && listing.reserve && listing.contactName && listing.contactPhone && listing.address;
  const validCar = car.maker && car.model && car.year && car.plate && car.mileage && car.color && shots.ext.length > 0 && shots.int.length > 0;

  const goNext = () => {
    if (!validListing) { setErr(true); return; }
    setErr(false); setStep(1); window.scrollTo(0, 0);
  };
  const addCar = () => {
    if (!validCar) { setErr(true); return; }
    setCars((cs) => [...cs, { ...car, shots }]);
    setCar(EMPTY_CAR); setShots({ ext: [], int: [], video: false });
    setErr(false); window.scrollTo(0, 0);
  };
  const removeCar = (i) => setCars((cs) => cs.filter((_, idx) => idx !== i));
  const bulkImport = () => {
    const src = (window.VEHICLES || []).slice(0, 8);
    const rows = src.map((v) => ({
      maker: v.maker, model: v.model, submodel: v.trim || "", year: v.year,
      plate: `${(v.vin.charCodeAt(4) % 90) + 10}가 ${(v.vin.charCodeAt(8) % 9000) + 1000}`,
      vin: v.vin, mileage: String(v.mileage), color: v.color, fuel: v.fuel, trans: v.trans,
      accident: v.inspect.accident, flood: "", notes: "",
      shots: { ext: [1, 2, 3], int: [1, 2], video: true },
    }));
    setCars((cs) => [...cs, ...rows]);
    window.scrollTo(0, 0);
  };
  const submit = () => {
    const hasCurrent = validCar;
    if (cars.length === 0 && !hasCurrent) { setErr(true); return; }
    setErr(false);
    onComplete && onComplete(buildWizardDisclosure(listing, cars, hasCurrent ? { ...car, shots } : null));
    onDone && onDone(); setStep(2); window.scrollTo(0, 0);
  };

  // ── done ──
  if (step === 2) {
    return (
      <div className="nl-done">
        <div className="wf-burst good"><window.Icons.check size={28} /></div>
        <h2>{t("nl.done_title")}</h2>
        <p className="wf-sub">{t("nl.done_sub")}</p>
        <button className="btn-primary nl-done-btn" onClick={onClose}>{t("nl.done_btn")}</button>
      </div>
    );
  }

  return (
    <div className="nl-wizard">
      {/* stepper */}
      <div className="nl-stepper">
        {["nl.s1", "nl.s2"].map((k, i) => (
          <React.Fragment key={k}>
            {i > 0 && <span className={`nl-line ${i <= step ? "done" : ""}`} />}
            <div className={`nl-stp ${i === step ? "on" : ""} ${i < step ? "done" : ""}`}>
              <span className="nl-stp-dot">{i < step ? <window.Icons.check size={13} /> : i + 1}</span>
              <span className="nl-stp-lbl">{t(k)}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* STEP 1: listing details */}
      {step === 0 && (
        <div className="nl-card">
          <div className="nl-card-head">
            <h3>{t("nl.s1")}</h3>
            <p>{t("nl.s1_sub")}</p>
          </div>
          <div className="nl-form">
            <div className="field-row">
              <RField label={t("nl.regno")} required error={err && !listing.regNo}>
                <input value={listing.regNo} onChange={(e) => lset("regNo", e.target.value.toUpperCase())} placeholder={t("nl.regno_ph")} />
              </RField>
              <RField label={t("nl.venue")} required error={err && !listing.venue}>
                <NLSelect value={listing.venue} onChange={(v) => lset("venue", v)} options={venueOpts} error={err && !listing.venue} />
              </RField>
            </div>
            <div className="field-row">
              <RField label={t("nl.start_date")} required error={err && !listing.startDate}>
                <input type="date" value={listing.startDate} onChange={(e) => lset("startDate", e.target.value)} />
              </RField>
              <RField label={t("nl.start_time")} required error={err && !listing.startTime}>
                <input type="time" value={listing.startTime} onChange={(e) => lset("startTime", e.target.value)} />
              </RField>
            </div>
            <div className="field-row">
              <RField label={t("nl.end_date")} required error={err && !listing.endDate}>
                <input type="date" value={listing.endDate} onChange={(e) => lset("endDate", e.target.value)} />
              </RField>
              <RField label={t("nl.end_time")} required error={err && !listing.endTime}>
                <input type="time" value={listing.endTime} onChange={(e) => lset("endTime", e.target.value)} />
              </RField>
            </div>
            <div className="field-row">
              <RField label={t("nl.method")} required error={err && !listing.method}>
                <NLSelect value={listing.method} onChange={(v) => lset("method", v)} options={methodOpts} error={err && !listing.method} />
              </RField>
              <RField label={t("nl.lots")} required error={err && !listing.lots}>
                <input inputMode="numeric" value={listing.lots} onChange={(e) => lset("lots", e.target.value.replace(/[^0-9]/g, ""))} placeholder={t("nl.lots_ph")} />
              </RField>
            </div>
            <div className="field-row">
              <RField label={t("nl.contact_name")} required error={err && !listing.contactName}>
                <input value={listing.contactName} onChange={(e) => lset("contactName", e.target.value)} placeholder={t("nl.contact_name_ph")} />
              </RField>
              <RField label={t("nl.contact_phone")} required error={err && !listing.contactPhone}>
                <input inputMode="tel" value={listing.contactPhone} onChange={(e) => lset("contactPhone", e.target.value)} placeholder={t("nl.contact_phone_ph")} />
              </RField>
            </div>
            <RField label={t("nl.address")} required error={err && !listing.address}>
              <input value={listing.address} onChange={(e) => lset("address", e.target.value)} placeholder={t("nl.address_ph")} />
            </RField>
            <RField label={t("nl.reserve")} required error={err && !listing.reserve}>
              <input inputMode="numeric" value={listing.reserve ? Number(listing.reserve).toLocaleString("en-US") : ""}
                     onChange={(e) => lset("reserve", e.target.value.replace(/[^0-9]/g, ""))} placeholder="예: 30,000,000" />
            </RField>
            <RField label={t("nl.memo")}>
              <textarea rows="3" value={listing.memo} onChange={(e) => lset("memo", e.target.value)} placeholder={t("nl.memo_ph")} />
            </RField>
          </div>
        </div>
      )}

      {/* STEP 2: vehicle */}
      {step === 1 && (
        <div className="nl-step2">
          {/* 등록된 차량 자산에서 불러오기 */}
          <div className="nl-bulk">
            <div className="nl-bulk-ic"><window.Icons.doc size={22} /></div>
            <div className="nl-bulk-txt">
              <span className="nl-bulk-main">{t("nl.asset_title")}</span>
              <span className="nl-bulk-sub">{t("nl.asset_sub")}</span>
            </div>
            <div className="nl-bulk-actions">
              <button className="nl-bulk-btn" onClick={() => setAssetOpen((o) => !o)}><window.Icons.doc size={15} />{assetOpen ? t("nl.asset_close") : t("nl.asset_open")}</button>
            </div>
          </div>
          {assetOpen && (
            <div className="asset-pick">
              <div className="asset-pick-list">
                {assetPool.map((a) => {
                  const on = pickedAssets.has(a.id);
                  return (
                    <label className={`asset-pick-row ${on ? "on" : ""}`} key={a.id}>
                      <input type="checkbox" checked={on} onChange={() => togglePick(a.id)} />
                      <span className="asset-pick-name">{window.trMaker(a.maker, locale)} {a.model} <span className="mono">{a.year}</span></span>
                      <span className="asset-pick-meta mono">{a.assetNo || a.plate || "—"}<span className="sep">·</span>{(a.mileage / 10000).toFixed(1).replace(/\.0$/, "")}만km</span>
                    </label>
                  );
                })}
              </div>
              <div className="asset-pick-foot">
                <span className="asset-pick-count mono">{t("nl.asset_selected", pickedAssets.size)}</span>
                <button className="nl-bulk-btn" disabled={pickedAssets.size === 0} onClick={addPickedAssets}>{t("nl.asset_add")}</button>
              </div>
            </div>
          )}

          {/* added vehicles summary */}
          {cars.length > 0 && (
            <div className="nl-added">
              <div className="nl-added-head">
                <h3>{t("nl.added_title")}<span className="nl-added-n mono">{cars.length}</span></h3>
              </div>
              <div className="nl-added-list">
                {cars.map((c, i) => {
                  const tv = window.trVehicle({ maker: c.maker, model: c.model, year: c.year }, locale);
                  const photoN = (c.shots.ext.length || 0) + (c.shots.int.length || 0);
                  const open = openCar === i;
                  return (
                    <div className={`nl-added-item ${open ? "open" : ""}`} key={i}>
                      <div className="nl-added-row" onClick={() => setOpenCar(open ? null : i)}>
                        <span className="nl-added-ix mono">{i + 1}</span>
                        <div className="nl-added-info">
                          <span className="nl-added-name">{window.trMaker(c.maker, locale)} {window.trModel(c.model, locale)} <span className="nl-added-yr mono">{c.year}</span></span>
                          <span className="nl-added-meta mono">{c.plate || "—"}<span className="sep">·</span>{t("nl.photos_n", photoN)}{c.shots.video ? <span className="sep">·</span> : null}{c.shots.video ? t("nl.shots_video") : null}</span>
                        </div>
                        <window.Icons.chevron size={16} style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform .18s", color: "var(--ink-3)", flexShrink: 0 }} />
                        <button className="nl-added-x" onClick={(e) => { e.stopPropagation(); removeCar(i); if (open) setOpenCar(null); }} aria-label="remove"><window.Icons.x size={14} /></button>
                      </div>
                      {open && (
                        <div className="nl-added-detail">
                          <div className="nl-added-grid">
                            <div className="nl-added-gi"><span>{t("sell.maker")}</span><b>{window.trMaker(c.maker, locale)}</b></div>
                            <div className="nl-added-gi"><span>{t("sell.model")}</span><b>{window.trModel(c.model, locale)}</b></div>
                            <div className="nl-added-gi"><span>{t("nl.submodel")}</span><b>{c.submodel ? window.trModel(c.submodel, locale) : "—"}</b></div>
                            <div className="nl-added-gi"><span>{t("sell.year")}</span><b className="mono">{c.year}</b></div>
                            <div className="nl-added-gi"><span>{t("nl.plate")}</span><b className="mono">{c.plate || "—"}</b></div>
                            <div className="nl-added-gi"><span>{t("nl.vin")}</span><b className="mono">{c.vin || "—"}</b></div>
                            <div className="nl-added-gi"><span>{t("nl.mileage")}</span><b className="mono">{Number(c.mileage || 0).toLocaleString("en-US")} km</b></div>
                            <div className="nl-added-gi"><span>{t("nl.color")}</span><b>{c.color || "—"}</b></div>
                            <div className="nl-added-gi"><span>{t("sell.fuel")}</span><b>{c.fuel ? window.trFuel(c.fuel, locale) : "—"}</b></div>
                            <div className="nl-added-gi"><span>{t("sell.trans")}</span><b>{c.trans ? window.trTrans(c.trans, locale) : "—"}</b></div>
                            <div className="nl-added-gi"><span>{t("nl.acc_hist")}</span><b>{c.accident ? window.trAccident(c.accident, locale) : "—"}</b></div>
                            <div className="nl-added-gi"><span>{t("nl.flood_hist")}</span><b>{c.flood || "—"}</b></div>
                            {c.notes ? <div className="nl-added-gi wide"><span>{t("nl.notes")}</span><b>{c.notes}</b></div> : null}
                          </div>

                          <div className="nl-added-photolbl">{t("nl.photos")}<i className="req-star">*</i></div>
                          <div className="nl-shots">
                            {[{ k: "ext", label: t("nl.shots_ext"), base: 4 }, { k: "int", label: t("nl.shots_int"), base: 30 }].map((slot) => (
                              <div className="nl-shot" key={slot.k}>
                                <div className="nl-shot-label">{slot.label}<i className="req-star">*</i>{c.shots[slot.k].length > 0 && <span className="nl-shot-count mono">{c.shots[slot.k].length}</span>}</div>
                                {c.shots[slot.k].length === 0 ? (
                                  <button className="nl-shot-drop" onClick={() => carAddShot(i, slot.k)}>
                                    <span className="nl-shot-ic"><window.Icons.arrowDown size={20} style={{ transform: "rotate(180deg)" }} /></span>
                                    <span className="nl-shot-main">{t("nl.up_img")}</span><span className="nl-shot-sub mono">{t("nl.up_img_sub")}</span>
                                  </button>
                                ) : (
                                  <div className="nl-shot-grid">
                                    {c.shots[slot.k].map((id) => (
                                      <div className="nl-shot-thumb" key={id}>
                                        <window.VehicleImage seed={slot.base + id} label="" aspect="4 / 3" radius={9} />
                                        <button className="nl-shot-x" onClick={() => carRemoveShot(i, slot.k, id)}><window.Icons.x size={11} /></button>
                                      </div>
                                    ))}
                                    <button className="nl-shot-add" onClick={() => carAddShot(i, slot.k)} aria-label={t("nl.up_img")}><window.Icons.x size={16} style={{ transform: "rotate(45deg)" }} /></button>
                                  </div>
                                )}
                              </div>
                            ))}
                            <div className="nl-shot">
                              <div className="nl-shot-label">{t("nl.shots_video")}</div>
                              {c.shots.video ? (
                                <div className="nl-shot-filled is-video">
                                  <window.VehicleImage seed={13} label="" aspect="4 / 3" radius={10} />
                                  <span className="nl-shot-play"><window.Icons.play size={20} /></span>
                                  <span className="nl-shot-done"><window.Icons.check size={12} />{t("nl.uploaded")}</span>
                                  <button className="nl-shot-x" onClick={() => carToggleVideo(i)}><window.Icons.x size={12} /></button>
                                </div>
                              ) : (
                                <button className="nl-shot-drop" onClick={() => carToggleVideo(i)}>
                                  <span className="nl-shot-ic"><window.Icons.play size={20} /></span>
                                  <span className="nl-shot-main">{t("nl.up_video")}</span><span className="nl-shot-sub mono">{t("nl.up_video_sub")}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}


        </div>
      )}

      {/* footer */}
      <div className="nl-foot">
        {step === 0
          ? <button className="btn-ghost" onClick={onClose}>{t("nl.cancel")}</button>
          : <button className="btn-ghost" onClick={() => { setErr(false); setStep(0); window.scrollTo(0, 0); }}>{t("nl.prev")}</button>}
        <div className="nl-foot-right">
          <button className="btn-ghost" onClick={onClose}>{t("nl.draft")}</button>
          {step === 0
            ? <button className="btn-primary nl-cta" onClick={goNext}>{t("nl.next_vehicle")}</button>
            : <button className="btn-primary nl-cta" onClick={submit}>{t("nl.submit_n", cars.length + (validCar ? 1 : 0) || 1)}</button>}
        </div>
      </div>
    </div>
  );
}

// ── seller's disclosures (공시) — each groups several vehicles ─────────────────
function buildDisclosures() {
  const V = window.VEHICLES;
  const S = window.SESSIONS;
  const pick = (ids) => ids.map((id) => V.find((v) => v.id === id)).filter(Boolean);
  // scheduled disclosures haven't opened for bidding yet → no bids, price = start
  const preBid = (v) => ({ ...v, bids: 0, bidders: 0, current: v.start });
  return {
    selling: [
      { id: "DC-2606-018", title: "6월 정기 수출공시 1차", titleEn: "June Export Disclosure #1", sess: S[0], date: "2026.06.10", status: "bidding", mode: "auction", vehicles: pick(["carnival_limo", "ev9", "k9", "sorento", "ev6", "sportage", "k8", "staria", "niro", "ev4"]) },
      { id: "DC-2606-014", title: "법인 단체차량 특별공시", titleEn: "Corporate Fleet Special Disclosure", sess: S[1], date: "2026.06.08", status: "bidding", mode: "tender", vehicles: pick(["carnival_new", "carnival", "staria", "bongo3", "mohave", "k7", "k5", "avante", "ray", "morning"]) },
      { id: "DC-2606-022", title: "6월 정기 수출공시 2차", titleEn: "June Export Disclosure #2", sess: S[0], date: "2026.06.11", status: "listed", mode: "auction", vehicles: pick(["k8", "ev6", "sorento", "sportage", "avante", "k5", "niro", "soul", "stonic", "ray"]).map(preBid) },
    ],
    upcoming: [
      { id: "DC-2606-031", title: "6월 2차 정기공시", titleEn: "June Regular Disclosure #2", sess: S[2], date: "2026.06.12", status: "scheduled", mode: "auction", vehicles: pick(["sportage", "staria", "mohave", "ev3", "k3", "rv3", "soul", "stonic", "k5", "niro"]).map(preBid) },
    ],
    done: [
      { id: "DC-2605-090", title: "5월 정기 수출공시 마감분", titleEn: "May Export Disclosure — closed", sess: S[4], date: "2026.05.28", status: "closed", mode: "auction",
        vehicles: pick(["forte", "sportage", "avante", "mohave", "carnival", "k7", "opirus", "soul", "pride", "k8"]),
        soldIds: ["forte", "sportage", "avante", "soul"] },
      { id: "DC-2605-061", title: "5월 법인 단체차량 공시", titleEn: "May Corporate Fleet Disclosure", sess: S[3], date: "2026.05.16", status: "closed", mode: "tender",
        vehicles: pick(["carens", "sorento", "staria", "bongo3", "k9", "ev6", "niro", "ray", "morning", "stonic"]),
        soldIds: ["carens", "k9", "ray"] },
    ],
  };
}

const DISC_STATUS = {
  bidding: { key: "disc.st_bidding", cls: "sst-bidding" },
  listed: { key: "disc.st_listed", cls: "sst-listed" },
  scheduled: { key: "disc.st_scheduled", cls: "sst-arriving" },
  review: { key: "disc.st_review", cls: "sst-inspect" },
  closed: { key: "disc.st_closed", cls: "sst-sold" },
};

// thumbnail stack of the first few vehicles in a disclosure
function DiscThumbs({ vehicles }) {
  const shown = vehicles.slice(0, 3);
  return (
    <div className="disc-thumbs">
      {shown.map((v, i) => {
        const seedNum = v.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
        return (
          <div className="disc-thumb" key={v.id} style={{ zIndex: shown.length - i }}>
            <window.VehicleImage seed={seedNum} aspect="1 / 1" label="" radius={10} img={v.img} />
          </div>
        );
      })}
      {vehicles.length > 3 && <span className="disc-thumb-more mono">+{vehicles.length - 3}</span>}
    </div>
  );
}

function DisclosureRow({ d, onOpen, onReReg, onEdit }) {
  const { locale, t } = window.useLang();
  const st = DISC_STATUS[d.status];
  const totalBids = d.vehicles.reduce((a, v) => a + (v.bids || 0), 0);
  const venue = locale === "ko" ? d.sess.venue : d.sess.venueEn;
  return (
    <div className="disc-row" onClick={onOpen} role="button" tabIndex={0}>
      <DiscThumbs vehicles={d.vehicles} />
      <div className="disc-row-main">
        <div className="disc-row-top">
          <span className={`disc-mode ${d.mode === "tender" ? "tender" : "auction"}`}>
            {d.mode === "tender" ? <window.Icons.shield size={11} /> : <window.Icons.gavel size={11} />}
            {t(d.mode === "tender" ? "disc.mode_tender" : "disc.mode_auction")}
          </span>
          <span className="disc-row-title">{locale === "ko" ? d.title : d.titleEn}</span>
          <span className={`srow-status ${st.cls}`}>{t(st.key)}</span>
        </div>
        <div className="disc-row-meta mono">
          <span className="disc-row-no">{d.id}</span>
          <span className="sep">·</span>
          <span><window.Icons.pin size={12} />{venue}</span>
          <span className="sep">·</span>
          <span>{t("disc.date")} {d.date}</span>
        </div>
      </div>
      <div className="disc-row-stats">
        <span className="disc-row-count">{t("disc.count", d.vehicles.length)}</span>
        <span className="disc-row-bids mono">
          {d.status === "closed"
            ? `${t("disc.sold_n", (d.soldIds || []).length)} · ${t("rereg.unsold")} ${d.vehicles.length - (d.soldIds || []).length}`
            : EDITABLE_ST.includes(d.status)
            ? t("edit.pending")
            : t("disc.total_bids", totalBids)}
        </span>
      </div>
      {onEdit
        ? <button className="disc-rereg-row edit" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <window.Icons.doc size={14} />{t("edit.btn")}
          </button>
        : onReReg
        ? <button className="disc-rereg-row" onClick={(e) => { e.stopPropagation(); onReReg(); }}>
            <window.Icons.refresh size={14} />{t("rereg.btn")}
          </button>
        : <span className="srow-chev"><window.Icons.chevron size={18} /></span>}
    </div>
  );
}

// drill-down: vehicles inside one disclosure
function DisclosureDetail({ d, onBack, onOpen, onReReg, onEdit, currency, now, watched, toggleWatch }) {
  const { locale, t } = window.useLang();
  const st = DISC_STATUS[d.status];
  const venue = locale === "ko" ? d.sess.venue : d.sess.venueEn;
  const soldIds = d.soldIds || [];
  const isClosed = d.status === "closed";
  const editable = EDITABLE_ST.includes(d.status);
  const unsold = isClosed ? d.vehicles.filter((v) => !soldIds.includes(v.id)) : [];
  return (
    <div className="disc-detail">
      <button className="disc-back icon-only" onClick={onBack} aria-label={t("disc.back")}>
        <img className="back-ic" src={(window.__resources && window.__resources["assets/back-button.svg"]) || "assets/back-button.svg"} alt="" />
      </button>
      <div className="disc-detail-head">
        <div className="disc-detail-titles">
          <div className="disc-detail-row1">
            <span className={`disc-mode ${d.mode === "tender" ? "tender" : "auction"}`}>
              {d.mode === "tender" ? <window.Icons.shield size={12} /> : <window.Icons.gavel size={12} />}
              {t(d.mode === "tender" ? "disc.mode_tender" : "disc.mode_auction")}
            </span>
            <h2 className="disc-detail-title">{locale === "ko" ? d.title : d.titleEn}</h2>
            <span className={`srow-status ${st.cls}`}>{t(st.key)}</span>
          </div>
          <div className="disc-detail-meta mono">
            <span>{t("disc.no")} {d.id}</span>
            <span className="sep">·</span>
            <span><window.Icons.pin size={13} />{venue}</span>
            <span className="sep">·</span>
            <span>{t("disc.date")} {d.date}</span>
          </div>
        </div>
        {isClosed && unsold.length > 0
          ? <button className="btn-primary disc-rereg-btn" onClick={() => onReReg(d)}>
              <window.Icons.refresh size={15} />{t("rereg.btn")}
            </button>
          : editable
          ? <div className="disc-detail-actions">
              <span className="disc-detail-count mono">{t("disc.count", d.vehicles.length)}</span>
              <button className="btn-primary disc-rereg-btn" onClick={() => onEdit(d)}>
                <window.Icons.doc size={15} />{t("edit.btn")}
              </button>
            </div>
          : <span className="disc-detail-count mono">{t("disc.count", d.vehicles.length)}</span>}
      </div>

      {editable && (
        <div className="rereg-hint edit-hint">
          <window.Icons.info size={15} />
          <span>{t("edit.sub")}</span>
        </div>
      )}

      {isClosed && unsold.length > 0 && (
        <div className="rereg-hint">
          <window.Icons.info size={15} />
          <span>{t("rereg.detail_hint", unsold.length)}</span>
        </div>
      )}

      <h3 className="disc-cars-title">{t("disc.cars_title")}</h3>
      <div className="grid disc-cars-grid">
        {d.vehicles.map((v) => {
          const sold = soldIds.includes(v.id);
          const cardV = isClosed ? { ...v, endsAt: now - 86400000 } : v;
          return (
            <div className={`disc-car-wrap ${isClosed ? (sold ? "is-sold" : "is-unsold") : ""}`} key={v.id}>
              {isClosed && (
                <span className={`disc-car-tag ${sold ? "sold" : "unsold"}`}>
                  {sold ? t("rereg.sold") : t("rereg.unsold")}
                </span>
              )}
              <window.VehicleCard v={cardV} now={now} currency={currency}
                onOpen={onOpen} watched={watched} toggleWatch={toggleWatch} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── re-register unsold vehicles from a closed disclosure ──────────────────────
function ReRegisterFlow({ d, onCancel, onDone, onComplete }) {
  const { locale, t } = window.useLang();
  const soldIds = d.soldIds || [];
  const unsold = d.vehicles.filter((v) => !soldIds.includes(v.id));
  const [step, setStep] = React.useState(0);
  const [sel, setSel] = React.useState(() => new Set(unsold.map((v) => v.id)));
  const [prices, setPrices] = React.useState(() => { const m = {}; unsold.forEach((v) => { m[v.id] = v.start; }); return m; });
  const setPrice = (id, val) => setPrices((p) => ({ ...p, [id]: val }));
  const [err, setErr] = React.useState(false);
  const newNo = "DC-2606-0" + (50 + (d.id.charCodeAt(d.id.length - 1) % 40));
  const [period, setPeriod] = React.useState({
    regNo: newNo, venue: "", startDate: "2026-06-15", startTime: "10:00",
    endDate: "2026-06-17", endTime: "17:00",
  });
  const pset = (k, v) => setPeriod((s) => ({ ...s, [k]: v }));
  const venueOpts = window.SESSIONS.map((s) => ({ value: s.id, label: locale === "ko" ? s.venue : s.venueEn }));

  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allOn = sel.size === unsold.length;
  const toggleAll = () => setSel(allOn ? new Set() : new Set(unsold.map((v) => v.id)));
  const validPeriod = period.regNo && period.venue && period.startDate && period.endDate;

  const next = () => { if (sel.size === 0) { setErr(true); return; } setErr(false); setStep(1); window.scrollTo(0, 0); };
  const submit = () => {
    if (!validPeriod) { setErr(true); return; }
    setErr(false);
    const picked = unsold.filter((v) => sel.has(v.id)).map((v) => {
      const newStart = prices[v.id] || v.start;
      return { ...v, start: newStart, current: Math.max(newStart, v.current || 0) };
    });
    const sess = window.SESSIONS.find((s) => s.id === period.venue) || d.sess;
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, ".");
    const newDisc = {
      id: period.regNo,
      title: d.title + " · 재등록",
      titleEn: (d.titleEn || d.title) + " · Re-listed",
      sess, date: today, status: "listed", mode: d.mode || "auction", vehicles: picked, soldIds: [], reReg: true,
    };
    onComplete && onComplete(newDisc);
    setStep(2); window.scrollTo(0, 0);
    onDone && onDone(sel.size);
  };

  return (
    <div className="rereg">
      <button className="disc-back icon-only" onClick={onCancel} aria-label={t("disc.back")}>
        <img className="back-ic" src={(window.__resources && window.__resources["assets/back-button.svg"]) || "assets/back-button.svg"} alt="" />
      </button>

      <div className="rereg-head">
        <h2 className="disc-detail-title">{t("rereg.title")}</h2>
        <p className="page-sub">{t("rereg.sub")}</p>
        <div className="rereg-steps">
          {[t("rereg.step_select"), t("rereg.step_period")].map((label, i) => (
            <div className={`rereg-step ${step === i ? "on" : ""} ${step > i ? "done" : ""}`} key={i}>
              <span className="rereg-step-n">{step > i ? <window.Icons.check size={13} /> : i + 1}</span>
              <span className="rereg-step-l">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 0 — select unsold vehicles */}
      {step === 0 && (
        <div className="rereg-card">
          <div className="rereg-card-head">
            <span className="rereg-card-hint">{t("rereg.select_hint")}</span>
            <button className="rereg-all" onClick={toggleAll}>
              <span className={`rereg-cb ${allOn ? "on" : ""}`}>{allOn && <window.Icons.check size={12} />}</span>
              {t("rereg.all_select")}
            </button>
          </div>
          <div className={`rereg-list ${err && sel.size === 0 ? "err" : ""}`}>
            {unsold.map((v) => {
              const tv = window.trVehicle(v, locale);
              const seedNum = v.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
              const on = sel.has(v.id);
              return (
                <div className={`rereg-item ${on ? "on" : ""}`} key={v.id}>
                  <div className="rereg-pick" role="button" tabIndex={0} onClick={() => toggle(v.id)}>
                    <span className={`rereg-cb ${on ? "on" : ""}`}>{on && <window.Icons.check size={12} />}</span>
                    <span className="rereg-thumb"><window.VehicleImage seed={seedNum} aspect="1 / 1" label="" radius={9} img={v.img} /></span>
                    <span className="rereg-info">
                      <span className="rereg-name">{tv.maker} {tv.model} <span className="mono">{v.year}</span></span>
                      <span className="rereg-meta mono">{v.mileage.toLocaleString("en-US")} km<span className="sep">·</span>{t("color." + window.colorFamily(v))}</span>
                    </span>
                  </div>
                  <div className="rereg-price" onClick={(e) => e.stopPropagation()}>
                    <label className="rereg-price-lbl">{t("rereg.new_start")}</label>
                    <div className={`rereg-price-field ${!on ? "off" : ""}`}>
                      <span className="rereg-won">₩</span>
                      <input inputMode="numeric" disabled={!on}
                        value={prices[v.id] ? Number(prices[v.id]).toLocaleString("en-US") : ""}
                        onChange={(e) => setPrice(v.id, Number(e.target.value.replace(/[^0-9]/g, "")))} />
                    </div>
                    {prices[v.id] !== v.start && (
                      <span className="rereg-was mono">{t("rereg.was")} {window.fmtKRW(v.start)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="rereg-foot">
            <span className="rereg-selected mono">{t("rereg.selected_n", sel.size)}</span>
            <button className="btn-primary rereg-cta" onClick={next}>{t("rereg.next")}</button>
          </div>
        </div>
      )}

      {/* STEP 1 — new disclosure period */}
      {step === 1 && (
        <div className="rereg-card">
          <div className="rereg-card-head">
            <span className="rereg-card-hint">{t("rereg.period_hint", sel.size)}</span>
          </div>
          <div className="nl-form">
            <div className="field-row">
              <RField label={t("rereg.new_regno")} required error={err && !period.regNo}>
                <input value={period.regNo} onChange={(e) => pset("regNo", e.target.value.toUpperCase())} />
              </RField>
              <RField label={t("nl.venue")} required error={err && !period.venue}>
                <NLSelect value={period.venue} onChange={(v) => pset("venue", v)} options={venueOpts} error={err && !period.venue} />
              </RField>
            </div>
            <div className="field-row">
              <RField label={t("nl.start_date")} required error={err && !period.startDate}>
                <input type="date" value={period.startDate} onChange={(e) => pset("startDate", e.target.value)} />
              </RField>
              <RField label={t("nl.start_time")}>
                <input type="time" value={period.startTime} onChange={(e) => pset("startTime", e.target.value)} />
              </RField>
            </div>
            <div className="field-row">
              <RField label={t("nl.end_date")} required error={err && !period.endDate}>
                <input type="date" value={period.endDate} onChange={(e) => pset("endDate", e.target.value)} />
              </RField>
              <RField label={t("nl.end_time")}>
                <input type="time" value={period.endTime} onChange={(e) => pset("endTime", e.target.value)} />
              </RField>
            </div>
          </div>
          <div className="rereg-recap">
            <span className="rereg-recap-lbl">{t("rereg.recap")}</span>
            <div className="rereg-recap-chips">
              {unsold.filter((v) => sel.has(v.id)).map((v) => (
                <span className="rereg-chip" key={v.id}>{window.trMaker(v.maker, locale)} {v.model}</span>
              ))}
            </div>
          </div>
          <div className="rereg-foot">
            <button className="btn-ghost" onClick={() => setStep(0)}>{t("nl.prev")}</button>
            <button className="btn-primary rereg-cta" onClick={submit}>{t("rereg.submit", sel.size)}</button>
          </div>
        </div>
      )}

      {/* STEP 2 — done */}
      {step === 2 && (
        <div className="nl-done">
          <div className="wf-burst good"><window.Icons.check size={28} /></div>
          <h2>{t("rereg.done_title")}</h2>
          <p>{t("rereg.done_sub", sel.size)}</p>
          <div className="nl-done-row mono"><span>{t("rereg.new_regno")}</span><b>{period.regNo}</b></div>
          <button className="btn-primary" onClick={onCancel}>{t("rereg.done_close")}</button>
        </div>
      )}
    </div>
  );
}

// statuses where bidding hasn't started yet → disclosure + vehicle info still editable
const EDITABLE_ST = ["listed", "scheduled", "review"];

// ── edit a pre-bidding disclosure + its registered vehicles ───────────────────
function DisclosureEditFlow({ d, onCancel, onSave }) {
  const { locale, t } = window.useLang();
  const [title, setTitle] = React.useState(d.title);
  const [venue, setVenue] = React.useState(d.sess.id);
  const [dateISO, setDateISO] = React.useState(d.date.replace(/\./g, "-"));
  const [ids, setIds] = React.useState(() => d.vehicles.map((v) => v.id));
  const [starts, setStarts] = React.useState(() => { const m = {}; d.vehicles.forEach((v) => { m[v.id] = v.start; }); return m; });
  const [err, setErr] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const venueOpts = window.SESSIONS.map((s) => ({ value: s.id, label: locale === "ko" ? s.venue : s.venueEn }));
  const setStart = (id, val) => setStarts((p) => ({ ...p, [id]: val }));
  const removed = new Set(d.vehicles.map((v) => v.id).filter((id) => !ids.includes(id)));
  const toggleRemove = (id) => setIds((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...d.vehicles.map((v) => v.id).filter((x) => x === id || cur.includes(x))]);
  const kept = ids.length;
  const valid = title.trim() && venue && dateISO && kept > 0;

  const save = () => {
    if (!valid) { setErr(true); return; }
    setErr(false);
    const sess = window.SESSIONS.find((s) => s.id === venue) || d.sess;
    const vehicles = d.vehicles.filter((v) => ids.includes(v.id)).map((v) => {
      const ns = starts[v.id] || v.start;
      return { ...v, start: ns, current: Math.max(ns, v.current || 0) };
    });
    onSave({ ...d, title: title.trim(), sess, date: dateISO.replace(/-/g, "."), vehicles });
    setSaved(true);
  };

  if (saved) {
    return (
      <div className="rereg">
        <div className="nl-done">
          <div className="wf-burst good"><window.Icons.check size={28} /></div>
          <h2>{t("edit.saved")}</h2>
          <div className="nl-done-row mono"><span>{t("disc.no")}</span><b>{d.id}</b></div>
          <button className="btn-primary" onClick={onCancel}>{t("rereg.done_close")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rereg">
      <button className="disc-back icon-only" onClick={onCancel} aria-label={t("disc.back")}>
        <img className="back-ic" src={(window.__resources && window.__resources["assets/back-button.svg"]) || "assets/back-button.svg"} alt="" />
      </button>

      <div className="rereg-head">
        <h2 className="disc-detail-title">{t("edit.title")}</h2>
        <p className="page-sub">{t("edit.sub")}</p>
      </div>

      {/* disclosure info */}
      <div className="rereg-card">
        <div className="rereg-card-head">
          <span className="edit-sec-title">{t("edit.info_title")}</span>
        </div>
        <div className="nl-form">
          <div className="field-row">
            <RField label={t("edit.name")} required error={err && !title.trim()}>
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
            </RField>
          </div>
          <div className="field-row">
            <RField label={t("nl.venue")} required error={err && !venue}>
              <NLSelect value={venue} onChange={(v) => setVenue(v)} options={venueOpts} error={err && !venue} />
            </RField>
            <RField label={t("disc.date")} required error={err && !dateISO}>
              <input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} />
            </RField>
          </div>
        </div>
      </div>

      {/* vehicles */}
      <div className="rereg-card">
        <div className="rereg-card-head">
          <span className="edit-sec-title">{t("edit.cars_title")}</span>
          <span className="rereg-card-hint">{t("edit.cars_hint", d.vehicles.length)}</span>
        </div>
        <div className={`rereg-list ${err && kept === 0 ? "err" : ""}`}>
          {d.vehicles.map((v) => {
            const tv = window.trVehicle(v, locale);
            const seedNum = v.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
            const isRemoved = removed.has(v.id);
            const changed = (starts[v.id] || v.start) !== v.start;
            return (
              <div className={`rereg-item edit-item ${isRemoved ? "removed" : ""}`} key={v.id}>
                <div className="rereg-pick" style={{ cursor: "default" }}>
                  <span className="rereg-thumb"><window.VehicleImage seed={seedNum} aspect="1 / 1" label="" radius={9} img={v.img} /></span>
                  <span className="rereg-info">
                    <span className="rereg-name">{tv.maker} {tv.model} <span className="mono">{v.year}</span></span>
                    <span className="rereg-meta mono">{v.mileage.toLocaleString("en-US")} km<span className="sep">·</span>{t("color." + window.colorFamily(v))}</span>
                  </span>
                </div>
                <div className="rereg-price" onClick={(e) => e.stopPropagation()}>
                  <label className="rereg-price-lbl">{t("edit.start")}</label>
                  <div className={`rereg-price-field ${isRemoved ? "off" : ""}`}>
                    <span className="rereg-won">₩</span>
                    <input inputMode="numeric" disabled={isRemoved}
                      value={starts[v.id] ? Number(starts[v.id]).toLocaleString("en-US") : ""}
                      onChange={(e) => setStart(v.id, Number(e.target.value.replace(/[^0-9]/g, "")))} />
                  </div>
                  {changed && !isRemoved && <span className="rereg-was mono">{t("rereg.was")} {window.fmtKRW(v.start)}</span>}
                </div>
                <button className={`edit-remove ${isRemoved ? "undo" : ""}`} onClick={() => toggleRemove(v.id)}>
                  {isRemoved ? <><window.Icons.refresh size={13} />{t("edit.undo")}</> : <><window.Icons.x size={13} />{t("edit.remove")}</>}
                </button>
              </div>
            );
          })}
        </div>
        <div className="rereg-foot">
          <span className="rereg-selected mono">{t("disc.count", kept)}</span>
          <button className="btn-primary rereg-cta" onClick={save}>{t("edit.save")}</button>
        </div>
      </div>
    </div>
  );
}

function RegisterManage({ onNew, onOpen, currency, now, watched, toggleWatch, data, setData }) {
  const { t } = window.useLang();
  const [tab, setTab] = React.useState("selling");
  const [openId, setOpenId] = React.useState(null);
  const [reReg, setReReg] = React.useState(null);
  const [editDisc, setEditDisc] = React.useState(null);
  const [sub, setSub] = React.useState("all");
  const tabs = [
    { k: "selling", key: "sell.tab_selling" },
    { k: "upcoming", key: "sell.tab_upcoming" },
    { k: "done", key: "sell.tab_done" },
  ];
  const allRows = data[tab] || [];
  const subFilter = (d) => sub === "all" ? true : sub === "pre" ? EDITABLE_ST.includes(d.status) : d.status === "bidding";
  const rows = tab === "selling" ? allRows.filter(subFilter) : allRows;
  const preCount = allRows.filter((d) => EDITABLE_ST.includes(d.status)).length;
  const liveCount = allRows.filter((d) => d.status === "bidding").length;
  const openDisc = openId && allRows.find((d) => d.id === openId);

  if (editDisc) {
    return <DisclosureEditFlow d={editDisc}
      onCancel={() => { setEditDisc(null); window.scrollTo(0, 0); }}
      onSave={(upd) => {
        setData((prev) => {
          const next = {};
          for (const k of Object.keys(prev)) next[k] = prev[k].map((x) => x.id === upd.id ? upd : x);
          return next;
        });
      }} />;
  }

  if (reReg) {
    return <ReRegisterFlow d={reReg}
      onCancel={() => { setReReg(null); setOpenId(null); setTab("selling"); window.scrollTo(0, 0); }}
      onComplete={(newDisc) => setData((prev) => ({ ...prev, selling: [newDisc, ...prev.selling] }))}
      onDone={() => {}} />;
  }

  if (openDisc) {
    return (
      <DisclosureDetail d={openDisc} onBack={() => setOpenId(null)} onOpen={onOpen} onReReg={(d) => setReReg(d)}
        onEdit={(d) => { setEditDisc(d); window.scrollTo(0, 0); }}
        currency={currency} now={now} watched={watched} toggleWatch={toggleWatch} />
    );
  }

  return (
    <>
      <div className="manage-bar">
        <div className="manage-tabs">
          {tabs.map((tb) => (
            <button key={tb.k} className={`manage-tab ${tab === tb.k ? "on" : ""}`} onClick={() => { setTab(tb.k); setOpenId(null); setSub("all"); }}>
              {t(tb.key)}<span className="manage-tab-n mono">{data[tb.k].length}</span>
            </button>
          ))}
        </div>
        <button className="btn-primary manage-new" onClick={onNew}>
          <window.Icons.x size={15} style={{ transform: "rotate(45deg)" }} />{t("sell.new_listing")}
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="mp-empty">{t("disc.empty")}</div>
      ) : (
        <div className="disc-list">
          {rows.map((d) => (
            <DisclosureRow key={d.id} d={d}
              onOpen={() => setOpenId(d.id)}
              onEdit={EDITABLE_ST.includes(d.status) ? () => { setEditDisc(d); window.scrollTo(0, 0); } : null}
              onReReg={d.status === "closed" && (d.vehicles.length - (d.soldIds || []).length) > 0 ? () => setReReg(d) : null} />
          ))}
        </div>
      )}
    </>
  );
}

function RegisterPage({ onDone, onOpen, currency, now, watched, toggleWatch }) {
  const { t } = window.useLang();
  const [view, setView] = React.useState("manage");
  const [data, setData] = React.useState(buildDisclosures);
  return (
    <div className="page reg-page">
      {view === "manage"
        ? <RegisterManage onNew={() => setView("form")} onOpen={onOpen} data={data} setData={setData}
            currency={currency} now={now} watched={watched} toggleWatch={toggleWatch} />
        : <NewListingWizard onClose={() => { setView("manage"); window.scrollTo(0, 0); }} onDone={onDone}
            onComplete={(disc) => setData((prev) => ({ ...prev, selling: [disc, ...prev.selling] }))} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 차량 자산 (Vehicle Assets) — standalone inventory registered before disclosures
// ═══════════════════════════════════════════════════════════════════════════
const ASSET_STATUS = {
  ready: { key: "asset.st_ready", cls: "ast-ready" },
  listed: { key: "asset.st_listed", cls: "ast-listed" },
  sold: { key: "asset.st_sold", cls: "ast-sold" },
};

const ASSET_BRANCHES = ["본점", "대구지점1", "부산지점", "인천지점"];
const ASSET_USES = ["장기대여용", "단기대여용", "매각용"];
const ASSET_STATES = ["대여중", "대기중", "매각완료"];
const FUEL_KO = { "가솔린": "휘발유", "디젤": "경유", "하이브리드": "휘발유+전기", "전기": "전기", "LPG": "LPG" };

function buildAssets() {
  const V = window.VEHICLES;
  const hanguls = ["하", "호", "가", "저", "우", "무", "바", "사", "주", "러", "욱", "칠", "피", "고"];
  const ccPool = [1580, 1998, 2151, 2199, 2359, 2497, 2987, 2997, 3342, 3470, 3982];
  const yy = ["26", "25", "26", "26", "26", "26", "26", "26", "25", "25", "25", "25", "25", "25"];
  const mm = ["02", "10", "03", "03", "03", "02", "04", "02", "09", "09", "09", "09", "09", "09"];
  return V.slice(0, 14).map((v, i) => {
    const tv = window.trVehicle(v, "ko");
    const purchase = v.start;
    const consumer = Math.round(purchase * (1 + ((i % 4) * 0.015)) / 10000) * 10000;
    const state = i % 5 === 0 ? "대여중" : i % 7 === 3 ? "매각완료" : "대기중";
    const plate = ((100 + i * 37) % 900) + hanguls[i % hanguls.length] + String((i * 1717) % 9000 + 1000);
    return {
      ...v,
      id: "asset_seed_" + i,
      branch: i < 5 ? "본점" : ASSET_BRANCHES[i % ASSET_BRANCHES.length],
      assetNo: "AT" + yy[i] + mm[i] + String(18 + i * 137).padStart(5, "0"),
      state,
      saleDate: state === "매각완료" ? "2026.06.1" + (i % 9) : "",
      use: ASSET_USES[i % 6 === 5 ? 2 : 0],
      plate,
      modelKo: tv.model,
      submodelKo: v.trim || "-",
      consumer, purchase,
      prep: i % 4 === 1 ? [500000, 30700, 120000][i % 3] : 0,
      delivery: i % 5 === 2 ? [30700, 120000, 0][i % 3] : 0,
      colorKo: v.color,
      fuelKo: FUEL_KO[v.fuel] || v.fuel,
      cc: ccPool[i % ccPool.length],
      regStatus: state === "매각완료" ? "sold" : state === "대여중" ? "listed" : "ready",
    };
  });
}

// collapsible section card
function Section({ title, right, children }) {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="nl-card sec-card">
      <div className="sec-head">
        <h3>{title}</h3>
        {right ? <div className="sec-right">{right}</div> : null}
        <button type="button" className="sec-toggle" onClick={() => setOpen((o) => !o)} aria-label="toggle">
          <window.Icons.chevron size={18} style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform .18s" }} />
        </button>
      </div>
      {open ? <div className="sec-body">{children}</div> : null}
    </div>
  );
}

// 드롭다운 + "직접입력" 옵션 (선택 시 자유 입력으로 전환)
function PickOrType({ label, required, err, mode, onMode, value, onChange, options, placeholder }) {
  const { t } = window.useLang();
  const TYPE = "__type__";
  const typing = mode === "type";
  const optsWithType = [...options, { value: TYPE, label: t("asset.type_in") }];
  return (
    <div className={`field ${err ? "field-err" : ""}`}>
      <label>{label}{required && <i className="req-star">*</i>}</label>
      {typing ? (
        <div className="pot-typewrap">
          <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus />
          <button type="button" className="pot-back" onClick={() => { onMode("pick"); onChange(""); }} aria-label={t("asset.pick")}>
            <window.Icons.chevron size={15} style={{ transform: "rotate(90deg)" }} />
          </button>
        </div>
      ) : (
        <NLSelect value={value} options={optsWithType} error={err}
          onChange={(v) => { if (v === TYPE) { onMode("type"); onChange(""); } else { onChange(v); } }} />
      )}
    </div>
  );
}

// standalone vehicle-asset registration form — modeled on the MF (E-Collection) asset registration screen
function VehicleAssetForm({ onCancel, onSave, onBulk }) {
  const { locale, t } = window.useLang();
  const EMPTY = { maker: "", model: "", submodel: "", year: "", plate: "", vin: "", mileage: "", color: "", fuel: "", trans: "", accident: "", flood: "", notes: "",
    specFirstReg: "", specCc: "", specColorInt: "", specType: "", specBody: "", specSeats: "", dispAvail: "", dispDate: "" };
  const [car, setCar] = React.useState(EMPTY);
  const [err, setErr] = React.useState(false);
  const cset = (k, v) => setCar((s) => ({ ...s, [k]: v }));

  const V = window.VEHICLES;
  const makerOpts = window.MAKERS.map((m) => ({ value: m, label: window.trMaker(m, locale) }));
  const modelOpts = [...new Set(V.filter((v) => !car.maker || v.maker === car.maker).map(window.modelOf))].map((m) => ({ value: m, label: m }));
  const submodelOpts = [...new Set(V.filter((v) => v.maker === car.maker && (!car.model || window.modelOf(v) === car.model)).map((v) => v.trim).filter(Boolean))].map((x) => ({ value: x, label: x }));
  const yearOpts = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map((y) => ({ value: String(y), label: locale === "ko" ? `${y}년` : String(y) }));
  const colorOpts = window.COLOR_FAMILIES.map((c) => ({ value: c, label: t("color." + c) }));
  const fuelOpts = window.FUEL_TYPES.map((f) => ({ value: f, label: window.trFuel(f, locale) }));
  const transOpts = [{ value: "자동", label: window.trTrans("자동", locale) }, { value: "수동", label: window.trTrans("수동", locale) }];
  const accOpts = [["none", "nl.acc_none"], ["simple", "nl.acc_simple"], ["frame", "nl.acc_frame"]].map(([v, k]) => ({ value: v, label: t(k) }));
  const floodOpts = [["none", "nl.flood_none"], ["yes", "nl.flood_yes"]].map(([v, k]) => ({ value: v, label: t(k) }));

  // 가져오는 정보 — 차량 선택 시 등록원부에서 자동 조회, 이후 사용자가 수정 가능
  const base = (car.maker && car.model) ? V.find((v) => v.maker === car.maker && window.modelOf(v) === car.model) : null;
  const bodyType = base ? window.bodyOf(base) : "";
  const bodyShapeMap = { SUV: "5도어 SUV", 세단: "4도어 세단", 미니밴: "5도어 미니밴", 픽업: "2도어 픽업" };
  const seatM = base && base.trim ? (base.trim.match(/(\d+)\s*인승/) || [])[1] : null;
  const fetchedReady = !!car.specFirstReg;
  React.useEffect(() => {
    const b = base || V[0];
    if (!b) return;
    const bt = window.bodyOf(b);
    const sm = b.trim ? (b.trim.match(/(\d+)\s*인승/) || [])[1] : null;
    setCar((s) => ({
      ...s,
      specFirstReg: `${car.year || b.year}.03.15`,
      specCc: b.fuel === "전기" ? "전기 모터" : b.fuel === "디젤" ? "2,199 cc" : "1,998 cc",
      specColorInt: "블랙 (인조가죽)",
      specType: bt,
      specBody: bodyShapeMap[bt] || bt,
      specSeats: (sm ? sm : (bt === "미니밴" ? "7" : "5")) + "명",
      dispAvail: "처분 가능",
      dispDate: `${Number(car.year || b.year) + 5}.03.14`,
    }));
  }, [car.maker, car.model, car.year]);

  const editField = (label, key, ph) => (
    <RField label={label}>
      <input value={car[key]} onChange={(e) => cset(key, e.target.value)} placeholder={ph || ""} />
    </RField>
  );
  const dispOpts = ["처분 가능", "처분 불가", "보류"].map((x) => ({ value: x, label: x }));

  const valid = car.maker && car.model && car.year && car.plate && car.mileage && car.color;
  const save = () => {
    if (!valid) { setErr(true); return; }
    const b = base || V.find((v) => v.maker === car.maker) || V[0];
    const accMap = { none: "무사고", simple: "단순교환 1", frame: "단순교환 2" };
    const start = b.start;
    onSave({
      ...b, id: "asset_" + Date.now(), i18n: null,
      maker: car.maker, model: car.model, trim: car.submodel || b.trim,
      year: Number(car.year) || b.year, mileage: Number(car.mileage) || b.mileage,
      fuel: car.fuel || b.fuel, trans: car.trans || b.trans,
      vin: car.vin || b.vin, plate: car.plate,
      color: car.color || b.color,
      colorKo: car.color || b.color,
      modelKo: car.model, submodelKo: car.submodel || b.trim || "-",
      fuelKo: FUEL_KO[car.fuel || b.fuel] || (car.fuel || b.fuel),
      inspect: { ...b.inspect, accident: accMap[car.accident] || b.inspect.accident },
      accidentNote: car.notes || b.accidentNote,
      branch: "본점", use: "장기대여용", state: "대기중",
      cc: base && base.fuel === "전기" ? 0 : (base && base.fuel === "디젤" ? 2199 : 1998),
      consumer: start, purchase: start, prep: 0, delivery: 0,
      start, current: start, bids: 0, bidders: 0,
      regStatus: "ready", assetNo: "",
    });
  };

  const bulkImport = () => {
    const src = V.slice(0, 8);
    onBulk(src.map((v, i) => ({ ...v, id: "asset_" + Date.now() + "_" + i, i18n: null, bids: 0, bidders: 0, current: v.start, regStatus: "ready", assetNo: "" })));
  };

  return (
    <div className="nl-wizard">
      <button className="disc-back icon-only" onClick={onCancel} aria-label={t("disc.back")}>
        <img className="back-ic" src={(window.__resources && window.__resources["assets/back-button.svg"]) || "assets/back-button.svg"} alt="" />
      </button>
      <div className="nl-head">
        <h1 className="page-title">{t("asset.form_title")}</h1>
        <p className="page-sub">{t("asset.form_sub")}</p>
      </div>


      {/* 차량 기본 정보 */}
      <Section title={t("asset.sec_basic")}>
        <div className="nl-form">
          <div className="field-row">
            <RField label={t("sell.maker")} required error={err && !car.maker}><input value={car.maker} onChange={(e) => cset("maker", e.target.value)} placeholder={t("nl.enter")} className={err && !car.maker ? "err" : ""} /></RField>
            <RField label={t("sell.model")} required error={err && !car.model}><input value={car.model} onChange={(e) => cset("model", e.target.value)} placeholder={t("nl.enter")} className={err && !car.model ? "err" : ""} /></RField>
          </div>
          <div className="field-row">
            <RField label={t("nl.submodel")}><input value={car.submodel} onChange={(e) => cset("submodel", e.target.value)} placeholder={t("nl.submodel_ph")} /></RField>
            <RField label={t("sell.year")} required error={err && !car.year}><input inputMode="numeric" value={car.year} onChange={(e) => cset("year", e.target.value.replace(/[^0-9]/g, ""))} placeholder={t("nl.enter")} className={err && !car.year ? "err" : ""} /></RField>
          </div>
          <div className="field-row">
            <RField label={t("nl.plate")} required error={err && !car.plate}><input value={car.plate} onChange={(e) => cset("plate", e.target.value)} placeholder={t("nl.plate_ph")} /></RField>
            <RField label={t("nl.vin")}><input value={car.vin} onChange={(e) => cset("vin", e.target.value.toUpperCase())} placeholder={t("nl.vin_ph")} /></RField>
          </div>
          <div className="field-row">
            <RField label={t("nl.mileage")} required error={err && !car.mileage}><input inputMode="numeric" value={car.mileage} onChange={(e) => cset("mileage", e.target.value.replace(/[^0-9]/g, ""))} placeholder="예: 43000" /></RField>
            <RField label={t("nl.color")} required error={err && !car.color}><input value={car.color} onChange={(e) => cset("color", e.target.value)} placeholder={t("nl.enter")} className={err && !car.color ? "err" : ""} /></RField>
          </div>
          <div className="field-row">
            <RField label={t("sell.fuel")}><input value={car.fuel} onChange={(e) => cset("fuel", e.target.value)} placeholder={t("nl.enter")} /></RField>
            <RField label={t("sell.trans")}><input value={car.trans} onChange={(e) => cset("trans", e.target.value)} placeholder={t("nl.enter")} /></RField>
          </div>
        </div>
      </Section>

      {/* 제원 관련 정보 — 자동 조회 후 수정 가능 */}
      <Section title={t("asset.sec_spec")} right={fetchedReady ? <span className="fetch-badge"><window.Icons.check size={12} />{t("asset.fetched_badge")}</span> : null}>
        <div className="nl-form">
          <div className="field-row">{editField(t("asset.spec_firstreg"), "specFirstReg")}{editField(t("asset.spec_cc"), "specCc")}</div>
          <div className="field-row">{editField(t("asset.spec_colorint"), "specColorInt")}{editField(t("asset.spec_type"), "specType")}</div>
          <div className="field-row">{editField(t("asset.spec_body"), "specBody")}{editField(t("asset.spec_seats"), "specSeats")}</div>
          <p className="asset-note">{t("asset.fetched_note")}</p>
        </div>
      </Section>

      {/* 처분 관련 정보 — 자동 조회 후 수정 가능 */}
      <Section title={t("asset.sec_disposal")} right={fetchedReady ? <span className="fetch-badge"><window.Icons.check size={12} />{t("asset.fetched_badge")}</span> : null}>
        <div className="nl-form">
          <div className="field-row">
            <RField label={t("asset.disp_avail")}><NLSelect value={car.dispAvail} onChange={(v) => cset("dispAvail", v)} options={dispOpts} /></RField>
            {editField(t("asset.disp_date"), "dispDate")}
          </div>
          <p className="asset-note">{t("asset.fetched_note")}</p>
        </div>
      </Section>

      {/* 차량 상태 */}
      <Section title={t("nl.state")}>
        <div className="nl-form">
          <div className="field-row">
            <RField label={t("nl.acc_hist")}><NLSelect value={car.accident} onChange={(v) => cset("accident", v)} options={accOpts} /></RField>
            <RField label={t("nl.flood_hist")}><NLSelect value={car.flood} onChange={(v) => cset("flood", v)} options={floodOpts} /></RField>
          </div>
          <RField label={t("nl.notes")}><textarea rows="3" value={car.notes} onChange={(e) => cset("notes", e.target.value)} placeholder={t("nl.notes_ph")} /></RField>
        </div>
      </Section>

      <div className="nl-foot">
        <button className="btn-ghost" onClick={onCancel}>{t("nl.cancel")}</button>
        <div className="nl-foot-right">
          <button className="btn-primary nl-cta" onClick={save}>{t("asset.save")}</button>
        </div>
      </div>
    </div>
  );
}

// 자산 엑셀등록 화면 (구성은 MF 레퍼런스, 디자인은 기존 스타일)
function AssetExcelUpload({ onClose, onSave }) {
  const { locale, t } = window.useLang();
  const [file, setFile] = React.useState("");
  const [rows, setRows] = React.useState([]);

  const uploadDemo = () => {
    const V = window.VEHICLES;
    const han = ["하", "호", "가", "저", "우", "무", "바", "사", "주", "러"];
    setRows(V.slice(0, 10).map((v, i) => {
      const tv = window.trVehicle(v, "ko");
      return {
        plate: ((100 + i * 37) % 900) + han[i % han.length] + String((i * 1717) % 9000 + 1000),
        maker: tv.maker, brand: tv.maker, model: tv.model, submodel: v.trim || "-",
        regDate: "20260101", useReg: "영업용", use: "장기대여용", branch: "본점",
        colorExt: v.color, expireDate: "20310101", airbags: [7, 9, 6][i % 3], year: v.year,
      };
    }));
  };

  const instructions = [
    "1) 반드시 정해진 엑셀 템플릿에 작업 후 업로드 바랍니다. ([Excel 템플릿 다운로드] 버튼 클릭 시 템플릿 다운로드가 가능합니다.)",
    "2) 날짜포맷은 \"YYYYMMDD\" 로 입력 바랍니다. (복사붙여넣기 사용 시 날짜포맷이 변경될 수 있습니다. 수기입력 바랍니다.)",
    "3) Excel 업로드 등록 정보에서 회색배경의 데이터(차량번호, 제조사, 브랜드, 모델)는 엑셀에서만 수정 가능한 데이터를 뜻합니다.",
    "4) Excel 업로드 등록 정보에서 빨간색배경인 데이터는 잘못된 형식의 데이터를 뜻합니다. 엑셀 데이터를 수정 후 재업로드 바랍니다.",
    "5) Excel 업로드 등록 정보에서 차량번호 중 주황색으로 변경된 데이터는 이미 등록된 자산 중 중복된 차량번호가 있다는 뜻입니다.",
    "6) 자산 엑셀등록 시 금액관련 데이터는 일괄 '0원'으로 등록됩니다. 데이터 저장 후 [차량등록정보상세] 팝업에서 수정이 가능합니다.",
    "7) 차령만료일자는 차량등록일자 기준으로 +5년으로 자동계산되고, Excel 업로드 등록 정보에서 수정이 가능합니다.",
    "8) 첫검사일자, 첫종합검사일자는 차량등록일자 기준으로 +1년, +2년으로 자동계산됩니다.",
    "9) 상세모델은 [추가하기] 버튼을 통해서 상세모델을 추가할 수 있습니다.",
  ];

  const cols = [
    [t("asset.c_plate"), true], [t("sell.maker"), true], [t("asset.brand"), true], [t("sell.model"), true],
    [t("asset.submodel"), true], [t("asset.submodel_add"), false], [t("asset.regdate"), true], [t("asset.usereg"), false],
    [t("asset.c_use"), true], [t("asset.c_branch"), true], [t("asset.color_ext"), false], [t("asset.expiredate"), true],
    [t("asset.airbags"), false], [t("asset.year"), false],
  ];

  return (
    <div className="asset-admin asset-xls">
      <div className="admin-bar">
        <h1 className="admin-title">{t("asset.xls_title")}</h1>
        <div className="admin-tools">
          <button className="admin-btn dark" onClick={() => onSave(rows)}>{t("asset.xls_save")}</button>
          <button className="admin-btn" onClick={onClose}>{t("asset.xls_close")}</button>
        </div>
      </div>

      {/* Excel 업로드 */}
      <Section title={t("asset.xls_upload")}>
        <div className="xls-upload">
          <label className="aform-file">
            <input type="file" hidden onChange={(e) => setFile(e.target.files[0]?.name || "")} />
            <span className="aform-file-btn">{t("asset.file_pick")}</span>
            <span className="aform-file-name">{file || t("asset.file_none")}</span>
          </label>
          <div className="xls-upload-btns">
            <button className="admin-btn dark" onClick={uploadDemo}>{t("asset.xls_btn_upload")}</button>
            <button className="admin-btn dark" onClick={() => {}}>{t("asset.xls_btn_template")}</button>
          </div>
        </div>
      </Section>

      {/* Excel 업로드 등록 정보 */}
      <Section title={t("asset.xls_info_title")}>
        <ol className="xls-info">
          {instructions.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      </Section>

      <div className="atbl-wrap" style={{ marginTop: 16 }}>
        <table className="atbl">
          <thead>
            <tr>
              <th className="atbl-num">#</th>
              {cols.map(([label, req], i) => <th key={i}>{label}{req ? <i className="req-star">*</i> : null}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0
              ? <tr><td colSpan={cols.length + 1} className="atbl-empty">{t("asset.xls_empty")}</td></tr>
              : rows.map((r, i) => (
                <tr key={i}>
                  <td className="atbl-num">{i + 1}</td>
                  <td className="atbl-plate mono">{r.plate}</td>
                  <td className="atbl-dim">{r.maker}</td>
                  <td className="atbl-dim">{r.brand}</td>
                  <td className="atbl-dim">{r.model}</td>
                  <td>{r.submodel}</td>
                  <td /><td className="mono">{r.regDate}</td>
                  <td>{r.useReg}</td>
                  <td>{r.use}</td>
                  <td>{r.branch}</td>
                  <td>{r.colorExt}</td>
                  <td className="mono">{r.expireDate}</td>
                  <td className="ta-r mono">{r.airbags}</td>
                  <td className="ta-r mono">{r.year}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// derive spec/disposal defaults from a vehicle base (mirrors VehicleAssetForm auto-fetch)
function deriveAssetSpec(a) {
  const V = window.VEHICLES;
  const base = V.find((v) => v.maker === a.maker && window.modelOf(v) === (a.modelKo || a.model)) || V[0];
  const bt = window.bodyOf(base);
  const bodyShapeMap = { SUV: "5도어 SUV", 세단: "4도어 세단", 미니밴: "5도어 미니밴", 픽업: "2도어 픽업" };
  const sm = base.trim ? (base.trim.match(/(\d+)\s*인승/) || [])[1] : null;
  const yr = a.year || base.year;
  return {
    specFirstReg: a.specFirstReg || `${yr}.03.15`,
    specCc: a.specCc || (base.fuel === "전기" ? "전기 모터" : base.fuel === "디젤" ? "2,199 cc" : "1,998 cc"),
    specColorInt: a.specColorInt || "블랙 (인조가죽)",
    specType: a.specType || bt,
    specBody: a.specBody || (bodyShapeMap[bt] || bt),
    specSeats: a.specSeats || ((sm ? sm : (bt === "미니밴" ? "7" : "5")) + "명"),
    dispAvail: a.dispAvail || "처분 가능",
    dispDate: a.dispDate || `${Number(yr) + 5}.03.14`,
  };
}

// edit-in-place modal for an existing vehicle asset — same fields as the registration form
function AssetEditModal({ asset, onClose, onSave }) {
  const { locale, t } = window.useLang();
  const [car, setCar] = React.useState(() => ({
    maker: asset.maker || "",
    model: asset.modelKo || asset.model || "",
    submodel: asset.submodelKo || asset.trim || "",
    year: asset.year ? String(asset.year) : "",
    plate: asset.plate || "",
    vin: asset.vin || "",
    mileage: asset.mileage != null ? String(asset.mileage) : "",
    color: asset.colorKo || asset.color || "",
    fuel: asset.fuelKo || asset.fuel || "",
    trans: window.trTrans ? window.trTrans(asset.trans, "ko") : (asset.trans || ""),
    notes: asset.accidentNote || "",
    ...deriveAssetSpec(asset),
  }));
  const [err, setErr] = React.useState(false);
  const cset = (k, v) => setCar((s) => ({ ...s, [k]: v }));

  const dispOpts = ["처분 가능", "처분 불가", "보류"].map((x) => ({ value: x, label: x }));
  const editField = (label, key, ph) => (
    <RField label={label}><input value={car[key]} onChange={(e) => cset(key, e.target.value)} placeholder={ph || ""} /></RField>
  );

  const valid = car.maker && car.model && car.year && car.plate && car.mileage && car.color;
  const save = () => {
    if (!valid) { setErr(true); return; }
    onSave({
      ...asset,
      maker: car.maker,
      model: car.model, modelKo: car.model,
      trim: car.submodel || asset.trim, submodelKo: car.submodel || asset.submodelKo,
      year: Number(car.year) || asset.year,
      plate: car.plate, vin: car.vin,
      mileage: Number(car.mileage) || asset.mileage,
      color: car.color, colorKo: car.color,
      fuel: car.fuel, fuelKo: car.fuel,
      trans: car.trans,
      accidentNote: car.notes,
      specFirstReg: car.specFirstReg, specCc: car.specCc, specColorInt: car.specColorInt,
      specType: car.specType, specBody: car.specBody, specSeats: car.specSeats,
      dispAvail: car.dispAvail, dispDate: car.dispDate,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal asset-edit-modal" onClick={(e) => e.stopPropagation()} style={{ position: "relative" }}>
        <div className="modal-head">
          <div>
            <h2>{t("asset.edit_title")}</h2>
            <p className="modal-sub" style={{ margin: "6px 0 0" }}>{t("asset.edit_sub")}</p>
          </div>
          <button className="modal-x-btn" onClick={onClose}><window.Icons.x size={16} /></button>
        </div>

        <div className="asset-edit-body">
          <Section title={t("asset.sec_basic")}>
            <div className="nl-form">
              <div className="field-row">
                <RField label={t("sell.maker")} required error={err && !car.maker}><input value={car.maker} onChange={(e) => cset("maker", e.target.value)} placeholder={t("nl.enter")} className={err && !car.maker ? "err" : ""} /></RField>
                <RField label={t("sell.model")} required error={err && !car.model}><input value={car.model} onChange={(e) => cset("model", e.target.value)} placeholder={t("nl.enter")} className={err && !car.model ? "err" : ""} /></RField>
              </div>
              <div className="field-row">
                <RField label={t("nl.submodel")}><input value={car.submodel} onChange={(e) => cset("submodel", e.target.value)} placeholder={t("nl.submodel_ph")} /></RField>
                <RField label={t("sell.year")} required error={err && !car.year}><input inputMode="numeric" value={car.year} onChange={(e) => cset("year", e.target.value.replace(/[^0-9]/g, ""))} placeholder={t("nl.enter")} className={err && !car.year ? "err" : ""} /></RField>
              </div>
              <div className="field-row">
                <RField label={t("nl.plate")} required error={err && !car.plate}><input value={car.plate} onChange={(e) => cset("plate", e.target.value)} placeholder={t("nl.plate_ph")} /></RField>
                <RField label={t("nl.vin")}><input value={car.vin} onChange={(e) => cset("vin", e.target.value.toUpperCase())} placeholder={t("nl.vin_ph")} /></RField>
              </div>
              <div className="field-row">
                <RField label={t("nl.mileage")} required error={err && !car.mileage}><input inputMode="numeric" value={car.mileage} onChange={(e) => cset("mileage", e.target.value.replace(/[^0-9]/g, ""))} placeholder="예: 43000" /></RField>
                <RField label={t("nl.color")} required error={err && !car.color}><input value={car.color} onChange={(e) => cset("color", e.target.value)} placeholder={t("nl.enter")} className={err && !car.color ? "err" : ""} /></RField>
              </div>
              <div className="field-row">
                <RField label={t("sell.fuel")}><input value={car.fuel} onChange={(e) => cset("fuel", e.target.value)} placeholder={t("nl.enter")} /></RField>
                <RField label={t("sell.trans")}><input value={car.trans} onChange={(e) => cset("trans", e.target.value)} placeholder={t("nl.enter")} /></RField>
              </div>
            </div>
          </Section>

          <Section title={t("asset.sec_spec")}>
            <div className="nl-form">
              <div className="field-row">{editField(t("asset.spec_firstreg"), "specFirstReg")}{editField(t("asset.spec_cc"), "specCc")}</div>
              <div className="field-row">{editField(t("asset.spec_colorint"), "specColorInt")}{editField(t("asset.spec_type"), "specType")}</div>
              <div className="field-row">{editField(t("asset.spec_body"), "specBody")}{editField(t("asset.spec_seats"), "specSeats")}</div>
            </div>
          </Section>

          <Section title={t("asset.sec_disposal")}>
            <div className="nl-form">
              <div className="field-row">
                <RField label={t("asset.disp_avail")}><NLSelect value={car.dispAvail} onChange={(v) => cset("dispAvail", v)} options={dispOpts} /></RField>
                {editField(t("asset.disp_date"), "dispDate")}
              </div>
            </div>
          </Section>

          <Section title={t("nl.state")}>
            <div className="nl-form">
              <RField label={t("nl.notes")}><textarea rows="3" value={car.notes} onChange={(e) => cset("notes", e.target.value)} placeholder={t("nl.notes_ph")} /></RField>
            </div>
          </Section>
        </div>

        <div className="nl-foot" style={{ marginTop: 4 }}>
          <button className="btn-ghost" onClick={onClose}>{t("nl.cancel")}</button>
          <div className="nl-foot-right">
            <button className="btn-primary nl-cta" onClick={save}>{t("asset.edit_save")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VehicleAssetPage({ onToast }) {
  const { locale, t } = window.useLang();
  const [assets, setAssets] = React.useState(buildAssets);
  const [view, setView] = React.useState("list");
  const [layout, setLayout] = React.useState("table");
  const EMPTY_F = { branch: "", q: "", state: "", use: "" };
  const [draft, setDraft] = React.useState(EMPTY_F);
  const [applied, setApplied] = React.useState(EMPTY_F);
  const [sel, setSel] = React.useState(() => new Set());
  const [editId, setEditId] = React.useState(null);
  const dset = (k, v) => setDraft((s) => ({ ...s, [k]: v }));

  const shown = assets.filter((a) =>
    (!applied.branch || a.branch === applied.branch) &&
    (!applied.q || a.plate.includes(applied.q) || a.modelKo.includes(applied.q) || a.assetNo.includes(applied.q)) &&
    (!applied.state || a.state === applied.state) &&
    (!applied.use || a.use === applied.use)
  );
  const stat = {
    total: shown.length,
    ready: shown.filter((a) => a.regStatus === "ready").length,
    listed: shown.filter((a) => a.regStatus === "listed").length,
    sold: shown.filter((a) => a.regStatus === "sold").length,
    avgConsumer: shown.length ? Math.round(shown.reduce((s, a) => s + (a.consumer || 0), 0) / shown.length) : 0,
    avgPurchase: shown.length ? Math.round(shown.reduce((s, a) => s + (a.purchase || 0), 0) / shown.length) : 0,
  };
  const allSel = shown.length > 0 && shown.every((a) => sel.has(a.id));
  const toggleAll = () => setSel(allSel ? new Set() : new Set(shown.map((a) => a.id)));
  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const reset = () => { setDraft(EMPTY_F); setApplied(EMPTY_F); };
  const num = (n) => n ? n.toLocaleString("en-US") : (n === 0 ? "0" : "");

  const branchOpts = ASSET_BRANCHES.map((b) => ({ value: b, label: b }));
  const stateOpts = ASSET_STATES.map((s) => ({ value: s, label: s }));
  const useOpts = ASSET_USES.map((u) => ({ value: u, label: u }));

  if (view === "form") {
    return (
      <div className="page reg-page">
        <VehicleAssetForm onCancel={() => { setView("list"); window.scrollTo(0, 0); }}
          onSave={(a) => { setAssets((cur) => [normalizeNew(a, cur.length), ...cur]); setView("list"); onToast && onToast("toast.asset_saved"); window.scrollTo(0, 0); }}
          onBulk={(list) => { setAssets((cur) => [...list.map((x, i) => normalizeNew(x, cur.length + i)), ...cur]); setView("list"); onToast && onToast("toast.asset_excel"); window.scrollTo(0, 0); }} />
      </div>
    );
  }

  if (view === "excel") {
    return (
      <div className="page reg-page asset-admin">
        <AssetExcelUpload onClose={() => { setView("list"); window.scrollTo(0, 0); }}
          onSave={(list) => { setAssets((cur) => [...list.map((x, i) => normalizeNew({
            ...(window.VEHICLES.find((v) => v.maker === x.maker && window.modelOf(v) === x.model) || window.VEHICLES[0]),
            maker: x.maker, model: x.model, modelKo: x.model, submodelKo: x.submodel, trim: x.submodel,
            colorKo: x.colorExt, branch: x.branch, use: x.use, plate: x.plate, year: x.year, state: "대기중",
            consumer: 0, purchase: 0, prep: 0, delivery: 0, i18n: null, id: "asset_xls_" + Date.now() + "_" + i,
          }, cur.length + i)), ...cur]); setView("list"); onToast && onToast("toast.asset_excel"); window.scrollTo(0, 0); }} />
      </div>
    );
  }

  const cols = ["asset.c_branch", "asset.c_no", "asset.c_state", "asset.c_saledate", "asset.c_use", "asset.c_plate", "asset.c_model", "asset.c_submodel", "asset.c_consumer", "asset.c_purchase", "asset.c_prep", "asset.c_delivery", "asset.c_color", "asset.c_fuel", "asset.c_cc"];
  const numCols = new Set(["asset.c_consumer", "asset.c_purchase", "asset.c_prep", "asset.c_delivery", "asset.c_cc"]);

  return (
    <div className="page reg-page asset-admin">
      <div className="admin-bar">
        <h1 className="admin-title">{t("asset.title")}</h1>
      </div>

      <div className="afilter">
        <div className="afilter-c"><NLSelect value={draft.branch} onChange={(v) => dset("branch", v)} options={branchOpts} allLabel={t("asset.c_branch")} /></div>
        <div className="afilter-c date">
          <input type="date" value={draft.from || ""} onChange={(e) => dset("from", e.target.value)} />
          <span>~</span>
          <input type="date" value={draft.to || ""} onChange={(e) => dset("to", e.target.value)} />
        </div>
        <div className="afilter-c"><NLSelect value={draft.state} onChange={(v) => dset("state", v)} options={stateOpts} allLabel={t("asset.c_state")} /></div>
        <div className="afilter-c"><NLSelect value={draft.use} onChange={(v) => dset("use", v)} options={useOpts} allLabel={t("asset.c_use")} /></div>
        <div className="afilter-search">
          <window.Icons.search size={16} />
          <input value={draft.q} placeholder={t("asset.search_ph")} onChange={(e) => dset("q", e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") setApplied(draft); }} />
        </div>
        <button className="admin-btn dark" onClick={() => setApplied(draft)}>{t("asset.search")}</button>
        <button className="admin-btn" onClick={reset}>{t("asset.reset")}</button>
      </div>

      <div className="admin-subbar">
        <h2 className="admin-subtitle">{t("asset.list_title")} <span className="admin-count mono">{shown.length}</span></h2>
        <div className="admin-tools">
          <div className="admin-viewtog">
            <button className={`admin-vt ${layout === "table" ? "on" : ""}`} onClick={() => setLayout("table")} aria-label={t("asset.view_table")}><window.Icons.rows size={15} /></button>
            <button className={`admin-vt ${layout === "card" ? "on" : ""}`} onClick={() => setLayout("card")} aria-label={t("asset.view_card")}><window.Icons.grid size={15} /></button>
          </div>
          <button className="admin-btn sm" onClick={() => { setView("form"); window.scrollTo(0, 0); }}><window.Icons.x size={13} style={{ transform: "rotate(45deg)" }} />{t("asset.new")}</button>
          <button className="admin-btn sm" onClick={() => { setView("excel"); window.scrollTo(0, 0); }}>{t("asset.a_excel")}</button>
        </div>
      </div>

      {layout === "card"
        ? (shown.length === 0
          ? <div className="asset-empty"><window.Icons.doc size={26} /><span>{t("asset.empty")}</span></div>
          : <div className="grid">
              {shown.map((a) => {
                const seedNum = a.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
                return (
                <article className="card asset-clickable" key={a.id} onClick={() => setEditId(a.id)}>
                  <div className="card-img">
                    <div onClick={(e) => e.stopPropagation()}>
                      <window.VehicleSlot slotId={a.id} seed={seedNum} label={t("card.photo")} img={a.img} radius={14} aspect="16 / 11" />
                    </div>
                    <span className={`card-cd-badge s-${a.regStatus}`}>{a.state}</span>
                  </div>
                  <div className="card-body">
                    <div className="card-branch">{a.branch}</div>
                    <div className="card-name">{a.modelKo}</div>
                    <div className="card-spec">
                      <span>{a.year}년</span>
                      <span className="sep">·</span><span>{a.colorKo}</span>
                      <span className="sep">·</span><span>{a.fuelKo}</span>
                    </div>
                    <div className="card-bidlabel">{t("asset.c_consumer")}</div>
                    <div className="card-price-krw mono">{num(a.consumer)}원</div>
                    <div className="card-price-conv mono">{t("asset.c_purchase")} {num(a.purchase)}원</div>
                    <div className="card-bids">{a.submodelKo}</div>
                    <div className="card-lotpill mono">{a.plate}</div>
                    <div className="card-watch mono">{a.assetNo}</div>
                  </div>
                </article>
                );
              })}
            </div>)
        : <div className="atbl-wrap">
        <table className="atbl">
          <thead>
            <tr>
              <th className="atbl-num">#</th>
              <th className="atbl-chk"><input type="checkbox" checked={allSel} onChange={toggleAll} /></th>
              {cols.map((c) => <th key={c} className={numCols.has(c) ? "ta-r" : ""}>{t(c)}</th>)}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0
              ? <tr><td colSpan={cols.length + 2} className="atbl-empty">{t("asset.empty")}</td></tr>
              : shown.map((a, i) => (
                <tr key={a.id} className={`asset-clickable ${sel.has(a.id) ? "on" : ""}`} onClick={() => setEditId(a.id)}>
                  <td className="atbl-num">{i + 1}</td>
                  <td className="atbl-chk" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={sel.has(a.id)} onChange={() => toggle(a.id)} /></td>
                  <td>{a.branch}</td>
                  <td className="mono">{a.assetNo}</td>
                  <td><span className={`atbl-state s-${a.regStatus}`}>{a.state}</span></td>
                  <td className="mono">{a.saleDate}</td>
                  <td>{a.use}</td>
                  <td className="atbl-plate mono">{a.plate}</td>
                  <td>{a.modelKo}</td>
                  <td className="atbl-dim">{a.submodelKo}</td>
                  <td className="ta-r mono">{num(a.consumer)}</td>
                  <td className="ta-r mono">{num(a.purchase)}</td>
                  <td className="ta-r mono">{num(a.prep)}</td>
                  <td className="ta-r mono">{num(a.delivery)}</td>
                  <td>{a.colorKo}</td>
                  <td>{a.fuelKo}</td>
                  <td className="ta-r mono">{num(a.cc)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>}

      {editId && (() => {
        const a = assets.find((x) => x.id === editId);
        if (!a) return null;
        return <AssetEditModal asset={a} onClose={() => setEditId(null)}
          onSave={(next) => { setAssets((cur) => cur.map((x) => x.id === editId ? { ...x, ...next } : x)); setEditId(null); onToast && onToast("toast.asset_saved"); }} />;
      })()}
    </div>
  );
}

// normalize a form/bulk-created vehicle into an admin asset row
function normalizeNew(a, idx) {
  const tv = window.trVehicle(a, "ko");
  const start = a.start || a.current || 0;
  return {
    ...a,
    branch: a.branch || "본점",
    assetNo: a.assetNo && a.assetNo.startsWith("AT") ? a.assetNo : "AT2607" + String(90 + idx).padStart(5, "0"),
    state: a.state || "대기중",
    saleDate: a.saleDate || "",
    use: a.use || "장기대여용",
    plate: a.plate || "신규" + (idx + 1),
    modelKo: a.modelKo || tv.model,
    submodelKo: a.submodelKo || a.trim || "-",
    consumer: a.consumer || start,
    purchase: a.purchase || start,
    prep: a.prep || 0,
    delivery: a.delivery || 0,
    colorKo: a.colorKo || a.color,
    fuelKo: a.fuelKo || FUEL_KO[a.fuel] || a.fuel,
    cc: a.cc || 1998,
    regStatus: "ready",
  };
}

Object.assign(window, { RegisterPage, VehicleAssetPage });