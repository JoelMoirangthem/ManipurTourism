# Claim audit register

Version 0.2 · 21 September 2026 · One row per externally verifiable claim used in the pitch or documents. Status values: **supported** (evidence found and bounded), **attributed** (third-party statement, not independently verified), **unverified** (no evidence located in this research), **hypothesis** (a proposal, not a finding), **unknown** (not established, must not be asserted).

Update the affected [sources.md](sources.md) entry, the [rules.md](rules.md) consequence and any dependent requirement or test when a status changes.

| ID | Claim | Status | Evidence and exact limit |
|---|---|---|---|
| C-01 | A hackathon titled “Reimagining Manipur” is scheduled for 23 September 2026 at IT SEZ, Mantripukhri, Imphal | supported | Organizer-partner public announcement [S01](sources.md#s01); announced scope, not a rulebook |
| C-02 | The Department of IT and Department of Tourism, Government of Manipur, are the organizing departments, with MTIF in a partner role | supported | [S01](sources.md#s01) says “Ecosystem Partner”; [S02](sources.md#s02) says “Knowledge Partner”. **Wording conflicts.** Use neutral “with MTIF” until confirmed |
| C-03 | Registration by 21 September 2026, ₹500 per team, “Open to All”, prizes totalling ₹1.5 lakh, incubation support for winners | attributed | Secondary announcement explicitly supplied by MTIF [S02](sources.md#s02); not a rulebook or transaction page. A “register by” date does not establish a cutoff time |
| C-04 | The event celebrates World Tourism Day 2026 and includes smart tourism, heritage, sustainable tourism, tourist experience, AI/AR/VR and accessibility/multilingual themes | supported | [S01](sources.md#s01), [S02](sources.md#s02). Theme tags are not mandatory implementation requirements |
| C-05 | An online MTIF platform with a hackathon registration entry exists | supported | [S03](sources.md#s03). No account created, no form submitted |
| C-06 | The official accommodation directory publishes property-level room counts, including 13 rooms for the named Sendra Resort | supported | [S04](sources.md#s04). Publication date unknown; contact details not call-verified |
| C-07 | Current room availability at the Sendra property | unknown | Not established by any source inspected. Do not present any number as availability |
| C-08 | “Sendra has about 10 rooms total” | unverified | No supporting source in this research. The local tender PDF yielded no extractable text [S21](sources.md#s21) |
| C-09 | The state tourism website links accommodation discovery, destination pages, an online ILP service and festival edition pages | supported | [S05](sources.md#s05). A link proves discoverability, not end-to-end functioning |
| C-10 | Inspected official festival hubs expose previous editions and no explicit 2026 schedule | supported | [S05](sources.md#s05), [S06](sources.md#s06). Absence on one page is not proof of no announcement anywhere |
| C-11 | Manipur Tourism Policy 2022 contains intent to improve online tourist information, tourism statistics and updated tourism literature | supported | Local PDF pages 26, 29 and 36 [S07](sources.md#s07). Policy intent is not implementation evidence |
| C-12 | An official online Inner Line Permit application service exists | supported | [S08](sources.md#s08). No application completed; eligibility not determined; foreign visitor guidance separate |
| C-13 | Official domestic and foreign visitor statistics are published in a raster table | supported | [S09](sources.md#s09). This pack makes no numeric decline, causation or market-size claim |
| C-14 | Sarvam Translate documents Manipuri `mni-IN` and explicitly does not support `output_script` | supported | [S10](sources.md#s10). Tourism-domain quality untested; out-of-scope languages remain unsupported |
| C-15 | Mayura's script controls include Manipuri | unverified | Manipuri is not in Mayura's documented language list [S11](sources.md#s11); its 11-versus-12 language discrepancy is unexplained |
| C-16 | IndicXlit performs transliteration with Manipuri listed | supported | [S12](sources.md#s12). Transliteration is not meaning translation; exact Manipuri script mapping unestablished |
| C-17 | BHASHINI exposes Manipuri in task/model listings, and onboarding requires registration | supported | [S13](sources.md#s13), [S14](sources.md#s14). No credentials obtained; no SLA established |
| C-18 | Gemini grounding with Google Search performs sourced retrieval with citations | supported | [S15](sources.md#s15). Citations do not prove correctness, freshness or operational confirmation |
| C-19 | IMD publishes API documentation requiring IP whitelisting and attribution | supported | [S17](sources.md#s17). Project access unconfirmed; no whitelisted integration tested |
| C-20 | Open-Meteo provides keyless model-derived forecast data with valid-time fields; free access excludes commercial and promotional use | supported | [S18](sources.md#s18), [S19](sources.md#s19). Model output is not a site sensor observation; hackathon participation does not establish eligibility |
| C-21 | Browser background execution is not a delivery guarantee | supported | [S20](sources.md#s20). Product reliability claims require own testing |
| C-22 | An official tender exists for operation and maintenance of the Sendra Hillock resort and the Takmu water-sports complex | supported | Landing page [S21](sources.md#s21). Room schedule, issue date and selected operator unverified; tender assets are not current inventory |
| C-23 | Tourists' and hosts' most important pain points, and willingness to use or pay | hypothesis | No interviews completed. Product proposals are not findings |
| C-24 | Communication and planning gaps suppress tourism outcomes in Manipur | hypothesis | Plausible and consistent with observed information-format limits, but not measured. No causal model |
| C-25 | Real-time road, weather or room feeds for Manipur tourism are available to this project | unknown | Some documented APIs exist [S17–S19]; no project integration, authorization or coverage test completed. Absence of access to this team is not proof no feed exists |
| C-26 | A manually updated dataset is “real-time” | unsupported | Propagation speed and field-observation freshness are different properties [R07](rules.md). Call it a dated report |
| C-27 | Government officials or village councils will verify and maintain updates | hypothesis | Requires explicit agreement. No partner commitment obtained |
| C-28 | A narrow assistant scope eliminates hallucination | unsupported | Scope reduction lowers exposure; validation, uncertainty labelling and evaluation remain required |
| C-29 | A full application is unrealistic for local providers because of connectivity | hypothesis | Low-bandwidth design is prudent; actual devices, preferences and connectivity must be tested |
| C-30 | Feature-level comparison against existing official and commercial services | hypothesis | Limited functional comparison of inspected sources only; not an exhaustive competitiveness audit |
| C-31 | A title for the festival that can be held at a resort on a river island and certain civic and heritage sites is being offered for operation under a government tender | supported | [S21](sources.md#s21) landing page. Operating status, room inventory and site configuration remain unknown |

## How to change a status

1. Record the new source or observation in [sources.md](sources.md) with its date and scope.
2. Update the claim row here, keeping the previous status visible in the change log of [memory.md](memory.md) when the reversal matters.
3. Update any requirement, UI copy or test that relied on the earlier status.
4. Never upgrade “unverified” to “supported” because a source looks authoritative; upgrade only when the specific wording supports the specific claim.
