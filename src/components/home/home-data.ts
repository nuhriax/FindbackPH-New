// ---------------------------------------------------------------------------
// Homepage reference & demo data.
//
// IMPORTANT: everything in this file marked "demo"/"simulated" is NOT real
// system activity. FindBack PH does not have a real-time feed yet, so the
// homepage cycles through these canned items to demonstrate how live features
// would behave. Real totals (lost / found / recovered / possible matches) are
// fetched from Supabase in src/app/page.tsx and passed down as props.
// ---------------------------------------------------------------------------

export type ActivityKind = "lost" | "found" | "match" | "returned" | "near";

export type LiveActivityItem = {
  kind: ActivityKind;
  title: string;
  city: string;
  secondsAgo: number;
};

export const DEMO_ACTIVITIES: LiveActivityItem[] = [
  { kind: "lost", title: "Lost phone reported", city: "Quezon City", secondsAgo: 12 },
  { kind: "found", title: "Found wallet reported", city: "Cebu City", secondsAgo: 41 },
  { kind: "match", title: "Possible match detected", city: "Makati", secondsAgo: 76 },
  { kind: "returned", title: "Item returned successfully", city: "Davao City", secondsAgo: 112 },
  { kind: "found", title: "Found keys reported", city: "Baguio", secondsAgo: 158 },
  { kind: "near", title: "A report was posted near you", city: "Iloilo City", secondsAgo: 201 },
];

export const SEARCH_CATEGORY_CHIPS: { label: string; category: string }[] = [
  { label: "Phone", category: "phones" },
  { label: "Wallet", category: "wallets" },
  { label: "ID", category: "ids" },
  { label: "Keys", category: "keys" },
  { label: "Bag", category: "bags" },
  { label: "Laptop", category: "electronics" },
];

export const SUGGESTED_LOCATIONS: { label: string; city: string }[] = [
  { label: "Near me", city: "" },
  { label: "Quezon City", city: "Quezon City" },
  { label: "Makati", city: "Makati" },
  { label: "Manila", city: "Manila" },
  { label: "Cebu City", city: "Cebu City" },
  { label: "Baguio", city: "Baguio" },
  { label: "Davao City", city: "Davao City" },
];

export type PreviewItem = {
  title: string;
  kind: "lost" | "found";
  distance: string;
  match: number;
  category: string;
};


export const PH_ISLAND_PATHS: { d: string }[] = [
  // Luzon
  { d: "M176 74C198 68 222 80 238 100C254 120 264 150 280 168C296 186 308 212 316 244C322 266 334 282 342 300C348 314 342 336 330 348C322 356 308 352 302 340C296 330 302 318 294 306C282 296 264 292 252 284C238 276 226 280 212 292C202 302 188 292 178 280C168 268 164 250 158 232C152 212 146 188 148 168C150 148 156 124 162 104C168 88 172 80 176 74Z" },
  // Mindoro
  { d: "M168 300C188 300 194 316 190 332C186 346 170 352 160 344C150 336 152 318 160 308C164 302 165 300 168 300Z" },
  // Palawan
  { d: "M128 358C102 368 78 388 60 412C46 432 32 456 26 472C22 482 14 480 16 470C20 456 30 440 42 424C56 402 78 380 100 364C116 354 126 352 128 358Z" },
  // Panay
  { d: "M118 392C142 390 162 402 158 424C156 442 132 452 114 446C100 440 98 420 104 408C108 398 112 392 118 392Z" },
  // Negros
  { d: "M152 400C174 398 188 412 190 436C192 458 182 476 168 484C158 490 144 484 140 470C134 452 138 430 144 416C148 406 150 400 152 400Z" },
  // Cebu
  { d: "M196 390C208 396 214 416 212 438C210 458 204 474 198 484C193 489 187 484 188 472C189 450 192 424 194 404C195 398 195 394 196 390Z" },
  // Bohol
  { d: "M212 440C228 436 242 446 240 460C238 472 222 478 214 472C206 468 208 454 210 448Z" },
  // Leyte
  { d: "M228 396C246 400 252 420 250 442C248 462 244 482 238 494C234 500 228 496 226 486C224 470 224 444 226 420C227 408 227 400 228 396Z" },
  // Samar
  { d: "M262 396C284 396 298 412 296 436C294 454 280 468 268 472C260 474 256 464 258 450C260 432 260 410 262 396Z" },
  // Masbate
  { d: "M258 364C276 364 286 378 280 394C276 404 264 408 256 402C248 396 250 382 254 374C256 368 256 364 258 364Z" },
  // Marinduque
  { d: "M256 316C264 316 268 328 264 336C260 342 254 340 254 332Z" },
  // Catanduanes
  { d: "M350 258C364 258 370 274 362 286C356 294 348 292 348 282Z" },
  // Polillo
  { d: "M328 214C338 214 340 224 334 230C328 234 324 228 324 222Z" },
  // Mindanao
  { d: "M246 496C268 492 290 498 304 512C318 526 326 546 320 564C316 578 302 586 290 584C278 582 270 590 262 598C250 608 234 608 226 598C216 586 214 568 218 556C222 544 214 532 218 522C222 508 232 500 246 496Z" },
  // Zamboanga peninsula
  { d: "M224 520C212 528 196 548 192 560C189 568 184 568 186 558C190 544 198 524 210 514C216 508 222 512 224 520Z" },
];

