#!/usr/bin/env node
/**
 * Auto-detect this Mac's primary LAN IPv4 and (re)write .env.development
 * with VITE_API_BASE_URL pointing at it.
 *
 * Why: WeChat real-device debugging cannot reach `localhost` on the dev
 * machine; it must use the LAN IP. DHCP rotates that IP, so doing it by
 * hand drifts. Run this before `dev:mp-weixin` (already wired into the
 * `dev:mp-weixin` npm script as a pre-step).
 */
const os = require('os');
const fs = require('fs');
const path = require('path');

const PORT = process.env.BACKEND_PORT || 8080;
const ICP_FALLBACK_REMOTE = process.env.ICP_FALLBACK_REMOTE || 'http://129.28.97.93:8088';
const ENV_FILE = path.resolve(__dirname, '..', '.env.development');

function pickLanIp() {
  const ifaces = os.networkInterfaces();

  // Names of virtual / non-physical adapters to skip (Windows + common tools).
  const SKIP_RE = /(vEthernet|VMware|VirtualBox|VBoxNet|Hyper-V|WSL|Docker|TAP|Loopback|Bluetooth|Tunnel|utun|llw|awdl|bridge)/i;

  // Preferred adapter names on macOS / Windows / Linux.
  const PREFER_RE = /(^en0$|^en1$|^en2$|Wi-?Fi|WLAN|Wireless|无线|以太网|Ethernet|eth0|wlan0)/i;

  const isLanIp = (addr) =>
    addr.startsWith('192.168.') ||
    addr.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(addr) ||
    // Some campus/office networks hand out other private ranges; allow as last resort
    (!addr.startsWith('169.254.') && !addr.startsWith('127.'));

  const candidates = [];
  for (const [name, list] of Object.entries(ifaces)) {
    if (SKIP_RE.test(name)) continue;
    for (const it of list || []) {
      if (it.family !== 'IPv4' || it.internal) continue;
      if (it.address.startsWith('169.254.')) continue;
      candidates.push({ name, address: it.address });
    }
  }

  // 1. Preferred-name + classic LAN range (best match)
  let hit = candidates.find(
    (c) => PREFER_RE.test(c.name) &&
      (c.address.startsWith('192.168.') || c.address.startsWith('10.') ||
       /^172\.(1[6-9]|2\d|3[01])\./.test(c.address))
  );
  if (hit) return hit.address;

  // 2. Any classic LAN range
  hit = candidates.find(
    (c) => c.address.startsWith('192.168.') || c.address.startsWith('10.') ||
           /^172\.(1[6-9]|2\d|3[01])\./.test(c.address)
  );
  if (hit) return hit.address;

  // 3. Preferred-name with whatever IP
  hit = candidates.find((c) => PREFER_RE.test(c.name));
  if (hit) return hit.address;

  // 4. Anything non-internal
  hit = candidates.find((c) => isLanIp(c.address));
  return hit ? hit.address : null;
}

const ip = pickLanIp();
if (!ip) {
  console.error('[set-api-host] No LAN IPv4 detected. Are you connected to a network?');
  process.exit(1);
}

const baseUrl = `http://${ip}:${PORT}`;
const line = `VITE_API_BASE_URL=${baseUrl}\n`;

let prev = '';
try { prev = fs.readFileSync(ENV_FILE, 'utf8'); } catch {}

// If an explicit remote URL is already set, keep it so server-backed
// debugging is not overwritten by the local LAN IP auto-detection.
const explicitRemoteUrl = prev.match(/VITE_API_BASE_URL=(https?:\/\/(?!localhost|127\.0\.0\.1)[^\s]+)/)?.[1];
if (explicitRemoteUrl) {
  // ICP filing period: domain traffic may be intercepted. Auto-fix known blocked domain.
  if (/api\.careerloop\.top/i.test(explicitRemoteUrl)) {
    fs.writeFileSync(ENV_FILE, `VITE_API_BASE_URL=${ICP_FALLBACK_REMOTE}\n`);
    console.log(`[set-api-host] Replaced blocked domain with fallback remote URL: ${ICP_FALLBACK_REMOTE}`);
    process.exit(0);
  }
  console.log(`[set-api-host] Keeping existing remote URL: ${explicitRemoteUrl}`);
  process.exit(0);
}

if (prev.trim() === line.trim()) {
  console.log(`[set-api-host] Unchanged: ${baseUrl}`);
  process.exit(0);
}
fs.writeFileSync(ENV_FILE, line);
console.log(`[set-api-host] Updated .env.development -> ${baseUrl}`);
