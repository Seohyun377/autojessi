// win.jsx — full escrow settlement lifecycle:
// 0 낙찰(최고가 선정) → 1 계약금 10%·계약확정 → 2 렌터카사 제공 서류
// → 3 잔금 에스크로 입금 → 4 차량 인도·인수증 확인 → 5 렌터카사 송금(정산)

const WF_STEPS = ["wf.e_s1", "wf.e_s2", "wf.e_s3", "wf.e_s4", "wf.e_s5"];

function Stepper({ step }) {
  const { t } = window.useLang();
  return (
    <div className="wf-stepper">
      {WF_STEPS.map((s, i) => (
        <React.Fragment key={s}>
          {i > 0 && <span className={`wf-line ${i <= step ? "done" : ""}`} />}
          <div className={`wf-step ${i === step ? "on" : ""} ${i < step ? "done" : ""}`}>
            <span className="wf-dot">{i < step ? <window.Icons.check size={11} /> : i + 1}</span>
            <span className="wf-step-lbl">{t(s)}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// money-location banner: 바이어 → 에스크로 → 렌터카사
function EscrowBanner({ state }) {
  const { t } = window.useLang();
  const statusKey = { none: "wf.esc_none", deposit: "wf.esc_deposit", full: "wf.esc_full", released: "wf.esc_released" }[state];
  const atEscrow = state === "deposit" || state === "full";
  const atSeller = state === "released";
  return (
    <div className={`esc-banner esc-${state}`}>
      <div className="esc-top">
        <span className="esc-label"><window.Icons.shield size={13} />{t("wf.esc_label")}</span>
        <span className="esc-status">{t(statusKey)}</span>
      </div>
      <div className="esc-flow">
        <div className={`esc-node ${state === "none" ? "active" : ""}`}>
          <window.Icons.user size={15} /><span>{t("wf.esc_buyer")}</span>
        </div>
        <span className={`esc-arrow ${atEscrow || atSeller ? "lit" : ""}`}><window.Icons.chevron size={13} /></span>
        <div className={`esc-node ${atEscrow ? "active" : ""}`}>
          <window.Icons.shield size={15} /><span>{t("wf.esc_escrow")}</span>
        </div>
        <span className={`esc-arrow ${atSeller ? "lit" : ""}`}><window.Icons.chevron size={13} /></span>
        <div className={`esc-node ${atSeller ? "active" : ""}`}>
          <window.Icons.gavel size={15} /><span>{t("wf.esc_seller")}</span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children, error }) {
  return (
    <div className={`field ${error ? "field-err" : ""}`}>
      <label>{label}{required && <i className="req-star">*</i>}</label>
      {children}
    </div>
  );
}

// seller/company-provided document row (download)
function ProvidedDoc({ label, locked, downloaded, onDownload }) {
  const { t } = window.useLang();
  return (
    <div className={`provrow ${locked ? "locked" : ""} ${downloaded ? "got" : ""}`}>
      <span className="prov-ic"><window.Icons.doc size={17} /></span>
      <div className="prov-main">
        <span className="prov-lbl">{label}</span>
        <span className="prov-tag">{t("wf.issued_by")}</span>
      </div>
      {locked ? (
        <span className="prov-lock"><window.Icons.shield size={13} />{t("wf.docs_locked")}</span>
      ) : downloaded ? (
        <button className="prov-btn got" onClick={onDownload}><window.Icons.check size={14} />{t("wf.downloaded")}</button>
      ) : (
        <button className="prov-btn" onClick={onDownload}><window.Icons.arrowDown size={14} />{t("wf.download")}</button>
      )}
    </div>
  );
}

// account block (deposit / escrow)
function AccountBlock({ bank, acctNo, holder, copied, onCopy }) {
  const { t } = window.useLang();
  return (
    <div className="pay-account">
      <div className="pay-acct-head">
        <span className="pay-acct-title">{t("wf.escrow_acct")}</span>
        <button className={`pay-copy ${copied ? "done" : ""}`} onClick={onCopy}>
          {copied ? <><window.Icons.check size={13} />{t("wf.pay_copied")}</> : <><window.Icons.doc size={13} />{t("wf.pay_copy")}</>}
        </button>
      </div>
      <div className="pay-acct-rows">
        <div className="pay-acct-row"><span>{t("wf.pay_bank")}</span><b className="mono">{bank}</b></div>
        <div className="pay-acct-row"><span>{t("wf.pay_acctno")}</span><b className="mono">{acctNo}</b></div>
        <div className="pay-acct-row"><span>{t("wf.pay_holder")}</span><b>{holder}</b></div>
      </div>
    </div>
  );
}

function WinModal({ vehicle, currency, existing, onClose, onComplete }) {
  const { locale, t } = window.useLang();
  const completed = existing && existing.status === "completed";
  const [step, setStep] = React.useState(completed ? 5 : 0);
  const [paid, setPaid] = React.useState(existing?.paid || false);            // deposit
  const [reviewed, setReviewed] = React.useState(existing?.reviewed || false); // seller docs
  const [balancePaid, setBalancePaid] = React.useState(existing?.balancePaid || false);
  const [received, setReceived] = React.useState(existing?.received || completed || false);
  const [copied, setCopied] = React.useState(false);
  const [provided, setProvided] = React.useState(existing?.provided || {});
  const [ship, setShip] = React.useState(existing?.shipping || {
    recipient: "", phone: "", country: "AE", city: "", address: "", incoterm: "CIF",
  });
  const [err, setErr] = React.useState("");

  const tv = window.trVehicle(vehicle, locale);
  const seedNum = vehicle.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const price = vehicle.current;
  const deposit = Math.round(price * 0.1);
  const balance = price - deposit;
  const conv = window.fmtConverted(price, currency);
  const acctSeed = seedNum * 7 % 9000 + 1000;
  const depositAcct = "880-" + acctSeed + "-203847";
  const escrowAcct = "880-" + acctSeed + "-990021";
  const refId = "ESC-" + vehicle.id.slice(0, 3).toUpperCase() + "-" + (acctSeed * 13 % 90000 + 10000);

  const escState = received ? "released" : balancePaid ? "full" : paid ? "deposit" : "none";
  const set = (k, v) => setShip((s) => ({ ...s, [k]: v }));
  const copy = () => { setCopied(true); setTimeout(() => setCopied(false), 1600); };
  const dl = (k) => setProvided((p) => ({ ...p, [k]: true }));
  const validShip = ship.recipient.trim() && ship.phone.trim() && ship.address.trim();

  const sellerDocs = [["reg", "wf.sd_reg"], ["tax", "wf.sd_tax"], ["transfer", "wf.sd_transfer"], ["seal", "wf.sd_seal"]];
  const trackSteps = ["wf.trk_out", "wf.trk_customs", "wf.trk_loaded", "wf.trk_arrived", "wf.trk_delivered"];
  const countries = ["AE", "RU", "KZ", "KR", "US"];

  // progress persistence on each meaningful action
  const persist = (patch) => onComplete(vehicle.id, {
    status: patch.received ? "completed" : "in_progress",
    paid, reviewed, balancePaid, received, provided, shipping: ship, ...patch,
  });

  const goFrom = {
    0: () => { setErr(""); setStep(1); },
    1: () => { if (!paid) { setErr(t("wf.pay_err")); return; } setErr(""); setStep(2); },
    2: () => { if (!reviewed) { setErr(t("wf.doc_err")); return; } setErr(""); setStep(3); },
    3: () => { if (!balancePaid) { setErr(t("wf.balance_err")); return; } if (!validShip) { setErr(t("wf.req_err")); return; } setErr(""); setStep(4); },
    4: () => { if (!received) { setErr(t("wf.receipt_err")); return; } setErr(""); persist({ received: true }); setStep(5); },
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wf-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x-btn wf-x" onClick={onClose}><window.Icons.x size={16} /></button>

        {step >= 1 && step <= 4 && <Stepper step={step - 1} />}
        {step >= 1 && step <= 4 && <EscrowBanner state={escState} />}

        {/* ── step 0: 낙찰 (highest bidder selected) ── */}
        {step === 0 && (
          <div className="wf-celebrate">
            <div className="wf-burst"><window.Icons.gavel size={26} /></div>
            <h2>{t("wf.congrats")}</h2>
            <p className="wf-sub">{t("wf.bidder_won")}</p>
            <div className="wf-car">
              <div className="wf-car-img"><window.VehicleImage seed={seedNum} aspect="16 / 10" label="" radius={10} img={v.img} /></div>
              <div className="wf-car-info">
                <b>{tv.name}</b>
                <span className="mono muted">{vehicle.mileage.toLocaleString("en-US")} km · {tv.fuel} · {tv.region}</span>
              </div>
            </div>
            <div className="wf-pricegrid">
              <div>
                <span className="apanel-lbl">{t("wf.final")}</span>
                <span className="mono wf-price">{window.fmtKRW(price)}</span>
                {conv && <span className="mono wf-price-conv">≈ {conv}</span>}
              </div>
              <div>
                <span className="apanel-lbl">{t("wf.deposit")}</span>
                <span className="mono wf-price">{window.fmtKRW(deposit)}</span>
                {window.fmtConverted(deposit, currency) && <span className="mono wf-price-conv">≈ {window.fmtConverted(deposit, currency)}</span>}
              </div>
            </div>
            <button className="btn-primary" onClick={goFrom[0]}>{t("wf.start")}</button>
            <button className="wf-textbtn" onClick={onClose}>{t("wf.later")}</button>
          </div>
        )}

        {/* ── step 1: 계약금 입금 → 계약 확정 ── */}
        {step === 1 && (
          <div className="wf-form">
            <h2>{t("wf.pay_title")}</h2>
            <p className="wf-sub">{t("wf.pay_sub")}</p>

            <div className="pay-amount">
              <span className="apanel-lbl">{t("wf.pay_amount")}</span>
              <span className="mono pay-amount-v">{window.fmtKRW(deposit)}</span>
              {window.fmtConverted(deposit, currency) && <span className="mono pay-amount-conv">≈ {window.fmtConverted(deposit, currency)}</span>}
            </div>

            <AccountBlock bank="KB국민은행" acctNo={depositAcct} holder={t("wf.pay_holder_v")} copied={copied} onCopy={copy} />

            {/* contract status */}
            <div className={`contract-row ${paid ? "on" : ""}`}>
              <window.Icons.doc size={16} />
              <span className="contract-lbl">{paid ? t("wf.contract_confirmed") : t("wf.contract_pending")}</span>
              {paid ? <span className="contract-badge"><window.Icons.check size={12} />OK</span>
                    : <span className="contract-hint">{t("wf.contract_after")}</span>}
            </div>

            <button className={`pay-mark ${paid ? "done" : ""}`} onClick={() => { setPaid(true); setErr(""); persist({ paid: true }); }}>
              {paid ? <><window.Icons.check size={17} />{t("wf.pay_done")}</> : <><window.Icons.arrowDown size={16} />{t("wf.pay_mark")}</>}
            </button>
            {err && <p className="wf-err">{err}</p>}
            <div className="wf-actions">
              <button className="btn-ghost" onClick={() => setStep(0)}>{t("wf.back")}</button>
              <button className="btn-primary wf-grow" onClick={goFrom[1]}>{t("wf.next")}</button>
            </div>
          </div>
        )}

        {/* ── step 2: 렌터카사 제공 서류 ── */}
        {step === 2 && (
          <div className="wf-form">
            <h2>{t("wf.seller_docs_title")}</h2>
            <p className="wf-sub">{t("wf.seller_docs_sub")}</p>
            <div className="wf-provided">
              {sellerDocs.map(([k, lbl]) => (
                <ProvidedDoc key={k} label={t(lbl)} locked={!paid} downloaded={!!provided[k]} onDownload={() => dl(k)} />
              ))}
            </div>
            <button className={`pay-mark ${reviewed ? "done" : ""}`} onClick={() => { setReviewed(true); setErr(""); persist({ reviewed: true }); }}>
              {reviewed ? <><window.Icons.check size={17} />{t("wf.reviewed")}</> : <><window.Icons.doc size={16} />{t("wf.review_docs")}</>}
            </button>
            {err && <p className="wf-err">{err}</p>}
            <div className="wf-actions">
              <button className="btn-ghost" onClick={() => setStep(1)}>{t("wf.back")}</button>
              <button className="btn-primary wf-grow" onClick={goFrom[2]}>{t("wf.next")}</button>
            </div>
          </div>
        )}

        {/* ── step 3: 잔금 에스크로 입금 + 배송지 ── */}
        {step === 3 && (
          <div className="wf-form">
            <h2>{t("wf.balance_title")}</h2>
            <p className="wf-sub">{t("wf.balance_sub")}</p>

            <div className="bd-breakdown">
              <div className="bd-brow"><span>{t("wf.bd_total")}</span><b className="mono">{window.fmtKRW(price)}</b></div>
              <div className="bd-brow sub"><span>− {t("wf.bd_paid")}</span><b className="mono">{window.fmtKRW(deposit)}</b></div>
              <div className="bd-brow total"><span>{t("wf.bd_balance")}</span><b className="mono">{window.fmtKRW(balance)}</b></div>
            </div>

            <AccountBlock bank="KB국민은행 (에스크로)" acctNo={escrowAcct} holder={t("wf.pay_holder_v")} copied={copied} onCopy={copy} />

            <button className={`pay-mark ${balancePaid ? "done" : ""}`} onClick={() => { setBalancePaid(true); setErr(""); persist({ balancePaid: true }); }}>
              {balancePaid ? <><window.Icons.check size={17} />{t("wf.balance_done")}</> : <><window.Icons.arrowDown size={16} />{t("wf.balance_mark")}</>}
            </button>

            {/* shipping destination */}
            <h3 className="wf-uphead">{t("wf.ship_title")}</h3>
            <div className="wf-fields">
              <div className="field-row">
                <Field label={t("wf.recipient")} required error={err && !ship.recipient.trim()}>
                  <input value={ship.recipient} onChange={(e) => set("recipient", e.target.value)} />
                </Field>
                <Field label={t("wf.phone")} required error={err && !ship.phone.trim()}>
                  <input value={ship.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+971 ..." />
                </Field>
              </div>
              <div className="field-row">
                <Field label={t("wf.country")} required>
                  <select value={ship.country} onChange={(e) => set("country", e.target.value)}>
                    {countries.map((c) => <option key={c} value={c}>{t("country." + c)}</option>)}
                  </select>
                </Field>
                <Field label={t("wf.incoterm")}>
                  <div className="seg">
                    {["FOB", "CIF", "EXW"].map((i) => (
                      <button key={i} className={ship.incoterm === i ? "on" : ""} onClick={() => set("incoterm", i)}>{i}</button>
                    ))}
                  </div>
                </Field>
              </div>
              <Field label={t("wf.address")} required error={err && !ship.address.trim()}>
                <input value={ship.address} onChange={(e) => set("address", e.target.value)} />
              </Field>
            </div>

            {err && <p className="wf-err">{err}</p>}
            <div className="wf-actions">
              <button className="btn-ghost" onClick={() => setStep(2)}>{t("wf.back")}</button>
              <button className="btn-primary wf-grow" onClick={goFrom[3]}>{t("wf.next")}</button>
            </div>
          </div>
        )}

        {/* ── step 4: 차량 인도 · 인수증 확인 ── */}
        {step === 4 && (
          <div className="wf-form">
            <h2>{t("wf.handover_title")}</h2>
            <p className="wf-sub">{t("wf.handover_sub")}</p>

            <div className="trk">
              <span className="wf-tl-head">{t("wf.track_title")}</span>
              <div className="trk-line">
                {trackSteps.map((k, i) => {
                  const done = received || i < trackSteps.length - 1;  // all but final done until receipt
                  const isFinal = i === trackSteps.length - 1;
                  const on = received || !isFinal;
                  return (
                    <React.Fragment key={k}>
                      {i > 0 && <span className={`trk-seg ${on ? "on" : ""}`} />}
                      <div className={`trk-node ${on ? "on" : ""} ${isFinal && received ? "final" : ""}`}>
                        <span className="trk-dot">{on ? <window.Icons.check size={10} /> : i + 1}</span>
                        <span className="trk-lbl">{t(k)}</span>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            <div className={`receipt ${received ? "on" : ""}`}>
              <div className="receipt-head">
                <window.Icons.doc size={16} /><span>{t("wf.receipt_box")}</span>
                {received && <span className="contract-badge"><window.Icons.check size={12} />{t("wf.receipt_done")}</span>}
              </div>
              <p className="receipt-hint">{t("wf.receipt_hint")}</p>
              <button className={`pay-mark ${received ? "done" : ""}`} onClick={() => { setReceived(true); setErr(""); }}>
                {received ? <><window.Icons.check size={17} />{t("wf.receipt_done")}</> : <><window.Icons.shield size={16} />{t("wf.receipt_confirm")}</>}
              </button>
            </div>

            {err && <p className="wf-err">{err}</p>}
            <div className="wf-actions">
              <button className="btn-ghost" onClick={() => setStep(3)}>{t("wf.back")}</button>
              <button className="btn-primary wf-grow" onClick={goFrom[4]}>{t("wf.settle_release")}</button>
            </div>
          </div>
        )}

        {/* ── step 5: 정산 완료 (escrow → seller) ── */}
        {step === 5 && (
          <div className="wf-done">
            <div className="wf-burst good"><window.Icons.check size={28} /></div>
            <h2>{t("wf.settle_title")}</h2>
            <p className="wf-sub">{t("wf.settle_sub")}</p>

            <EscrowBanner state="released" />

            <div className="settle-card">
              <span className="wf-tl-head">{t("wf.settle_flow")}</span>
              <div className="settle-row"><span>{t("wf.settle_deposit")}</span><b className="mono">{window.fmtKRW(deposit)}</b></div>
              <div className="settle-row"><span>{t("wf.settle_balance")}</span><b className="mono">{window.fmtKRW(balance)}</b></div>
              <div className="settle-row total"><span>{t("wf.settle_total")}</span><b className="mono">{window.fmtKRW(price)}</b></div>
              <div className="settle-ref"><span>{t("wf.settle_ref")}</span><b className="mono">{refId}</b></div>
            </div>

            {ship.recipient && (
              <div className="wf-shipto">
                <span className="apanel-lbl">{t("wf.ship_to")}</span>
                <span className="wf-shipto-v">{ship.recipient} · {t("country." + ship.country)}{ship.city ? ", " + ship.city : ""} · {ship.incoterm}</span>
              </div>
            )}
            <button className="btn-primary" onClick={() => onClose(true)}>{t("wf.done_close")}</button>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { WinModal });
