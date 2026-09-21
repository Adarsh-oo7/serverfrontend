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
  lanIpv4?: string | null;
  lanPort?: number | null;
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
  const [email, setEmail] = useState("adarshsarachandran@gmail.com");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<"admin" | "files">("files");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [customIp, setCustomIp] = useState("");
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

  function fetchDevices() {
    if (!token) return;
    api<Device[]>("/v1/devices", {}, token)
      .then((devs) => {
        setDevices(devs);
        const server = devs.find((d) => d.online && d.lanIpv4);
        if (server?.lanIpv4 && !customIp) {
          setCustomIp(server.lanIpv4);
        }
      })
      .catch(() => setDevices([]));
  }

  useEffect(() => {
    if (!token) return;
    api<Overview>("/v1/admin/overview", {}, token).then(setOverview).catch((e) => setError(String(e)));
    fetchDevices();
    const timer = setInterval(fetchDevices, 4000);
    return () => clearInterval(timer);
  }, [token]);

  if (!token) {
    return (
      <main>
        <h1>Private Android Cloud</h1>
        <p className="muted">Phones are the cloud servers. VPS is control only.</p>
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
          {error && <p style={{ color: "#ef4444" }}>{error}</p>}
        </form>
        <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #30363d", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <a
            href="/PrivateAndroidCloud.apk"
            download="PrivateAndroidCloud.apk"
            style={{
              display: "inline-block",
              padding: "10px 16px",
              background: "#1f6feb",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "8px",
              fontWeight: 600,
            }}
          >
            📱 Download Android APK (22 MB)
          </a>
          <a
            href="/PrivateAndroidCloud.zip"
            download="PrivateAndroidCloud.zip"
            style={{
              display: "inline-block",
              padding: "10px 16px",
              background: "#238636",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "8px",
              fontWeight: 600,
            }}
          >
            📦 Download ZIP
          </a>
        </div>
      </main>
    );
  }

  const onlineServers = devices.filter((d) => d.role !== "CLIENT");

  return (
    <div className="layout">
      <nav>
        <h2>PAC</h2>
        <p className="muted">cloud.digitalproductsolutions.in</p>
        <p>
          <button style={{ fontWeight: tab === "files" ? "bold" : "normal" }} onClick={() => setTab("files")}>
            📁 Phone Cloud Access
          </button>
        </p>
        <p>
          <button style={{ fontWeight: tab === "admin" ? "bold" : "normal" }} onClick={() => setTab("admin")}>
            ⚙️ Control Admin
          </button>
        </p>
        <p>
          <button onClick={() => setToken(null)}>Log out</button>
        </p>
      </nav>
      <main>
        {tab === "files" && (
          <>
            <h1>Direct Phone Cloud Access</h1>
            <p className="muted">
              Your Android phone is your storage server. File bytes are transferred directly between your devices over LAN.
            </p>

            <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {onlineServers.length === 0 ? (
                <div className="card" style={{ padding: "24px", background: "#161b22", border: "1px solid #30363d" }}>
                  <h3 style={{ margin: 0, color: "#f0883e" }}>📱 Waiting for Phone Connection...</h3>
                  <p style={{ marginTop: "8px", color: "#8b949e", fontSize: "0.9rem" }}>
                    Make sure the <strong>Private Android Cloud</strong> app is installed and open on your Android phone, logged into this account.
                  </p>
                </div>
              ) : (
                onlineServers.map((dev) => {
                  const targetIp = dev.lanIpv4 || customIp || "192.168.1.15";
                  const targetPort = dev.lanPort || 8443;
                  const directUrl = `http://${targetIp}:${targetPort}`;

                  return (
                    <div
                      key={dev.deviceId}
                      className="card"
                      style={{
                        padding: "24px",
                        background: "#161b22",
                        border: "1px solid #238636",
                        borderRadius: "12px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                        <div>
                          <h2 style={{ margin: 0, fontSize: "1.3rem" }}>
                            📱 {dev.name} <span style={{ fontSize: "0.8rem", color: "#2ea043", fontWeight: "normal" }}>● ONLINE ({dev.role})</span>
                          </h2>
                          <p style={{ color: "#8b949e", fontSize: "0.85rem", marginTop: "4px" }}>
                            Device ID: <code>{dev.deviceId}</code>
                          </p>
                        </div>
                        <span
                          style={{
                            background: "rgba(46, 160, 67, 0.15)",
                            color: "#3fb950",
                            padding: "4px 12px",
                            borderRadius: "999px",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                          }}
                        >
                          🟢 DATA PLANE ACTIVE
                        </span>
                      </div>

                      <div style={{ marginTop: "20px", padding: "16px", background: "#0d1117", borderRadius: "8px", border: "1px solid #30363d" }}>
                        <div style={{ fontWeight: 600, marginBottom: "6px" }}>Local Cloud Address:</div>
                        <div style={{ fontSize: "1.1rem", color: "#58a6ff", fontFamily: "monospace" }}>{directUrl}</div>
                        <p style={{ color: "#8b949e", fontSize: "0.85rem", marginTop: "6px", marginBottom: "16px" }}>
                          Connect your laptop / PC to the same Wi-Fi as your phone, then click below to browse, upload, and stream files directly!
                        </p>
                        <a
                          href={directUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "inline-block",
                            padding: "12px 24px",
                            background: "#238636",
                            color: "#fff",
                            textDecoration: "none",
                            borderRadius: "8px",
                            fontWeight: 700,
                            fontSize: "1rem",
                          }}
                        >
                          🚀 Open Phone Storage Portal ({targetIp}:{targetPort})
                        </a>
                      </div>
                    </div>
                  );
                })
              )}

              <div className="card" style={{ padding: "20px", background: "#161b22", border: "1px solid #30363d" }}>
                <h3 style={{ margin: 0, fontSize: "1rem" }}>Manual IP Connection (Optional)</h3>
                <p style={{ color: "#8b949e", fontSize: "0.85rem", marginTop: "4px" }}>
                  If your phone's IP is different (shown on your phone's home screen):
                </p>
                <div style={{ display: "flex", gap: "8px", marginTop: "10px", alignItems: "center" }}>
                  <input
                    style={{ width: "240px", padding: "8px 12px", background: "#0d1117", color: "#fff", border: "1px solid #30363d", borderRadius: "6px" }}
                    placeholder="e.g. 192.168.1.15"
                    value={customIp}
                    onChange={(e) => setCustomIp(e.target.value)}
                  />
                  <a
                    href={`http://${customIp || "192.168.1.15"}:8443`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "8px 16px",
                      background: "#1f6feb",
                      color: "#fff",
                      textDecoration: "none",
                      borderRadius: "6px",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                    }}
                  >
                    Open URL
                  </a>
                </div>
              </div>

              <div className="card" style={{ padding: "20px", background: "#161b22", border: "1px solid #30363d" }}>
                <h3 style={{ margin: 0, fontSize: "1rem" }}>💡 How Direct LAN Storage Works</h3>
                <ul style={{ color: "#8b949e", fontSize: "0.85rem", marginTop: "10px", paddingLeft: "20px", lineHeight: "1.6" }}>
                  <li><strong>Zero VPS File Storage:</strong> Files are stored directly in your phone's internal/SD card storage pool.</li>
                  <li><strong>Maximum Speed:</strong> Transfers occur at local Wi-Fi speeds (up to 1 Gbps), not constrained by internet upload bandwidth.</li>
                  <li><strong>Privacy Guaranteed:</strong> Nobody—including this VPS—can access or see your personal files.</li>
                </ul>
              </div>
            </div>
          </>
        )}

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
                  <th>LAN Address</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d.deviceId}>
                    <td><strong>{d.name}</strong></td>
                    <td>{d.role}</td>
                    <td>{d.online ? "🟢 yes" : "⚪ no"}</td>
                    <td><code>{d.lanIpv4 ? `${d.lanIpv4}:${d.lanPort || 8443}` : "—"}</code></td>
                    <td>
                      {d.online && (
                        <a
                          href={`http://${d.lanIpv4 || "192.168.1.15"}:${d.lanPort || 8443}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: "#58a6ff",
                            textDecoration: "none",
                            fontWeight: 600,
                          }}
                        >
                          Open Storage ↗
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {error && <p style={{ color: "#ef4444" }}>{error}</p>}
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
