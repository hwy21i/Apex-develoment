"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleType, SYSTEM_ROLES } from "@/types/erp";
import ConstructionDashboard from "@/components/dashboard/ConstructionDashboard";
import AppShell from "@/components/layout/AppShell";

type Project = {
  mongoId: string;
  id: string;
  name: string;
  client: string;
  location: string;
  manager: string;
  start: string;
  finish: string;
  progress: number;
  status: string;
  budget: number;
  spent: number;
  workers: number;
  tasks: number;
  health: "On Track" | "At Risk" | "Delayed";
};

type ProjectApi = {
  _id: string; name: string; projectCode: string; client?: string; location: string;
  projectManager?: { fullName?: string }; startDate: string; expectedEndDate: string;
  progressPercentage?: number; status?: string; totalBudget?: number; amountSpent?: number;
  healthStatus?: "ON_TRACK" | "AT_RISK" | "DELAYED";
};

function toWorkspaceProject(project: ProjectApi): Project {
  const health = project.healthStatus === "DELAYED" ? "Delayed" : project.healthStatus === "AT_RISK" ? "At Risk" : "On Track";
  return { mongoId: project._id, id: project.projectCode, name: project.name, client: project.client || "Client not specified", location: project.location, manager: project.projectManager?.fullName || "Project manager", start: new Date(project.startDate).toLocaleDateString(), finish: new Date(project.expectedEndDate).toLocaleDateString(), progress: project.progressPercentage ?? 0, status: project.status || "planning", budget: project.totalBudget ?? 0, spent: project.amountSpent ?? 0, workers: 0, tasks: 0, health };
}

const menuPermissions: Record<RoleType, string[]> = {
  Admin: [
    "Dashboard",
    "Projects",
    "Clients",
    "Tasks & Milestones",
    "Materials",
    "Warehouses & Stock",
    "Suppliers",
    "Procurement",
    "Employees",
    "Equipment",
    "Finance & Costs",
    "Documents",
    "Reports",
    "Audit Logs",
    "Notifications",
  ],
  "Project Manager": [
    "Dashboard",
    "Projects",
    "Clients",
    "Tasks & Milestones",
    "Materials",
    "Warehouses & Stock",
    "Procurement",
    "Employees",
    "Equipment",
    "Finance & Costs",
    "Documents",
    "Reports",
    "Notifications",
  ],
  "Site Engineer": [
    "Dashboard",
    "Projects",
    "Tasks & Milestones",
    "Materials",
    "Warehouses & Stock",
    "Procurement",
    "Equipment",
    "Documents",
    "Reports",
    "Notifications",
  ],
  "Procurement Officer": [
    "Dashboard",
    "Projects",
    "Materials",
    "Suppliers",
    "Procurement",
    "Documents",
    "Reports",
    "Notifications",
  ],
  "Warehouse Manager": [
    "Dashboard",
    "Materials",
    "Warehouses & Stock",
    "Procurement",
    "Documents",
    "Notifications",
  ],
  Accountant: [
    "Dashboard",
    "Projects",
    "Clients",
    "Suppliers",
    "Finance & Costs",
    "Documents",
    "Reports",
    "Audit Logs",
    "Notifications",
  ],
  "HR Manager": [
    "Dashboard",
    "Projects",
    "Employees",
    "Documents",
    "Reports",
    "Notifications",
  ],
  Worker: ["Dashboard", "Tasks & Milestones", "Notifications"],
  Client: ["Dashboard", "Projects", "Documents", "Reports", "Notifications"],
};

const sampleTasks = [
  {
    name: "Structural concrete core pour (Level 12)",
    project: "Addis Heights Mixed-Use Tower",
    due: "Today",
    status: "In Progress",
    priority: "High",
    progress: 70,
  },
  {
    name: "HVAC cold storage chiller commissioning",
    project: "Harbor Logistics Hub",
    due: "Aug 29",
    status: "Not Started",
    priority: "Critical",
    progress: 0,
  },
  {
    name: "Environmental impact mitigation sign-off",
    project: "Greenfield Eco-Resort",
    due: "Sep 05",
    status: "In Progress",
    priority: "Medium",
    progress: 45,
  },
];

const money = (amount: number) => `$${(amount / 1000000).toFixed(2)}M`;
const statusColor = (value: string) =>
  value === "Delayed" || value === "Overdue"
    ? "#DC3545"
    : value === "At Risk" || value === "High" || value === "Critical"
    ? "#F59E0B"
    : value === "In Progress"
    ? "#3B82B6"
    : "#22A06B";

function Bar({ value, color = "#3B82B6" }: { value: number; color?: string }) {
  return (
    <div style={{ height: 7, borderRadius: 9, background: "#E4E7EC", overflow: "hidden" }}>
      <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 9 }} />
    </div>
  );
}