export const PH_DOT_SPOTS: { x: number; y: number; r: number }[] = [
  // Batanes
  { x: 176, y: 26, r: 4 },
  { x: 198, y: 18, r: 3 },
  { x: 162, y: 34, r: 3 },
  // Romblon group
  { x: 206, y: 338, r: 3 },
  { x: 224, y: 352, r: 3 },
  { x: 238, y: 346, r: 4 },
  { x: 248, y: 332, r: 2.5 },
  // Cuyo group
  { x: 84, y: 478, r: 2.5 },
  { x: 96, y: 490, r: 2.5 },
  // Siquijor / Camiguin / Siargao
  { x: 210, y: 486, r: 2.5 },
  { x: 296, y: 516, r: 4 },
  { x: 326, y: 498, r: 3.5 },
  // Sulu archipelago
  { x: 168, y: 616, r: 3 },
  { x: 150, y: 606, r: 4 },
  { x: 134, y: 598, r: 3 },
  { x: 118, y: 592, r: 4 },
  { x: 104, y: 584, r: 3 },
  { x: 90, y: 576, r: 3.5 },
  { x: 78, y: 566, r: 3 },
  { x: 60, y: 560, r: 3 },
];

export const PH_VIEWBOX = "0 0 460 660";

export const DEMO_PREVIEWS: PreviewItem[] = [
  { title: "iPhone 13 (blue)", kind: "found", distance: "0.8 km away", match: 92, category: "phones" },
  { title: "iPhone 12 Pro", kind: "found", distance: "1.2 km away", match: 88, category: "phones" },
  { title: "Black phone case", kind: "lost", distance: "2.4 km away", match: 76, category: "phones" },
  { title: "Brown leather wallet", kind: "found", distance: "0.5 km away", match: 84, category: "wallets" },
  { title: "Laptop with charger", kind: "lost", distance: "3.1 km away", match: 61, category: "electronics" },
  { title: "School ID card", kind: "found", distance: "1.9 km away", match: 79, category: "ids" },
];

// --- Philippines (stylized, hand-tuned archipelago) -------------------------

export type PhCity = { name: string; x: number; y: number };

export const PH_CITIES: PhCity[] = [
  { name: "Baguio", x: 172, y: 128 },
  { name: "Manila", x: 198, y: 266 },
  { name: "Quezon City", x: 216, y: 258 },
  { name: "Iloilo", x: 128, y: 424 },
  { name: "Cebu", x: 199, y: 430 },
  { name: "Davao", x: 282, y: 566 },
];
