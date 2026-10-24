// Every event detail lives here.

export interface Trial {
  name: string;
  line: string;        // one-line description
  teams: string;       // how many teams take part
  duration: string;
}

export const EVENT = {
  name: "Clockout",
  edition: "4.0",
  title: "The Doom Takeover",
  host: "SIGAI · AIML Department",

  date: "30 October 2026",
  // When it starts, for the Doomsday clock (ISO with offset). Empty = clock hidden.
  startsAt: "2026-10-30T11:00:00+05:30",
  time: "11:00 a.m. – 6:00 p.m.",
  venue: "4th Floor, AIML Department",
  reporting: "11:00 a.m.",
  deadline: "Wednesday, 28 October",
  eligibility: "First-year and second-year students (FE and SE)",

  trials: [
    { name: "The Latverian Trials", line: "Crack hidden codes, solve mind-bending puzzles, test your memory, and escape Castle Doom before time runs out.", teams: "48", duration: "90 minutes" },
    { name: "Marvel Stock Exchange", line: "Trade superhero stocks, navigate market chaos, and make strategic moves to maximise your squad's virtual portfolio.", teams: "24", duration: "60 minutes" },
    { name: "The Multiversal Assembly", line: "Follow QR codes, solve cryptic riddles, and hunt down hidden Avengers across campus to claim victory.", teams: "12", duration: "75 minutes" },
  ] as Trial[],

  prizePool: "₹50,000+",
  prizes: [
    { place: "1st Place", amount: "₹25,000" },
    { place: "2nd Place", amount: "₹15,000" },
    { place: "3rd Place", amount: "₹10,000" },
  ],

  rules: [
    { t: "Squad Up", d: "Participate as a team and work together to overcome each trial." },
    { t: "Beat the Clock", d: "Complete every challenge within the given time limit." },
    { t: "Play Fair", d: "Cheating, tampering with clues, or disrupting other teams is not allowed." },
    { t: "Respect the Mission", d: "Follow the organisers' instructions and event guidelines throughout all rounds." },
  ],

  // Instagram: the handle without "@" (shown in the closing section)
  instagram: "djs.sigai",

  contacts: [
    { name: "Manan Darji", phone: "+91 89761 09195" },
    { name: "Manas Shah", phone: "+91 93241 25911" },
  ],

  faq: [
    { q: "What is CLOCKOUT 4.0?", a: "CLOCKOUT 4.0 is SIGAI's flagship non-technical fun event featuring puzzles, strategic challenges, and a multiversal treasure hunt." },
    { q: "How many members can a team have?", a: "Each team has 2 to 3 members. Find your squad, pick a team name, and register together." },
    { q: "How many rounds are there?", a: "There are three rounds: The Latverian Trials, Marvel Stock Exchange, and The Multiversal Assembly." },
    { q: "Who can participate in CLOCKOUT 4.0?", a: "CLOCKOUT 4.0 is primarily designed for first-year and second-year students, offering a chance to connect with peers and seniors through fun, interactive challenges." },
  ],

  // The registration form, embedded on the page (…/viewform). It must not require a Google sign-in:
  // Google won't show its sign-in inside a frame, and the embed comes up blank.
  googleFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLSek2gx-HmgkL-QIqgjYi72-SoD405UtKm20N4ngnznQ2ZCmfQ/viewform",
  // the short link, for opening the form on its own
  googleForm: "https://forms.gle/T9aEEpP5wPgW2HvJ8",
};

/** The form link turned into its embeddable form, or null when not set. */
export function formEmbedUrl(): string | null {
  const u = EVENT.googleFormUrl.trim();
  if (!/^https:\/\/docs\.google\.com\/forms\//.test(u)) return null;
  return u.includes("embedded=true") ? u : u + (u.includes("?") ? "&" : "?") + "embedded=true";
}
