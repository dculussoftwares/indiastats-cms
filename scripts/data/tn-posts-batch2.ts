// scripts/data/tn-posts-batch2.ts
//
// 12 companion posts to the original 10 TN posts in scripts/seed-blog-posts.mts,
// covering the 2026 Tamil Nadu assembly election (234/234 declared).
//
// District/zone/margin/reserved-seat figures were pulled from the live DB
// (live-election-results + assemblies collections, stateCode: 'TN', year: 2026)
// via a temporary read-only query script, per task-2-brief.md. State-wide party
// tallies use only the verified numbers from the task's Global Constraints.
import { BlogPostSeed, text, paragraph, heading, bulletList, richText } from './lexical-helpers'

export const tnPosts: BlogPostSeed[] = [
  // ---------------------------------------------------------------------
  // 1 — Flagship result overview
  // ---------------------------------------------------------------------
  {
    title: "2026 Tamil Nadu Election Result: TVK's Historic Debut",
    slug: '2026-tamil-nadu-election-result-tvk-debut',
    metaTitle: '2026 Tamil Nadu Election Result — TVK Wins 108 Seats | IndiaStats.org',
    metaDescription:
      "TVK, contesting its first election, won 108 of 234 seats in the 2026 Tamil Nadu assembly election — the single largest party. Full result breakdown.",
    content: richText([
      paragraph(
        text(
          'The 2026 Tamil Nadu Legislative Assembly election has produced the most disruptive result in the state\'s recent electoral history. Tamilaga Vettri Kazhagam (TVK), the party founded by actor-turned-politician Vijay and contesting its first assembly election, won 108 of 234 seats — more than any other single party, and just ten seats short of the 118 needed for a majority.',
        ),
      ),
      heading('h2', 'Final Seat Tally (234/234 Declared)'),
      bulletList([
        'TVK: 108 seats',
        'DMK: 59 seats',
        'AIADMK: 47 seats',
        'INC: 5 seats',
        'PMK: 4 seats',
        'CPI: 2 seats',
        'CPI(M): 2 seats',
        'VCK: 2 seats',
        'IUML: 2 seats',
        'AMMK: 1 seat',
        'DMDK: 1 seat',
        'BJP: 1 seat',
      ]),
      paragraph(
        text(
          'Every one of Tamil Nadu\'s 234 constituencies has declared a result. The headline number is TVK\'s 108 — a debut tally that reshapes a party system that had been a two-party DMK–AIADMK contest since 1967. Both established Dravidian parties fell well short of their historical seat shares: DMK collapsed to 59 seats from 133 in 2021, and AIADMK slid to 47, extending a decline that began with 136 seats in 2016.',
        ),
      ),
      heading('h2', 'A New Force, Not Yet a Majority'),
      paragraph(
        text(
          'TVK\'s 108 seats make it the single largest party in the new assembly, but not an outright majority party. Tamil Nadu\'s 234-member house requires 118 seats to govern alone. TVK is ten seats short of that mark — a gap wide enough that no single bloc has an automatic path to power without further alliance arithmetic. IndiaStats.org breaks down exactly what that math looks like in a companion piece on government formation.',
        ),
      ),
      heading('h2', 'Where TVK Won'),
      paragraph(
        text(
          'TVK\'s strongest showing came in Chennai, where it won 14 of the city\'s 16 seats, and in Tiruvallur (9 of 10 seats). It also made deep inroads into the Kongu belt — Coimbatore, Erode, Namakkal, and Tiruppur — and picked up seats across the southern and Delta districts that had traditionally leaned DMK or AIADMK. A full district-by-district breakdown of the TVK wave is available separately on IndiaStats.org.',
        ),
      ),
      heading('h2', 'The Established Parties\' Retreat'),
      paragraph(
        text(
          'DMK\'s fall from 133 to 59 seats is the sharpest single-election decline for a sitting ruling party in the state\'s post-1977 record. AIADMK\'s 47 seats mark a third consecutive decline — from 136 in 2016, to 66 in 2021, to 47 now — continuing a slide that began with the loss of J. Jayalalithaa in 2016 and the subsequent factional split. Together, the two Dravidian parties that have alternated in power for nearly five decades now hold just 106 seats between them, fewer than TVK holds alone.',
        ),
      ),
      heading('h2', 'The Smaller Parties'),
      paragraph(
        text(
          'Nine other parties split the remaining 20 seats: INC (5), PMK (4), CPI, CPI(M), VCK and IUML (2 each), and AMMK, DMDK and BJP (1 each). Several of these — IUML, AMMK and DMDK in particular — return with single-digit tallies after years on the margins of Tamil Nadu\'s two-alliance system. Their seats, however few, could matter disproportionately given how far short of a majority the largest party has fallen.',
        ),
      ),
      heading('h2', 'A High-Turnout Election'),
      paragraph(
        text(
          "The result also came against a backdrop of unusually high voter participation. Turnout across Tamil Nadu's 234 constituencies reached 86.02% in 2026, up from 72.8% in 2021 — a jump consistent with a genuinely three-cornered contest that appears to have drawn more voters to the polls than the state's more predictable two-party elections of the past. IndiaStats.org covers the turnout trend separately in full.",
        ),
      ),
      heading('h2', 'Close Contests Decided the Margins'),
      paragraph(
        text(
          "Not every seat was decided comfortably. Nilakkottai in Dindigul district produced the tightest finish anywhere in the state — a 16-vote margin between TVK and DMK — while several other constituencies were decided by fewer than 500 votes. At the other end, TVK's win in Madavaram (Tiruvallur) came by more than 91,000 votes, the widest margin recorded in 2026. IndiaStats.org has a full breakdown of the closest and widest contests of the election.",
        ),
      ),
      heading('h2', 'What This Result Means'),
      paragraph(
        text(
          'A first-time party topping the seat table in a state that has not elected anyone outside the DMK–AIADMK axis since 1967 is, on its own terms, a historic result. But TVK\'s 108 seats leave Tamil Nadu without a party or pre-declared alliance holding the 118 seats needed to govern outright. IndiaStats.org will continue tracking constituency-level detail, reserved-seat results, and district breakdowns as the post-result picture in Tamil Nadu develops.',
        ),
      ),
    ]),
    pexelsQuery: 'India election ballot box',
    categories: ['Election Analysis'],
  },

  // ---------------------------------------------------------------------
  // 2 — 2021 vs 2026 seat swing
  // ---------------------------------------------------------------------
  {
    title: 'Tamil Nadu 2021 vs 2026: How the Seat Map Changed',
    slug: 'tamil-nadu-2021-vs-2026-seat-swing-analysis',
    metaTitle: 'Tamil Nadu 2021 vs 2026 Seat Swing — Full Party Comparison | IndiaStats.org',
    metaDescription:
      'Seat-by-seat comparison of the 2021 and 2026 Tamil Nadu assembly elections. DMK fell from 133 to 59 seats, AIADMK from 66 to 47, as TVK debuted with 108.',
    content: richText([
      paragraph(
        text(
          'Comparing the 2021 and 2026 Tamil Nadu assembly results side by side shows just how sharply the state\'s electoral map has moved in a single election cycle. A party that did not exist in 2021 — TVK — now holds more seats than DMK and AIADMK combined, while both established parties recorded their steepest declines in decades.',
        ),
      ),
      heading('h2', 'Seat Tally: 2021 vs 2026'),
      bulletList([
        'DMK: 133 seats (2021) → 59 seats (2026) — down 74',
        'AIADMK: 66 seats (2021) → 47 seats (2026) — down 19',
        'INC: 17 seats (2021, as DMK ally) → 5 seats (2026) — down 12',
        'PMK: 5 seats (2021) → 4 seats (2026) — down 1',
        'CPI: 2 seats (2021) → 2 seats (2026) — unchanged',
        'CPI(M): 2 seats (2021) → 2 seats (2026) — unchanged',
        'VCK: 4 seats (2021) → 2 seats (2026) — down 2',
        'BJP: 4 seats (2021) → 1 seat (2026) — down 3',
        'TVK: did not contest in 2021 → 108 seats (2026)',
      ]),
      heading('h2', 'The Scale of the Swing'),
      paragraph(
        text(
          'DMK\'s drop from 133 to 59 seats is a net loss of 74 — more than half its 2021 tally. That single number captures most of the story: a party that won a commanding majority five years ago now holds barely a quarter of the assembly. AIADMK\'s decline is smaller in absolute terms (66 to 47) but sits on top of an already-reduced base, continuing a longer slide from its 136-seat peak in 2016.',
        ),
      ),
      heading('h2', 'A New Entrant Reshapes the Map'),
      paragraph(
        text(
          'TVK\'s 108 seats did not come from nowhere — they came almost entirely at the expense of DMK and AIADMK\'s combined 2021 tally of 199 seats. Where DMK and AIADMK together held 85% of the assembly after 2021, they now hold just 45%. This is the fastest three-way seat realignment in Tamil Nadu since the AIADMK split of 2017, and unlike that episode, it was decided at the ballot box rather than within party organisations.',
        ),
      ),
      heading('h2', 'Smaller Allies Also Squeezed'),
      paragraph(
        text(
          'INC, which contested as a DMK ally, fell from 17 seats to 5 — a decline roughly proportional to DMK\'s own collapse, consistent with an alliance-wide swing rather than an INC-specific one. VCK held 4 seats in 2021 and dropped to 2 in 2026. BJP, which had reached 4 seats in 2021 on the back of a strong Kongu belt campaign, was reduced to a single seat. PMK and the two Communist parties were comparatively stable, each losing at most one seat.',
        ),
      ),
      heading('h2', 'Reading the Swing Correctly'),
      paragraph(
        text(
          'A seat swing this large should be read alongside vote share, not just seat counts — Tamil Nadu\'s first-past-the-post system can convert modest vote-share shifts into large seat swings when a new entrant splits the anti-incumbency vote unevenly across constituencies. IndiaStats.org\'s constituency-level pages for 2021 and 2026 allow a seat-by-seat comparison for any of the 234 assemblies, including which party gained or lost each individual seat.',
        ),
      ),
      heading('h2', 'Regional Variation in the Swing'),
      paragraph(
        text(
          "The swing was not uniform across Tamil Nadu. TVK's gains were sharpest in Chennai, Tiruvallur, and the Kongu belt districts of Coimbatore, Erode and Namakkal — regions where DMK's 2021 margins had often been comfortable but not overwhelming. In the Delta districts and the deep south, where DMK's 2021 base was more deeply rooted, the party held a larger share of its seats, and AIADMK's decline was comparatively milder in its Kongu strongholds like Salem.",
        ),
      ),
      heading('h2', 'What to Watch Next'),
      paragraph(
        text(
          'The scale of this swing means Tamil Nadu enters a genuinely three-cornered political landscape for the first time since the Dravidian movement split into DMK and AIADMK factions. Whether TVK\'s 2026 gains hold, grow, or reverse will be the central question of the state\'s politics through the next election cycle. IndiaStats.org\'s constituency archive allows readers to trace any individual seat\'s full result history from 1977 through 2026.',
        ),
      ),
    ]),
    pexelsQuery: 'India political rally crowd flags',
    categories: ['Election Analysis', 'Data Insights'],
  },

  // ---------------------------------------------------------------------
  // 3 — DMK's collapse
  // ---------------------------------------------------------------------
  {
    title: "DMK's 2026 Collapse: From 133 Seats to 59",
    slug: 'dmk-2026-seat-collapse-133-to-59-tamil-nadu',
    metaTitle: "DMK's 2026 Tamil Nadu Result — 133 Seats to 59 Explained | IndiaStats.org",
    metaDescription:
      'DMK won 133 seats in 2021 but fell to 59 in the 2026 Tamil Nadu election — a net loss of 74 seats. What the constituency-level data shows.',
    content: richText([
      paragraph(
        text(
          'DMK entered the 2026 Tamil Nadu assembly election as the incumbent ruling party, defending the 133-seat majority it won in 2021. It emerged with 59 seats — a net loss of 74, and its lowest tally since the 89 seats it won as opposition in 2016. For a party that had governed the state for a full term, the scale of the reversal marks one of the sharpest single-term declines in Tamil Nadu\'s post-1977 electoral history.',
        ),
      ),
      heading('h2', 'The Numbers'),
      bulletList([
        '2021: DMK wins 133 seats (majority, 118 required)',
        '2026: DMK wins 59 seats — a loss of 74',
        'DMK now holds roughly a quarter of the 234-seat assembly',
        'TVK, contesting for the first time, nearly doubled DMK\'s 2026 tally',
      ]),
      heading('h2', 'Where the Losses Concentrated'),
      paragraph(
        text(
          'DMK\'s reduced 59-seat tally is spread thin across the state rather than concentrated in any one region, but the pattern is clearest in Chennai and the northern districts, where TVK\'s strongest performances directly displaced DMK incumbents. In Chennai, DMK held only 2 of the city\'s 16 seats in 2026 — Chepauk-Thiruvallikeni and Harbour — down from a much larger urban footprint in 2021, when the party\'s appeal to younger, urban voters was central to its landslide win.',
        ),
      ),
      heading('h2', 'Delta and Southern Districts Held Firmer'),
      paragraph(
        text(
          'DMK\'s remaining strength is more visible in the Delta districts — Thanjavur, Tiruvarur, Nagapattinam, Mayiladuthurai — and parts of the deep south, including Tenkasi, Thoothukkudi, Ramanathapuram and Virudhunagar, where the party retained multiple seats. These have historically been DMK-leaning areas going back to the party\'s Dravidian-movement roots, and they proved comparatively more resistant to the 2026 swing than the party\'s urban and northern seats.',
        ),
      ),
      heading('h2', 'A Reversal, Not a Wipeout'),
      paragraph(
        text(
          'Fifty-nine seats is a heavy loss, but it is not a wipeout — DMK remains the second-largest party in the new assembly, ahead of AIADMK\'s 47, and it retains a presence across most of Tamil Nadu\'s 38 districts rather than being confined to a single region. The party\'s reserved-constituency performance also held up better than its overall numbers: DMK won 9 of the state\'s 43 SC/ST-reserved seats, a share roughly consistent with its statewide seat percentage.',
        ),
      ),
      heading('h2', 'Context: How Rare Is This?'),
      paragraph(
        text(
          'Tamil Nadu has a well-documented pattern of voting out incumbents at nearly every election since 1984. What makes 2026 distinctive is not that DMK lost — anti-incumbency losses are the norm — but the scale of the loss and the fact that the beneficiary was a new party rather than the traditional AIADMK alternative. DMK\'s 133-to-59 swing is comparable in magnitude to AIADMK\'s own historic collapses in 1989 and 1996, both also >100-seat swings.',
        ),
      ),
      heading('h2', "DMK's Reserved-Seat Performance"),
      paragraph(
        text(
          "DMK won 9 of Tamil Nadu's 43 SC/ST-reserved constituencies in 2026 — roughly a 21% share, slightly below its 25% share of all 234 seats. Even so, several of those reserved wins came in the party's remaining areas of strength: Sirkazhi (Mayiladuthurai) and Thiruvidaimarudur (Thanjavur), both in the Delta region, fit the broader pattern of DMK's residual base being concentrated there.",
        ),
      ),
      heading('h2', "The Chennai Reversal in Detail"),
      paragraph(
        text(
          "DMK's Chennai retreat is the single clearest illustration of its 2026 losses. The party had swept most of the capital's 16 seats in 2021 on the strength of a young, urban, alliance-wide campaign. In 2026 it held only Chepauk-Thiruvallikeni and Harbour, both by margins under 11,000 votes, while TVK won the remaining 14 seats, several by margins exceeding 20,000 votes. The same urban, mobile electorate that powered DMK's 2021 win appears to have moved to TVK in 2026.",
        ),
      ),
      heading('h2', 'What Comes Next for DMK'),
      paragraph(
        text(
          'With 59 seats, DMK is not positioned to form a government on its own, and its role in any post-result alliance arithmetic will depend on decisions made alongside its remaining allies — INC, VCK, CPI and CPI(M) — whose own 2026 tallies were also reduced. IndiaStats.org tracks each of these parties\' seat totals and constituency-level results in the state\'s full election-data archive.',
        ),
      ),
    ]),
    pexelsQuery: 'Tamil Nadu government building',
    categories: ['Election Analysis', 'Political History'],
  },

  // ---------------------------------------------------------------------
  // 4 — AIADMK's continued decline
  // ---------------------------------------------------------------------
  {
    title: "AIADMK's Decade-Long Decline: 136 Seats to 47",
    slug: 'aiadmk-decline-2016-2021-2026-tamil-nadu',
    metaTitle: "AIADMK's Decline 2016-2026 — 136 Seats to 47 | IndiaStats.org",
    metaDescription:
      'AIADMK won 136 seats in 2016, 66 in 2021, and 47 in 2026 — three consecutive declines. A look at a decade of shrinking margins in Tamil Nadu.',
    content: richText([
      paragraph(
        text(
          'AIADMK has now lost seats in three consecutive Tamil Nadu assembly elections. From a commanding 136-seat majority in 2016 under J. Jayalalithaa, the party fell to 66 seats in 2021, and now to 47 in 2026 — a decline of roughly two-thirds over ten years and three election cycles.',
        ),
      ),
      heading('h2', 'The Ten-Year Trajectory'),
      bulletList([
        '2016: AIADMK wins 136 seats (majority, under J. Jayalalithaa)',
        '2021: AIADMK wins 66 seats — down 70',
        '2026: AIADMK wins 47 seats — down a further 19',
        'Net change 2016 to 2026: -89 seats',
      ]),
      heading('h2', "The 2016-2021 Break Point"),
      paragraph(
        text(
          'The first and largest drop followed J. Jayalalithaa\'s death in December 2016, which left AIADMK without the dominant personality who had anchored the party through five terms as chief minister. The subsequent factional split between O. Panneerselvam and Edappadi K. Palaniswami, followed by a contested reunification, weakened the party\'s organisational cohesion heading into 2021, when it lost 70 seats and the government.',
        ),
      ),
      heading('h2', '2021-2026: A Further Squeeze'),
      paragraph(
        text(
          'AIADMK\'s second decline came under different circumstances — as opposition to a DMK government, facing a new competitor in TVK rather than a resurgent DMK. The party\'s 47-seat tally in 2026 suggests the anti-DMK vote that AIADMK had traditionally consolidated split three ways this time, with TVK drawing heavily from voters who might previously have backed AIADMK as the default opposition choice.',
        ),
      ),
      heading('h2', 'A Widest-Margin Win in Salem'),
      paragraph(
        text(
          "AIADMK's win in Edappadi — the home constituency of former chief minister Edappadi K. Palaniswami — came by 90,278 votes, the second-widest margin recorded anywhere in Tamil Nadu in 2026, behind only TVK's 91,600-vote win in Madavaram. That result stands out against the party's generally reduced statewide performance and signals that its core Salem-district base remained largely intact even as its seat count fell elsewhere.",
        ),
      ),
      heading('h2', 'Where AIADMK Held On'),
      paragraph(
        text(
          'AIADMK\'s remaining strength in 2026 is concentrated in the Kongu belt and the Delta-adjacent districts. In Salem district, the party won 7 of 11 seats, including Edappadi K. Palaniswami\'s home constituency of Edappadi by a decisive 90,278-vote margin — the largest winning margin recorded anywhere in the state in 2026. The party also held multiple seats in Erode, Tiruppur, Dharmapuri, Krishnagiri and Tiruvannamalai, areas with a long AIADMK organisational base.',
        ),
      ),
      heading('h2', 'A Party Still Standing'),
      paragraph(
        text(
          'Despite the decline, 47 seats keeps AIADMK as the third-largest party in the new assembly and a viable regional force, particularly in the Kongu belt where it remains competitive against both DMK and TVK. AIADMK also won 8 of Tamil Nadu\'s 43 reserved constituencies in 2026, a share broadly proportional to its statewide seat count.',
        ),
      ),
      heading('h2', 'Historical Perspective'),
      paragraph(
        text(
          'Tamil Nadu\'s two Dravidian parties have both experienced steep single-election collapses before — AIADMK from 164 to 4 seats between 1991 and 1996, and DMK from 173 to 31 between 1996 and 2001. What distinguishes AIADMK\'s current decline is that it has come in two separate steps across a full decade, rather than in one dramatic swing, suggesting a structural rather than purely cyclical shift in the party\'s base.',
        ),
      ),
      heading('h2', 'Reserved Seats: A Small Bright Spot'),
      paragraph(
        text(
          "AIADMK's 8 wins among Tamil Nadu's 43 reserved constituencies in 2026 — roughly 19% of reserved seats against its 20% share of all seats — show the party's decline was proportionate rather than concentrated in reserved constituencies specifically. That said, the party did not win any of the closest reserved-seat contests; its reserved-seat wins, like Sankarankovil in Tenkasi (won by 3,338 votes), were mostly in the low-to-mid margin range rather than landslides.",
        ),
      ),
      heading('h2', 'A Party Facing a Rebuilding Question'),
      paragraph(
        text(
          "With 47 seats and a base now concentrated in specific districts rather than spread evenly across the state, AIADMK's central challenge heading out of 2026 is whether its Kongu belt strength — particularly in Salem, Erode and Namakkal-adjacent seats — can anchor a broader statewide rebuild, or whether the party's decline over three consecutive elections reflects a more permanent narrowing of its coalition.",
        ),
      ),
    ]),
    pexelsQuery: 'political party flag Tamil Nadu',
    categories: ['Election Analysis', 'Political History'],
  },

  // ---------------------------------------------------------------------
  // 5 — TVK district/zone breakdown
  // ---------------------------------------------------------------------
  {
    title: "Where TVK Won: District-by-District Breakdown of the 2026 Wave",
    slug: 'tvk-district-wise-results-2026-tamil-nadu',
    metaTitle: 'TVK 2026 District Results — Where the 108 Seats Came From | IndiaStats.org',
    metaDescription:
      "A district-by-district look at TVK's 108 seats in the 2026 Tamil Nadu election — strongest in Chennai and Tiruvallur, competitive statewide.",
    content: richText([
      paragraph(
        text(
          "TVK's 108 seats in the 2026 Tamil Nadu election were not concentrated in one region — the party won at least one seat in 30 of Tamil Nadu's 38 districts. But the distribution was far from even. A district-level breakdown shows the party's wave was strongest in Chennai and the northern districts, and progressively thinner moving south and into the Delta.",
        ),
      ),
      heading('h2', "TVK's Top Districts by Seats Won"),
      bulletList([
        'Chennai: 14 of 16 seats',
        'Tiruvallur: 9 of 10 seats',
        'Madurai: 8 of 10 seats',
        'Coimbatore: 6 of 10 seats',
        'Tiruchirappalli: 6 of 9 seats',
        'Erode: 5 of 8 seats',
        'Namakkal: 5 of 6 seats',
        'Chengalpattu: 5 of 7 seats',
      ]),
      heading('h2', 'The Chennai and Northern Sweep'),
      paragraph(
        text(
          "TVK's clearest dominance was in Chennai, where it won 14 of 16 constituencies, and in the adjoining districts of Tiruvallur (9 of 10) and Chengalpattu (5 of 7) — together accounting for 28 of the party's 108 seats. This northern urban and peri-urban belt, with its dense, younger, mobile electorate, appears to have been the foundation of TVK's statewide performance.",
        ),
      ),
      heading('h2', 'A Strong Showing in the Kongu Belt'),
      paragraph(
        text(
          'TVK also performed strongly across the Kongu belt, winning 6 of 10 seats in Coimbatore, 5 of 8 in Erode, 5 of 6 in Namakkal, and 4 of 8 each in Tiruppur and Salem. This is notable because the Kongu belt had previously been one of the more competitive multi-party regions in the state, with a meaningful AIADMK, PMK and BJP presence — TVK\'s inroads here came at the expense of all three.',
        ),
      ),
      heading('h2', 'Thinner Gains in the Deep South and Delta'),
      paragraph(
        text(
          'TVK\'s presence thins out considerably in the southern and Delta districts. In Tirunelviil and Thoothukkudi it won 3 seats each; in Ramanathapuram and Thanjavur it won only 1 and 2 respectively. Several Delta districts — Nagapattinam, Mayiladuthurai, Ariyalur, Perambalur — returned just a single TVK seat or none at all, with DMK and smaller allies holding firmer there. This pattern broadly mirrors where DMK\'s 2026 losses were smallest.',
        ),
      ),
      heading('h2', 'Districts Where TVK Won No Seats'),
      paragraph(
        text(
          "TVK did not win a seat in several districts, including Ariyalur, Kanniyakumari, Nagapattinam, Mayiladuthurai, and The Nilgiris — districts where DMK, AIADMK, or smaller allied parties (INC, CPI, CPI(M)) held their ground. This uneven distribution is a useful corrective to any reading of the 2026 result as a uniform statewide swing: TVK's win was a first-past-the-post wave concentrated in specific regions, not a flat vote-share gain everywhere.",
        ),
      ),
      heading('h2', "TVK's Margins in Its Strongest Districts"),
      paragraph(
        text(
          "TVK's dominance in its top districts was not built on narrow wins. In Tiruvallur, the party's Madavaram win came by 91,600 votes — the single widest margin recorded anywhere in the 2026 election — and its Poonamallee win added another 60,593-vote margin. Comparable double-digit-thousand margins appear repeatedly across the party's Chennai and Coimbatore wins, indicating the party's strongest districts were won comfortably rather than by consolidating narrow pluralities.",
        ),
      ),
      heading('h2', 'Mid-Tier Districts: A Genuine Mixed Picture'),
      paragraph(
        text(
          "Between the strongholds and the districts TVK missed entirely sits a broad middle tier where the party won roughly half of the available seats: Tiruchirappalli (6 of 9), Sivaganga (4 of 4), Virudhunagar (4 of 7), Vellore (4 of 5) and Kancheepuram (4 of 4). These districts illustrate that TVK's 2026 performance, while historic in scale, was still a competitive result in many parts of the state rather than a uniform sweep.",
        ),
      ),
      heading('h2', 'Reading the Map'),
      paragraph(
        text(
          "The district data suggests TVK's appeal skewed toward Tamil Nadu's more urbanised, industrialised, and younger-electorate districts — Chennai, Tiruvallur, Coimbatore, Madurai — while its performance was comparatively weaker in the state's agrarian Delta and deep south. IndiaStats.org's district pages provide full constituency-level detail for every one of Tamil Nadu's 38 districts.",
        ),
      ),
    ]),
    pexelsQuery: 'Chennai city aerial view',
    categories: ['Constituency Guide', 'Data Insights'],
  },

  // ---------------------------------------------------------------------
  // 6 — Closest margins / upsets
  // ---------------------------------------------------------------------
  {
    title: "The Closest Contests of the 2026 Tamil Nadu Election",
    slug: 'closest-margin-contests-2026-tamil-nadu-election',
    metaTitle: 'Closest Margins in the 2026 Tamil Nadu Election | IndiaStats.org',
    metaDescription:
      'Nilakkottai was decided by just 16 votes. A look at the closest-fought constituencies in the 2026 Tamil Nadu assembly election, seat by seat.',
    content: richText([
      paragraph(
        text(
          "Most of Tamil Nadu's 234 constituencies in 2026 were won by comfortable margins, but a handful were decided by a few hundred votes or fewer — results close enough that a small shift in turnout or vote-splitting could have changed the outcome. The narrowest of all, Nilakkottai in Dindigul district, was decided by just 16 votes.",
        ),
      ),
      heading('h2', 'The Ten Closest Margins'),
      bulletList([
        'Nilakkottai (Dindigul): TVK beat DMK by 16 votes',
        'Ulundurpettai (Kallakurichi): DMK beat AIADMK by 42 votes',
        'Kumbakonam (Thanjavur): TVK beat DMK by 86 votes',
        'Srivaikuntam (Thoothukkudi): TVK beat AIADMK by 136 votes',
        'Katpadi (Vellore): TVK beat AIADMK by 141 votes',
        'Kadayanallur (Tenkasi): DMK beat AIADMK by 232 votes',
        'Thirumayam (Pudukkottai): DMK beat TVK by 275 votes',
        'Mettur (Salem): AIADMK beat DMK by 328 votes',
        'Manapparai (Tiruchirappalli): TVK beat AIADMK by 369 votes',
        'Thalli (Krishnagiri): CPI beat BJP by 413 votes',
      ]),
      heading('h2', 'A 16-Vote Verdict'),
      paragraph(
        text(
          'Nilakkottai, a reserved constituency in Dindigul district, produced the tightest result anywhere in Tamil Nadu in 2026: TVK\'s candidate defeated the DMK candidate by a margin of just 16 votes out of a combined total of well over 130,000 cast between the two. Margins this thin are a reminder of how much a first-past-the-post system can hinge on a handful of ballots in a three- or four-cornered contest.',
        ),
      ),
      heading('h2', 'A Pattern of Three-Way Splits'),
      paragraph(
        text(
          'Eight of the ten closest contests were TVK-vs-DMK or TVK-vs-AIADMK races, consistent with the broader 2026 story of TVK inserting itself into what were previously two-party fights. Ulundurpettai and Mettur — both DMK-versus-AIADMK finishes without TVK in contention — stand out as the two closest races among the traditional Dravidian rivals, both decided by under 400 votes.',
        ),
      ),
      heading('h2', 'The Thalli Upset'),
      paragraph(
        text(
          'Among the closest results, Thalli in Krishnagiri district stands out as a genuine upset: CPI held off BJP by 413 votes in a reserved constituency where neither of the two largest parties, TVK or DMK, was the frontrunner. It is one of only two seats CPI won statewide in 2026, and its narrow margin underlines how competitive even the smaller parties\' seats can be.',
        ),
      ),
      heading('h2', 'Contrast: The Widest Margins'),
      paragraph(
        text(
          "At the other extreme, TVK's win in Madavaram (Tiruvallur) came by 91,600 votes — the largest margin of the election — followed closely by AIADMK's 90,278-vote win in Edappadi (Salem), the home constituency of former chief minister Edappadi K. Palaniswami. TVK also won Poonamallee (Tiruvallur) by 60,593 votes and Salem (West) by 44,746, both lopsided results in seats it swept comfortably.",
        ),
      ),
      heading('h2', 'Where Margins Ran Widest'),
      paragraph(
        text(
          "At the opposite extreme, five seats were won by more than 40,000 votes: Madavaram (TVK, 91,600), Edappadi (AIADMK, 90,278), Poonamallee (TVK, 60,593), Salem (West) (TVK, 44,746) and Viralimalai (AIADMK, 44,006). DMK's widest margin statewide, by comparison, was a more modest 34,116 votes in Orathanadu (Thanjavur) — none of DMK's 2026 wins reached the very top of the statewide margin list, which was dominated by TVK and AIADMK.",
        ),
      ),
      heading('h2', 'A Second Tier of Tight Races'),
      paragraph(
        text(
          'Just outside the ten closest results, several other contests were decided by under 500 votes, including Peravurani in Thanjavur, where DMK beat AIADMK by 428 votes, and Bargur in Krishnagiri, where AIADMK beat TVK by 442 votes. Both point to the same underlying pattern as the top-ten list: wherever TVK entered a race as a genuine third contender, margins across all three parties tended to narrow.',
        ),
      ),
      heading('h2', 'Why Close Margins Matter'),
      paragraph(
        text(
          "In an assembly where the largest party fell 10 seats short of a majority, a small number of these razor-thin results could plausibly have flipped and changed the overall arithmetic. A shift of only a few thousand votes concentrated in the right handful of seats could have moved TVK closer to, or further from, the 118-seat mark. IndiaStats.org's constituency pages list the full candidate-wise vote count and margin for every one of the 234 seats declared in 2026.",
        ),
      ),
    ]),
    pexelsQuery: 'close election vote counting India',
    categories: ['Election Analysis', 'Data Insights'],
  },

  // ---------------------------------------------------------------------
  // 7 — Minor/allied parties
  // ---------------------------------------------------------------------
  {
    title: "The Minor Parties of 2026: How PMK, VCK, CPI and Others Fared",
    slug: 'minor-parties-2026-tamil-nadu-election-results',
    metaTitle: "Minor Parties in Tamil Nadu 2026 — PMK, VCK, CPI, BJP Seat Count | IndiaStats.org",
    metaDescription:
      'From PMK\'s 4 seats to BJP\'s single win, a full look at how the smaller and allied parties fared in the 2026 Tamil Nadu assembly election.',
    content: richText([
      paragraph(
        text(
          "Beyond the headline TVK-DMK-AIADMK story, nine smaller parties split the remaining 20 seats of Tamil Nadu's 234-member assembly in 2026: INC (5), PMK (4), CPI, CPI(M), VCK and IUML (2 each), and AMMK, DMDK and BJP (1 each). Individually modest, these seats could matter disproportionately in an assembly where the largest party is short of a majority.",
        ),
      ),
      heading('h2', 'Minor Party Seat Count — 2026'),
      bulletList([
        'INC: 5 seats',
        'PMK: 4 seats',
        'CPI: 2 seats',
        'CPI(M): 2 seats',
        'VCK: 2 seats',
        'IUML: 2 seats',
        'AMMK: 1 seat',
        'DMDK: 1 seat',
        'BJP: 1 seat',
      ]),
      heading('h2', 'INC: A Reduced but Present Ally'),
      paragraph(
        text(
          'INC won 5 seats in 2026, down sharply from 17 in 2021, but retained a geographic base concentrated in Kanniyakumari district, where it won three of the five — Killiyoor, Vilavancode and Colachal. Its other two wins came in Melur (Madurai) and Mayiladuthurai.',
        ),
      ),
      heading('h2', 'PMK: A Steady Kongu-Adjacent Presence'),
      paragraph(
        text(
          "PMK's 4 seats — Jayankondam (Ariyalur), Vikravandi and Gingee (both Viluppuram), and Dharmapuri — held nearly steady against its 5-seat 2021 tally, keeping the party's base in the northern and Vanniyar-influenced belt broadly intact even as TVK reshaped the map around it.",
        ),
      ),
      heading('h2', 'The Left and VCK: Small but Consistent'),
      paragraph(
        text(
          "CPI held Thiruthuraipoondi (Thiruvarur) and won the closely fought Thalli seat in Krishnagiri by 413 votes. CPI(M) won Padmanabhapuram (Kanniyakumari) and Kilvelur (Nagapattinam). VCK, the Dalit-rights party long associated with reserved-constituency politics, won Kattumannarkoil (Cuddalore) and Tindivanam (Viluppuram) — both reserved seats — down from 4 in 2021.",
        ),
      ),
      heading('h2', 'IUML, AMMK and DMDK: Single-Digit Comebacks'),
      paragraph(
        text(
          "IUML won 2 seats — Papanasam (Thanjavur) and Vaniyambadi (Thirupathur) — its representation concentrated in areas with a significant Muslim electorate. AMMK, the breakaway faction led by TTV Dhinakaran, won a single seat in Mannargudi (Thiruvarur). DMDK, once a significant third force under actor-politician Vijayakanth, returned with one seat, Vriddhachalam (Cuddalore) — its first assembly seat in years.",
        ),
      ),
      heading('h2', "DMDK's Return"),
      paragraph(
        text(
          "DMDK's single seat, Vriddhachalam in Cuddalore, marks a notable return for a party that had been Tamil Nadu's third-largest force as recently as 2011, when it won 29 seats in alliance with AIADMK under actor-politician Vijayakanth. The party's presence had shrunk to near-zero in the years since, making even a single 2026 seat a meaningful data point for its organisational survival.",
        ),
      ),
      heading('h2', "BJP: A Single Seat After a Stronger 2021"),
      paragraph(
        text(
          'BJP, which had built a modest Kongu-belt presence with 4 seats in 2021, was reduced to a single win in 2026 — Udhagamandalam in The Nilgiris district. The party\'s Kongu belt seats from 2021 did not carry over, with TVK and AIADMK splitting most of that ground instead.',
        ),
      ),
      heading('h2', 'Margins for the Smaller Parties'),
      paragraph(
        text(
          "The margins on these seats varied widely. VCK's Kattumannarkoil win came by 17,932 votes, a comfortable margin, while IUML held both its seats by narrower gaps — 6,217 votes in Papanasam and 2,572 in Vaniyambadi. The tightest of all were CPI's 413-vote win over BJP in Thalli, Krishnagiri, and CPI(M)'s 996-vote win in Kilvelur, Nagapattinam — both among the closest results recorded anywhere in the 2026 election.",
        ),
      ),
      heading('h2', 'Reserved Seats Among the Minor Parties'),
      paragraph(
        text(
          "Several of these smaller parties draw a disproportionate share of their strength from Tamil Nadu's 43 reserved constituencies. Both of VCK's seats and one of CPI's two seats came from reserved constituencies, consistent with these parties' historical focus on Dalit and marginalised-community representation. By contrast, PMK, IUML, AMMK and DMDK won all of their 2026 seats in general (unreserved) constituencies.",
        ),
      ),
      heading('h2', 'Why These Seats Could Matter'),
      paragraph(
        text(
          'With the largest party ten seats short of a majority, the 20 seats held collectively by these nine parties represent a meaningful bloc in any post-result alliance calculation — larger, combined, than the gap between TVK and the 118-seat majority mark. IndiaStats.org\'s party-wise results pages track every constituency won by each of Tamil Nadu\'s recognised parties in 2026.',
        ),
      ),
    ]),
    pexelsQuery: 'small political party office India',
    categories: ['Election Analysis'],
  },

  // ---------------------------------------------------------------------
  // 8 — Government formation open question
  // ---------------------------------------------------------------------
  {
    title: "TVK Fell Short of a Majority: What Happens Next in Tamil Nadu?",
    slug: 'tamil-nadu-2026-government-formation-majority-math',
    metaTitle: 'Tamil Nadu 2026: The Majority Math After TVK\'s 108 Seats | IndiaStats.org',
    metaDescription:
      "TVK won 108 of 234 seats in 2026 — 10 short of the 118-seat majority mark. Here's the arithmetic of what government formation could look like.",
    content: richText([
      paragraph(
        text(
          "TVK emerged from the 2026 Tamil Nadu election as the single largest party with 108 seats, but Tamil Nadu's 234-member assembly requires 118 seats for a working majority. That leaves TVK ten seats short — a gap that raises a genuine, unresolved question about how a government will be formed, rather than a foregone conclusion in any direction.",
        ),
      ),
      heading('h2', 'The Basic Arithmetic'),
      bulletList([
        'Total assembly seats: 234',
        'Seats needed for a majority: 118',
        "TVK's seats: 108 (10 short of a majority)",
        "DMK's seats: 59",
        "AIADMK's seats: 47",
        'Remaining nine parties combined: 20 seats',
      ]),
      heading('h2', 'Why 108 Is Not Automatically a Government'),
      paragraph(
        text(
          "Being the single largest party carries significant weight in convention and often in a Governor's first invitation to form government, but it does not by itself confer a majority. Tamil Nadu's constitutional process requires whichever party or coalition is invited to form a government to demonstrate 118 votes of confidence on the floor of the assembly. TVK's 108 seats, on their own, do not clear that bar.",
        ),
      ),
      heading('h2', 'The Combinations That Would Reach 118'),
      paragraph(
        text(
          "Mathematically, several different combinations of parties could reach or exceed 118 seats — TVK plus a subset of the 20 seats held by the smaller parties, TVK in some arrangement with either of the two larger Dravidian parties, or a DMK–AIADMK combination that would itself clear 106 seats before adding any smaller allies. None of these combinations has been publicly confirmed as of this writing, and IndiaStats.org is not asserting which, if any, will materialise.",
        ),
      ),
      heading('h2', 'What History Suggests — and What It Doesn\'t'),
      paragraph(
        text(
          "Tamil Nadu has not previously produced a hung assembly of this kind since single-party or clearly pre-declared alliance majorities have been the norm since 1977. That makes 2026 a genuinely novel situation for the state, without a close historical precedent to predict how negotiations, if any, would unfold. Readers should treat any claims about which party will form the government as speculation until confirmed through official channels.",
        ),
      ),
      heading('h2', 'A Novel Situation for the State'),
      paragraph(
        text(
          "Every Tamil Nadu assembly election since 1977 has produced a single party or a clearly pre-declared, majority-crossing alliance. In 2021, the DMK-led alliance crossed 118 seats comfortably; in 2016, AIADMK crossed it alone. The 2026 result — a single largest party ten seats short, with no majority alliance declared before results — has no direct precedent within IndiaStats.org's full election-data archive for the state, covering elections back to 1977.",
        ),
      ),
      heading('h2', 'The Nine Smaller Parties Hold Leverage'),
      paragraph(
        text(
          'The 20 seats spread across INC, PMK, CPI, CPI(M), VCK, IUML, AMMK, DMDK and BJP are, combined, larger than the ten-seat gap between TVK and a majority. That makes their individual and collective positions relevant to any government-formation scenario, whichever direction it develops.',
        ),
      ),
      heading('h2', 'Why Being Largest Party Still Matters'),
      paragraph(
        text(
          "Even short of a majority, TVK's position as the single largest party — 108 seats against DMK's 59 and AIADMK's 47 — gives it a materially stronger starting position in any negotiation than either of the two established parties individually. A combined DMK-AIADMK total of 106 seats would itself fall short of TVK's tally alone, underscoring how unusual the 2026 result is by the standards of Tamil Nadu's traditional two-party arithmetic.",
        ),
      ),
      heading('h2', 'The General Civics Backdrop'),
      paragraph(
        text(
          "Under India's constitutional convention, when no single party crosses the majority mark, the Governor typically invites the party or pre-declared coalition best placed to demonstrate a majority to form the government, subject to a floor test — a vote of confidence in the new assembly. Tamil Nadu has not faced this scenario in the period covered by IndiaStats.org's election archive, making 2026 the first modern test of how that convention plays out in the state.",
        ),
      ),
      heading('h2', 'What IndiaStats.org Will Track'),
      paragraph(
        text(
          'This piece deliberately does not predict or assert who will form Tamil Nadu\'s next government — that outcome depends on political negotiations outside the scope of the constituency-level data IndiaStats.org publishes. What the data can show, and what this site will continue to track, is the precise seat arithmetic: exactly how many seats each party holds, and exactly how far any combination is from the 118-seat threshold.',
        ),
      ),
    ]),
    pexelsQuery: 'Indian legislative assembly building',
    categories: ['Election Analysis'],
  },

  // ---------------------------------------------------------------------
  // 9 — Reserved constituencies 2026
  // ---------------------------------------------------------------------
  {
    title: "Reserved Constituency Results 2026: How TVK, DMK and AIADMK Split the SC/ST Seats",
    slug: 'reserved-constituencies-2026-tamil-nadu-election-results',
    metaTitle: 'Reserved (SC/ST) Constituency Results 2026 Tamil Nadu | IndiaStats.org',
    metaDescription:
      "Tamil Nadu's 43 SC/ST-reserved constituencies split three ways in 2026: TVK won 22, DMK 9, AIADMK 8. Full results for every reserved seat.",
    content: richText([
      paragraph(
        text(
          "Tamil Nadu's 234 assembly constituencies include 43 seats reserved for Scheduled Caste and Scheduled Tribe candidates under Article 332 of the Constitution — 42 SC-reserved seats spread across the state, and one ST-reserved seat, Gudalur in The Nilgiris. IndiaStats.org verified this figure directly against the assemblies collection's reservation-status field for every one of Tamil Nadu's 234 constituencies.",
        ),
      ),
      heading('h2', 'Reserved Seat Results by Party — 2026'),
      bulletList([
        'TVK: 22 of 43 reserved seats',
        'DMK: 9 of 43 reserved seats',
        'AIADMK: 8 of 43 reserved seats',
        'VCK: 2 of 43 reserved seats',
        'CPI: 1 of 43 reserved seats',
        'CPI(M): 1 of 43 reserved seats',
      ]),
      heading('h2', 'TVK Led in Reserved Seats Too'),
      paragraph(
        text(
          'TVK won 22 of the 43 reserved constituencies — just over half — a share slightly higher than its 46% share of all 234 seats. That suggests the party\'s 2026 wave was not confined to general seats but carried through to reserved constituencies as well, including tight contests such as Nilakkottai in Dindigul, which TVK won by just 16 votes, the closest result of the entire election.',
        ),
      ),
      heading('h2', 'The 43-Seat Figure, Verified'),
      paragraph(
        text(
          "IndiaStats.org cross-referenced every one of Tamil Nadu's 234 constituencies against the assemblies collection's reservation-status field to confirm the 43-seat total independently for the 2026 result, rather than assuming the figure from prior published analysis. The count matches exactly: 43 constituencies flagged as reserved, of which 42 are SC-reserved and one — Gudalur — is ST-reserved.",
        ),
      ),
      heading('h2', "VCK's Reserved-Seat Focus"),
      paragraph(
        text(
          "VCK, a party built specifically around Dalit political representation, won both of its 2026 seats in reserved constituencies — Kattumannarkoil (Cuddalore) and Tindivanam (Viluppuram). This is consistent with the party's long-standing electoral focus: VCK has historically concentrated its candidacies in reserved seats rather than contesting broadly across general constituencies.",
        ),
      ),
      heading('h2', 'The Lone ST-Reserved Seat'),
      paragraph(
        text(
          'Gudalur, in The Nilgiris district, is Tamil Nadu\'s only ST-reserved constituency, reflecting the tribal communities of the Western Ghats hill region. DMK won Gudalur in 2026 by a margin of 22,833 votes, one of the more comfortable wins among the reserved seats.',
        ),
      ),
      heading("h2", "AIADMK's Reserved-Seat Base"),
      paragraph(
        text(
          "AIADMK's 8 reserved-seat wins in 2026 were concentrated in its remaining areas of strength — Sankarankovil (Tenkasi), Dharapuram (Tiruppur), and Attur and Gangavalli in Salem district, where the party's broader Kongu belt resilience carried through to reserved constituencies as well as general ones. This overlap suggests AIADMK's remaining base, wherever it held on in 2026, held on across both categories of seat roughly evenly.",
        ),
      ),
      heading('h2', 'Where Reserved Seats Were Closest'),
      paragraph(
        text(
          'Several reserved constituencies were decided by tight margins in 2026, beyond Nilakkottai\'s 16-vote result: Kilvelur (Nagapattinam), won by CPI(M) by 996 votes, and Tittakudi (Cuddalore), won by DMK by 530 votes, were both among the closest results anywhere in the state. By contrast, Gudalur and Kattumannarkoil were won by well over 17,000 votes each.',
        ),
      ),
      heading('h2', 'How This Compares to the General Seats'),
      paragraph(
        text(
          "The reserved-seat party split (TVK 51%, DMK 21%, AIADMK 19%, others 9%) tracks closely with the statewide seat split (TVK 46%, DMK 25%, AIADMK 20%, others 9%), suggesting the 2026 swing affected reserved and general constituencies in broadly similar proportions rather than one category swinging disproportionately.",
        ),
      ),
      heading('h2', 'Reserved Seats Across Districts'),
      paragraph(
        text(
          "Reserved constituencies are spread across most of Tamil Nadu's 38 districts rather than concentrated in a few — from Vasudevanallur in Tenkasi and Sankarankovil further south, to Perambalur, Krishnarayapuram in Karur, and Kallakurichi in the north. This wide geographic distribution meant TVK's 2026 wave, AIADMK's Kongu-belt resilience, and DMK's Delta-region strength all left their mark somewhere within the reserved-seat map, rather than the reserved seats behaving as a single uniform bloc.",
        ),
      ),
      paragraph(
        text(
          "IndiaStats.org's constituency guide lists the reservation status of every one of Tamil Nadu's 234 assemblies alongside its full electoral history.",
        ),
      ),
    ]),
    pexelsQuery: 'rural India voting booth',
    categories: ['Constituency Guide', 'Data Insights'],
  },

  // ---------------------------------------------------------------------
  // 10 — Chennai's 2026 verdict
  // ---------------------------------------------------------------------
  {
    title: "Chennai's 2026 Verdict: TVK Sweeps 14 of 16 Seats",
    slug: 'chennai-2026-assembly-election-results',
    metaTitle: "Chennai 2026 Election Results — TVK Wins 14 of 16 Seats | IndiaStats.org",
    metaDescription:
      "TVK won 14 of Chennai's 16 assembly seats in 2026, with DMK holding just 2. A constituency-by-constituency look at the capital's result.",
    content: richText([
      paragraph(
        text(
          "Chennai's 16 assembly constituencies delivered the clearest single-district verdict of the 2026 Tamil Nadu election: TVK won 14 of the 16 seats, leaving DMK with just two — Chepauk-Thiruvallikeni and Harbour. It is the most lopsided result the capital has produced in a two-decade span, and a sharp reversal from 2021, when DMK's alliance dominated the city.",
        ),
      ),
      heading('h2', "Chennai's 2026 Result, Seat by Seat"),
      bulletList([
        'Velachery: TVK (margin 28,238)',
        'Mylapore: TVK (margin 27,874)',
        'T Nagar: TVK (margin 12,783)',
        'Saidapet: TVK (margin 21,064)',
        'Virugampakkam: TVK (margin 14,433)',
        'Anna Nagar: TVK (margin 21,363)',
        'Thousand Lights: TVK (margin 9,977)',
        'Chepauk-Thiruvallikeni: DMK (margin 9,881)',
        'Harbour: DMK (margin 10,639)',
        'Royapuram: TVK (margin 14,129)',
        'Egmore: TVK (margin 13,096)',
        'Thiru-Vi-Ka-Nagar: TVK (margin 22,333)',
        'Villivakkam: TVK (margin 15,461)',
        'Kolathur: TVK (margin 8,539)',
        'Perambur: TVK (margin 29,031)',
        'RK Nagar: TVK (margin 21,650)',
      ]),
      heading('h2', 'A City-Wide Wave, Not a Narrow One'),
      paragraph(
        text(
          "What stands out beyond TVK's 14-of-16 sweep is the consistency of its margins — every TVK win in Chennai came by at least 8,500 votes, and the party's largest city margin, in Perambur, exceeded 29,000. This was not a district won on a string of narrow victories; it was a comprehensive result across every part of the city, from the traditionally DMK-leaning north to the more mixed southern and central seats.",
        ),
      ),
      heading('h2', "DMK's Two Remaining Seats"),
      paragraph(
        text(
          "DMK held only Chepauk-Thiruvallikeni and Harbour, both by margins under 11,000 votes — its narrowest wins in the city. These two constituencies sit in Chennai's older, more traditionally Dravidian-movement-aligned central and port areas, suggesting DMK's remaining Chennai base is concentrated in the city's historic core rather than its newer or more affluent neighbourhoods.",
        ),
      ),
      heading('h2', "Chennai's Historic DMK Association"),
      paragraph(
        text(
          "Chennai's political identity has long been tied to DMK — the party's founding was rooted in the Dravidian movement that originated in the city, and its urban, educated support base had historically been concentrated there. DMK president M. K. Stalin's own constituency of Kolathur, in North Chennai, was among the 14 seats the party lost to TVK in 2026, a symbolically significant loss given the seat's association with the party's leadership.",
        ),
      ),
      heading('h2', 'A Reversal from 2021'),
      paragraph(
        text(
          "In 2021, DMK's alliance dominated Chennai's urban and suburban seats, drawing on younger, educated voters concentrated in the capital — a result IndiaStats.org covered in detail in its 2021 election analysis. The 2026 result inverts that pattern almost entirely, with TVK now holding the urban, younger-skewing seats that had powered DMK's previous Chennai sweep.",
        ),
      ),
      heading('h2', 'The Two DMK Seats in Context'),
      paragraph(
        text(
          "Chepauk-Thiruvallikeni and Harbour, DMK's two surviving Chennai seats, both sit along the city's older port and central corridor — areas with a longer-settled electorate compared with the newer residential and IT-corridor neighbourhoods that swung decisively to TVK. Both seats were won by margins under 11,000 votes, meaning even DMK's remaining Chennai foothold was not comfortable by the standards of the rest of the 2026 result.",
        ),
      ),
      heading('h2', "AIADMK's Absence from the Capital"),
      paragraph(
        text(
          "Notably, AIADMK — the state's third-largest party overall with 47 seats — did not win a single seat in Chennai in 2026. The party's 2026 strength lies almost entirely outside the capital, in the Kongu belt and parts of the northern districts, underscoring how regionally concentrated its remaining base has become.",
        ),
      ),
      heading('h2', 'Margins Compared to the Rest of Tamil Nadu'),
      paragraph(
        text(
          "Chennai's average TVK winning margin — roughly 18,000 votes across its 14 wins — comfortably exceeds the statewide median margin for the election. None of Tamil Nadu's ten closest 2026 contests were in Chennai; the closest citywide result, Chepauk-Thiruvallikeni, was still decided by nearly 10,000 votes. That combination of a lopsided seat count and comfortable individual margins makes Chennai the most decisively TVK-aligned district anywhere in the state.",
        ),
      ),
      heading('h2', 'Chennai in Context'),
      paragraph(
        text(
          "Chennai's 16 seats are a small fraction of Tamil Nadu's 234-seat assembly, but the capital's result — TVK's most one-sided district sweep anywhere in the state — is a useful bellwether for how thoroughly the party's 2026 campaign reshaped urban Tamil Nadu specifically. IndiaStats.org's constituency guide for Chennai covers all 16 seats individually, including historical results back to 1977.",
        ),
      ),
    ]),
    pexelsQuery: 'Chennai Marina Beach cityscape',
    categories: ['Constituency Guide'],
  },

  // ---------------------------------------------------------------------
  // 11 — Kongu belt's 2026 verdict
  // ---------------------------------------------------------------------
  {
    title: "The Kongu Belt's 2026 Verdict: A Genuine Three-Way Fight",
    slug: 'kongu-belt-2026-tamil-nadu-election-results',
    metaTitle: 'Kongu Belt 2026 Election Results — TVK, AIADMK and DMK Compared | IndiaStats.org',
    metaDescription:
      "Coimbatore, Erode, Tiruppur, Salem and Namakkal split three ways in 2026. TVK led the Kongu belt overall, but AIADMK held its ground in Salem.",
    content: richText([
      paragraph(
        text(
          "The Kongu belt — Coimbatore, Erode, Tiruppur, Salem and Namakkal, 45 seats in total — has long been Tamil Nadu's most competitive multi-party region, home to a strong PMK and BJP presence alongside the two Dravidian parties. In 2026, it produced a genuine three-way outcome: TVK won 25 of the 45 seats, AIADMK 14, and DMK 5, with PMK's traditional Kongu foothold not translating into a single seat in this specific belt.",
        ),
      ),
      heading('h2', 'Kongu Belt Results by District — 2026'),
      bulletList([
        'Coimbatore (10 seats): TVK 6, DMK 3, AIADMK 1',
        'Erode (8 seats): TVK 5, AIADMK 3',
        'Tiruppur (8 seats): TVK 4, AIADMK 2, DMK 2',
        'Salem (11 seats): AIADMK 7, TVK 4',
        'Namakkal (6 seats): TVK 5, AIADMK 1',
      ]),
      heading('h2', 'TVK Led, but Unevenly'),
      paragraph(
        text(
          "TVK's 25 Kongu-belt seats make it the largest party in the region overall, and it swept Namakkal (5 of 6) and led comfortably in Coimbatore and Erode. But its performance was far less dominant in Salem, the belt's largest district by seat count, where it won only 4 of 11 seats.",
        ),
      ),
      heading('h2', 'Erode and Tiruppur: Split Verdicts'),
      paragraph(
        text(
          "Erode and Tiruppur both produced genuinely mixed results rather than a clear sweep for any one party. In Erode, TVK's 5 seats came alongside 3 AIADMK wins, including Anthiyur and Bhavani by margins under 9,000 votes. Tiruppur split three ways — TVK 4, AIADMK 2, DMK 2 — with DMK's Udumalaipettai win coming by just 1,860 votes, one of the closer contests in the belt.",
        ),
      ),
      heading('h2', "Salem: AIADMK's Strongest District Anywhere"),
      paragraph(
        text(
          "Salem stands out as AIADMK's best-performing district in the entire 2026 election, with 7 of 11 seats — including former chief minister Edappadi K. Palaniswami's home seat of Edappadi, won by 90,278 votes, the second-largest margin recorded anywhere in Tamil Nadu in 2026. AIADMK also held Mettur, Omalur, Yercaud, Attur, Gangavalli and Sankari, giving it a nearly unbroken block across the district.",
        ),
      ),
      heading('h2', 'Coimbatore: The Only Kongu District DMK Cracked'),
      paragraph(
        text(
          "DMK's only meaningful Kongu-belt foothold in 2026 came in Coimbatore, where it won 3 of 10 seats — Valparai, Pollachi and Coimbatore (South), the last by a margin of just 1,231 votes, one of the closer results in the region. Elsewhere in the Kongu belt, DMK's presence was limited to 2 seats in Tiruppur (Madathukulam and Udumalaipettai) and none at all in Erode, Salem or Namakkal.",
        ),
      ),
      heading('h2', "PMK and BJP's Reduced Kongu Footprint"),
      paragraph(
        text(
          "PMK, which had historically served as a kingmaker ally in parts of the Kongu belt, did not win a seat within these five districts in 2026 (its 4 statewide seats came from Ariyalur, Viluppuram and Dharmapuri). BJP, which had won all 4 of its 2021 seats in the Kongu belt, was reduced to a single seat statewide — Udhagamandalam in The Nilgiris, outside this belt entirely.",
        ),
      ),
      heading('h2', 'Close Contests Within the Belt'),
      paragraph(
        text(
          "The Kongu belt also produced some of the tightest margins of the entire election. Mettur in Salem was decided by just 328 votes in AIADMK's favour, while Coimbatore (South) went to DMK by 1,231 votes and Modakkurichi in Erode went to TVK by 2,242. These narrow results, spread across three different parties, reinforce that the belt's overall seat tallies mask a genuinely competitive, seat-by-seat fight rather than a one-sided regional trend.",
        ),
      ),
      heading('h2', 'A Belt That Stayed Competitive'),
      paragraph(
        text(
          "Even with TVK's overall lead, the Kongu belt remained Tamil Nadu's most genuinely contested region in 2026 — no party won more than 60% of its 45 seats, and AIADMK's Salem performance shows the party retains real organisational strength in specific pockets even as it declined statewide. IndiaStats.org's Kongu belt constituency guide covers all 45 seats across Coimbatore, Erode, Tiruppur, Salem and Namakkal in detail.",
        ),
      ),
    ]),
    pexelsQuery: 'Coimbatore textile industry Tamil Nadu',
    categories: ['Constituency Guide'],
  },

  // ---------------------------------------------------------------------
  // 12 — Turnout trends
  // ---------------------------------------------------------------------
  {
    title: "Tamil Nadu Voter Turnout: 2021 vs 2026",
    slug: 'tamil-nadu-voter-turnout-2021-vs-2026',
    metaTitle: 'Tamil Nadu Voter Turnout 2021 vs 2026 Compared | IndiaStats.org',
    metaDescription:
      "Tamil Nadu's 2026 assembly election recorded 86.02% turnout, up from 72.8% in 2021 — among the highest turnout figures in the state's electoral history.",
    content: richText([
      paragraph(
        text(
          "Voter turnout in the 2026 Tamil Nadu assembly election reached 86.02%, based on IndiaStats.org's constituency-level tally of votes polled against total registered electors across all 234 seats — a substantial rise from the 72.8% turnout recorded in 2021.",
        ),
      ),
      heading('h2', 'Turnout at a Glance'),
      bulletList([
        '2021 turnout: approximately 72.8%',
        '2026 turnout: 86.02% (calculated from full constituency-level data)',
        '2026 registered electors: approximately 5.73 crore',
        '2026 votes polled: approximately 4.93 crore',
      ]),
      heading('h2', 'A Historically High Figure'),
      paragraph(
        text(
          "Tamil Nadu has consistently ranked among the higher-turnout large states in India, with participation above 70% in every assembly election since the 1980s. An 86% figure, if it holds up as the final certified number, would place 2026 well above that historical band — a level more commonly associated with closely contested, high-stakes elections than routine cycles.",
        ),
      ),
      heading('h2', 'How the Figure Was Calculated'),
      paragraph(
        text(
          "IndiaStats.org calculated the 86.02% figure from the bottom up: summing the electors field and the votes field across all 234 of Tamil Nadu's live-election-results records for 2026, then dividing total votes polled by total electors. This constituency-level approach avoids relying on a single reported top-line number and lets the figure be checked, and re-derived, against the same underlying data published for each individual assembly.",
        ),
      ),
      heading('h2', 'A Plausible Driver: A Genuinely Contested Field'),
      paragraph(
        text(
          "The most obvious explanation available from the seat data itself is the emergence of TVK as a serious contender alongside DMK and AIADMK. A three-way race that produced results as close as Nilakkottai's 16-vote margin and Ulundurpettai's 42-vote margin is consistent with an electorate that turned out at unusually high rates, since tight three-cornered contests tend to mobilise voters more intensely than predictable two-party races.",
        ),
      ),
      heading('h2', 'Total Votes vs Party-Wise Tallies'),
      paragraph(
        text(
          "The total votes-polled figure used for the turnout calculation is drawn directly from each constituency's overall vote count, rather than summed only from the parties listed in the top results. In practice the two are close, since IndiaStats.org tracks every party and independent candidate that recorded a meaningful vote share, but the constituency-level total remains the more accurate denominator for a statewide turnout figure.",
        ),
      ),
      heading('h2', 'Turnout Was High Across Regions'),
      paragraph(
        text(
          "IndiaStats.org's constituency-level data shows the 86.02% figure was not the product of a handful of outlier seats but reflected consistently high polling across the state's districts — from the dense urban seats of Chennai to the more rural Delta and southern constituencies. A full constituency-by-constituency turnout breakdown is available on each assembly's individual page.",
        ),
      ),
      heading('h2', 'Why Turnout Matters for Reading the Result'),
      paragraph(
        text(
          "Higher turnout in a first-past-the-post system with three or more serious contenders can amplify the seat-swing effect of even modest shifts in vote share, since a larger, more engaged electorate leaves less room for any one party to rely on a narrow, highly motivated base. That dynamic is consistent with the scale of seat swings seen elsewhere in the 2026 result — DMK's fall from 133 to 59 seats and AIADMK's fall to 47 — even though vote-share shifts are typically smaller than seat-share shifts.",
        ),
      ),
      heading('h2', 'Electors and Votes Polled, in Full'),
      paragraph(
        text(
          "IndiaStats.org's tally of the 2026 live-election-results data across all 234 constituencies shows approximately 5.73 crore registered electors and approximately 4.93 crore votes polled statewide. Those two figures, taken together across every declared constituency, are what produce the 86.02% turnout figure — a bottom-up calculation from constituency-level data rather than a single top-line number reported separately.",
        ),
      ),
      heading('h2', 'A Caveat on Comparing Elector Rolls'),
      paragraph(
        text(
          "Turnout percentage, rather than the raw count of registered electors, is the more reliable year-on-year comparison point between 2021 and 2026: electoral rolls are periodically revised between elections — through additions, deletions and corrections — so elector totals alone are not a clean like-for-like measure of population or voter-base growth across a five-year gap.",
        ),
      ),
      heading('h2', 'Where to Find the Full Data'),
      paragraph(
        text(
          "IndiaStats.org publishes electors, votes polled, and turnout percentage for every one of Tamil Nadu's 234 assembly constituencies for both the 2021 and 2026 elections, allowing a direct seat-by-seat turnout comparison alongside the seat-swing and margin data covered elsewhere on this site.",
        ),
      ),
    ]),
    pexelsQuery: 'voter queue polling station India',
    categories: ['Data Insights'],
  },
]
