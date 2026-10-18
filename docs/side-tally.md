# Live side tally (Kneel vs Resist)

The site shows how many visitors knelt to Doom and how many resist. The counts live in a Google Sheet behind a small Apps Script web app. No server is needed.

## Setup (about 5 minutes)

1. Create a Google Sheet. Name the first tab `tally`. Put `kneel` in A1 and `0` in B1, then `resist` in A2 and `0` in B2.
2. Open **Extensions → Apps Script**, replace the code with the script below, and save.
3. Click **Deploy → New deployment**:
   - Type: **Web app**.
   - Execute as: **Me**.
   - Who has access: **Anyone**.
4. Deploy, then copy the web app URL (it ends in `/exec`).
5. Set it as `NEXT_PUBLIC_TALLY_URL`, either in `.env.local` or in your hosting settings. Then rebuild.

```js
function counts_() {
  const sh = SpreadsheetApp.getActive().getSheetByName('tally');
  return { sh, kneel: Number(sh.getRange('B1').getValue()) || 0, resist: Number(sh.getRange('B2').getValue()) || 0 };
}
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function doGet() {
  const c = counts_();
  return json_({ kneel: c.kneel, resist: c.resist });
}
// body: "kneel" | "resist" | "kneel:from:resist" | "resist:from:kneel"
function doPost(e) {
  const lock = LockService.getScriptLock(); lock.waitLock(5000);
  try {
    const c = counts_();
    const [side, , from] = String(e.postData.contents || '').split(':');
    const cell = { kneel: 'B1', resist: 'B2' };
    if (!cell[side]) return json_({ ok: false });
    c.sh.getRange(cell[side]).setValue(c[side] + 1);
    if (cell[from] && c[from] > 0) c.sh.getRange(cell[from]).setValue(c[from] - 1);
    return json_({ ok: true });
  } finally { lock.releaseLock(); }
}
```

Until the URL is set, the site still works and records each visitor's side, but it doesn't show live numbers.

## Recording the side with each registration

Add a question to the Google Form, for example "Your side" with the options **Kneel** and **Resist**. Then:

1. In the form, open **⋮ → Get pre-filled link**.
2. Pick any answer for that question, then click **Get link**.
3. The link contains something like `entry.123456789=Kneel`. Set `NEXT_PUBLIC_FORM_SIDE_ENTRY=entry.123456789`.

The embedded form then opens with the visitor's side already filled in.
