// auth.jsx — login / member-type / individual & corporate signup (modals) + corporate approval admin page

const APPS_KEY = "kcea_corpapps";

function loadApps() {
  try {
    const v = JSON.parse(localStorage.getItem(APPS_KEY));
    if (Array.isArray(v) && v.length) return v;
  } catch {}
  return [
    { id: "CA-2607-004", company: "메가렌터카 주식회사", biz: "214-88-01923", contact: "김도현", phone: "+82 10-3312-8890", email: "dhkim@megarent.co.kr", country: "KR", cur: "KRW", file: "megarent_사업자등록증.pdf", at: "2026-07-29 10:12", status: "pending" },
    { id: "CA-2607-003", company: "Almaty Auto Trade LLP", biz: "KZ-2210-99341", contact: "Aisulu Karim", phone: "+7 701 220 7788", email: "aisulu@almatyauto.kz", country: "KZ", cur: "USD", file: "AAT_business_license.pdf", at: "2026-07-28 16:40", status: "pending" },
    { id: "CA-2607-002", company: "Gulf Motors FZE", biz: "AE-7781-2290", contact: "Omar Haddad", phone: "+971 50 447 1120", email: "omar@gulfmotors.ae", country: "AE", cur: "AED", file: "gulfmotors_trade_license.pdf", at: "2026-07-24 09:05", status: "approved" },
    { id: "CA-2607-001", company: "한빛모빌리티", biz: "132-81-77410", contact: "정유진", phone: "+82 10-8871-2043", email: "yj.jung@hanbit.kr", country: "KR", cur: "KRW", file: "hanbit_사업자등록증.jpg", at: "2026-07-21 14:22", status: "rejected", memo: "제출 서류 만료 (2025-12 기준)" },
  ];
}
function saveApps(list) { try { localStorage.setItem(APPS_KEY, JSON.stringify(list)); } catch {} }

const COUNTRIES = ["AE", "RU", "KZ", "KR", "US"];
const CURS = [["USD", "USD $"], ["EUR", "EUR €"], ["VND", "VND ₫"], ["AED", "AED"], ["KRW", "KRW ₩"]];

function GLogo() {
  return (
    <svg className="g-logo" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.3h5.9c-.3 1.4-1 2.5-2.2 3.3v2.8h3.6c2.1-1.9 3.2-4.8 3.2-8.2z" /><path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.6-2.8c-1 .7-2.3 1.1-3.6 1.1-2.8 0-5.1-1.9-6-4.4H2.3v2.9C4.1 20.6 7.8 23 12 23z" /><path fill="#FBBC05" d="M6 14.3c-.2-.7-.4-1.4-.4-2.3s.1-1.6.4-2.3V6.8H2.3C1.5 8.4 1 10.1 1 12s.5 3.6 1.3 5.2L6 14.3z" /><path fill="#EA4335" d="M12 5.4c1.6 0 3 .5 4.1 1.6l3.1-3.1C17.4 2.1 14.9 1 12 1 7.8 1 4.1 3.4 2.3 6.8L6 9.7c.9-2.6 3.2-4.4 6-4.4z" /></svg>);
}

// ── fake Google account-chooser popup ───────────────────────────────────────
function GooglePopup({ onPick, onClose }) {
  const { t } = window.useLang();
  const accounts = [
    { n: "손태현", e: "shtjgus0724@gmail.com", i: "손" },
    { n: "Buyer Account", e: "buyer.export@gmail.com", i: "B" },
  ];
  return (
    <div className="gpop-overlay" onClick={onClose}>
      <div className="gpop" onClick={(e) => e.stopPropagation()}>
        <div className="gpop-head">
          <GLogo />
          <button className="modal-x-btn" onClick={onClose}><window.Icons.x size={15} /></button>
        </div>
        <div className="gpop-title">{t("auth.g_title")}</div>
        <div className="gpop-sub">{t("auth.g_sub")}</div>
        <div className="gpop-list">
          {accounts.map((a) => (
            <button key={a.e} className="gpop-acct" onClick={() => onPick(a)}>
              <span className="gpop-av">{a.i}</span>
              <span className="gpop-info"><span className="gpop-n">{a.n}</span><span className="gpop-e">{a.e}</span></span>
            </button>
          ))}
        </div>
        <div className="gpop-foot">{t("auth.g_foot")}</div>
      </div>
    </div>);
}

