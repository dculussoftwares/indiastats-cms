// scripts/data/up-posts-batch2.ts
//
// 12 posts covering Uttar Pradesh election history for IndiaStats.org, per
// task-3-brief.md. UP has zero existing blog posts, so this batch establishes
// the state's editorial coverage from scratch across the 2012, 2017 and 2022
// assembly elections.
//
// State-wide seat tallies use only the verified numbers from the task's
// Global Constraints (2012 SP 224/BSP 80/BJP 47/INC 28/RLD 9; 2017 BJP
// 312/SP 47/BSP 19/ApnaDal(S) 9/INC 7; 2022 BJP 256/SP 111/ApnaDal(S)
// 12/RLD 8/NISHAD 6/SBSP 6/BSP 1). These were independently re-verified
// against the live `election-history` collection (stateCode: 'UP'), which
// matches exactly.
//
// Zone/district-level breakdowns were pulled from the live DB (`assemblies`
// + `election-history` collections, stateCode: 'UP') via a temporary
// read-only query script, per task-3-brief.md Step 1. IndiaStats.org's own
// zone classification for UP is: Eastern UP (175 seats), Western UP (111),
// Central UP (60), Terai (38), Bundelkhand (19) — this is the classification
// used throughout, alongside the commonly used political-vocabulary names
// (Purvanchal, Awadh) where relevant.
//
// UP per-assembly voter/turnout figures are unpopulated (0) in the DB, so no
// precise per-constituency voter or turnout numbers are cited anywhere in
// this batch. Only the safe state-level aggregates from
// src/config/states/uttar-pradesh.ts are used: 15+ crore voters, 1.7 lakh+
// booths, 403 assemblies, 75 districts.
import { BlogPostSeed, text, paragraph, heading, bulletList, richText } from './lexical-helpers'

