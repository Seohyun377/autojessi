// components.jsx — shared UI primitives (icons, countdown, placeholders, badges)

// ── global ticking clock (1s) ────────────────────────────────────────────────
function useNow(intervalMs = 1000) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

// ── icons (simple stroke paths) ──────────────────────────────────────────────
const Icon = ({ d, size = 16, fill = "none", stroke = "currentColor", sw = 1.6, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
    <path d={d} />
  </svg>
);
const Icons = {
  clock: (p) => <Icon {...p} d="M12 7v5l3 2 M12 21a9 9 0 100-18 9 9 0 000 18z" />,
  heart: (p) => <Icon {...p} d="M12 20s-7-4.5-9.5-9C1 8 2.5 4.5 6 4.5c2 0 3.2 1.2 4 2.4.8-1.2 2-2.4 4-2.4 3.5 0 5 3.5 3.5 6.5C19 15.5 12 20 12 20z" />,
  gavel: (p) => <Icon {...p} d="M14 4l6 6 M12.5 5.5l3 3 M3 21h8 M9 11l4 4 M5.5 14.5l4 4" />,
  bolt: (p) => <Icon {...p} d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />,
  chevron: (p) => <Icon {...p} d="M9 6l6 6-6 6" />,
  chevronL: (p) => <Icon {...p} d="M15 6l-6 6 6 6" />,
  search: (p) => <Icon {...p} d="M11 19a8 8 0 100-16 8 8 0 000 16z M21 21l-4.3-4.3" />,
  check: (p) => <Icon {...p} d="M5 12l5 5 9-11" />,
  user: (p) => <Icon {...p} d="M12 12a4 4 0 100-8 4 4 0 000 8z M4 21a8 8 0 0116 0" />,
  globe: (p) => <Icon {...p} d="M12 21a9 9 0 100-18 9 9 0 000 18z M3 12h18 M12 3c2.6 2.7 2.6 15.3 0 18 M12 3c-2.6 2.7-2.6 15.3 0 18" />,
  sort: (p) => <Icon {...p} d="M7 4v15 M4 8l3-4 3 4 M17 20V5 M14 16l3 4 3-4" />,
  expand: (p) => <Icon {...p} d="M4 9V4h5 M20 9V4h-5 M4 15v5h5 M20 15v5h-5" />,
  doc: (p) => <Icon {...p} d="M7 3h7l5 5v13a0 0 0 01 0 0H7a0 0 0 010 0V3z M14 3v5h5 M9 14h6 M9 17h6" />,
  arrowDown: (p) => <Icon {...p} d="M12 4v14 M6 12l6 6 6-6" />,
  swap: (p) => <Icon {...p} d="M7 4l-3 3 3 3 M4 7h13 M17 20l3-3-3-3 M20 17H7" />,
  shield: (p) => <Icon {...p} d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z M9 12l2 2 4-4" />,
  pin: (p) => <Icon {...p} d="M12 21s-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11z M12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />,
  x: (p) => <Icon {...p} d="M6 6l12 12 M18 6L6 18" />,
  flame: (p) => <Icon {...p} d="M12 3c2 3 5 4.5 5 9a5 5 0 11-10 0c0-2 1-3 1.5-4 .5 1 1.5 1.5 2.5 1.5 0-2.5-1-4.5 1-7.5z" />,
  filter: (p) => <Icon {...p} d="M3 5h18 M6 12h12 M10 19h4" />,
  menu: (p) => <Icon {...p} d="M4 7h16 M4 12h16 M4 17h16" />,
  play: (p) => <Icon {...p} d="M8 5v14l11-7z" />,
  refresh: (p) => <Icon {...p} d="M20 11a8 8 0 10-1.5 5 M20 4v6h-6" />,
  info: (p) => <Icon {...p} d="M12 21a9 9 0 100-18 9 9 0 000 18z M12 11v5 M12 8h.01" />,
  eye: (p) => <Icon {...p} d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z M12 15a3 3 0 100-6 3 3 0 000 6z" />,
  search: (p) => <Icon {...p} d="M11 4a7 7 0 100 14 7 7 0 000-14z M20 20l-3.5-3.5" />,
  rows: (p) => <Icon {...p} d="M3 5h18 M3 12h18 M3 19h18" />,
  grid: (p) => <Icon {...p} d="M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z" />,
};

// ── striped image placeholder ────────────────────────────────────────────────
function VehicleImage({ seed = 0, label = "차량 사진", index, aspect = "16 / 10", main = false, radius = 0, img }) {
  if (img) {
    const src = (window.__resources && window.__resources[img]) || img;
    return (
      <div className="ph ph-photo" style={{ aspectRatio: aspect, borderRadius: radius, background: "transparent" }}>
        <img src={src} alt={label || ""} loading="lazy"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
        {index != null && <span className="ph-idx mono ph-idx-over">{index}</span>}
      </div>
    );
  }
  const hue = (seed * 47 + 210) % 360;
  const a = main ? 0.06 : 0.05;
  return (
    <div className="ph" style={{
      aspectRatio: aspect, borderRadius: radius,
      background:
        `repeating-linear-gradient(135deg, oklch(0.5 0.04 ${hue} / ${a}) 0 1px, transparent 1px 11px), ` +
        `linear-gradient(160deg, oklch(0.93 0.012 ${hue}), oklch(0.88 0.02 ${hue}))`,
    }}>
      <div className="ph-tag">
        <span className="mono">{label}</span>
        {index != null && <span className="ph-idx mono">{index}</span>}
      </div>
    </div>
  );
}

// ── drag-and-drop car photo slot (dummy until the user drops a real photo) ──
function VehicleSlot({ slotId, label = "차량 사진", index, aspect = "16 / 10", radius = 0, seed = 0, img }) {
  if (img) {
    const src = (window.__resources && window.__resources[img]) || img;
    return (
      <div className="ph ph-photo" style={{ aspectRatio: aspect, borderRadius: radius, background: "transparent" }}>
        <img src={src} alt={label || ""} loading="lazy"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
        {index != null && <span className="ph-idx mono ph-idx-over">{index}</span>}
      </div>
    );
  }
  const hue = (seed * 47 + 210) % 360;
  return (
    <div className="ph ph-slot" style={{
      aspectRatio: aspect, borderRadius: radius,
      background:
        `repeating-linear-gradient(135deg, oklch(0.5 0.04 ${hue} / 0.05) 0 1px, transparent 1px 11px), ` +
        `linear-gradient(160deg, oklch(0.93 0.012 ${hue}), oklch(0.88 0.02 ${hue}))`,
    }}>
      <image-slot
        id={"veh-" + slotId}
        shape={radius ? "rounded" : "rect"}
        radius={String(radius)}
        placeholder={label}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}>
      </image-slot>
      {index != null && <span className="ph-idx mono ph-idx-over">{index}</span>}
    </div>
  );
}