function Terms({ v, set }) {
  const { t } = window.useLang();
  const all = v.tos && v.privacy && v.mkt;
  const toggleAll = () => set({ tos: !all, privacy: !all, mkt: !all });
  const Row = ({ k, label, req }) => (
    <label className="auth-chk">
      <input type="checkbox" checked={!!v[k]} onChange={() => set({ ...v, [k]: !v[k] })} />
      <span className="auth-chk-tx">{label}</span>
      <span className={`auth-chk-tag ${req ? "req" : ""}`}>{req ? t("auth.required") : t("auth.optional")}</span>
    </label>);
  return (
    <div className="auth-terms">
      <label className="auth-chk auth-chk-all">
        <input type="checkbox" checked={all} onChange={toggleAll} />
        <span className="auth-chk-tx">{t("auth.agree_all")}</span>
      </label>
      <div className="auth-terms-sep" />
      <Row k="tos" label={t("auth.tos")} req />
      <Row k="privacy" label={t("auth.privacy")} req />
      <Row k="mkt" label={t("auth.mkt")} />
    </div>);
}

function LocaleFields({ setCurrency }) {
  const { t } = window.useLang();
  return (
    <div className="field-row">
      <div className="field"><label>{t("login.country")}</label>
        <select defaultValue="AE">{COUNTRIES.map((c) => <option key={c} value={c}>{t("country." + c)}</option>)}</select>
      </div>
      <div className="field"><label>{t("login.cur")}</label>
        <select defaultValue="USD" onChange={(e) => setCurrency && setCurrency(e.target.value)}>
          {CURS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
    </div>);
}

// ── auth modal ──────────────────────────────────────────────────────────────
function AuthModal({ onClose, onAuth, setCurrency, onToast }) {
  const { t } = window.useLang();
  const [step, setStep] = React.useState("login");
  const [gpop, setGpop] = React.useState(false);
  const [terms, setTerms] = React.useState({ tos: false, privacy: false, mkt: false });
  const [file, setFile] = React.useState("");
  const [code, setCode] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [biz, setBiz] = React.useState("");
  const fileRef = React.useRef(null);
  const okTerms = terms.tos && terms.privacy;

  const bizFmt = (s) => {
    const d = s.replace(/[^0-9]/g, "").slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 5) return d.slice(0, 3) + "-" + d.slice(3);
    return d.slice(0, 3) + "-" + d.slice(3, 5) + "-" + d.slice(5);
  };

  const submitCorp = (e) => {
    e.preventDefault();
    const form = e.target;
    const list = loadApps();
    const n = String(list.length + 1).padStart(3, "0");
    list.unshift({
      id: "CA-2607-" + n,
      company: form.company.value || "-",
      biz: biz || "-",
      contact: form.contact.value || "-",
      phone: form.phone.value || "-",
      email: form.email.value || "-",
      country: form.country.value,
      cur: form.cur.value,
      file: file || "-",
      at: new Date().toISOString().slice(0, 16).replace("T", " "),
      status: "pending",
    });
    saveApps(list);
    setStep("corp_done");
  };

  const wide = step === "type" || step === "corp";
  const heads = {
    login: [t("login.signin"), t("login.sub_in")],
    type: [t("auth.type_title"), t("auth.type_sub")],
    ind: [t("auth.ind_title"), t("auth.ind_sub")],
    verify: [t("auth.vf_title"), t("auth.vf_sub")],
    corp: [t("auth.corp_title"), t("auth.corp_sub")],
    corp_done: [t("auth.done_title"), t("auth.done_sub")],
  };
  const back = { type: "login", ind: "type", corp: "type", verify: "ind" }[step];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal auth-modal ${wide ? "wide" : ""}`} onClick={(e) => e.stopPropagation()} style={{ position: "relative" }}>
        <div className="modal-head">
          <div>
            {back && <button className="auth-back" onClick={() => setStep(back)}><window.Icons.chevronL size={14} />{t("auth.back")}</button>}
            <h2>{heads[step][0]}</h2>
            <p className="modal-sub">{heads[step][1]}</p>
          </div>
          <button className="modal-x-btn" onClick={onClose}><window.Icons.x size={16} /></button>
        </div>

        <div className="auth-body">
        {step === "login" && <>
          <form onSubmit={(e) => { e.preventDefault(); onAuth(); }}>
            <div className="field"><label>{t("login.email")}</label><input type="email" placeholder="buyer@example.com" required /></div>
            <div className="field"><label>{t("login.pw")}</label><input type="password" placeholder="••••••••" required /></div>
            <button className="btn-primary" type="submit">{t("login.submit_in")}</button>
          </form>
          <div className="modal-divider">{t("login.or")}</div>
          <button className="btn-google" onClick={() => setGpop(true)}><GLogo />{t("login.google")}</button>
          <div className="modal-foot">{t("login.foot_in_q")} <button onClick={() => setStep("type")}>{t("login.tab_up")}</button></div>
        </>}

        {step === "type" && <>
          <div className="auth-types">
            <button className="auth-type" onClick={() => setStep("ind")}>
              <span className="auth-type-ic"><window.Icons.user size={22} /></span>
              <span className="auth-type-n">{t("auth.type_ind")}</span>
              <span className="auth-type-d">{t("auth.type_ind_d")}</span>
              <span className="auth-type-go"><window.Icons.chevron size={15} /></span>
            </button>
            <button className="auth-type" onClick={() => setStep("corp")}>
              <span className="auth-type-ic"><window.Icons.doc size={22} /></span>
              <span className="auth-type-n">{t("auth.type_corp")}</span>
              <span className="auth-type-d">{t("auth.type_corp_d")}</span>
              <span className="auth-type-go"><window.Icons.chevron size={15} /></span>
            </button>
          </div>
          <div className="auth-note"><window.Icons.info size={14} />{t("auth.type_note")}</div>
          <div className="modal-foot">{t("login.foot_up_q")} <button onClick={() => setStep("login")}>{t("login.tab_in")}</button></div>
        </>}

        {step === "ind" && <>
          <form onSubmit={(e) => { e.preventDefault(); setStep("verify"); }}>
            <div className="field"><label>{t("login.name")}</label><input placeholder={t("auth.ph_name")} required /></div>
            <div className="field"><label>{t("login.email")}</label>
              <input type="email" placeholder="buyer@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div className="field"><label>{t("login.pw")}</label><input type="password" placeholder="••••••••" required /></div>
            <LocaleFields setCurrency={setCurrency} />
            <Terms v={terms} set={setTerms} />
            <button className="btn-primary" type="submit" disabled={!okTerms}>{t("login.submit_up")}</button>
          </form>
          <div className="modal-divider">{t("login.or")}</div>
          <button className="btn-google" onClick={() => setGpop(true)}><GLogo />{t("auth.g_signup")}</button>
        </>}

        {step === "verify" && <>
          <div className="auth-vf-to">{email || "buyer@example.com"}</div>
          <form onSubmit={(e) => { e.preventDefault(); onAuth(); }}>
            <div className="field"><label>{t("auth.vf_code")}</label>
              <input className="auth-code mono" inputMode="numeric" maxLength={6} placeholder="000000"
                     value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))} required /></div>
            <button className="btn-primary" type="submit" disabled={code.length < 6}>{t("auth.vf_submit")}</button>
          </form>
          <div className="modal-foot">{t("auth.vf_nomail")} <button onClick={() => onToast && onToast("auth.vf_resent")}>{t("auth.vf_resend")}</button></div>
        </>}

        {step === "corp" && <>
          <form onSubmit={submitCorp}>
            <div className="field-row">
              <div className="field"><label>{t("auth.company")}</label><input name="company" placeholder={t("auth.ph_company")} required /></div>
              <div className="field"><label>{t("auth.bizno")}</label>
                <input name="biz" className="mono" inputMode="numeric" placeholder="000-00-00000"
                       value={biz} onChange={(e) => setBiz(bizFmt(e.target.value))} required /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>{t("auth.mgr")}</label><input name="contact" placeholder={t("auth.ph_name")} required /></div>
              <div className="field"><label>{t("auth.mgr_tel")}</label><input name="phone" placeholder="+82 10-0000-0000" required /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>{t("login.email")}</label><input name="email" type="email" placeholder="manager@company.com" required /></div>
              <div className="field"><label>{t("login.pw")}</label><input type="password" placeholder="••••••••" required /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>{t("login.country")}</label>
                <select name="country" defaultValue="KR">{COUNTRIES.map((c) => <option key={c} value={c}>{t("country." + c)}</option>)}</select>
              </div>
              <div className="field"><label>{t("login.cur")}</label>
                <select name="cur" defaultValue="KRW" onChange={(e) => setCurrency && setCurrency(e.target.value)}>
                  {CURS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="field">
              <label>{t("auth.license")}</label>
              <div className="auth-file">
                <input readOnly value={file} placeholder={t("auth.license_ph")} />
                <button type="button" className="auth-file-btn" onClick={() => fileRef.current && fileRef.current.click()}>{t("auth.pick_file")}</button>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }}
                       onChange={(e) => setFile(e.target.files && e.target.files[0] ? e.target.files[0].name : "")} />
              </div>
              <div className="auth-hint">{t("auth.license_hint")}</div>
            </div>
            <Terms v={terms} set={setTerms} />
            <button className="btn-primary" type="submit" disabled={!okTerms || !file}>{t("auth.corp_submit")}</button>
          </form>
        </>}

        {step === "corp_done" && <>
          <div className="auth-done">
            <div className="auth-done-ic"><window.Icons.check size={26} /></div>
            <div className="auth-done-tx">{t("auth.done_body")}</div>
            <ul className="auth-done-list">
              <li>{t("auth.done_l1")}</li>
              <li>{t("auth.done_l2")}</li>
              <li>{t("auth.done_l3")}</li>
            </ul>
          </div>
          <button className="btn-primary" onClick={onClose}>{t("auth.done_ok")}</button>
        </>}

        </div>

        {gpop && <GooglePopup onClose={() => setGpop(false)} onPick={() => { setGpop(false); onAuth(); }} />}
      </div>
    </div>);
}

// ── corporate approval admin page ───────────────────────────────────────────
function ApprovalsPage({ onToast }) {
  const { t } = window.useLang();
  const [apps, setApps] = React.useState(loadApps);
  const [tab, setTab] = React.useState("pending");
  const [q, setQ] = React.useState("");
  const [doc, setDoc] = React.useState(null);
  const [reject, setReject] = React.useState(null);
  const [memo, setMemo] = React.useState("");

  React.useEffect(() => saveApps(apps), [apps]);

  const counts = {
    pending: apps.filter((a) => a.status === "pending").length,
    approved: apps.filter((a) => a.status === "approved").length,
    rejected: apps.filter((a) => a.status === "rejected").length,
    all: apps.length,
  };
  const shown = apps.filter((a) => (tab === "all" || a.status === tab) &&
    (!q.trim() || (a.company + a.biz + a.contact + a.email).toLowerCase().includes(q.trim().toLowerCase())));

  const setStatus = (id, status, m) => {
    setApps((l) => l.map((a) => a.id === id ? { ...a, status, memo: m || "" } : a));
    onToast && onToast(status === "approved" ? "auth.tst_ok" : "auth.tst_no");
  };

  return (
    <div className="page reg-page asset-admin">
      <div className="admin-bar">
        <h1 className="admin-title">{t("auth.adm_title")}</h1>
      </div>

      <div className="admin-subbar">
        <div className="apv-tabs">
          {[["pending", "auth.adm_pending"], ["approved", "auth.adm_approved"], ["rejected", "auth.adm_rejected"], ["all", "auth.adm_all"]].map(([k, key]) => (
            <button key={k} className={`apv-tab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>
              {t(key)}<span className="apv-tab-n mono">{counts[k]}</span>
            </button>
          ))}
        </div>
        <div className="afilter-search" style={{ maxWidth: 280 }}>
          <window.Icons.search size={15} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("auth.adm_search")} />
        </div>
      </div>

      <div className="atbl-wrap">
        <table className="atbl">
          <thead>
            <tr>
              <th>{t("auth.adm_c_id")}</th>
              <th>{t("auth.company")}</th>
              <th>{t("auth.bizno")}</th>
              <th>{t("auth.mgr")}</th>
              <th>{t("login.email")}</th>
              <th>{t("login.country")}</th>
              <th>{t("auth.adm_c_at")}</th>
              <th>{t("auth.adm_c_doc")}</th>
              <th>{t("auth.adm_c_state")}</th>
              <th className="ta-r">{t("auth.adm_c_act")}</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ?
              <tr><td colSpan={10} className="atbl-empty">{t("auth.adm_empty")}</td></tr> :
              shown.map((a) => (
                <tr key={a.id}>
                  <td className="mono atbl-dim">{a.id}</td>
                  <td style={{ fontWeight: 700 }}>{a.company}</td>
                  <td className="mono">{a.biz}</td>
                  <td>{a.contact}<span className="apv-phone mono">{a.phone}</span></td>
                  <td className="atbl-dim">{a.email}</td>
                  <td>{t("country." + a.country)}</td>
                  <td className="mono atbl-dim">{a.at}</td>
                  <td><button className="apv-doc" onClick={() => setDoc(a)}><window.Icons.doc size={13} />{t("auth.adm_view")}</button></td>
                  <td><span className={`apv-badge s-${a.status}`}>{t("auth.st_" + a.status)}</span></td>
                  <td className="ta-r">
                    {a.status === "pending" ?
                      <span className="apv-acts">
                        <button className="admin-btn sm" onClick={() => { setReject(a); setMemo(""); }}>{t("auth.adm_reject")}</button>
                        <button className="admin-btn sm primary" onClick={() => setStatus(a.id, "approved")}>{t("auth.adm_approve")}</button>
                      </span> :
                      <span className="apv-memo">{a.memo || "—"}</span>}
                  </td>
                </tr>))}
          </tbody>
        </table>
      </div>

      {doc &&
        <div className="modal-overlay" onClick={() => setDoc(null)}>
          <div className="modal apv-doc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div><h2>{t("auth.adm_doc_title")}</h2><p className="modal-sub">{doc.company} · {doc.biz}</p></div>
              <button className="modal-x-btn" onClick={() => setDoc(null)}><window.Icons.x size={16} /></button>
            </div>
            <div className="apv-doc-view">
              <window.Icons.doc size={30} />
              <div className="apv-doc-name mono">{doc.file}</div>
              <div className="apv-doc-hint">{t("auth.adm_doc_hint")}</div>
            </div>
            <div className="apv-doc-rows">
              <div><span>{t("auth.mgr")}</span><b>{doc.contact}</b></div>
              <div><span>{t("auth.mgr_tel")}</span><b className="mono">{doc.phone}</b></div>
              <div><span>{t("login.email")}</span><b>{doc.email}</b></div>
              <div><span>{t("auth.adm_c_at")}</span><b className="mono">{doc.at}</b></div>
            </div>
            {doc.status === "pending" &&
              <div className="apv-doc-acts">
                <button className="admin-btn" onClick={() => { setReject(doc); setMemo(""); setDoc(null); }}>{t("auth.adm_reject")}</button>
                <button className="admin-btn primary" onClick={() => { setStatus(doc.id, "approved"); setDoc(null); }}>{t("auth.adm_approve")}</button>
              </div>}
          </div>
        </div>}

      {reject &&
        <div className="modal-overlay" onClick={() => setReject(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div><h2>{t("auth.adm_reject")}</h2><p className="modal-sub">{reject.company}</p></div>
              <button className="modal-x-btn" onClick={() => setReject(null)}><window.Icons.x size={16} /></button>
            </div>
            <div className="field"><label>{t("auth.adm_memo")}</label>
              <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder={t("auth.adm_memo_ph")} /></div>
            <div className="apv-doc-acts">
              <button className="admin-btn" onClick={() => setReject(null)}>{t("nl.cancel")}</button>
              <button className="admin-btn primary" onClick={() => { setStatus(reject.id, "rejected", memo); setReject(null); }}>{t("auth.adm_reject_do")}</button>
            </div>
          </div>
        </div>}
    </div>);
}

Object.assign(window, { AuthModal, ApprovalsPage });
