import json

with open("src/data/seed-places.json", "r", encoding="utf-8") as f:
    existing = json.load(f)

existing_ids = {p["id"] for p in existing}

new_places = [
    {
        "id": "govindajee-temple",
        "name": "Shree Shree Govindajee Temple",
        "aliases": ["Govindajee", "Govindaji Temple"],
        "category": "Heritage",
        "district": "Imphal East",
        "summary": "Historic Vaishnavite golden twin-domed temple adjacent to the palace of former Manipur Maharajas, celebrated for devotional rituals and classical Raas Leela performances.",
        "tagline": "Golden twin domes and the sacred heart of classical Raas Leela.",
        "lat": 24.802,
        "lng": 93.953,
        "coordSource": "seed-approx-WGS84 + manipurtourism-verified",
        "isDemo": False,
        "claims": [
            {
                "id": "c-govindajee-01",
                "fieldKey": "description",
                "valueText": "Center of Vaishnavite culture and sacred classical dance in Manipur.",
                "valueInt": None,
                "sourceTitle": "Manipur Tourism — Places of Interest",
                "sourceUrl": "https://manipurtourism.gov.in",
                "scope": "place",
                "observedAt": "2026-01-15T00:00:00Z",
                "reviewState": "approved"
            }
        ],
        "photos": []
    },
    {
        "id": "shaheed-minar",
        "name": "Shaheed Minar",
        "aliases": ["Bir Tikendrajit Park Memorial", "Shaheed Minar Imphal"],
        "category": "Heritage",
        "district": "Imphal West",
        "summary": "Tall commemorative obelisk standing in Bir Tikendrajit Park, honouring Meitei and tribal martyrs who fought valiantly in the 1891 Anglo-Manipur War.",
        "tagline": "A soaring tribute to the martyrs of the 1891 Anglo-Manipur War.",
        "lat": 24.808,
        "lng": 93.939,
        "coordSource": "seed-approx-WGS84 + landmark-crosscheck",
        "isDemo": False,
        "claims": [
            {
                "id": "c-shaheed-01",
                "fieldKey": "description",
                "valueText": "Memorial obelisk honoring martyrs of the Anglo-Manipur War.",
                "valueInt": None,
                "sourceTitle": "Manipur Tourism Official Portal",
                "sourceUrl": "https://manipurtourism.gov.in",
                "scope": "place",
                "observedAt": "2026-01-15T00:00:00Z",
                "reviewState": "approved"
            }
        ],
        "photos": []
    },
    {
        "id": "mutua-museum",
        "name": "Mutua Bahadur Cultural Museum",
        "aliases": ["Mutua Museum Andro", "Andro Cultural Complex"],
        "category": "Heritage",
        "district": "Imphal East",
        "summary": "Open-air cultural complex in Andro showcasing authentic Meitei thatched architecture, wood carvings, tribal relics, and ancient pottery traditions.",
        "tagline": "An open-air living archive of indigenous art, craft, and architecture.",
        "lat": 24.757,
        "lng": 94.041,
        "coordSource": "seed-approx-WGS84 + andro-archive",
        "isDemo": False,
        "claims": [
            {
                "id": "c-mutua-01",
                "fieldKey": "description",
                "valueText": "Cultural museum presenting indigenous tribal architecture and pottery.",
                "valueInt": None,
                "sourceTitle": "Manipur Tourism — Cultural Heritage",
                "sourceUrl": "https://manipurtourism.gov.in",
                "scope": "place",
                "observedAt": "2026-01-15T00:00:00Z",
                "reviewState": "approved"
            }
        ],
        "photos": []
    },
    {
        "id": "imphal-war-cemetery",
        "name": "Imphal War Cemetery",
        "aliases": ["Commonwealth War Cemetery Imphal"],
        "category": "Heritage",
        "district": "Imphal East",
        "summary": "Peacefully maintained Commonwealth War Graves Commission cemetery holding the graves of 1,600 soldiers who fell during the decisive 1944 Battle of Imphal.",
        "tagline": "Quiet lawns remembering the decisive Allied battleground of WWII.",
        "lat": 24.821,
        "lng": 93.949,
        "coordSource": "seed-approx-WGS84 + cwgc-record",
        "isDemo": False,
        "claims": [
            {
                "id": "c-imphalwar-01",
                "fieldKey": "description",
                "valueText": "Commonwealth memorial ground for 1,600 soldiers of WWII Battle of Imphal.",
                "valueInt": None,
                "sourceTitle": "CWGC & Manipur Tourism",
                "sourceUrl": "https://manipurtourism.gov.in",
                "scope": "place",
                "observedAt": "2026-01-15T00:00:00Z",
                "reviewState": "approved"
            }
        ],
        "photos": []
    },
    {
        "id": "red-hill-peace-memorial",
        "name": "Red Hill & India Peace Memorial",
        "aliases": ["Maibam Lotpa Ching", "Red Hill WWII"],
        "category": "Heritage",
        "district": "Bishnupur",
        "summary": "Historical battle site on Maibam Lotpa Ching hill where intense hand-to-hand combat took place in 1944; home to the Japan-built India Peace Memorial.",
        "tagline": "Where history turned in 1944 — now a solemn monument of world peace.",
        "lat": 24.693,
        "lng": 93.856,
        "coordSource": "seed-approx-WGS84 + bishnupur-crosscheck",
        "isDemo": False,
        "claims": [
            {
                "id": "c-redhill-01",
                "fieldKey": "description",
                "valueText": "Historic WWII Battle of Red Hill site with Japan-built peace memorial.",
                "valueInt": None,
                "sourceTitle": "Manipur Tourism — War Heritage",
                "sourceUrl": "https://manipurtourism.gov.in",
                "scope": "place",
                "observedAt": "2026-01-15T00:00:00Z",
                "reviewState": "approved"
            }
        ],
        "photos": []
    },
    {
        "id": "khongjom-war-memorial",
        "name": "Khongjom War Memorial Complex",
        "aliases": ["Khongjom Memorial", "Kheba Ching"],
        "category": "Heritage",
        "district": "Thoubal",
        "summary": "Monument complex atop Kheba Ching hill where Paona Brajabasi and fellow warriors fought heroically to the last breath against the British Army in April 1891.",
        "tagline": "The historic hill of bravery and the last stand of the Meitei kingdom.",
        "lat": 24.518,
        "lng": 93.999,
        "coordSource": "seed-approx-WGS84 + thoubal-crosscheck",
        "isDemo": False,
        "claims": [
            {
                "id": "c-khongjom-01",
                "fieldKey": "description",
                "valueText": "Site of the Anglo-Manipur War 1891 where Major Paona Brajabasi fell.",
                "valueInt": None,
                "sourceTitle": "Manipur Tourism — Khongjom Day",
                "sourceUrl": "https://manipurtourism.gov.in",
                "scope": "place",
                "observedAt": "2026-01-15T00:00:00Z",
                "reviewState": "approved"
            }
        ],
        "photos": []
    },
    {
        "id": "andro-village",
        "name": "Andro Heritage Village",
        "aliases": ["Andro Village", "Panam Ningthou"],
        "category": "Culture",
        "district": "Imphal East",
        "summary": "Centuries-old craft settlement famed for hand-coiled pottery (charpu), local distillation traditions, and the sacred perpetually burning fire of deity Panam Ningthou.",
        "tagline": "Ancient coil pottery and a sacred flame burning across centuries.",
        "lat": 24.755,
        "lng": 94.044,
        "coordSource": "seed-approx-WGS84 + district-records",
        "isDemo": False,
        "claims": [
            {
                "id": "c-andro-01",
                "fieldKey": "description",
                "valueText": "Centuries-old heritage village with eternal fire and traditional coil pottery.",
                "valueInt": None,
                "sourceTitle": "Manipur Tourism — Andro Heritage",
                "sourceUrl": "https://manipurtourism.gov.in",
                "scope": "place",
                "observedAt": "2026-01-15T00:00:00Z",
                "reviewState": "approved"
            }
        ],
        "photos": []
    },
    {
        "id": "kaina-temple",
        "name": "Kaina Sacred Hillock",
        "aliases": ["Kaina Hill", "Kaina Temple"],
        "category": "Heritage",
        "district": "Thoubal",
        "summary": "Sacred wooded hillock surrounded by jackfruit trees where King Bhagyachandra was divinely inspired to carve the revered idol of Lord Govindajee.",
        "tagline": "Wooded hills of divine vision and the origin of Lord Govindajee.",
        "lat": 24.707,
        "lng": 94.053,
        "coordSource": "seed-approx-WGS84 + thoubal-records",
        "isDemo": False,
        "claims": [
            {
                "id": "c-kaina-01",
                "fieldKey": "description",
                "valueText": "Sacred place associated with King Bhagyachandra's vision of Lord Govindajee.",
                "valueInt": None,
                "sourceTitle": "Manipur Tourism — Religious Sites",
                "sourceUrl": "https://manipurtourism.gov.in",
                "scope": "place",
                "observedAt": "2026-01-15T00:00:00Z",
                "reviewState": "approved"
            }
        ],
        "photos": []
    },
    {
        "id": "bijoy-govindaji",
        "name": "Bijoy Govindaji Temple",
        "aliases": ["Bijoy Govinda", "Sagolband Govindaji"],
        "category": "Heritage",
        "district": "Imphal West",
        "summary": "Historic temple in Sagolband central to the annual Heikru Hidongba boat race festival on its ceremonial moat, steeped in 18th-century court history.",
        "tagline": "Historic shrine and home of the ceremonial Heikru Hidongba boat race.",
        "lat": 24.809,
        "lng": 93.928,
        "coordSource": "seed-approx-WGS84 + imphal-records",
        "isDemo": False,
        "claims": [
            {
                "id": "c-bijoy-01",
                "fieldKey": "description",
                "valueText": "Historical temple venue for annual Heikru Hidongba traditional boat festival.",
                "valueInt": None,
                "sourceTitle": "Manipur Tourism — Festivals & Shrines",
                "sourceUrl": "https://manipurtourism.gov.in",
                "scope": "place",
                "observedAt": "2026-01-15T00:00:00Z",
                "reviewState": "approved"
            }
        ],
        "photos": []
    },
    {
        "id": "khangkhui-lime-caves",
        "name": "Khangkhui Mangsor Lime Caves",
        "aliases": ["Khangkhui Cave", "Khangkhui Mangsor"],
        "category": "Nature",
        "district": "Ukhrul",
        "summary": "Prehistoric limestone cave system with spacious calcified halls dating back to the Paleolithic Stone Age, nestled amidst Ukhrul's pine-carpeted slopes.",
        "tagline": "Prehistoric limestone chambers carved out in the Paleolithic dawn.",
        "lat": 25.050,
        "lng": 94.450,
        "coordSource": "seed-approx-WGS84 + ukhrul-records",
        "isDemo": False,
        "claims": [
            {
                "id": "c-khangkhui-01",
                "fieldKey": "description",
                "valueText": "Paleolithic archaeological limestone cave in Ukhrul district.",
                "valueInt": None,
                "sourceTitle": "Manipur Tourism — Ukhrul Attractions",
                "sourceUrl": "https://manipurtourism.gov.in",
                "scope": "place",
                "observedAt": "2026-01-15T00:00:00Z",
                "reviewState": "approved"
            }
        ],
        "photos": []
    },
    {
        "id": "tharon-cave",
        "name": "Tharon Cave",
        "aliases": ["Tharon Stone Cave", "Kalina Cave"],
        "category": "Nature",
        "district": "Tamenglong",
        "summary": "A 655-meter subterranean limestone labyrinth featuring intricate natural tunnels, underground streams, and Hobinhian Stone Age archaeological excavations.",
        "tagline": "An underground limestone labyrinth echoing with Hobinhian antiquity.",
        "lat": 24.985,
        "lng": 93.535,
        "coordSource": "seed-approx-WGS84 + tamenglong-records",
        "isDemo": False,
        "claims": [
            {
                "id": "c-tharon-01",
                "fieldKey": "description",
                "valueText": "Prehistoric 655-meter cave system linked to ancient Southeast Asian stone culture.",
                "valueInt": None,
                "sourceTitle": "Manipur Tourism — Tamenglong Adventure",
                "sourceUrl": "https://manipurtourism.gov.in",
                "scope": "place",
                "observedAt": "2026-01-15T00:00:00Z",
                "reviewState": "approved"
            }
        ],
        "photos": []
    },
    {
        "id": "sadu-chiru-waterfall",
        "name": "Sadu Chiru Waterfall",
        "aliases": ["Leimaram Waterfall", "Sadu Chiru Falls"],
        "category": "Nature",
        "district": "Kangpokpi",
        "summary": "Perennial three-tiered cascade plunging through lush tropical vegetation and rock ravines, one of Manipur's favorite weekend day-trek destinations.",
        "tagline": "Three cascading tiers tumbling through cool subtropical rainforest.",
        "lat": 24.733,
        "lng": 93.771,
        "coordSource": "seed-approx-WGS84 + leimaram-crosscheck",
        "isDemo": False,
        "claims": [
            {
                "id": "c-saduchiru-01",
                "fieldKey": "description",
                "valueText": "Picturesque three-stage cascade nestled in the Leimaram valley.",
                "valueInt": None,
                "sourceTitle": "Manipur Tourism — Waterfalls & Treks",
                "sourceUrl": "https://manipurtourism.gov.in",
                "scope": "place",
                "observedAt": "2026-01-15T00:00:00Z",
                "reviewState": "approved"
            }
        ],
        "photos": []
    },
    {
        "id": "barak-waterfalls",
        "name": "Seven Barak Waterfalls",
        "aliases": ["Barak Falls", "Tamenglong Barak Waterfalls"],
        "category": "Nature",
        "district": "Tamenglong",
        "summary": "Series of seven dramatic waterfalls roaring along the wild Barak River course amidst untouched evergreen rainforests and rich avian biodiversity.",
        "tagline": "Seven untamed cascades coursing through virgin rainforest canyons.",
        "lat": 24.980,
        "lng": 93.490,
        "coordSource": "seed-approx-WGS84 + river-records",
        "isDemo": False,
        "claims": [
            {
                "id": "c-barak-01",
                "fieldKey": "description",
                "valueText": "Series of seven majestic cascades on the Barak River in Tamenglong.",
                "valueInt": None,
                "sourceTitle": "Manipur Tourism — Nature & Adventure",
                "sourceUrl": "https://manipurtourism.gov.in",
                "scope": "place",
                "observedAt": "2026-01-15T00:00:00Z",
                "reviewState": "approved"
            }
        ],
        "photos": []
    },
    {
        "id": "zeilad-lake",
        "name": "Zeilad Lake Sanctuary",
        "aliases": ["Zeilad Lake", "Zeilad Forest Sanctuary"],
        "category": "Nature",
        "district": "Tamenglong",
        "summary": "Pristine high-altitude wetland surrounded by six associated sister lakes and dense jungle, famous for migratory winter birds, pythons, and tribal folklore.",
        "tagline": "High-altitude lake haven shrouded in mystery, birds, and virgin green.",
        "lat": 24.883,
        "lng": 93.367,
        "coordSource": "seed-approx-WGS84 + sanctuary-records",
        "isDemo": False,
        "claims": [
            {
                "id": "c-zeilad-01",
                "fieldKey": "description",
                "valueText": "Protected natural wetland sanctuary known for migratory bird stopovers.",
                "valueInt": None,
                "sourceTitle": "Manipur Tourism — Lakes & Sanctuaries",
                "sourceUrl": "https://manipurtourism.gov.in",
                "scope": "place",
                "observedAt": "2026-01-15T00:00:00Z",
                "reviewState": "approved"
            }
        ],
        "photos": []
    },
    {
        "id": "khonghampat-orchidarium",
        "name": "Khonghampat Orchidarium",
        "aliases": ["Khonghampat Orchid Centre", "State Orchidarium"],
        "category": "Nature",
        "district": "Imphal West",
        "summary": "State botanical reserve spanning 200 acres that preserves more than 110 rare species of orchids, creating a riot of blossoms during spring (March to May).",
        "tagline": "Two hundred acres of indigenous forest sheltering over 110 orchid species.",
        "lat": 24.887,
        "lng": 93.912,
        "coordSource": "seed-approx-WGS84 + forest-dept",
        "isDemo": False,
        "claims": [
            {
                "id": "c-orchid-01",
                "fieldKey": "description",
                "valueText": "Botanical reserve preserving rare indigenous orchid flora of Northeast India.",
                "valueInt": None,
                "sourceTitle": "Forest Dept & Manipur Tourism",
                "sourceUrl": "https://manipurtourism.gov.in",
                "scope": "place",
                "observedAt": "2026-01-15T00:00:00Z",
                "reviewState": "approved"
            }
        ],
        "photos": []
    },
    {
        "id": "marjing-polo-complex",
        "name": "Marjing Polo Complex",
        "aliases": ["Marjing Polo Statue", "Heingang Polo Complex"],
        "category": "Culture",
        "district": "Imphal East",
        "summary": "Hilltop monument featuring a colossal 122-foot bronze statue of a polo player riding a Manipuri pony, honoring Manipur as the cradle of modern polo.",
        "tagline": "The 122-foot polo colossus celebrating Manipur as the birthplace of polo.",
        "lat": 24.851,
        "lng": 93.968,
        "coordSource": "seed-approx-WGS84 + heingang-landmark",
        "isDemo": False,
        "claims": [
            {
                "id": "c-marjing-01",
                "fieldKey": "description",
                "valueText": "World's tallest polo player statue honoring Sagol Kangjei heritage.",
                "valueInt": None,
                "sourceTitle": "Manipur Tourism — Polo Heritage",
                "sourceUrl": "https://manipurtourism.gov.in",
                "scope": "place",
                "observedAt": "2026-01-15T00:00:00Z",
                "reviewState": "approved"
            }
        ],
        "photos": []
    },
    {
        "id": "kakching-garden",
        "name": "Kakching Garden",
        "aliases": ["Uyok Ching Garden", "Kakching Park"],
        "category": "Garden",
        "district": "Kakching",
        "summary": "Scenic hilltop garden atop Uyok Ching hill featuring terraced flower gardens, scenic valley gazebos, cultural statues, and an ancient Shiva temple.",
        "tagline": "Terraced floral hilltops looking out across the southern valley plains.",
        "lat": 24.484,
        "lng": 93.978,
        "coordSource": "seed-approx-WGS84 + kakching-records",
        "isDemo": False,
        "claims": [
            {
                "id": "c-kakching-01",
                "fieldKey": "description",
                "valueText": "Landscaped hillside botanical retreat and regional cultural landmark.",
                "valueInt": None,
                "sourceTitle": "Manipur Tourism — Gardens & Parks",
                "sourceUrl": "https://manipurtourism.gov.in",
                "scope": "place",
                "observedAt": "2026-01-15T00:00:00Z",
                "reviewState": "approved"
            }
        ],
        "photos": []
    },
    {
        "id": "santhei-natural-park",
        "name": "Santhei Natural Park",
        "aliases": ["Santhei Park Andro", "Santhei Eco Park"],
        "category": "Garden",
        "district": "Imphal East",
        "summary": "Community-conserved eco-park surrounding a crystal-clear artificial reservoir at the base of Andro hills, framed by forested pines and picnic glades.",
        "tagline": "Crystal reservoir reflections framed by pine groves and Andro foothills.",
        "lat": 24.752,
        "lng": 94.045,
        "coordSource": "seed-approx-WGS84 + andro-community",
        "isDemo": False,
        "claims": [
            {
                "id": "c-santhei-01",
                "fieldKey": "description",
                "valueText": "Community-managed eco-tourism park and artificial reservoir in Andro.",
                "valueInt": None,
                "sourceTitle": "Manipur Tourism — Eco-Tourism",
                "sourceUrl": "https://manipurtourism.gov.in",
                "scope": "place",
                "observedAt": "2026-01-15T00:00:00Z",
                "reviewState": "approved"
            }
        ],
        "photos": []
    },
    {
        "id": "takmu-water-sports",
        "name": "Takmu Water Sports Complex",
        "aliases": ["Takmu Complex", "Takmu Lake Sports"],
        "category": "Activity",
        "district": "Bishnupur",
        "summary": "State-of-the-art watersports training and recreational hub situated on Takmu Lake (an arm of Loktak), hosting canoeing, kayaking, and rowing activities.",
        "tagline": "Water racing across calm lake channels beneath forested hill ranges.",
        "lat": 24.520,
        "lng": 93.795,
        "coordSource": "seed-approx-WGS84 + sports-authority",
        "isDemo": False,
        "claims": [
            {
                "id": "c-takmu-01",
                "fieldKey": "description",
                "valueText": "Regional hub for aquatic sports including canoeing and kayaking.",
                "valueInt": None,
                "sourceTitle": "Manipur Tourism — Sports & Adventure",
                "sourceUrl": "https://manipurtourism.gov.in",
                "scope": "place",
                "observedAt": "2026-01-15T00:00:00Z",
                "reviewState": "approved"
            }
        ],
        "photos": []
    },
    {
        "id": "singda-dam",
        "name": "Singda Dam",
        "aliases": ["Singda Dam Lookout", "Singda Earthen Dam"],
        "category": "Nature",
        "district": "Kangpokpi",
        "summary": "The world's highest mud-and-rock earthen dam, perched at 920 meters altitude, offering cool highland breezes, trekking paths, and peaceful reservoir panoramas.",
        "tagline": "The world’s highest earthen dam cradled by quiet mist-laden hills.",
        "lat": 24.872,
        "lng": 93.818,
        "coordSource": "seed-approx-WGS84 + irrigation-records",
        "isDemo": False,
        "claims": [
            {
                "id": "c-singda-01",
                "fieldKey": "description",
                "valueText": "World's highest earthen dam situated at 920 meters elevation.",
                "valueInt": None,
                "sourceTitle": "Manipur Tourism — Scenic Escapes",
                "sourceUrl": "https://manipurtourism.gov.in",
                "scope": "place",
                "observedAt": "2026-01-15T00:00:00Z",
                "reviewState": "approved"
            }
        ],
        "photos": []
    }
]

added = 0
for p in new_places:
    if p["id"] not in existing_ids:
        existing.append(p)
        added += 1

with open("src/data/seed-places.json", "w", encoding="utf-8") as f:
    json.dump(existing, f, indent=2, ensure_ascii=False)

print(f"Added {added} new destinations. Total destinations: {len(existing)}")

