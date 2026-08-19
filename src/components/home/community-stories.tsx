import { HeartHandshake, Quote, CheckCircle2 } from "lucide-react";

// Placeholder community stories — swap these out for real, verified stories
// whenever you're ready. Keep the tone warm and specific (city + item + outcome).
const STORIES = [
  {
    initials: "MR",
    name: "Maria R.",
    place: "Makati",
    text: "I lost my wallet at the jeepney stop and thought it was gone for good — a kind commuter found it and posted it here. FindBack made returning it safe and easy.",
    tag: "Found a wallet",
  },
  {
    initials: "JP",
    name: "Jose P.",
    place: "Cebu City",
    text: "Someone returned my school ID two weeks later. The in-app chat kept us safe from the first message to the handover.",
    tag: "Got an ID back",
  },
  {
    initials: "AL",
    name: "Alicia L.",
    place: "Quezon City",
    text: "My store keys went missing on a busy day. A neighbor saw the post, remembered the keys, and brought them home the same week.",
    tag: "Returned keys",
  },
];

export function CommunityStories() {
  return (
    <section className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <HeartHandshake size={14} /> Community stories
          </span>

          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
            Real items. Real people. Real returns.
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
            Every day, someone in the community gets a lost thing back — because
            someone else took the time to care.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {STORIES.map((s) => (
            <figure
              key={s.initials}
              className="card flex h-full flex-col p-5"
            >
              <Quote size={20} className="text-electric-200" aria-hidden="true" />

              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
                &ldquo;{s.text}&rdquo;
              </blockquote>

              <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-electric-400 to-electric-600 text-xs font-bold text-white">
                  {s.initials}
                </span>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-navy-900">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.place}</p>
                </div>

                <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                  <CheckCircle2 size={11} aria-hidden="true" /> {s.tag}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}