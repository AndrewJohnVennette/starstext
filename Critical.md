# StarsText — Security Analysis

_Date: 2026-11-07_

I found **10 security problems**. The four worst are in the payment page, the hidden news editor, and file uploads, and some of them can be exploited by anyone visiting the site today.

I checked the code and scanned the git history for leaked keys (Stripe, Resend, database passwords) and committed `.env` files, and found none. I couldn't check the npm packages for known vulnerabilities because the `npm audit` server couldn't be reached.

## 🔴 Critical

### 1. The payment form collects raw card numbers
`frontend/src/components/PaymentMethod.astro` has plain text fields for the card number, expiry and CVC. Card data should only ever be entered in Stripe's own secure fields (Stripe Elements) or on Stripe's hosted Checkout page. Handling raw card numbers breaks the card industry's security rules (PCI-DSS). It also means a single script injected into the site could steal every card entered.

### 2. Customers can choose their own price
The total is calculated in the browser (`window.__invoiceTotal`). `routes/payment.js` then charges whatever `amount` it receives, as long as it's at least $0.50. Anyone can change the request and pay 50¢ for any order. The server should work out the price from a list of item IDs instead.

### 3. The news editor's login details are visible to anyone
`frontend/src/pages/pepenews.astro` puts `CMS_USER`, `CMS_PASS` and `CMS_KEY` into the page itself. The login check runs in the browser and is remembered by setting `localStorage['pepenews-auth']='true'`. As a result, anyone who views the page source gets:
- the username and password, and
- the `CMS_KEY` that the backend uses to protect creating, deleting and replacing news.

So **anyone can edit or delete the news and upload files to the server**. Having an unlisted URL doesn't protect it.

### 4. Uploaded files can contain malicious web pages
`routes/upload.js` checks only the file type the browser claims (`file.mimetype`) but saves the file with whatever extension the user chose. `/files` then serves these files from the site's own domain. An attacker can upload `evil.html` while claiming it's `image/png`. Their page would then run on the site's domain, and could steal data from visitors (stored XSS).
- `/api/upload` also needs no login, so anyone can fill the disk 10 MB at a time.
- `routes/news.js` has the same weakness: an allowed claimed type plus any extension is accepted. Combined with the leaked key from #3, anyone can exploit it.

## 🟠 High

### 5. Weak default secrets
If an environment variable is missing, the code quietly falls back to `changeme-some-random-shared-secret` and `admin`/`changeme`. It should refuse to start instead.

### 6. No webhook to confirm payments
Orders are only marked "paid" if the browser calls `/confirm`. Nothing reliably confirms payments on the server, and `/confirm` accepts any payment ID.

### 7. Registration has no input checks, and the welcome email can be manipulated
In `routes/register.js` the validation is commented out, and `firstName`/`lastName` go straight into the email's HTML. Anyone can inject their own HTML or links into the email that is sent to the owner's inbox (`EMAIL_TO`).

## 🟡 Medium

### 8. No protection against abuse
There are no rate limits on registration, uploads or payments, so they can be spammed. There are also no standard security headers (e.g. `helmet`) and no size limit on incoming JSON.

### 9. Internal error messages are shown to users
Raw Stripe errors (`err.message`) and upload errors are sent back to the browser.

### 10. Low-risk display issue on the upload page
`upload.astro` inserts the uploaded file's name and server errors into the page as HTML. In practice only the person uploading could affect themselves, so this is low risk, but it should display them as plain text. The news pages already do this correctly.

## ✅ Things already done right
- Every database query uses parameters, so there's no SQL injection risk.
- Deleting news files is protected against path tricks (`path.basename`), and news IDs are checked.
- `.env` files are excluded from git, and none are in the history.
- CORS (which sites may call the API) is restricted to an allowed list.

## Recommended fix order
1. **Fix #3 and #5:** add a real login on the server (a hashed password and a secure session cookie, using the `express-session` package already installed). Remove all secrets from the frontend, and stop the app from starting without them.
2. **Fix #1, #2 and #6:** replace the card fields with Stripe Elements or Checkout, calculate prices on the server, and add a webhook.
3. **Fix #4:** require a login to upload, store files under safe extensions chosen by the server, check the actual file contents, and serve them with `Content-Disposition`/`nosniff` headers.
4. **Fix the rest:** input checks and escaping in the email, `helmet`, rate limits, and generic error messages.

## Other important issue (not security)
- **The frontend doesn't build right now:** `frontend/src/assets/Stellarwave.png` was deleted, but `Layout.astro`, `NavBar.astro`, `NavBar3.astro` and `_NavBar.astro` still import it. The new logo is in the untracked `frontend/src/assets/StarsText.png`.
