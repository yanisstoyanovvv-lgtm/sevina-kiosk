// ===== Sevina 2.0 Quiz kiosk – CONFIG =====
// 1) Paste the Apps Script web app URL (ends with /exec) below after deploying apps-script/Code.gs.
// 2) Open each kiosk with ?kiosk=1 or ?kiosk=2 (e.g. index.html?kiosk=1). Default: 1.
window.CONFIG = {
  WEB_APP_URL: "https://script.google.com/macros/s/AKfycbwSAFHawh33lY5TSnaKB2E5a8K4ho72Nw5stvaFQkm573-dsC32Lz-Q1iXrflcDPMTo/exec",            // e.g. "https://script.google.com/macros/s/AKfy.../exec"
  KIOSK_ID: "1",              // overridden by ?kiosk=N
  RETRY_SECONDS: 30,          // offline queue retry interval
  REQUEST_TIMEOUT_MS: 15000,  // POST vote / flush; Apps Script cold starts can be slow
  TALLY_TIMEOUT_MS: 12000,    // GET tally=1; retry once on fail/timeout
  DUP_CHECK_TIMEOUT_MS: 2500  // online duplicate pre-check; if slower, vote is accepted and server dedupes
};
