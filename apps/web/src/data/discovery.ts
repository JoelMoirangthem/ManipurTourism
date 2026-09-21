export type Collection = { slug: string; title: string; blurb: string; district?: string; category?: string; href: string };
export const COLLECTIONS: Collection[] = [
  { slug: "lakeside", title: "Lakeside Manipur", blurb: "Loktak, Keibul Lamjao, Sendra and Takmu — phumdis, Sangai deer habitat, and calm waters.", district: "Bishnupur", href: "/places?district=Bishnupur" },
  { slug: "heritage-imphal", title: "Heritage Imphal", blurb: "Kangla Fort, Ima Keithel, Govindajee Temple and Shaheed Minar — royalty, living markets and Meitei history.", district: "Imphal West", href: "/places?district=Imphal%20West" },
  { slug: "war-memory", title: "War Memory Trail", blurb: "Imphal War Cemetery, Red Hill Peace Memorial, and Khongjom — WWII battlegrounds and Anglo-Manipur bravery.", href: "/places?category=Heritage" },
  { slug: "faith-craft", title: "Faith & Living Craft", blurb: "Andro Heritage Village, Mutua Museum, Kaina and Bijoy Govindaji — ancient pottery and devotional traditions.", href: "/places?category=Culture" },
  { slug: "caves-waterfalls", title: "Caves & Waterfalls", blurb: "Khangkhui Lime Caves, Tharon Cave, Sadu Chiru and Seven Barak Waterfalls — wild subterranean and canyon wonder.", href: "/places?category=Nature" },
  { slug: "trek-country", title: "Trek & High Country", blurb: "Shirui Peak, Dzukou Valley, and Singda Dam — Shirui lilies, alpine meadows, and highland breezes.", category: "Trek", href: "/places?category=Trek" },
];

export type Season = { name: string; months: string; temp: string; note: string };
export const SEASONS: Season[] = [
  { name: "Best window", months: "Oct – Mar", temp: "8–25°C clear", note: "Sightseeing, festivals, calm lake waters. Peak Oct–Feb." },
  { name: "Lush summer", months: "Mar – Jun", temp: "16–35°C", note: "Green valleys, Shirui Lily May–Jun. Warm afternoons." },
  { name: "Monsoon caution", months: "Jun – Sep", temp: "~1500mm rain", note: "Lush but heavy rain; hill roads difficult. Check conditions." },
];

export type Festival = { name: string; pattern: string; venues: string; sourceUrl: string; sourceLabel: string };
export const FESTIVALS: Festival[] = [
  { name: "Sangai Festival", pattern: "21–30 Nov yearly", venues: "Hapta Kangjeibung, BOAT, polo ground, Loktak", sourceUrl: "https://manipurtourism.gov.in/manipur-sangai-festival-2025-programme/", sourceLabel: "manipurtourism.gov.in" },
  { name: "Shirui Lily Festival", pattern: "May yearly", venues: "Shirui Village, TNL Ground, Phangrei, Ukhrul", sourceUrl: "https://manipurtourism.gov.in/shirui-lily-festival/", sourceLabel: "manipurtourism.gov.in" },
  { name: "Yaoshang", pattern: "Feb–Mar full moon, 5 days", venues: "Kangla Fort to local grounds, Govindajee Temple", sourceUrl: "https://manipurtourism.gov.in/events/", sourceLabel: "manipurtourism.gov.in" },
];
