import Link from "next/link";

type PageKind = "platform" | "projects" | "about" | "demo";

type PageContent = {
  eyebrow: string;
  title: string;
  summary: string;
  items: { title: string; body: string }[];
};

const content: Record<PageKind, PageContent> = {
  platform: {
    eyebrow: "The Apex platform",
    title: "Clarity for every stage of development.",
    summary:
      "Apex Developments brings planning, delivery, financial control, and field coordination into one dependable workspace.",
    items: [
      { title: "Portfolio oversight", body: "See risk, progress, and milestones across every active development." },
      { title: "Cost control", body: "Track approved budgets, committed costs, and forecasts in real time." },
      { title: "Field coordination", body: "Keep teams, tasks, inspections, and daily work aligned." },
    ],
  },
  projects: {
    eyebrow: "Selected developments",
    title: "Places with purpose, built to last.",
    summary:
      "Our portfolio spans residential, commercial, and infrastructure projects designed around lasting value and better communities.",
    items: [
      { title: "Westfield Tower A", body: "A high-rise residential community advancing through its structural phase." },
      { title: "Harbor Bridge Renewal", body: "A resilient infrastructure upgrade reconnecting a growing waterfront district." },
      { title: "Greenfield Logistics Hub", body: "A future-ready industrial campus built for efficient regional distribution." },
    ],
  },
  about: {
    eyebrow: "About Apex",
    title: "Development with a higher standard.",
    summary:
      "Apex Developments pairs rigorous project execution with thoughtful design to create spaces that perform for generations.",
    items: [
      { title: "Our approach", body: "We combine local insight, disciplined delivery, and clear communication from first concept to handover." },
      { title: "Our people", body: "Our teams bring development, construction, commercial, and operational expertise." },
      { title: "Our commitment", body: "We build enduring value for clients, communities, and the people who use our places every day." },
    ],
  },
  demo: {
    eyebrow: "Product walkthrough",
    title: "See Apex in action.",
    summary:
      "Explore how a connected view of projects, costs, crews, and delivery milestones helps your team make better decisions every day.",
    items: [
      { title: "1. See the full picture", body: "Start with a live portfolio view to identify what needs attention." },
      { title: "2. Coordinate the work", body: "Use projects, tasks, and schedules to keep every delivery team aligned." },
      { title: "3. Act with confidence", body: "Use timely budget and progress signals to resolve issues before they grow." },
    ],
  },
};

const styles = {
  page: { minHeight: "100vh", background: "#0F1115", color: "#E4E5E7", fontFamily: "Work Sans, sans-serif" } as React.CSSProperties,
  header: { padding: "22px 48px", borderBottom: "1px solid #3F434C", display: "flex", justifyContent: "space-between", alignItems: "center" } as React.CSSProperties,
  brand: { color: "#E4E5E7", fontFamily: "Roboto Slab, serif", fontWeight: 700, textDecoration: "none" } as React.CSSProperties,
  nav: { display: "flex", gap: 24 } as React.CSSProperties,
  navLink: { color: "rgba(228,229,231,0.65)", fontSize: 13, textDecoration: "none" } as React.CSSProperties,
  container: { maxWidth: 1120, margin: "0 auto", padding: "112px 48px 80px" } as React.CSSProperties,
  eyebrow: { color: "#C9A15A", fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase" } as React.CSSProperties,
  title: { maxWidth: 760, margin: "20px 0", fontFamily: "Roboto Slab, serif", fontSize: 52, lineHeight: 1.08, letterSpacing: "-.03em" } as React.CSSProperties,
  summary: { maxWidth: 650, color: "rgba(228,229,231,.65)", fontSize: 18, lineHeight: 1.7 } as React.CSSProperties,
  grid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 18, marginTop: 64 } as React.CSSProperties,
  card: { background: "#16181D", border: "1px solid #3F434C", borderRadius: 12, padding: 28 } as React.CSSProperties,
  accent: { width: 28, height: 3, background: "#C9A15A", marginBottom: 24 } as React.CSSProperties,
  cardTitle: { fontFamily: "Roboto Slab, serif", fontSize: 21 } as React.CSSProperties,
  cardBody: { color: "rgba(228,229,231,.6)", lineHeight: 1.7 } as React.CSSProperties,
  demoButton: { display: "inline-block", marginTop: 48, background: "#C9A15A", borderRadius: 6, color: "#0F1115", fontWeight: 700, padding: "13px 24px", textDecoration: "none" } as React.CSSProperties,
};

const NAV: [string, string][] = [["Platform", "/platform"], ["Projects", "/projects"], ["About", "/about"]];

function Nav() {
  return (
    <nav style={styles.nav}>
      {NAV.map(([label, href]) => (
        <Link key={href} href={href} style={styles.navLink}>
          {label}
        </Link>
      ))}
    </nav>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <article style={styles.card}>
      <div style={styles.accent} />
      <h2 style={styles.cardTitle}>{title}</h2>
      <p style={styles.cardBody}>{body}</p>
    </article>
  );
}

export default function MarketingPage({ kind }: { kind: PageKind }) {
  const page = content[kind];
  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <Link href="/" style={styles.brand}>
          Apex <span style={{ color: "#C9A15A" }}>Developments</span>
        </Link>
        <Nav />
      </header>

      <section style={styles.container}>
        <p style={styles.eyebrow}>{page.eyebrow}</p>
        <h1 style={styles.title}>{page.title}</h1>
        <p style={styles.summary}>{page.summary}</p>

        <div style={styles.grid}>
          {page.items.map((it) => (
            <Card key={it.title} title={it.title} body={it.body} />
          ))}
        </div>

        {kind === "demo" && (
          <Link href="/" style={styles.demoButton}>
            Open Dashboard
          </Link>
        )}
      </section>
    </main>
  );
}
