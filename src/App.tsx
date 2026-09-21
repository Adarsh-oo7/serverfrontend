import { useEffect, useState } from "react";

type Overview = {
  users: number;
  devices: number;
  sessions: number;
  online: number;
  controlRequests: number;
  signallingFrames: number;
  fileTrafficAlerts: number;
  plane: string;
  storesUserFiles: boolean;
};

type Device = {
  deviceId: string;
  name: string;
  role: string;
  online: boolean;
  approved: boolean;
  lastSeen: number;
};

const API =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "https://cloud.digitalproductsolutions.in";

async function api<T>(path: string, opts: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(opts.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export function App() {
  const [email, setEmail] = useState("admin@local");
  const [password, setPassword] = useState("password12");
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<"admin" | "files">("admin");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function login(register: boolean) {
    setError(null);
    try {
      const path = register ? "/v1/auth/register" : "/v1/auth/login";
      const body = await api<{ accessToken: string }>(path, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(body.accessToken);
    } catch (e) {
      setError(String(e));
    }
  }

  useEffect(() => {
    if (!token) return;
    api<Overview>("/v1/admin/overview", {}, token).then(setOverview).catch((e) => setError(String(e)));
    api<Device[]>("/v1/devices", {}, token).then(setDevices).catch(() => setDevices([]));
  }, [token]);

  if (!token) {
    return (
      <main>
        <h1>Private Android Cloud</h1>
        <p className="muted">Control plane only. Files stay on Android nodes.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            login(false);
          }}
        >
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <button className="primary" type="submit">
            Sign in
          </button>
          <button type="button" onClick={() => login(true)}>
            Create account
          </button>
          {error && <p>{error}</p>}
        </form>
      </main>
    );
  }

  return (
    <div className="layout">
      <nav>
        <h2>PAC</h2>
        <p className="muted">cloud.digitalproductsolutions.in</p>
        <p>
          <button onClick={() => setTab("admin")}>Admin</button>
        </p>
        <p>
          <button onClick={() => setTab("files")}>Web client</button>
        </p>
        <p>
          <button onClick={() => setToken(null)}>Log out</button>
        </p>
      </nav>
      <main>
        {tab === "admin" && (
          <>
            <h1>Control plane</h1>
            <p className="muted">This dashboard never lists file bytes. Storage lives on phones.</p>
            {overview && (
              <div className="cards">
                <Stat label="Users" value={overview.users} />
                <Stat label="Devices" value={overview.devices} />
                <Stat label="Online" value={overview.online} />
                <Stat label="Sessions" value={overview.sessions} />
                <Stat label="Control requests" value={overview.controlRequests} />
                <Stat label="Signalling frames" value={overview.signallingFrames} />
                <Stat label="File-on-VPS alerts" value={overview.fileTrafficAlerts} />
                <Stat label="Stores user files" value={overview.storesUserFiles ? "YES (BUG)" : "no"} />
              </div>
            )}
            <h2>Devices</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Online</th>
                  <th>Approved</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d.deviceId}>
                    <td>{d.name}</td>
                    <td>{d.role}</td>
                    <td>{d.online ? "yes" : "no"}</td>
                    <td>{d.approved ? "yes" : "no"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {tab === "files" && (
          <>
            <h1>Web client</h1>
            <p>
              After signalling, this browser talks to an Android server (DIRECT LAN / P2P). The VPS
              only introduced you.
            </p>
            <p className="muted">
              Connect the Android Main Server on the same Wi-Fi, then open{" "}
              <code>http://&lt;phone-ip&gt;:8443/api/health</code> from a trusted session.
            </p>
          </>
        )}
        {error && <p>{error}</p>}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card">
      <div className="muted">{label}</div>
      <strong>{value}</strong>
    </div>
  );
}
