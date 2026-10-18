// Every event detail lives here. Anything in [brackets] is a placeholder waiting for the real value.

export interface Trial {
  name: string;
  line: string;        // one-line description
  team: string;        // team size
  duration: string;
  prize: string;
}

export const EVENT = {
  name: "Clockout",
  edition: "4.0",
  title: "The Doom Takeover",
  host: "SIGAI · AIML Department",

  date: "[Date to be announced]",
  // When it starts, for the Doomsday clock (ISO with offset, e.g. "2026-12-05T10:00:00+05:30"). Empty = clock hidden.
  startsAt: "",
  time: "[Start time] – [End time]",
  venue: "[Room], 4th Floor, AIML Department",
  reporting: "[Reporting time]",
  deadline: "[Registration deadline]",
  fee: "[Registration fee]",
  eligibility: "[Who can take part: years / departments]",

  trials: [
    { name: "[Trial one]", line: "[One line on what happens in this trial.]", team: "[2–4]", duration: "[90 min]", prize: "[Prize]" },
    { name: "[Trial two]", line: "[One line on what happens in this trial.]", team: "[Solo]", duration: "[60 min]", prize: "[Prize]" },
    { name: "[Trial three]", line: "[One line on what happens in this trial.]", team: "[2–3]", duration: "[2 hrs]", prize: "[Prize]" },
  ] as Trial[],

  prizePool: "[Total prize pool]",

  rules: [
    "[Rule one]",
    "[Rule two]",
    "[Rule three]",
    "[Rule four]",
  ],

  contacts: [
    { name: "[Coordinator name]", phone: "[+91 00000 00000]" },
    { name: "[Coordinator name]", phone: "[+91 00000 00000]" },
  ],

  faq: [
    { q: "[Question one?]", a: "[Answer one.]" },
    { q: "[Question two?]", a: "[Answer two.]" },
    { q: "[Question three?]", a: "[Answer three.]" },
    { q: "[Question four?]", a: "[Answer four.]" },
  ],

  // Paste the Google Form link here (…/viewform). Leave empty to show the placeholder frame.
  googleFormUrl: process.env.NEXT_PUBLIC_GOOGLE_FORM_URL || "",
};

/** The form link turned into its embeddable form, or null when not set. */
export function formEmbedUrl(): string | null {
  const u = EVENT.googleFormUrl.trim();
  if (!/^https:\/\/docs\.google\.com\/forms\//.test(u)) return null;
  return u.includes("embedded=true") ? u : u + (u.includes("?") ? "&" : "?") + "embedded=true";
}
