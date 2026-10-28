import type { CSSProperties, ReactNode } from "react";

const SITE = {
  page: "#f4f3ef",
  white: "#ffffff",
  ink: "#1c1d1b",
  muted: "#6b6d68",
  faint: "#9a9c96",
  line: "#e7e5df",
  field: "#d9d7d0",
};

const font: CSSProperties = {
  fontFamily: "Inter, system-ui, sans-serif",
  letterSpacing: "-0.01em",
};

function Pick({
  selector,
  style,
  children,
}: {
  selector: string;
  style: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <span data-pick={selector} style={style}>
      {children}
    </span>
  );
}

export function SampleSite({ email }: { email?: string }) {
  return (
    <div
      style={{
        ...font,
        height: "100%",
        background: SITE.page,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: 52,
          flexShrink: 0,
          padding: "0 28px",
          display: "flex",
          alignItems: "center",
          gap: 22,
          background: SITE.white,
          borderBottom: `1px solid ${SITE.line}`,
        }}
      >
        <Pick
          selector="a.logo"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
            fontWeight: 600,
            color: SITE.ink,
          }}
        >
          <span style={{ width: 20, height: 20, borderRadius: 6, background: SITE.ink }} />
          hub
        </Pick>
        {["Product", "Pricing", "Docs"].map((item) => (
          <Pick
            key={item}
            selector={`a.nav-${item.toLowerCase()}`}
            style={{ fontSize: 13, color: SITE.muted }}
          >
            {item}
          </Pick>
        ))}
      </div>
      <div style={{ flex: 1, display: "flex", justifyContent: "center", paddingTop: 70 }}>
        <div
          style={{
            width: 360,
            height: "fit-content",
            boxSizing: "border-box",
            padding: 28,
            borderRadius: 12,
            background: SITE.white,
            boxShadow: `0 0 0 1px ${SITE.line}`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Pick selector="h1.title" style={{ fontSize: 20, fontWeight: 600, color: SITE.ink }}>
            Sign in to hub
          </Pick>
          <span style={{ marginTop: 4, fontSize: 13, color: SITE.muted }}>Welcome back</span>
          <span style={{ marginTop: 22, fontSize: 12, fontWeight: 500, color: SITE.ink }}>
            Email
          </span>
          <Pick
            selector="input#email"
            style={{
              height: 38,
              marginTop: 6,
              boxSizing: "border-box",
              padding: "0 12px",
              borderRadius: 8,
              boxShadow: `inset 0 0 0 1px ${SITE.field}`,
              display: "flex",
              alignItems: "center",
              fontSize: 13,
              color: email ? SITE.ink : SITE.faint,
            }}
          >
            {email ?? "name@company.com"}
          </Pick>
          <Pick
            selector="button.continue"
            style={{
              height: 38,
              marginTop: 12,
              borderRadius: 8,
              background: SITE.ink,
              color: SITE.white,
              fontSize: 13,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Continue
          </Pick>
          <span
            style={{
              height: 14,
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 11,
              color: SITE.faint,
            }}
          >
            <span style={{ flex: 1, height: 1, background: SITE.line }} />
            or
            <span style={{ flex: 1, height: 1, background: SITE.line }} />
          </span>
          <Pick
            selector="button.oauth-google"
            style={{
              height: 38,
              marginTop: 16,
              borderRadius: 8,
              boxShadow: `inset 0 0 0 1px ${SITE.field}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontSize: 13,
              color: SITE.ink,
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 99,
                boxShadow: `inset 0 0 0 2px ${SITE.muted}`,
              }}
            />
            Sign in with Google
          </Pick>
          <span style={{ marginTop: 14, fontSize: 11, color: SITE.faint, textAlign: "center" }}>
            You’ll land on /billing after signing in
          </span>
        </div>
      </div>
    </div>
  );
}