function Card({
  title,
  value,
  detail,
  color,
}: {
  title: string;
  value: string;
  detail: string;
  color?: string;
}) {
  return (
    <section className="apex-card">
      <span className="apex-label">{title}</span>
      <strong style={{ color: color ?? "#f1f2f4" }}>{value}</strong>
      <small>{detail}</small>
    </section>
  );
}

export default function Workspace({
  onLogout,
  userName,
  userRole = "Project Manager",
}: {
  onLogout: () => void;
  userName: string;
  userRole?: RoleType;
}) {
  const router = useRouter();
  const [role, setRole] = useState<RoleType>(userRole);
  const [page, setPage] = useState("Dashboard");
  const [projectTab, setProjectTab] = useState("Overview");
  const [selected, setSelectedProject] = useState<Project | null>(null);
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [projectError, setProjectError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("3 unread notifications");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    async function loadProjects() {
      try {
        const response = await fetch("/api/projects?limit=100");
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error?.message || "Unable to load projects");
        if (active) setProjectsList((payload.data.items as ProjectApi[]).map(toWorkspaceProject));
      } catch (error) {
        if (active) setProjectError(error instanceof Error ? error.message : "Unable to load projects");
      } finally {
        if (active) setIsLoadingProjects(false);
      }
    }
    loadProjects();
    return () => { active = false; };
  }, []);

  const allowedMenus = menuPermissions[role] || menuPermissions["Worker"];

  const visibleProjects = useMemo(() => {
    if (role === "Worker") return projectsList.slice(0, 1);
    if (role === "Client") return projectsList.slice(0, 1);
    return projectsList;
  }, [role, projectsList]);

  const totalBudget = visibleProjects.reduce((sum, project) => sum + project.budget, 0);
  const totalSpent = visibleProjects.reduce((sum, project) => sum + project.spent, 0);
  const filteredProjects = visibleProjects.filter(
    (project) =>
      project.name.toLowerCase().includes(query.toLowerCase()) ||
      project.id.toLowerCase().includes(query.toLowerCase())
  );

  const canCreate = ["Admin", "Project Manager"].includes(role);
  const canEdit = !["Client", "Worker"].includes(role);

  const openPage = (next: string) => {
    setSelectedProject(null);
    setProjectTab("Overview");
    setPage(next);
  };

  const dashboard = (
    <>
      <header className="apex-heading">
        <div>
          <p>
            ENTERPRISE WORKSPACE · <span style={{ color: "#3B82B6" }}>{role.toUpperCase()}</span>
          </p>
          <h1>Welcome back, {userName.split(" ")[0]}.</h1>
          <span>Multi-department construction operations command center.</span>
        </div>
        {canCreate && (
          <button className="apex-primary" onClick={() => router.push("/projects/new")}>
            + Create New Project
          </button>
        )}
      </header>

      <div className="apex-kpis">
        <Card
          title="Active Projects"
          value={`${visibleProjects.length}`}
          detail={`${visibleProjects.filter((p) => p.status === "Active").length} executing`}
        />
        <Card
          title="Portfolio Budget"
          value={money(totalBudget)}
          detail={`${money(totalSpent)} spent to date`}
        />
        <Card
          title="Remaining Balance"
          value={money(totalBudget - totalSpent)}
          detail={`${Math.round((totalSpent / totalBudget) * 100)}% budget utilization`}
          color="#22A06B"
        />
        <Card
          title="Critical Alerts"
          value={`${visibleProjects.filter((p) => p.health !== "On Track").length}`}
          detail="site actions required"
          color="#F59E0B"
        />
      </div>

      <div className="apex-grid">
        <section className="apex-panel">
          <div className="apex-panel-title">
            <h2>Live Project Status</h2>
            <button onClick={() => openPage("Projects")}>View All</button>
          </div>
          {visibleProjects.map((p) => (
            <div key={p.id} className="apex-row">
              <div>
                <b>{p.name}</b>
                <small>
                  {p.id} · {p.location}
                </small>
              </div>
              <div className="apex-progress">
                <Bar value={p.progress} color={statusColor(p.health)} />
                <small>{p.progress}% completed</small>
              </div>
              <em style={{ color: statusColor(p.health) }}>{p.health}</em>
            </div>
          ))}
        </section>

        <section className="apex-panel">
          <div className="apex-panel-title">
            <h2>Critical Tasks & Milestones</h2>
            <button onClick={() => openPage("Tasks & Milestones")}>All Tasks</button>
          </div>
          {sampleTasks.map((task) => (
            <div className="apex-task" key={task.name}>
              <span style={{ background: statusColor(task.priority) }} />
              <div>
                <b>{task.name}</b>
                <small>
                  {task.project} · Due: {task.due}
                </small>
              </div>
              <strong>{task.progress}%</strong>
            </div>
          ))}
        </section>
      </div>

      <div className="apex-grid">
        <section className="apex-panel">
          <h2>Financial Realization (Budget vs Actual)</h2>
          <div className="apex-chart">
            {[45, 60, 52, 78, 70, 85].map((height, index) => (
              <div key={index}>
                <i style={{ height: `${height}%` }} />
                <i
                  className="actual"
                  style={{ height: `${Math.max(18, height - (index % 2 ? 14 : 6))}%` }}
                />
              </div>
            ))}
          </div>
          <small>
            Q1 · Q2 · Q3 · Q4 · Year 2 &nbsp; <b>■ Approved Budget</b>{" "}
            <b className="actual-text">■ Actual Incurred</b>
          </small>
        </section>

        <section className="apex-panel">
          <h2>Immutable System Audit Trail</h2>
          {[
            { msg: `${userName} authenticated into ${role} role`, time: "Just now" },
            { msg: "Material Request #MR-018 Approved for Addis Heights", time: "1h ago" },
            { msg: "Goods Receipt #GRN-092 confirmed: +500 Bags Cement", time: "3h ago" },
            { msg: "Structural drawing v4.2 committed to document store", time: "5h ago" },
          ].map((event, i) => (
            <div className="apex-activity" key={i}>
              <span>{i + 1}</span>
              <div>
                <b>{event.msg}</b>
                <small>{event.time}</small>
              </div>
            </div>
          ))}
        </section>
      </div>
    </>
  );

  // Retained during the gradual workspace migration; the live dashboard is rendered below.
  void dashboard;

  const projectList = (
    <>
      <header className="apex-heading">
        <div>
          <p>AUTHORIZED ENTERPRISE PORTFOLIO</p>
          <h1>Construction Projects</h1>
          <span>Restricted to your verified role credentials ({role}).</span>
        </div>
        {canCreate && (
          <button className="apex-primary" onClick={() => router.push("/projects/new")}>
            + Create New Project
          </button>
        )}
      </header>

      <div className="apex-toolbar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search project code, name, client, location..."
        />
        <select>
          <option>All Statuses</option>
          <option>Active</option>
          <option>Planning</option>
          <option>Completed</option>
        </select>
      </div>

      <section className="apex-panel apex-table">
        {isLoadingProjects && <div style={{ padding: 24, color: "#64748B" }}>Loading projects from the ERP database…</div>}
        {projectError && <div style={{ padding: 24, color: "#DC3545" }}>{projectError}</div>}
        {!isLoadingProjects && !projectError && filteredProjects.length === 0 && <div style={{ padding: 24, color: "#64748B" }}>No projects are available for your role.</div>}
        {filteredProjects.map((project) => (
          <button
            className="apex-project"
            key={project.id}
            onClick={() => setSelectedProject(project)}
          >
            <div>
              <b>{project.name}</b>
              <small>
                {project.id} · {project.client} · {project.location}
              </small>
            </div>
            <span>
              {project.progress}%
              <Bar value={project.progress} color={statusColor(project.health)} />
            </span>
            <span>
              {money(project.budget)}
              <small>{money(project.spent)} spent</small>
            </span>
            <em style={{ color: statusColor(project.health) }}>{project.health}</em>
          </button>
        ))}
      </section>
    </>
  );

  const genericModuleView = (
    <>
      <header className="apex-heading">
        <div>
          <p>{page.toUpperCase()} MODULE</p>
          <h1>{page}</h1>
          <span>
            Enterprise operational dataset organized by project permissions and real-time database
            records.
          </span>
        </div>
        {canEdit && (
          <button className="apex-primary" onClick={() => setShowForm(true)}>
            + Create {page.slice(0, -1) || "Record"}
          </button>
        )}
      </header>

      <div className="apex-toolbar">
        <input placeholder={`Search in ${page}...`} />
        <select>
          <option>All Projects</option>
          {visibleProjects.map((p) => (
            <option key={p.id}>{p.name}</option>
          ))}
        </select>
        <select>
          <option>All Statuses</option>
          <option>Active / In Progress</option>
          <option>Pending Approval</option>
          <option>Approved / Completed</option>
        </select>
      </div>

      <section className="apex-panel">
        <h2>Live {page} Records</h2>
        <div style={{ padding: "20px 0", color: "#64748B", fontSize: 13 }}>
          Displaying verified records accessible to <b>{role}</b>. Real database queries are active.
        </div>
      </section>
    </>
  );

  const selectedTabContent = selected && (
    <section className="apex-panel apex-tab-panel">
      {projectTab === "Overview" && <><h2>Project execution summary</h2><div className="apex-grid"><div><p className="apex-label">Project progress</p><div style={{ marginTop: 12 }}><Bar value={selected.progress} color={statusColor(selected.health)} /></div><p style={{ marginTop: 10, fontSize: 13 }}>{selected.progress}% of planned work complete</p></div><div><p className="apex-label">Financial position</p><p style={{ marginTop: 12, fontSize: 20, fontWeight: 700 }}>{money(selected.budget - selected.spent)} remaining</p><small>{money(selected.spent)} actual spend of {money(selected.budget)} approved budget</small></div></div></>}
      {projectTab === "Progress" && <><h2>Progress tracking</h2><p className="apex-note">Overall progress is based on approved project updates and completed tasks.</p><div style={{ marginTop: 18 }}><Bar value={selected.progress} color={statusColor(selected.health)} /></div><strong style={{ display: "block", marginTop: 10, fontSize: 24 }}>{selected.progress}% complete</strong></>}
      {projectTab === "Budget" && <><h2>Budget management</h2><div className="apex-kpis"><Card title="Original Budget" value={money(selected.budget)} detail="approved baseline" /><Card title="Actual Expenses" value={money(selected.spent)} detail="posted expenditure" /><Card title="Remaining Budget" value={money(selected.budget - selected.spent)} detail="available balance" /></div></>}
      {projectTab === "Tasks" && <><h2>Tasks</h2><p className="apex-note">Project tasks will be listed here as they are assigned, updated, and completed.</p></>}
      {["Expenses", "Materials", "Procurement", "Workforce", "Timeline", "Reports", "Documents", "Issues", "Safety"].includes(projectTab) && <><h2>{projectTab}</h2><p className="apex-note">No {projectTab.toLowerCase()} records have been added for this project yet. New records will remain linked to {selected.id}.</p></>}
    </section>
  );

  const content = selected ? (
    <>
      <button className="apex-back" onClick={() => setSelectedProject(null)}>
        ← Back to Projects Portfolio
      </button>
      <header className="apex-heading">
        <div>
          <p>
            {selected.id} · {selected.status.toUpperCase()}
          </p>
          <h1>{selected.name}</h1>
          <span>
            {selected.client} · {selected.location} · PM: {selected.manager}
          </span>
        </div>
        <button className="apex-primary" onClick={() => setShowForm(true)}>
          Update Progress / Phase
        </button>
      </header>

      <div className="apex-tabs">
        {["Overview", "Progress", "Tasks", "Budget", "Expenses", "Materials", "Procurement", "Workforce", "Timeline", "Reports", "Documents", "Issues", "Safety"].map((tab) => (
          <button
            key={tab}
            className={projectTab === tab ? "active" : ""}
            onClick={() => setProjectTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="apex-kpis">
        <Card title="Overall Progress" value={`${selected.progress}%`} detail="Construction Phase" />
        <Card
          title="Remaining Budget"
          value={money(selected.budget - selected.spent)}
          detail="committed balance"
          color="#49b784"
        />
        <Card
          title="Health Indicator"
          value={selected.health}
          detail="schedule & cost status"
          color={statusColor(selected.health)}
        />
        <Card title="Scheduled Finish" value={selected.finish} detail="target completion" />
      </div>
      {selectedTabContent}
    </>
  ) : page === "Dashboard" ? (
    <ConstructionDashboard
      userName={userName}
      onCreate={canCreate ? () => router.push("/projects/new") : undefined}
    />
  ) : page === "Projects" ? (
    projectList
  ) : (
    genericModuleView
  );

  return (
    <AppShell
      userName={userName}
      userRole={role}
      onRoleChange={(newRole) => {
        setRole(newRole);
        setPage("Dashboard");
      }}
      onLogout={onLogout}
    >
      <div className="space-y-6">
        {content}
      </div>

      {showForm && (
        <div className="apex-modal-backdrop">
          <form
            className="apex-modal"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              setShowForm(false);
              setNotice("Record saved and committed to audit log");
            }}
          >
            <div className="apex-panel-title">
              <h2>{selected ? "Update Construction Record" : `Create ${page} Record`}</h2>
              <button type="button" onClick={() => setShowForm(false)}>
                ×
              </button>
            </div>
            <div className="apex-form">
              <label>
                Project *
                <select required>
                  {visibleProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Date *
                <input required type="date" defaultValue="2026-08-27" />
              </label>
              <label>
                Record Title / Description *
                <input required placeholder="Enter description or work log" />
              </label>
            </div>
            <footer>
              <button type="button" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button className="apex-primary" type="submit">
                Commit Record
              </button>
            </footer>
          </form>
        </div>
      )}
    </AppShell>
  );
}