// ── status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, size = "sm" }) {
  const { t } = window.useLang();
  const map = {
    live: { k: "status.live", cls: "b-live" },
    soon: { k: "status.soon", cls: "b-soon" },
    ended: { k: "status.ended", cls: "b-ended" },
  };
  const m = map[status] || map.live;
  return (
    <span className={`badge ${m.cls} ${size === "lg" ? "badge-lg" : ""}`}>
      {status === "live" && <i className="dot" />}
      {status === "soon" && <Icons.flame size={size === "lg" ? 14 : 11} />}
      {t(m.k)}
    </span>
  );
}

// ── countdown ────────────────────────────────────────────────────────────────
function splitRemain(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
const p2 = (n) => String(n).padStart(2, "0");

// compact inline countdown for cards
function CountdownInline({ endsAt, now }) {
  const { t } = window.useLang();
  const rem = endsAt - now;
  if (rem <= 0) return <span className="cd-end mono">{t("cd.ended")}</span>;
  const { d, h, m, s } = splitRemain(rem);
  const urgent = rem <= 3600 * 1000;
  let txt;
  if (d > 0) txt = `${d}${t("cd.day")} ${p2(h)}:${p2(m)}`;
  else txt = `${p2(h)}:${p2(m)}:${p2(s)}`;
  return (
    <span className={`cd-inline mono ${urgent ? "cd-urgent" : ""}`}>
      <Icons.clock size={13} />{txt}
    </span>
  );
}

// big segmented countdown for the detail page
function CountdownBig({ endsAt, now }) {
  const { t } = window.useLang();
  const rem = endsAt - now;
  const { d, h, m, s } = splitRemain(rem);
  const urgent = rem > 0 && rem <= 3600 * 1000;
  const ended = rem <= 0;
  const cells = [[t("unit.d"), d], [t("unit.h"), h], [t("unit.m"), m], [t("unit.s"), s]];
  return (
    <div className={`cd-big ${urgent ? "cd-big-urgent" : ""} ${ended ? "cd-big-ended" : ""}`}>
      {cells.map(([lbl, val], i) => (
        <React.Fragment key={lbl}>
          {i > 0 && <span className="cd-sep mono">:</span>}
          <div className="cd-cell">
            <span className="cd-num mono">{p2(val)}</span>
            <span className="cd-unit">{lbl}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// inspection grade pill
function GradePill({ grade }) {
  const g = String(grade);
  const cls = g.startsWith("A") ? "g-a" : g.startsWith("B") ? "g-b" : g.startsWith("C") ? "g-c" : "g-n";
  return <span className={`grade ${cls}`}>{grade}</span>;
}

Object.assign(window, {
  useNow, Icons, Icon, VehicleImage, VehicleSlot, StatusBadge,
  CountdownInline, CountdownBig, GradePill, splitRemain, p2,
});
