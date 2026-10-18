const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Challenge configuration
// ---------------------------------------------------------------------------
// IMPORTANT:
// Set REAL_FLAG in Render/Docker environment variables.
// Never commit the real flag to GitHub.
//
// Example:
// REAL_FLAG=OXCODE{your_real_flag_here}
// ---------------------------------------------------------------------------

const REAL_FLAG = process.env.REAL_FLAG;

if (!REAL_FLAG) {
  throw new Error("REAL_FLAG is not configured");
}

const DECOY_FLAG = "OXCODE{you_found_the_decoy_not_the_end}";

// ---------------------------------------------------------------------------
// JSON parser
// ---------------------------------------------------------------------------

app.use(express.json({ limit: "32kb" }));

// ---------------------------------------------------------------------------
// INTENTIONAL CTF VULNERABILITY
// ---------------------------------------------------------------------------
// This recursive merge is deliberately unsafe.
//
// A nested "__proto__" property can reach Object.prototype and allow a
// contestant to pollute the global object prototype.
//
// DO NOT reuse this function in production software.
// ---------------------------------------------------------------------------

function unsafeMerge(target, source) {
  for (const key of Object.keys(source || {})) {
    const value = source[key];

    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (!target[key] || typeof target[key] !== "object") {
        target[key] = {};
      }

      unsafeMerge(target[key], value);
    } else {
      target[key] = value;
    }
  }

  return target;
}

// ---------------------------------------------------------------------------
// Frontend
// ---------------------------------------------------------------------------

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ---------------------------------------------------------------------------
// Recon clue
// ---------------------------------------------------------------------------

app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send(
`User-agent: *
Disallow: /api/ops/omega
Disallow: /internal/echo

# The apocalypse does not care about the obvious path.
# The client knows more than the page admits.
`
  );
});

// ---------------------------------------------------------------------------
// Main challenge endpoint
// ---------------------------------------------------------------------------
//
// Normal-looking endpoint.
//
// Decoy:
//   {"key":"DOOM-KEY-7F3A"}
//
// Intended vulnerability:
//   {"meta":{"__proto__":{"isAdmin":true}}}
// ---------------------------------------------------------------------------

app.post("/api/submit", (req, res) => {
  const body = req.body || {};

  // -------------------------------------------------------------------------
  // Decoy path
  // -------------------------------------------------------------------------

  if (body.key === "DOOM-KEY-7F3A") {
    return res.json({
      ok: true,
      message: "ACCESS ACCEPTED",
      flag: DECOY_FLAG,
      note: "One door opened. The city is still burning."
    });
  }

  // -------------------------------------------------------------------------
  // INTENTIONAL PROTOTYPE POLLUTION SINK
  // -------------------------------------------------------------------------

  const challengeState = {};

  unsafeMerge(challengeState, body.meta || {});

  return res.status(200).json({
    ok: false,
    message: "ACCESS DENIED",
    hint: "The gate remembers what you teach it.",
    echo: body.key || null
  });
});

// ---------------------------------------------------------------------------
// Hidden final endpoint
// ---------------------------------------------------------------------------
//
// Players discover this through robots.txt.
//
// Requirements:
//   1. Object.prototype must be polluted with isAdmin=true
//   2. Correct token must be supplied
//
// ---------------------------------------------------------------------------

app.get("/api/ops/omega", (req, res) => {
  // Token gate
  if (req.query.token !== "omega") {
    return res.status(404).json({
      error: "not found"
    });
  }

  // Privilege check
  //
  // This intentionally relies on inherited properties.
  const session = {};

  if (session.isAdmin !== true) {
    return res.status(403).json({
      error: "forbidden",
      detail: "operator privileges required"
    });
  }

  // Successful exploitation
  return res.json({
    status: "OMEGA_UNLOCKED",
    flag: REAL_FLAG
  });
});

// ---------------------------------------------------------------------------
// Diagnostic endpoint
// ---------------------------------------------------------------------------
//
// This is intentionally boring.
//
// It allows players to verify that their prototype pollution succeeded.
// ---------------------------------------------------------------------------

app.get("/internal/echo", (req, res) => {
  const probe = {};

  const inherited = probe.isAdmin === true;

  res.json({
    inherited,
    message: inherited
      ? "Something changed globally."
      : "Nothing unusual."
  });
});

// ---------------------------------------------------------------------------
// Static files
// ---------------------------------------------------------------------------

app.use(express.static(path.join(__dirname, "public")));

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(
    `OxCode Doomsday CTF listening on http://localhost:${PORT}`
  );
});
