/* ============================================================
   REPORT HEADER — big title, quiet context line, lede
   (status pills live in the shell's top band)
============================================================ */

export function ReportHeader({
  isLost,
  title,
  categoryLabel,
  location,
  cityProvince,
  lede,
}: {
  isLost: boolean;
  title: string;
  categoryLabel: string;
  location: string;
  /** City, province — used for the quiet "Phones · Lost in …" context line. */
  cityProvince?: string | null;
  /** One-line summary rendered under the context line. */
  lede?: string;
}) {
  /* Fix common brand casing in user-typed titles (e.g. "iphone 15" → "iPhone 15"). */
  const BRANDS: [RegExp, string][] = [
    [/\biphone\b/gi, "iPhone"],
    [/\bipad\b/gi, "iPad"],
    [/\bairpods?\b/gi, "AirPods"],
    [/\bmacbook\b/gi, "MacBook"],
    [/\bimac\b/gi, "iMac"],
    [/\bairpods pro\b/gi, "AirPods Pro"],
    [/\bsamsung\b/gi, "Samsung"],
    [/\bgalaxy\b/gi, "Galaxy"],
    [/\boppo\b/gi, "Oppo"],
    [/\brealme\b/gi, "Realme"],
    [/\btecno\b/gi, "Tecno"],
    [/\binfinix\b/gi, "Infinix"],
    [/\bjbl\b/gi, "JBL"],
    [/\bnike\b/gi, "Nike"],
    [/\bgucci\b/gi, "Gucci"],
    [/\blouis vuitton\b/gi, "Louis Vuitton"],
  ];

  const displayTitle = BRANDS.reduce(
    (acc, [pattern, brand]) => acc.replace(pattern, brand),
    title,
  );

  return (
    <>
      {/* Big display title */}
      <h1
        className="
          min-w-0
          font-display
          text-3xl
          font-bold
          tracking-[-0.02em]
          text-slate-900
          sm:text-4xl
        "
      >
        {displayTitle}
      </h1>

      {/* Quiet context line — "Phones · Lost in San Fernando, La Union" */}
      <p className="mt-2 text-sm leading-6 text-slate-500">
        {categoryLabel}
        {cityProvince ? (
          <>
            {" · "}
            {isLost ? "Lost" : "Found"} in {cityProvince}
          </>
        ) : (
          <>
            {" · "}
            {location}
          </>
        )}
      </p>

      {/* Lede — what happened + what the reader should do */}
      {lede && (
        <p className="mt-4 max-w-xl text-[15px] leading-7 text-slate-600">
          {lede}
        </p>
      )}
    </>
  );
}