export const upPosts: BlogPostSeed[] = [
  // ---------------------------------------------------------------------
  // 1 — 2022 result overview
  // ---------------------------------------------------------------------
  {
    title: "2022 Uttar Pradesh Election Result: BJP's Second Straight Majority Under Yogi Adityanath",
    slug: 'up-2022-election-result-bjp-second-term-yogi',
    metaTitle: '2022 Uttar Pradesh Election Result — BJP Wins 256 Seats | IndiaStats.org',
    metaDescription:
      'BJP won 256 of 403 Uttar Pradesh assembly seats in 2022, giving Yogi Adityanath a second consecutive term as chief minister. Full seat breakdown.',
    content: richText([
      paragraph(
        text(
          "The 2022 Uttar Pradesh Legislative Assembly election returned the Bharatiya Janata Party (BJP) to power with 256 of the state's 403 seats — comfortably above the 202-seat majority mark. The result gave Yogi Adityanath a second consecutive term as chief minister, a rare outcome in a state where incumbent governments have historically struggled to win back-to-back mandates.",
        ),
      ),
      heading('h2', 'Final Seat Tally'),
      bulletList([
        'BJP: 256 seats',
        'SP: 111 seats',
        'ApnaDal(S): 12 seats',
        'RLD: 8 seats',
        'NISHAD Party: 6 seats',
        'SBSP: 6 seats',
        'BSP: 1 seat',
        'Others (independents and smaller parties): remainder of the 403-seat house',
      ]),
      paragraph(
        text(
          "Counting the BJP's pre-poll allies together — ApnaDal(S) and the NISHAD Party — the NDA bloc crossed 270 seats, well past the majority line. On the other side, the Samajwadi Party (SP) more than doubled its 2017 tally, and with ally RLD's 8 seats, the SP-led opposition alliance finished with around 119 seats — its strongest showing since the party's own 2012 majority.",
        ),
      ),
      heading('h2', 'A Second Consecutive Term'),
      paragraph(
        text(
          "Yogi Adityanath's return to power was widely noted at the time as one of the few instances of an incumbent Uttar Pradesh government winning a second consecutive term in the state's modern electoral history — most UP governments since the 1980s have been voted out after a single term. The 2022 result broke that pattern decisively.",
        ),
      ),
      heading('h2', 'Where the Majority Was Built'),
      paragraph(
        text(
          "BJP's 256 seats were spread across every region of the state rather than concentrated in one belt. In Uttar Pradesh's Eastern zone — 175 seats, the largest single region — BJP won 94 seats against SP's 62. In Western UP (111 seats), BJP took 75 against SP's 28. The party also swept Central UP (46 of 60 seats) and held a strong majority in Bundelkhand (14 of 19) and the Terai belt bordering Nepal (27 of 38).",
        ),
      ),
      heading('h2', "Gorakhpur: The Chief Minister's Home Turf"),
      paragraph(
        text(
          "Gorakhpur district — where Yogi Adityanath built his political base as head of the Gorakhnath Math and as the constituency's long-serving Member of Parliament — delivered a clean sweep for BJP in 2022: all 9 assembly seats in the district went to the party, up from 8 of 9 in 2017.",
        ),
      ),
      heading('h2', "SP's Recovery, but Not a Majority"),
      paragraph(
        text(
          "SP's 111 seats marked a sharp recovery from its 47-seat low in 2017, but the party remained well short of power. Its gains were concentrated in the Eastern zone, where it nearly doubled its 2017 tally, and in Western UP, where its RLD alliance made inroads in the Jat-influenced belt around Muzaffarnagar and Meerut. Even so, BJP's 256 seats meant the SP-led opposition had no realistic path to government.",
        ),
      ),
      heading('h2', 'Lucknow: The Seat of Government'),
      paragraph(
        text(
          "Lucknow district, home to the state capital and the assembly itself, mirrored the statewide swing across all three elections. SP held 7 of its 9 seats in 2012; BJP took 8 of 9 in 2017; and in 2022, BJP again won 7 against SP's 2 — a result consistent with the district's status as one of Central UP's most reliably BJP-leaning areas over the past two elections.",
        ),
      ),
      heading('h2', 'A State-Wide Contest'),
      paragraph(
        text(
          "Uttar Pradesh's 403 assembly constituencies span 75 districts and more than 15 crore registered voters — by far the largest electorate of any Indian state, served by over 1.7 lakh polling booths. A win of this scale, replicated across urban, rural, and semi-urban seats alike, made the 2022 result one of the most emphatic mandates in the state's recent history.",
        ),
      ),
      heading('h2', 'Explore the Full Data'),
      paragraph(
        text(
          "IndiaStats.org carries constituency-level election history for Uttar Pradesh from 2012 through 2022, including every candidate, party and vote total recorded for all 403 assemblies. Use the district and constituency pages to trace how any individual seat has voted across all three elections.",
        ),
      ),
    ]),
    pexelsQuery: 'India political rally crowd',
    categories: ['Election Analysis'],
  },

  // ---------------------------------------------------------------------
  // 2 — 2017 landslide
  // ---------------------------------------------------------------------
  {
    title: '2017 Uttar Pradesh Election: The BJP Landslide That Won 312 of 403 Seats',
    slug: 'up-2017-election-landslide-bjp-312-seats',
    metaTitle: '2017 Uttar Pradesh Election — BJP Wins 312 Seats | IndiaStats.org',
    metaDescription:
      'The 2017 Uttar Pradesh assembly election delivered BJP its largest-ever seat tally in the state — 312 of 403 seats — and brought Yogi Adityanath to power.',
    content: richText([
      paragraph(
        text(
          "The 2017 Uttar Pradesh Legislative Assembly election produced one of the most one-sided results in the state's electoral history. The Bharatiya Janata Party (BJP), contesting with allies including ApnaDal(S), won 312 of the state's 403 seats — a three-fourths majority that dwarfed every other party's tally and marked the party's best-ever performance in Uttar Pradesh.",
        ),
      ),
      heading('h2', 'Final Seat Tally'),
      bulletList([
        'BJP: 312 seats',
        'SP: 47 seats',
        'BSP: 19 seats',
        'ApnaDal(S): 9 seats',
        'INC: 7 seats',
        'Others (NISHAD, SBSP, RLD, independents): remainder of the 403-seat house',
      ]),
      paragraph(
        text(
          'The scale of the win was unprecedented for BJP in Uttar Pradesh — 312 seats meant the party alone, without counting allies, held more than three-quarters of the assembly. It was the first time BJP had governed Uttar Pradesh outright since the 1990s, and the margin over every other party was the widest recorded for any single party in the state in decades.',
        ),
      ),
      heading('h2', 'Yogi Adityanath Becomes Chief Minister'),
      paragraph(
        text(
          "Following the result, Yogi Adityanath — a five-term Member of Parliament from Gorakhpur and head of the Gorakhnath Math — was named chief minister, a position he has held since March 2017. His selection surprised many observers who had expected a more conventional party functionary; it placed a Hindu religious leader with a strong Eastern UP base at the head of India's most populous state.",
        ),
      ),
      heading('h2', 'A Sweep Across Every Region'),
      paragraph(
        text(
          "BJP's 2017 win was remarkable for its geographic spread. In Western UP, the party won 88 of 111 seats. In the Eastern zone — the state's largest region at 175 seats — it took 123. Bundelkhand, a historically BSP- and Congress-competitive region, went entirely to BJP: all 19 of its seats. Central UP (50 of 60 seats) and the Terai belt (32 of 38) followed the same pattern.",
        ),
      ),
      heading('h2', "SP and BSP's Collapse"),
      paragraph(
        text(
          "The scale of BJP's win came almost entirely at the expense of the two parties that had alternated in power for the previous two decades. The Samajwadi Party, which had won 224 seats and formed the government in 2012, fell to just 47. The Bahujan Samaj Party, which had won 80 seats in 2012, dropped to 19 — the beginning of a decline that would deepen further by 2022.",
        ),
      ),
      heading('h2', 'A Clean Sweep in Bundelkhand'),
      paragraph(
        text(
          "Bundelkhand — a drought-prone, historically underdeveloped region spanning seven districts including Jhansi, Banda and Chitrakoot — had traditionally been a competitive, multi-party region. In 2017, BJP won all 19 of its seats, a clean sweep that had no precedent in the region's recent electoral history and signalled how deep the party's 2017 wave ran, even in areas without a strong prior BJP base.",
        ),
      ),
      heading('h2', "Varanasi's Assembly Verdict"),
      paragraph(
        text(
          "Varanasi district, home to one of the state's most politically watched cities, split narrowly in favour of BJP and its allies in 2017: the party won 6 of the district's 8 seats, with SBSP and ApnaDal(S) taking one each. That result was itself a shift from 2012, when the district had split across five different parties, none holding a clear majority of its seats.",
        ),
      ),
      heading('h2', 'Reading the Result in Context'),
      paragraph(
        text(
          "Uttar Pradesh's 403-seat assembly, elected from 75 districts, is the largest state legislature in India. A 312-seat win in that context — roughly 77% of all seats — represents one of the most decisive mandates recorded anywhere in the country's recent state election history. It set the stage for the BJP's return to power five years later in 2022, when the party held its ground with 256 seats.",
        ),
      ),
      heading('h2', 'Track the Full Result'),
      paragraph(
        text(
          'IndiaStats.org carries constituency-by-constituency results for the 2017 Uttar Pradesh election alongside the 2012 and 2022 elections, allowing a direct seat-by-seat comparison of how the state voted across all three cycles.',
        ),
      ),
    ]),
    pexelsQuery: 'India election ballot box',
    categories: ['Election Analysis', 'Political History'],
  },

  // ---------------------------------------------------------------------
  // 3 — 2012 SP wave
  // ---------------------------------------------------------------------
  {
    title: "2012 Uttar Pradesh Election: The Samajwadi Wave That Brought Akhilesh Yadav to Power",
    slug: 'up-2012-election-samajwadi-wave-akhilesh-yadav',
    metaTitle: '2012 Uttar Pradesh Election — SP Wins 224 Seats | IndiaStats.org',
    metaDescription:
      'The 2012 Uttar Pradesh assembly election gave the Samajwadi Party 224 of 403 seats, making Akhilesh Yadav, at 38, the state\'s youngest chief minister.',
    content: richText([
      paragraph(
        text(
          "The 2012 Uttar Pradesh Legislative Assembly election marked a decisive shift in the state's politics. The Samajwadi Party (SP), under the leadership of Akhilesh Yadav, won 224 of the state's 403 seats — a clear majority — unseating the Bahujan Samaj Party (BSP) government led by Mayawati and bringing SP back to power for the first time since 2007.",
        ),
      ),
      heading('h2', 'Final Seat Tally'),
      bulletList([
        'SP: 224 seats (majority — 202 required)',
        'BSP: 80 seats',
        'BJP: 47 seats',
        'INC: 28 seats',
        'RLD: 9 seats',
        'Others (independents and smaller parties): remainder of the 403-seat house',
      ]),
      paragraph(
        text(
          "SP's 224-seat win crossed the majority threshold comfortably, and Akhilesh Yadav — then 38 years old — was sworn in as chief minister, becoming the youngest person to hold the office in Uttar Pradesh's history. He led the state until BJP's landslide victory in 2017.",
        ),
      ),
      heading('h2', 'Where the Samajwadi Wave Was Strongest'),
      paragraph(
        text(
          "SP's win was heavily concentrated in Central and Eastern Uttar Pradesh. In Central UP, the party won 46 of 60 seats. In the Eastern zone, it took 114 of 175 — nearly two-thirds of the region. The party's traditional Yadav-Muslim support base, strongest in these two regions, translated directly into seats.",
        ),
      ),
      heading('h2', "BSP's Fall From Power"),
      paragraph(
        text(
          "The BSP, which had won a full majority on its own in 2007 under Mayawati, dropped to 80 seats in 2012 — a significant decline that ended its single-party government. The party remained competitive in Western UP, where it won 36 of 111 seats, its strongest regional performance, but its statewide vote could not match SP's consolidated support.",
        ),
      ),
      heading('h2', 'A Competitive Western UP'),
      paragraph(
        text(
          'Western Uttar Pradesh was the most evenly contested region in 2012: SP won 39 seats, BSP 36, and BJP 20, with RLD adding 6 — a far more fragmented result than the SP-dominated east and centre of the state. This multi-party competitiveness in the west would later prove significant, as the region swung heavily toward BJP in both 2017 and 2022.',
        ),
      ),
      heading('h2', 'Congress and RLD as Junior Players'),
      paragraph(
        text(
          "INC won 28 seats in 2012, its best performance of the three elections covered here, while RLD — representing the Jat-dominated western districts — won 9 seats, largely in and around Muzaffarnagar and Meerut. Neither party came close to challenging for power, but both played a role in the state's broader multi-party landscape at the time.",
        ),
      ),
      heading('h2', "Azamgarh: An Early Marker of SP's East UP Base"),
      paragraph(
        text(
          "Azamgarh district, in eastern Uttar Pradesh, offered an early sign of how deep SP's regional base could run: the party won 9 of the district's 10 seats in 2012. That dominance would prove durable — Azamgarh remained one of SP's strongest districts through both subsequent elections, even as the party's statewide fortunes fell sharply in 2017.",
        ),
      ),
      heading('h2', 'Central UP: The Core of the 2012 Wave'),
      paragraph(
        text(
          "Central Uttar Pradesh, home to the state capital Lucknow, was where SP's 2012 wave ran deepest relative to the region's size: the party won 46 of Central UP's 60 seats, a share of more than three-quarters. In Lucknow district itself, SP took 7 of 9 seats, a dominance it would not come close to repeating in either of the two elections that followed.",
        ),
      ),
      heading('h2', 'The Setup for What Followed'),
      paragraph(
        text(
          "The 2012 result proved to be the high-water mark for SP in this period. Akhilesh Yadav's government completed its five-year term, but by 2017 the party's seat count had collapsed to 47 as BJP swept the state. The 224-seat mandate of 2012 stands as the last time either SP or BSP has won a majority on its own in Uttar Pradesh.",
        ),
      ),
      heading('h2', 'Full Constituency Data'),
      paragraph(
        text(
          "IndiaStats.org's Uttar Pradesh archive includes every candidate and vote total from the 2012 election for all 403 assembly constituencies, alongside the 2017 and 2022 results, for direct year-on-year comparison at the constituency level.",
        ),
      ),
    ]),
    pexelsQuery: 'Uttar Pradesh Ganges river',
    categories: ['Election Analysis', 'Political History'],
  },

  // ---------------------------------------------------------------------
  // 4 — BSP's collapse
  // ---------------------------------------------------------------------
  {
    title: "BSP's Collapse in Uttar Pradesh: 80 Seats to 19 to 1",
    slug: 'bsp-collapse-mayawati-decline-up-elections',
    metaTitle: "BSP's Decline in UP — 80 Seats (2012) to 1 Seat (2022) | IndiaStats.org",
    metaDescription:
      "BSP won 80 Uttar Pradesh assembly seats in 2012, 19 in 2017, and just 1 in 2022. A look at the numbers behind Mayawati's party's steep decline.",
    content: richText([
      paragraph(
        text(
          "Few declines in Indian state politics have been as steep, or as consistent, as the Bahujan Samaj Party's fall in Uttar Pradesh over the last three assembly elections. From 80 seats in 2012, BSP dropped to 19 in 2017, and then to a single seat in 2022 — a collapse of more than 98% in a decade, across a state where the party once governed with a full majority.",
        ),
      ),
      heading('h2', 'The Ten-Year Trajectory'),
      bulletList([
        '2007 (for context): BSP wins a majority on its own under Mayawati',
        '2012: BSP wins 80 seats — loses power to SP',
        '2017: BSP wins 19 seats — down 61',
        '2022: BSP wins 1 seat — down a further 18',
      ]),
      heading('h2', 'Mayawati and the BSP Base'),
      paragraph(
        text(
          "Mayawati led BSP to power in Uttar Pradesh across several terms, including as chief minister in 1995, 1997, 2002–03, and 2007–2012 — the last of these a full majority government. The party's core support has traditionally rested on Jatav voters, the largest Dalit sub-group in Uttar Pradesh, along with a wider coalition-building strategy that at various points included upper-caste and Muslim voters.",
        ),
      ),
      heading('h2', 'Where the Decline Was Sharpest'),
      paragraph(
        text(
          "BSP's 2012 strength was most visible in Western UP, where it won 36 of 111 seats — its best regional performance that year. By 2017, that number had fallen to just 3 seats in the same region. By 2022, the party's statewide total across all of Uttar Pradesh's 403 seats had fallen to one — a seat won in the Eastern zone, the only constituency the party carried anywhere in the state.",
        ),
      ),
      heading('h2', 'Not a Sudden Drop, but a Steady One'),
      paragraph(
        text(
          "What distinguishes BSP's decline from a single bad election is its consistency across three consecutive cycles — each election saw a further fall, without any recovery in between. This differs from the more common pattern in Indian state politics of a party losing power and then partially rebuilding within a cycle or two; BSP's seat count has moved in only one direction since 2012.",
        ),
      ),
      heading('h2', 'A Shrinking Footprint, Not Just Fewer Wins'),
      paragraph(
        text(
          "The 2022 result was notable not just for the single seat won, but for how thin BSP's presence had become across the state's 403 constituencies. In 2012, the party had a competitive presence across all five of Uttar Pradesh's political regions — Western UP, Central UP, Eastern UP, Terai, and Bundelkhand. By 2022, it had been reduced to a single seat in just one of those five regions.",
        ),
      ),
      heading('h2', 'Where the Votes May Have Gone'),
      paragraph(
        text(
          "Political analysts have widely attributed BSP's decline to two overlapping shifts: a consolidation of non-Jatav Dalit voters toward BJP, and a splitting of the party's broader social coalition among SP, BJP and smaller caste-based parties like SBSP and NISHAD. IndiaStats.org's caste-politics coverage for Uttar Pradesh examines this shift in more detail.",
        ),
      ),
      heading('h2', 'A Party Still Present, but Diminished'),
      paragraph(
        text(
          "BSP remains a registered, contesting party in every Uttar Pradesh election, and Mayawati remains its leader. But the seat numbers tell an unambiguous story: a party that governed the state outright as recently as 2007 now holds a single seat in a 403-member assembly. Whether that decline reflects a temporary trough or a structural shift in the state's caste coalitions is one of the central open questions in Uttar Pradesh politics heading into the next election.",
        ),
      ),
      heading('h2', 'Explore the Data'),
      paragraph(
        text(
          "IndiaStats.org tracks BSP's full candidate and seat history across all three elections — 2012, 2017 and 2022 — for every one of Uttar Pradesh's 403 assembly constituencies.",
        ),
      ),
    ]),
    pexelsQuery: 'India rural landscape',
    categories: ['Political History', 'Election Analysis'],
  },

  // ---------------------------------------------------------------------
  // 5 — 2022 BJP vs SP head-to-head
  // ---------------------------------------------------------------------
  {
    title: '2022 Uttar Pradesh: BJP vs SP Head-to-Head, Region by Region',
    slug: 'up-2022-bjp-vs-sp-head-to-head',
    metaTitle: '2022 UP Election — BJP (256) vs SP (111) Region-by-Region | IndiaStats.org',
    metaDescription:
      "In 2022, Uttar Pradesh narrowed to a two-party contest: BJP won 256 seats, SP 111. A region-by-region look at how the two parties split the state.",
    content: richText([
      paragraph(
        text(
          "The 2022 Uttar Pradesh assembly election was, more than either of the previous two cycles, a direct two-party contest. BJP won 256 of the state's 403 seats and SP won 111 — together accounting for more than 90% of the assembly, with BSP, once the state's dominant force, reduced to a single seat.",
        ),
      ),
      heading('h2', 'The Headline Numbers'),
      bulletList([
        'BJP: 256 seats',
        'SP: 111 seats',
        'Combined BJP + SP share: roughly 91% of the 403-seat assembly',
        "SP's allies (RLD): 8 additional seats, bringing the SP-led alliance to around 119",
        "BJP's allies (ApnaDal(S), NISHAD Party): 18 additional seats, bringing the NDA total to around 274",
      ]),
      heading('h2', 'Eastern UP: BJP Ahead, but SP Competitive'),
      paragraph(
        text(
          "In the Eastern zone — Uttar Pradesh's largest region at 175 seats — BJP won 94 and SP 62, the closest regional margin between the two parties anywhere in the state. This is also the region containing Gorakhpur, Yogi Adityanath's home district, and Azamgarh, one of SP's strongest traditional bases, illustrating how both parties' core strength sits within the same broad region.",
        ),
      ),
      heading('h2', 'Western UP: A Wider BJP Margin'),
      paragraph(
        text(
          'In Western UP (111 seats), BJP won 75 against SP\'s 28, with RLD — contesting in alliance with SP — taking the remaining 8. This was a narrower gap than BJP\'s 88-17 sweep of the region in 2017, suggesting the SP-RLD alliance made real, if partial, inroads into what had been one of BJP\'s strongest regions.',
        ),
      ),
      heading('h2', 'Central UP and Bundelkhand: BJP Dominant'),
      paragraph(
        text(
          'BJP held a wide lead in both Central UP (46 of 60 seats, against 12 for SP) and Bundelkhand (14 of 19, against 3 for SP). These two regions, together accounting for 79 seats, were among BJP\'s most one-sided wins anywhere in the state in 2022.',
        ),
      ),
      heading('h2', 'Terai: BJP Leads, SP a Distant Second'),
      paragraph(
        text(
          "In the Terai belt bordering Nepal (38 seats), BJP won 27 against SP's 6, with the remainder split among NISHAD, INC and ApnaDal(S). This region — spanning districts like Bahraich, Balrampur and Lakhimpur Kheri — has consistently favoured BJP across all three elections covered here.",
        ),
      ),
      heading('h2', "SP's Strongholds: Azamgarh and the East"),
      paragraph(
        text(
          "SP's clearest regional strength in 2022 came in specific Eastern UP districts. In Azamgarh district, long considered one of SP's most reliable bases, the party swept all 10 assembly seats — its only clean sweep of any district anywhere in the state that year.",
        ),
      ),
      heading('h2', "SP's Northern Pockets: Moradabad"),
      paragraph(
        text(
          "Beyond Azamgarh, SP's 2022 strength also showed up further west, in districts like Moradabad — on the boundary between Western UP and the Terai belt — where the party won 6 of 7 seats. Pockets like this illustrate that SP's 2022 recovery, while concentrated in the east, was not confined to a single region.",
        ),
      ),
      heading('h2', 'A Two-Party State, With Smaller Parties as Balancers'),
      paragraph(
        text(
          "With BSP reduced to a single seat, Uttar Pradesh's 2022 result functioned largely as a two-party contest, with RLD, ApnaDal(S), NISHAD Party and SBSP playing supporting roles within the two larger alliances rather than as independent power centres. This alliance structure — NDA built around BJP, and the opposition built around SP — is examined in more detail in IndiaStats.org's coverage of Uttar Pradesh's smaller parties.",
        ),
      ),
      heading('h2', 'Reading the Regional Split'),
      paragraph(
        text(
          'The region-by-region data shows BJP\'s 2022 majority was not built on a uniform statewide swing but on decisive wins in Central UP, Bundelkhand and Terai, combined with competitive-but-still-winning margins in the Eastern and Western zones where SP was strongest. IndiaStats.org\'s district and constituency pages allow this comparison to be repeated for any individual seat across all three elections.',
        ),
      ),
    ]),
    pexelsQuery: 'India voting booth queue',
    categories: ['Election Analysis', 'Data Insights'],
  },

  // ---------------------------------------------------------------------
  // 6 — Beginner's guide
  // ---------------------------------------------------------------------
  {
    title: "How to Read Uttar Pradesh Election Data: A Beginner's Guide to IndiaStats.org",
    slug: 'how-to-read-uttar-pradesh-election-data-guide',
    metaTitle: "How to Read Uttar Pradesh Election Data — Beginner's Guide | IndiaStats.org",
    metaDescription:
      "New to election data? Learn how to use IndiaStats.org to explore Uttar Pradesh's 403 assembly constituencies — election history, districts, and more.",
    content: richText([
      paragraph(
        text(
          "IndiaStats.org brings together election results and constituency data for Uttar Pradesh's 403 assembly constituencies — the largest state assembly in India — in one searchable platform. If you're new to reading election data, this guide walks through the key concepts and how to use the tools available on this site.",
        ),
      ),
      heading('h2', 'What Is an Assembly Constituency?'),
      paragraph(
        text(
          "India's state legislatures are elected from single-member constituencies called Vidhan Sabha (assembly) constituencies. Uttar Pradesh has 403 such constituencies spread across 75 districts — more than any other Indian state. Each elects one Member of the Legislative Assembly (MLA) by simple plurality (first-past-the-post voting). The party or alliance that wins a majority of these 403 seats (202 or more) forms the state government.",
        ),
      ),
      heading('h2', 'Reading the Constituency Page'),
      paragraph(text('Each constituency page on IndiaStats.org displays:')),
      bulletList([
        'The current elected MLA and party',
        'Complete election history: every candidate, party, and vote total from 2012, 2017 and 2022',
        'District and zone context — which of Uttar Pradesh\'s five political regions the seat belongs to',
        'The assembly ID and constituency name',
      ]),
      heading('h2', 'Understanding Vote Share vs Seats'),
      paragraph(
        text(
          "Because Uttar Pradesh uses first-past-the-post voting, a party can win a large share of seats without winning a majority of the popular vote, especially in a multi-party field. BJP's 312-seat win in 2017 — 77% of all seats — came without anything close to 77% of the statewide vote. This winner's-bonus effect is a standard feature of plurality electoral systems, and it becomes more pronounced the more parties split the vote.",
        ),
      ),
      heading('h2', "Uttar Pradesh's Scale"),
      paragraph(
        text(
          'Uttar Pradesh is India\'s largest state by population and by assembly size. It has over 15 crore registered voters and more than 1.7 lakh polling booths — both larger than the entire population of most other Indian states. Keeping this scale in mind is useful context when comparing UP election data to smaller states.',
        ),
      ),
      heading('h2', 'The Three Elections Covered'),
      paragraph(
        text(
          "IndiaStats.org's Uttar Pradesh data currently spans the 2012, 2017 and 2022 assembly elections — enough to trace a full decade of the state's political shifts, from the Samajwadi Party's 2012 majority, through BJP's record 2017 landslide, to its narrower but still decisive 2022 win.",
        ),
      ),
      heading('h2', "Using the District and Region Views"),
      paragraph(
        text(
          "Uttar Pradesh's 403 constituencies are grouped into 75 districts, which in turn sit within five broader political regions used throughout IndiaStats.org's coverage: Western UP, Central UP, Eastern UP (often called Purvanchal), Terai, and Bundelkhand. Filtering by district or region is a useful way to spot patterns that a single constituency page won't show on its own.",
        ),
      ),
      heading('h2', 'A Note on Party Abbreviations'),
      paragraph(
        text(
          "Uttar Pradesh's ballot has historically featured a wider range of parties than most states. Beyond the three largest — BJP, SP and BSP — readers will regularly encounter RLD (Rashtriya Lok Dal), NISHAD Party, ApnaDal(S) (Apna Dal, Soneylal faction), SBSP (Suheldev Bharatiya Samaj Party), and INC (Indian National Congress). IndiaStats.org's constituency pages list the full party name alongside its abbreviation for every candidate.",
        ),
      ),
      heading('h2', 'Following a Single Constituency Over Time'),
      paragraph(
        text(
          "One of the more useful ways to use IndiaStats.org is to pick a single constituency and follow it across all three elections rather than reading each year in isolation. A district like Azamgarh, which SP has carried consistently since 2012, tells a different story from one like Bundelkhand's Jhansi, which swung from a fragmented multi-party result in 2012 to an outright BJP sweep in 2017. Comparing a constituency's full history is often more revealing than any single year's result on its own.",
        ),
      ),
    ]),
    pexelsQuery: 'India government building',
    categories: ['Data Insights'],
  },

  // ---------------------------------------------------------------------
  // 7 — 75 districts and political regions
  // ---------------------------------------------------------------------
  {
    title: "Uttar Pradesh's 75 Districts and Its Five Political Regions",
    slug: 'uttar-pradesh-75-districts-political-regions',
    metaTitle: "Uttar Pradesh's 75 Districts & Political Regions Explained | IndiaStats.org",
    metaDescription:
      "Uttar Pradesh's 403 assembly seats span 75 districts and five political regions — Western UP, Central UP, Purvanchal, Terai, and Bundelkhand. A full guide.",
    content: richText([
      paragraph(
        text(
          "Uttar Pradesh's 403 assembly constituencies are spread across 75 districts — the most of any Indian state. For election analysis, these districts are commonly grouped into broader political regions that share economic, demographic, and voting characteristics. IndiaStats.org groups Uttar Pradesh into five such regions: Western UP, Central UP, Eastern UP, Terai, and Bundelkhand.",
        ),
      ),
      heading('h2', 'The Five Regions by Seat Count'),
      bulletList([
        'Eastern UP (often called Purvanchal): 175 seats — the largest region',
        'Western UP: 111 seats',
        'Central UP (broadly overlapping with the traditional Awadh region): 60 seats',
        'Terai: 38 seats',
        'Bundelkhand: 19 seats',
      ]),
      heading('h2', 'Eastern UP / Purvanchal'),
      paragraph(
        text(
          "Eastern Uttar Pradesh — widely referred to in political commentary as Purvanchal — is the state's largest region by seat count, spanning 28 districts including Varanasi, Gorakhpur, Azamgarh, Ayodhya and Prayagraj. It is also Uttar Pradesh's most politically consequential region simply by scale: no party can form a government without a strong showing here. In 2022, BJP won 94 of its 175 seats to SP's 62 — the closest regional margin between the two parties anywhere in the state.",
        ),
      ),
      heading('h2', 'Western UP'),
      paragraph(
        text(
          "Western Uttar Pradesh, spanning 21 districts including Meerut, Ghaziabad, Agra, Saharanpur and Muzaffarnagar, is the state's second-largest region at 111 seats. It has a distinct agrarian and sugarcane-belt economy, a significant Jat population in its northern districts, and a long RLD presence dating back decades. In 2022, RLD — allied with SP — won all 8 of its statewide seats from this region.",
        ),
      ),
      heading('h2', 'Central UP / Awadh'),
      paragraph(
        text(
          "Central Uttar Pradesh, covering 12 districts including Lucknow, Kanpur Nagar and Aligarh, broadly overlaps with the historic Awadh region associated with Lucknow and its surrounding districts. It has been one of BJP's most consistent strongholds across all three elections — the party won 46 of its 60 seats in 2012's SP-wave year, rising to 50 in 2017 and holding at 46 in 2022.",
        ),
      ),
      heading('h2', 'Terai'),
      paragraph(
        text(
          "The Terai belt runs along Uttar Pradesh's northern border with Nepal, covering seven districts including Bahraich, Balrampur and Lakhimpur Kheri — 38 seats in total. It has consistently leaned toward BJP across all three elections, most recently 27 of 38 seats in 2022.",
        ),
      ),
      heading('h2', 'Bundelkhand'),
      paragraph(
        text(
          "Bundelkhand, in the state's southwest, is its smallest region at 19 seats across seven districts including Jhansi, Banda and Chitrakoot. Historically drought-prone and economically underdeveloped relative to the rest of the state, it swung from a fragmented multi-party result in 2012 to a clean BJP sweep of all 19 seats in 2017, before settling at 14 of 19 for BJP in 2022.",
        ),
      ),
      heading('h2', 'District Counts by Region'),
      bulletList([
        'Eastern UP / Purvanchal: 28 districts',
        'Western UP: 21 districts',
        'Central UP / Awadh: 12 districts',
        'Terai: 7 districts',
        'Bundelkhand: 7 districts',
      ]),
      paragraph(
        text(
          'These regional boundaries are not official administrative divisions — Uttar Pradesh\'s formal units are its 75 districts and, above them, a smaller number of administrative divisions. The five-region grouping used here reflects how the state is commonly discussed in political analysis, grouping districts by shared economic geography, dominant caste demographics, and historical voting patterns rather than by administrative boundary alone.',
        ),
      ),
      heading('h2', 'Why Regional Data Matters'),
      paragraph(
        text(
          "Because Uttar Pradesh is so large — 403 seats across 75 districts and more than 15 crore voters — statewide seat totals alone can obscure very different regional stories. A party can win comfortably at the state level while losing ground in a specific region, or vice versa. IndiaStats.org's district and constituency pages let readers drill into any of the 75 districts individually to see how that pattern plays out on the ground.",
        ),
      ),
    ]),
    pexelsQuery: 'Uttar Pradesh farmland village',
    categories: ['Constituency Guide', 'Data Insights'],
  },

  // ---------------------------------------------------------------------
  // 8 — Caste politics
  // ---------------------------------------------------------------------
  {
    title: "Caste Politics in Uttar Pradesh: The Coalitions Behind SP, BSP and BJP",
    slug: 'caste-politics-uttar-pradesh-elections',
    metaTitle: 'Caste Politics in Uttar Pradesh Elections Explained | IndiaStats.org',
    metaDescription:
      "Yadav-Muslim, Jatav-Dalit, and non-Yadav OBC coalitions have shaped Uttar Pradesh elections for decades. How SP, BSP and BJP built their voter bases.",
    content: richText([
      paragraph(
        text(
          "Caste has long been one of the central organising forces in Uttar Pradesh politics, shaping party coalitions as much as ideology or policy. Understanding the broad caste alignments behind the state's three largest parties — SP, BSP, and BJP — helps explain both the 2012 Samajwadi wave and BJP's subsequent dominance in 2017 and 2022.",
        ),
      ),
      heading('h2', "SP's Yadav-Muslim Base"),
      paragraph(
        text(
          "The Samajwadi Party's core coalition has historically rested on Yadav voters — a dominant Other Backward Class (OBC) community concentrated in Central and Eastern Uttar Pradesh — combined with Muslim voters, who make up a significant share of the electorate in many eastern and western districts. This Yadav-Muslim alignment was central to SP's 224-seat majority in 2012 and remains its core base today; the party's clean sweep of all 10 seats in Azamgarh district in 2022 reflects this coalition at its strongest.",
        ),
      ),
      heading('h2', "BSP's Jatav-Dalit Foundation"),
      paragraph(
        text(
          "The Bahujan Samaj Party was built specifically around Dalit political representation, with its strongest and most consistent support coming from Jatav voters — the largest Dalit sub-group in Uttar Pradesh. Under Mayawati, the party expanded this base at various points to include upper-caste and Muslim voters as part of a broader social-coalition strategy, most successfully in its 2007 majority win. That broader coalition has narrowed considerably since — BSP's seat count fell from 80 in 2012 to just 1 in 2022.",
        ),
      ),
      heading('h2', "BJP's OBC and Non-Jatav Dalit Consolidation"),
      paragraph(
        text(
          "BJP's rise across 2017 and 2022 has been widely attributed by political analysts to its success in consolidating two groups that neither SP nor BSP fully represented: non-Yadav OBC communities (numerous smaller backward-caste groups outside the dominant Yadav community) and non-Jatav Dalit communities (Dalit sub-groups outside BSP's core Jatav base). This consolidation, alongside BJP's broader upper-caste support, underpinned both its 312-seat landslide in 2017 and its 256-seat win in 2022.",
        ),
      ),
      heading('h2', 'Smaller Parties as Caste-Specific Vehicles'),
      paragraph(
        text(
          "Several smaller Uttar Pradesh parties are built around narrower caste-specific bases. The Suheldev Bharatiya Samaj Party (SBSP) draws on Rajbhar community support, largely in Eastern UP — it won 6 seats in 2022. The NISHAD Party represents Nishad and other traditionally fishing and boatman communities along the state's rivers, also winning 6 seats in 2022. Apna Dal (Soneylal) draws support from the Kurmi community, expanding from 9 seats in 2017 to 12 in 2022. Each has, at various points, allied with BJP as part of its broader OBC-consolidation strategy.",
        ),
      ),
      heading('h2', "RLD and the Jat Vote"),
      paragraph(
        text(
          "The Rashtriya Lok Dal (RLD) represents a different caste alignment altogether — built around Jat voters concentrated in Western UP's sugarcane belt, particularly around Muzaffarnagar, Meerut and Baghpat. RLD's seat count has fluctuated sharply across the three elections covered here — 9 in 2012, a near wipeout in 2017, and 8 in 2022 — reflecting how closely tied its fortunes are to whichever larger alliance it partners with in a given election.",
        ),
      ),
      heading('h2', 'Why These Coalitions Matter for Reading the Data'),
      paragraph(
        text(
          "Caste coalitions in Uttar Pradesh are not static — voters and communities have shifted between parties across the three elections covered on IndiaStats.org, and the same district can show very different results in 2012, 2017 and 2022 as these coalitions realign. Reading constituency-level data alongside a basic understanding of these caste dynamics gives a fuller picture than seat totals alone.",
        ),
      ),
      heading('h2', 'Explore District-Level Patterns'),
      paragraph(
        text(
          "IndiaStats.org's district and constituency pages allow readers to trace how these coalitions have played out in specific parts of the state — from SP's Azamgarh stronghold to BJP's near-total sweep of the Bundelkhand region in 2017.",
        ),
      ),
    ]),
    pexelsQuery: 'India rural community people',
    categories: ['Political History', 'Data Insights'],
  },

  // ---------------------------------------------------------------------
  // 9 — Yogi Adityanath profile
  // ---------------------------------------------------------------------
  {
    title: "Yogi Adityanath: Uttar Pradesh's Chief Minister Since 2017",
    slug: 'yogi-adityanath-profile-uttar-pradesh-cm',
    metaTitle: "Yogi Adityanath — Uttar Pradesh Chief Minister Profile | IndiaStats.org",
    metaDescription:
      "Yogi Adityanath has led Uttar Pradesh as chief minister since March 2017, winning back-to-back majorities in 2017 (312 seats) and 2022 (256 seats).",
    content: richText([
      paragraph(
        text(
          "Yogi Adityanath has served as Chief Minister of Uttar Pradesh since March 2017, following BJP's landslide 312-seat win that year. His tenure has since been extended by a second consecutive term after the party's 256-seat victory in 2022 — together, the two results anchor his position as the central figure in Uttar Pradesh's politics of the last decade.",
        ),
      ),
      heading('h2', 'From Gorakhpur to the Chief Minister\'s Office'),
      paragraph(
        text(
          "Before becoming chief minister, Yogi Adityanath was a five-term Member of Parliament representing Gorakhpur and head of the Gorakhnath Math, a prominent religious institution in the city. His political base in Gorakhpur has remained a consistent stronghold through his time as chief minister — the district's 9 assembly seats went entirely to BJP in the 2022 election, up from 8 of 9 in 2017.",
        ),
      ),
      heading('h2', 'Two Elections as Chief Minister'),
      bulletList([
        '2017: BJP wins 312 of 403 seats — Yogi Adityanath becomes chief minister',
        '2022: BJP wins 256 of 403 seats — Yogi Adityanath returns for a second consecutive term',
      ]),
      heading('h2', 'A Rare Second Term'),
      paragraph(
        text(
          "Winning a second consecutive term was itself a notable outcome — Uttar Pradesh's electorate has historically voted out incumbent governments after a single term more often than not. Yogi Adityanath's 2022 win, while at a reduced seat count from 2017's landslide, was still a decisive majority, making him one of the few Uttar Pradesh chief ministers in recent decades to secure back-to-back mandates.",
        ),
      ),
      heading('h2', 'The Regional Base of His Mandates'),
      paragraph(
        text(
          "Both of Yogi Adityanath's election wins drew strength from a broad geographic spread rather than any single region. In 2017, BJP swept Bundelkhand entirely (19 of 19 seats) and won heavily across Western UP (88 of 111) and Central UP (50 of 60). In 2022, the pattern held with reduced but still dominant margins — 75 of 111 in Western UP, 46 of 60 in Central UP, and 94 of 175 in the Eastern zone that includes his home district of Gorakhpur.",
        ),
      ),
      heading('h2', "A Term-Defining Consistency"),
      paragraph(
        text(
          "What distinguishes Yogi Adityanath's two terms from the more volatile seat swings that characterised Uttar Pradesh in the preceding decade — SP's 224 seats in 2012, followed by its collapse to 47 in 2017 — is the relative consistency of BJP's performance across his two elections. A drop from 312 to 256 seats is still a significant decline in absolute terms, but it left the party's majority comfortably intact, unlike the more dramatic reversals seen elsewhere in the state's recent history.",
        ),
      ),
      heading('h2', "Eastern UP's Continued Importance"),
      paragraph(
        text(
          "As chief minister, Yogi Adityanath has drawn heavily on his Eastern UP base, and the region's 175 seats — more than any other single zone in the state — have remained central to both of his governing majorities. Purvanchal's 94-62 BJP-SP split in 2022 was the closest regional margin of that election, underlining that even the Chief Minister's home region is not automatically secured; it has had to be actively contested and won at every cycle.",
        ),
      ),
      heading('h2', 'What the Data Shows Going Forward'),
      paragraph(
        text(
          "With Uttar Pradesh's next assembly election due in 2027, following the established 2012-2017-2022 five-year cycle, Yogi Adityanath's two terms as chief minister will form the backdrop against which that contest is judged. IndiaStats.org's constituency archive covers both of his election wins in full, alongside the 2012 election that preceded them.",
        ),
      ),
      heading('h2', 'Full Election History'),
      paragraph(
        text(
          "IndiaStats.org tracks every constituency, candidate, and party result from the 2017 and 2022 Uttar Pradesh elections that brought Yogi Adityanath to power and returned him for a second term, alongside the 2012 election that preceded his tenure.",
        ),
      ),
    ]),
    pexelsQuery: 'Indian temple architecture',
    categories: ['Political History'],
  },

  // ---------------------------------------------------------------------
  // 10 — Smaller parties and alliance math
  // ---------------------------------------------------------------------
  {
    title: 'RLD, NISHAD Party and Apna Dal: The Smaller Parties Behind Uttar Pradesh\'s Alliance Math',
    slug: 'rld-nishad-apna-dal-smaller-parties-up-alliance-math',
    metaTitle: 'RLD, NISHAD Party, Apna Dal — UP\'s Smaller Parties Explained | IndiaStats.org',
    metaDescription:
      'RLD, NISHAD Party, and Apna Dal (Soneylal) rarely win big on their own, but their alliance choices have shaped every recent Uttar Pradesh election.',
    content: richText([
      paragraph(
        text(
          "Uttar Pradesh's elections are not decided by BJP, SP and BSP alone. A handful of smaller, often community-specific parties — RLD, NISHAD Party, ApnaDal(S), and SBSP among them — regularly win single-digit-to-low-double-digit seat counts, but their alliance choices have shaped the margins of every recent Uttar Pradesh election.",
        ),
      ),
      heading('h2', 'Smaller Party Seat Counts, 2012-2022'),
      bulletList([
        'RLD: 9 seats (2012) → a near wipeout in 2017 → 8 seats (2022)',
        'ApnaDal(S): did not register at this scale in 2012 → 9 seats (2017) → 12 seats (2022)',
        'NISHAD Party: did not register at this scale in 2012 or 2017 → 6 seats (2022)',
        'SBSP: won a handful of seats in 2017 → 6 seats (2022)',
      ]),
      heading('h2', 'RLD: A Jat-Belt Party With Swinging Fortunes'),
      paragraph(
        text(
          "The Rashtriya Lok Dal (RLD) represents Western Uttar Pradesh's Jat-majority sugarcane belt, centred on districts like Muzaffarnagar, Meerut and Baghpat. Its seat count has swung dramatically depending on its alliance: 9 seats in 2012 contesting on its own strength, a near-wipeout in 2017, and a recovery to 8 seats in 2022 while allied with SP. In Muzaffarnagar district specifically, RLD won 3 of 6 seats in 2022 as part of that alliance.",
        ),
      ),
      heading('h2', "NISHAD Party: A Newer Force on the River Belt"),
      paragraph(
        text(
          "The NISHAD Party, representing Nishad and other traditionally fishing and boatman communities concentrated along Uttar Pradesh's rivers, particularly in the Eastern zone, contested as a BJP ally in 2022 and won 6 seats — its strongest showing in the elections covered here. Its rise reflects BJP's broader strategy of allying with smaller, community-specific parties to consolidate non-dominant OBC votes.",
        ),
      ),
      heading('h2', "Apna Dal (Soneylal): Steady Growth as a BJP Ally"),
      paragraph(
        text(
          "ApnaDal(S), drawing support from the Kurmi community, has grown steadily as a BJP ally — from 9 seats in 2017 to 12 in 2022, making it the largest of BJP's smaller allies in the most recent election. Its seats are spread across multiple regions, including Central UP, Eastern UP, Terai and Bundelkhand, reflecting a genuinely statewide, rather than regionally concentrated, presence.",
        ),
      ),
      heading('h2', 'SBSP: An Eastern UP-Concentrated Ally'),
      paragraph(
        text(
          "The Suheldev Bharatiya Samaj Party (SBSP), representing Rajbhar community interests, has contested as an ally of both BJP and SP at different points. In 2022, contesting alongside BJP, it won 6 seats, with all 6 concentrated in the Eastern zone — reflecting the regionally specific nature of its support base.",
        ),
      ),
      heading('h2', 'Why These Parties Matter Beyond Their Seat Counts'),
      paragraph(
        text(
          "Individually, none of these parties comes close to challenging for power on its own. But collectively, their seats have regularly been the difference between a comfortable majority and a narrower one for whichever larger party they ally with. In 2022, BJP's allies (ApnaDal(S) and NISHAD Party) added 18 seats to its 256-seat tally, while SP's ally RLD added 8 — in both cases, meaningful margins in a 403-seat house where 202 is the threshold for government.",
        ),
      ),
      heading('h2', 'Alliance Loyalty Has Shifted Over Time'),
      paragraph(
        text(
          "None of these parties has stayed with the same larger ally across all three elections covered here — RLD in particular has shifted alignment between cycles. This fluidity means the smaller-party landscape is worth tracking independently of the headline BJP-SP-BSP contest, since it can shift the alliance math meaningfully from one election to the next.",
        ),
      ),
      heading('h2', 'Reading a Smaller Party\'s Seats District by District'),
      paragraph(
        text(
          "The most useful way to assess any of these smaller parties is at the district level rather than the state level, since a single-digit statewide seat count can obscure a genuinely dominant local presence. RLD's 3-of-6 sweep of Muzaffarnagar in 2022, for instance, is a far more complete local victory than its 8-seat statewide total alone suggests.",
        ),
      ),
      heading('h2', 'Track Every Party on IndiaStats.org'),
      paragraph(
        text(
          "IndiaStats.org's constituency pages list every candidate and party, including all of Uttar Pradesh's smaller and regional parties, across the 2012, 2017 and 2022 elections.",
        ),
      ),
    ]),
    pexelsQuery: 'small town India street market',
    categories: ['Election Analysis'],
  },

  // ---------------------------------------------------------------------
  // 11 — Western UP vs Purvanchal
  // ---------------------------------------------------------------------
  {
    title: "Western UP vs Purvanchal: Uttar Pradesh's Two Biggest Electoral Battlegrounds",
    slug: 'western-up-vs-purvanchal-electoral-battlegrounds',
    metaTitle: 'Western UP vs Purvanchal — Comparing UP\'s Key Battlegrounds | IndiaStats.org',
    metaDescription:
      'Western UP (111 seats) and Purvanchal / Eastern UP (175 seats) together decide most Uttar Pradesh elections. A district-by-district comparison.',
    content: richText([
      paragraph(
        text(
          "Between them, Western Uttar Pradesh and Purvanchal — the popular name for the state's Eastern region — account for 286 of Uttar Pradesh's 403 assembly seats, more than two-thirds of the entire state. No party has formed a Uttar Pradesh government in the last three elections without winning decisively in at least one of these two regions, and their differing political character makes for one of the more instructive comparisons in Indian state politics.",
        ),
      ),
      heading('h2', 'The Two Regions by the Numbers'),
      bulletList([
        'Purvanchal (Eastern UP): 175 seats across 28 districts — the largest of Uttar Pradesh\'s five political regions',
        'Western UP: 111 seats across 21 districts — the second-largest region',
        'Combined: 286 seats, or roughly 71% of the 403-seat assembly',
      ]),
      heading('h2', 'Purvanchal: Size, Diversity, and a Contested Base'),
      paragraph(
        text(
          "Purvanchal spans districts as varied as Varanasi, Gorakhpur, Azamgarh, Ayodhya, Prayagraj and Ballia, giving it the most demographically and politically diverse electorate of any Uttar Pradesh region. It is also the closest-fought of the state's regions between BJP and SP: in 2022, BJP won 94 of its 175 seats to SP's 62 — a narrower regional margin than BJP achieved in Western UP, Central UP or Bundelkhand that same year.",
        ),
      ),
      heading('h2', 'Western UP: A Different Economic and Caste Profile'),
      paragraph(
        text(
          "Western UP's political character is shaped heavily by its agrarian, sugarcane-belt economy and its significant Jat population in northern districts like Muzaffarnagar, Meerut and Baghpat — a demographic largely absent from Purvanchal. This has historically given RLD an independent political base in the west that has no real equivalent in the east, where SP's Yadav-Muslim coalition and BJP's broader OBC consolidation are the dominant forces instead.",
        ),
      ),
      heading('h2', 'How the Two Regions Swung Differently, 2012–2022'),
      paragraph(
        text(
          'In 2012, Purvanchal delivered SP its strongest regional result — 114 of 175 seats — while Western UP was far more fragmented, split between SP (39), BSP (36) and BJP (20). By 2017, both regions swung heavily to BJP, though Western UP\'s swing was sharper (88 of 111, or 79%) than Purvanchal\'s (123 of 175, or 70%). By 2022, both regions had settled into wide but not overwhelming BJP margins — 75 of 111 in the west, 94 of 175 in the east.',
        ),
      ),
      heading('h2', "RLD's Regional Concentration"),
      paragraph(
        text(
          "RLD's 8 seats in the 2022 election came entirely from Western UP, with the party winning 3 of 6 seats in Muzaffarnagar district alone as part of its alliance with SP. The party has effectively no presence in Purvanchal, illustrating how distinct the two regions' party systems remain even within a single state.",
        ),
      ),
      heading('h2', "Purvanchal's Outsized Political Weight"),
      paragraph(
        text(
          "Because Purvanchal alone accounts for more seats (175) than Western UP, Central UP and Bundelkhand combined, its political direction has an outsized influence on the statewide result. A party that performs even moderately well across Purvanchal's 175 seats can offset a weaker showing elsewhere in the state — a dynamic that gives the region a level of attention from state and national leaders disproportionate to any single district within it.",
        ),
      ),
      heading('h2', 'Two Regions, One State'),
      paragraph(
        text(
          "Despite their different economic bases, caste coalitions, and swing patterns, Western UP and Purvanchal have moved in broadly the same direction in each of the last three elections — toward SP in 2012, sharply toward BJP in 2017, and toward a more moderate BJP margin in 2022. Whether that parallel movement continues in 2027 will be one of the key questions to watch in Uttar Pradesh's next election cycle.",
        ),
      ),
      heading('h2', 'Compare the Regions Yourself'),
      paragraph(
        text(
          "IndiaStats.org's district and constituency pages allow a direct comparison between any of Western UP's 21 districts and Purvanchal's 28, across all three elections from 2012 to 2022.",
        ),
      ),
    ]),
    pexelsQuery: 'India highway road landscape',
    categories: ['Constituency Guide', 'Election Analysis'],
  },

  // ---------------------------------------------------------------------
  // 12 — 2027 preview
  // ---------------------------------------------------------------------
  {
    title: 'Uttar Pradesh 2027 Assembly Election: What the 2012-2022 Trend Line Suggests',
    slug: 'uttar-pradesh-2027-assembly-election-preview',
    metaTitle: 'Uttar Pradesh 2027 Election Preview — Trends From 2012-2022 | IndiaStats.org',
    metaDescription:
      'Uttar Pradesh\'s next assembly election is due in 2027. Here\'s what the 2012, 2017 and 2022 results suggest about the state\'s political trend line.',
    content: richText([
      paragraph(
        text(
          "Uttar Pradesh's next Legislative Assembly election is due in 2027, following the state's established five-year cycle: 2012, 2017, 2022. With three consecutive election results now on record, a clear trend line has emerged — one defined by BJP's rise, BSP's steep decline, and SP's position as the only party that has meaningfully challenged BJP in the two most recent contests.",
        ),
      ),
      heading('h2', 'The Trend Line: 2012 to 2022'),
      bulletList([
        '2012: SP 224, BSP 80, BJP 47, INC 28, RLD 9',
        '2017: BJP 312, SP 47, BSP 19, ApnaDal(S) 9, INC 7',
        '2022: BJP 256, SP 111, ApnaDal(S) 12, RLD 8, NISHAD 6, SBSP 6, BSP 1',
      ]),
      heading('h2', "BJP's Two-Term Foundation"),
      paragraph(
        text(
          "BJP heads into the 2027 cycle as the incumbent for the second consecutive election, having won 312 seats in 2017 and 256 in 2022 under Yogi Adityanath. The party's seat count declined by 56 between those two elections but remained well clear of the 202-seat majority mark both times — a pattern of comfortable, if narrowing, majorities rather than the boom-and-bust seat swings that defined the SP and BSP eras before it.",
        ),
      ),
      heading('h2', "SP's Recovery Trajectory"),
      paragraph(
        text(
          "SP's seat count moved from a 224-seat majority in 2012, to a 47-seat trough in 2017, to a 111-seat recovery in 2022 — more than doubling its previous tally, though still well short of BJP. Whether that recovery continues, stalls, or reverses by 2027 is the central open question on the opposition side of Uttar Pradesh politics.",
        ),
      ),
      heading('h2', "BSP's Uncertain Path Back"),
      paragraph(
        text(
          "BSP's decline — from 80 seats in 2012, to 19 in 2017, to a single seat in 2022 — is the sharpest sustained fall of any major party in this dataset. Whether the party can arrest that slide before 2027, or whether its remaining vote base continues to migrate toward BJP or SP, will be one of the more closely watched storylines of the next cycle.",
        ),
      ),
      heading('h2', 'Regions to Watch'),
      paragraph(
        text(
          "Based on the 2012-2022 data, three patterns stand out heading into 2027. First, Purvanchal (Eastern UP, 175 seats) has consistently been the most competitive of Uttar Pradesh's five regions between BJP and SP — a 94-62 split in 2022, the narrowest regional margin of that election. Second, Western UP's RLD-SP alliance recovered meaningful ground in 2022 (8 seats, up from a near wipeout in 2017) after Western UP had swung most sharply to BJP in 2017. Third, Bundelkhand — a clean BJP sweep in 2017, but only 14 of 19 in 2022 — shows the region is not a permanently locked BJP stronghold.",
        ),
      ),
      heading('h2', "Smaller Parties' Role Will Likely Persist"),
      paragraph(
        text(
          "RLD, NISHAD Party, ApnaDal(S) and SBSP have each played a measurable role in the last two elections' alliance arithmetic, and there is no data-driven reason to expect their influence to disappear by 2027. How these parties align — and with whom — will likely again shape the margins in Western and Eastern UP specifically.",
        ),
      ),
      heading('h2', 'What This Preview Does and Does Not Claim'),
      paragraph(
        text(
          "This preview is built strictly on the verified seat data from Uttar Pradesh's last three assembly elections — it does not predict a 2027 outcome, forecast vote share, or assert which party or alliance will win. Election results depend on candidate selection, national political conditions, and alliance decisions that have not yet been made. What the 2012-2022 trend line offers instead is a data-grounded starting point for understanding where the state's political contest currently stands.",
        ),
      ),
      heading('h2', 'Follow the Data as 2027 Approaches'),
      paragraph(
        text(
          "IndiaStats.org will continue to track Uttar Pradesh's constituency-level data as the 2027 election approaches. All 403 assembly pages carry full historical results from 2012 through 2022, making it possible to trace any individual seat's trajectory across a full decade of the state's politics.",
        ),
      ),
    ]),
    pexelsQuery: 'India ballot paper voting',
    categories: ['Election Analysis'],
  },
]
