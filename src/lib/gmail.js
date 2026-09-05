// Reads the user's own Gmail inbox for bill/receipt-like emails, entirely
// client-side. Uses Google Identity Services (GIS) token client, which is
// designed for public/static clients — there is no client secret involved,
// so nothing sensitive needs to be protected on a server.
//
// Requires the user's own OAuth Client ID (not secret) from a free Google
// Cloud project, pasted into Settings. Scope requested is read-only Gmail
// access ("gmail.readonly") — the minimum needed to find bills.

let tokenClient = null;
let accessToken = null;
let tokenExpiry = 0;

export function isGoogleReady() {
  return typeof window !== "undefined" && !!window.google?.accounts?.oauth2;
}

export function requestGmailAccess(clientId) {
  return new Promise((resolve, reject) => {
    if (!isGoogleReady()) {
      reject(new Error("Google sign-in script hasn't loaded yet — try again in a moment."));
      return;
    }
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/gmail.readonly",
      callback: (resp) => {
        if (resp.error) { reject(new Error(resp.error)); return; }
        accessToken = resp.access_token;
        tokenExpiry = Date.now() + (resp.expires_in || 3600) * 1000;
        resolve(accessToken);
      },
      error_callback: (err) => reject(new Error(err.message || "Google sign-in was cancelled or failed.")),
    });
    tokenClient.requestAccessToken();
  });
}

export function hasValidToken() {
  return !!accessToken && Date.now() < tokenExpiry;
}

export function disconnectGmail() {
  if (accessToken && window.google?.accounts?.oauth2?.revoke) {
    window.google.accounts.oauth2.revoke(accessToken, () => {});
  }
  accessToken = null;
  tokenExpiry = 0;
}

async function gmailFetch(path) {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Gmail API error (${res.status})`);
  return res.json();
}

// Extracts a naive merchant/amount guess from a message's subject + snippet.
function parseCandidate(subject, snippet, from) {
  const text = `${subject} ${snippet}`;
  const amountMatch = text.match(/\$\s?([\d,]+\.\d{2})/);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, "")) : null;
  const merchantMatch = from.match(/^"?([^"<]+)"?\s*</) || from.match(/^([^<]+)/);
  const merchant = (merchantMatch ? merchantMatch[1] : from).trim();
  return { merchant, amount };
}

// Scans recent mail for bill/receipt-like messages and returns candidates
// for the user to confirm — never writes anything itself.
export async function scanForBills(maxResults = 12) {
  const query = encodeURIComponent("(receipt OR invoice OR \"your order\" OR \"payment confirmation\" OR bill) newer_than:30d");
  const list = await gmailFetch(`messages?q=${query}&maxResults=${maxResults}`);
  const messages = list.messages || [];
  const candidates = [];

  for (const m of messages) {
    try {
      const detail = await gmailFetch(`messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`);
      const headers = detail.payload?.headers || [];
      const subject = headers.find((h) => h.name === "Subject")?.value || "(no subject)";
      const from = headers.find((h) => h.name === "From")?.value || "";
      const snippet = detail.snippet || "";
      const { merchant, amount } = parseCandidate(subject, snippet, from);
      if (amount) {
        candidates.push({ id: m.id, subject, merchant, amount, snippet, date: new Date(Number(detail.internalDate)).toISOString().slice(0, 10) });
      }
    } catch {
      // skip messages that fail to parse — never block the whole scan on one bad message
    }
  }
  return candidates;
}
