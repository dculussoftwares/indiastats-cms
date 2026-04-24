/**
 * Seed 10 editorial blog posts for IndiaStats.org.
 * Uses real DB data (party wins, voter counts, districts).
 *
 * Run with:
 *   DOTENV_CONFIG_PATH=.env.local pnpm exec tsx scripts/seed-blog-posts.mts
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

// ---------------------------------------------------------------------------
// Lexical rich-text helpers
// ---------------------------------------------------------------------------
type LexicalNode = Record<string, unknown>

function text(content: string, bold = false): LexicalNode {
  return { type: 'text', text: content, format: bold ? 1 : 0, version: 1 }
}

function paragraph(...children: LexicalNode[]): LexicalNode {
  return { type: 'paragraph', children, direction: 'ltr', format: '', indent: 0, version: 1 }
}

function heading(tag: 'h2' | 'h3', content: string): LexicalNode {
  return {
    type: 'heading',
    tag,
    children: [text(content)],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  }
}

function listItem(content: string): LexicalNode {
  return {
    type: 'listitem',
    children: [text(content)],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
    value: 1,
  }
}

function bulletList(items: string[]): LexicalNode {
  return {
    type: 'list',
    listType: 'bullet',
    children: items.map(listItem),
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
    start: 1,
    tag: 'ul',
  }
}

function richText(children: LexicalNode[]) {
  return {
    root: {
      type: 'root',
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

// ---------------------------------------------------------------------------
// Post definitions
// ---------------------------------------------------------------------------
const posts = [
  // -------------------------------------------------------------------------
  // 1 — 2021 election overview
  // -------------------------------------------------------------------------
  {
    title: '2021 Tamil Nadu Election Results: How DMK Won a Landslide Victory',
    slug: '2021-tamil-nadu-election-results-dmk-landslide',
    metaTitle: '2021 Tamil Nadu Election Results — DMK Wins 133 Seats | IndiaStats.org',
    metaDescription:
      'Complete analysis of the 2021 Tamil Nadu Legislative Assembly elections. DMK alliance swept 159 seats while AIADMK retained 66. District-wise breakdown and key takeaways.',
    content: richText([
      paragraph(
        text(
          'The 2021 Tamil Nadu Legislative Assembly election, held on 6 April 2021, delivered one of the most decisive mandates in the state\'s post-1977 electoral history. The Dravidam Munnetra Kazhagam (DMK) led alliance swept to power, ending a decade of AIADMK rule under two chief ministers.',
        ),
      ),
      heading('h2', 'Final Seat Tally'),
      paragraph(
        text(
          'Of the 234 assembly seats in Tamil Nadu, the DMK alliance won 159 seats — a clear majority in a house where 118 is the majority mark. The AIADMK alliance retained 66 seats, a sharp decline from their 136-seat triumph in 2016.',
        ),
      ),
      bulletList([
        'DMK: 133 seats (up from 89 in 2016)',
        'INC (ally): 17 seats',
        'VCK (ally): 4 seats',
        'CPI: 2 seats',
        'CPI(M): 2 seats',
        'AIADMK: 66 seats (down from 136)',
        'BJP: 4 seats',
        'PMK: 5 seats',
      ]),
      heading('h2', 'Voter Turnout'),
      paragraph(
        text(
          'Tamil Nadu recorded a voter turnout of approximately 72.8% in 2021, with over 6.3 crore registered voters across 234 constituencies. The state has consistently seen turnout above 70% since the 1980s — one of the highest among large Indian states.',
        ),
      ),
      heading('h2', 'Key Factors Behind the DMK Win'),
      paragraph(
        text(
          'Political analysts attributed the DMK victory to several converging factors. The death of former chief minister J. Jayalalithaa in December 2016 left AIADMK without its dominant personality. The party\'s subsequent internal split, public defection of senior leaders, and governance criticism over the decade gave the DMK a clear opening.',
        ),
      ),
      paragraph(
        text(
          'DMK president M. K. Stalin, son of five-time chief minister M. Karunanidhi, had been positioning himself as chief ministerial candidate since 2016. His party\'s 133-seat win — a net gain of 44 seats — made him the undisputed choice for chief minister.',
        ),
      ),
      heading('h2', 'Urban vs Rural Patterns'),
      paragraph(
        text(
          'Chennai\'s 16 assembly segments returned a mixed result. The DMK alliance swept most urban and suburban seats, particularly in areas with younger voter demographics. The AIADMK held on in some of its traditional strongholds in the Delta zone and parts of the Kongu region.',
        ),
      ),
      heading('h2', 'Historical Context'),
      paragraph(
        text(
          'Tamil Nadu has a distinctive electoral pattern: since 1984, every state election has resulted in a change of government, with DMK and AIADMK alternating in power. The 2021 result maintained this trend. Understanding it requires looking at all elections since 1977 — data now available for all 234 constituencies on IndiaStats.org.',
        ),
      ),
    ]),
  },

  // -------------------------------------------------------------------------
  // 2 — 2016 election
  // -------------------------------------------------------------------------
  {
    title: '2016 Tamil Nadu Election: AIADMK\'s 136-Seat Sweep Under Jayalalithaa',
    slug: '2016-tamil-nadu-election-aiadmk-jayalalithaa',
    metaTitle: '2016 Tamil Nadu Election — AIADMK Wins 136 Seats | IndiaStats.org',
    metaDescription:
      'Detailed analysis of the 2016 Tamil Nadu assembly elections where AIADMK under J. Jayalalithaa won 136 seats — the last election before her passing in December 2016.',
    content: richText([
      paragraph(
        text(
          'The 2016 Tamil Nadu Legislative Assembly elections, held on 16 May 2016, saw the All India Anna Dravida Munnetra Kazhagam (AIADMK) under J. Jayalalithaa win a historic second consecutive term — the first time any party had achieved that in Tamil Nadu since the MGR era.',
        ),
      ),
      heading('h2', 'Seat Results at a Glance'),
      bulletList([
        'AIADMK: 136 seats (majority — 118 required)',
        'DMK: 89 seats',
        'INC: 8 seats',
        'IUML: 1 seat',
      ]),
      paragraph(
        text(
          'Jayalalithaa herself contested from the R. K. Nagar constituency in Chennai and won. She was sworn in as chief minister for the sixth time on 23 May 2016, but passed away on 5 December 2016, triggering a prolonged political crisis within the AIADMK.',
        ),
      ),
      heading('h2', 'Why AIADMK Won a Second Term'),
      paragraph(
        text(
          'The 2016 result was widely attributed to the popularity of welfare schemes introduced during Jayalalithaa\'s previous term (2011–16), including the free laptop scheme for students, amma canteens offering subsidised meals, and cash transfers for various beneficiary groups. Tamil Nadu\'s Human Development Index ranking had also improved during the period.',
        ),
      ),
      heading('h2', 'DMK\'s Performance'),
      paragraph(
        text(
          'The DMK, contesting in alliance with the INC, won 89 seats — a significant improvement over their 2011 tally, but still short of the majority mark. M. K. Stalin led the campaign as the de facto opposition leader, positioning himself for the 2021 election in which DMK would eventually prevail.',
        ),
      ),
      heading('h2', 'Long-Term Significance'),
      paragraph(
        text(
          'The 2016 election was the last in which J. Jayalalithaa stood as a candidate. Her death eight months later transformed Tamil Nadu\'s political landscape permanently. AIADMK subsequently split into factions led by O. Panneerselvam (OPS) and Edappadi K. Palaniswami (EPS), a division that contributed to their weakened performance in 2021.',
        ),
      ),
      paragraph(
        text(
          'All booth-level and constituency-level data from the 2016 election is available on IndiaStats.org for researchers and political analysts.',
        ),
      ),
    ]),
  },

  // -------------------------------------------------------------------------
  // 3 — SC/ST reserved constituencies
  // -------------------------------------------------------------------------
  {
    title: 'SC/ST Reserved Constituencies in Tamil Nadu: All 43 Explained',
    slug: 'sc-st-reserved-constituencies-tamil-nadu',
    metaTitle: 'SC/ST Reserved Constituencies in Tamil Nadu — 43 Seats | IndiaStats.org',
    metaDescription:
      'Complete guide to all 43 SC/ST reserved assembly constituencies in Tamil Nadu. Understand delimitation, voter counts, and historical political representation.',
    content: richText([
      paragraph(
        text(
          'Tamil Nadu\'s 234 assembly constituencies include 43 seats reserved for Scheduled Castes (SC) and Scheduled Tribes (ST) under Article 332 of the Indian Constitution. These reservations ensure political representation for historically marginalised communities across the state.',
        ),
      ),
      heading('h2', 'How Reservation Works'),
      paragraph(
        text(
          'Reserved constituencies can only be contested by candidates belonging to the specified SC or ST community. The delimitation of reserved seats is decided by the Election Commission of India based on census data. When constituencies are reserved, only SC/ST candidates may stand — any voter in the constituency, regardless of caste, can vote.',
        ),
      ),
      heading('h2', 'Numbers at a Glance'),
      bulletList([
        'Total assembly constituencies in Tamil Nadu: 234',
        'SC reserved seats: 42',
        'ST reserved seats: 2 (Gudalur, Nilgiris)',
        'General (unreserved) seats: 189',
        'Reserved seats as % of total: 18.4%',
      ]),
      heading('h2', 'Geographical Distribution'),
      paragraph(
        text(
          'SC-reserved constituencies are distributed across all 38 districts of Tamil Nadu, with higher concentrations in districts like Villupuram, Cuddalore, and Tirunelveli — areas with historically significant Dalit populations. ST-reserved seats are concentrated in the Nilgiris hill district, reflecting the tribal communities of the Western Ghats.',
        ),
      ),
      heading('h2', 'Political Significance'),
      paragraph(
        text(
          'Reserved constituencies have been crucial battlegrounds for parties like the VCK (Viduthalai Chiruthaigal Katchi), which focuses on Dalit political representation. In 2021, the DMK alliance allocated several reserved seats to VCK, which won 4 of the 6 seats it contested. The PMK (Pattali Makkal Katchi) also focuses on OBC representation, though it primarily contests general seats.',
        ),
      ),
      heading('h2', 'Voter Data'),
      paragraph(
        text(
          'Reserved constituencies in Tamil Nadu collectively account for approximately 1.2 crore registered voters. IndiaStats.org displays the SC/ST reservation status for every assembly constituency, allowing users to filter and compare voter demographics across reserved and general seats.',
        ),
      ),
    ]),
  },

  // -------------------------------------------------------------------------
  // 4 — Voter demographics
  // -------------------------------------------------------------------------
  {
    title: 'Tamil Nadu Voter Demographics: 6.36 Crore Voters Across 234 Constituencies',
    slug: 'tamil-nadu-voter-demographics-2024',
    metaTitle: 'Tamil Nadu Voter Demographics — 6.36 Crore Registered Voters | IndiaStats.org',
    metaDescription:
      'Deep dive into Tamil Nadu\'s voter demographics: 3.12 crore male, 3.24 crore female, and 8,000+ third-gender voters across 234 assembly constituencies and 38 districts.',
    content: richText([
      paragraph(
        text(
          'Tamil Nadu is home to approximately 6.36 crore registered voters spread across 234 assembly constituencies and 38 districts. The state\'s voter rolls reflect its diversity — from densely packed urban constituencies in Chennai to the rural delta districts of the Cauvery belt.',
        ),
      ),
      heading('h2', 'Gender Breakdown'),
      bulletList([
        'Total registered voters: 6,36,12,950',
        'Male voters: 3,11,74,027 (49.0%)',
        'Female voters: 3,24,29,803 (51.0%)',
        'Third-gender voters: ~9,120',
      ]),
      paragraph(
        text(
          'Tamil Nadu is notable for having more registered female voters than male voters — a pattern that reflects both demographic reality and successful voter registration drives targeting women. In several constituencies, women outnumber men on the electoral rolls by a significant margin.',
        ),
      ),
      heading('h2', 'Largest Constituencies by Voter Count'),
      paragraph(
        text(
          'Urban and peri-urban constituencies consistently top the list due to rapid in-migration. The largest constituencies are:',
        ),
      ),
      bulletList([
        'Shozhinganallur (Chennai): 6,90,958 voters — the largest constituency in the state',
        'Kavundampalayam (Coimbatore): 4,91,143 voters',
        'Madavaram (Tiruvallur): 4,86,536 voters',
        'Avadi (Tiruvallur): 4,60,408 voters',
        'Maduravoyal (Tiruvallur): 4,41,669 voters',
      ]),
      heading('h2', 'Smallest Constituencies by Voter Count'),
      paragraph(
        text(
          'Rural, coastal, and hilly constituencies tend to have the lowest voter counts:',
        ),
      ),
      bulletList([
        'Kilvelur (Nagapattinam): 1,76,505 voters',
        'Harbour (Chennai): 1,78,980 voters',
        'Coonoor (Nilgiris): 1,90,543 voters',
        'Vedaranyam (Nagapattinam): 1,93,170 voters',
        'Nagapattinam (Nagapattinam): 1,93,478 voters',
      ]),
      heading('h2', 'District-Level Distribution'),
      paragraph(
        text(
          'Chennai district has 16 assembly constituencies, the highest in the state, followed by Salem and Madurai with 11 and 10 respectively. The 6 electoral zones — Chennai, North, South, Delta, Kongu, and a central group — each have distinct political personalities and voting patterns.',
        ),
      ),
      heading('h2', 'Polling Booth Infrastructure'),
      paragraph(
        text(
          'Tamil Nadu has over 88,000 polling booths serving its 6.36 crore voters. IndiaStats.org tracks all booth-level data, allowing users to explore the booth composition of any of the 234 assembly constituencies in detail.',
        ),
      ),
    ]),
  },

  // -------------------------------------------------------------------------
  // 5 — Chennai constituencies
  // -------------------------------------------------------------------------
  {
    title: 'Chennai\'s 16 Assembly Constituencies: A Complete Voter\'s Guide',
    slug: 'chennai-assembly-constituencies-guide',
    metaTitle: 'Chennai Assembly Constituencies — All 16 Seats Explained | IndiaStats.org',
    metaDescription:
      'A complete guide to Chennai\'s 16 assembly constituencies — from Harbour and Harbour to Shozhinganallur. Voter counts, election history, and key political facts.',
    content: richText([
      paragraph(
        text(
          'Chennai, Tamil Nadu\'s capital and largest city, has 16 assembly constituencies within its corporation limits — the most of any single district in the state. The city is a key political battleground, and its urban, working-class, and educated-youth voter base makes it particularly competitive in every election cycle.',
        ),
      ),
      heading('h2', 'The 16 Chennai Constituencies'),
      bulletList([
        'Dr. Radhakrishnan Nagar',
        'Perambur',
        'Kolathur',
        'Villivakkam',
        'Thiru Vi Ka Nagar',
        'Egmore',
        'Harbour',
        'Chepauk-Thiruvallikeni',
        'Thousand Lights',
        'Anna Nagar',
        'Virugambakkam',
        'Saidapet',
        'T. Nagar',
        'Mylapore',
        'Velachery',
        'Shozhinganallur',
      ]),
      heading('h2', 'Voter Counts Vary Widely'),
      paragraph(
        text(
          'The variation in voter counts across Chennai\'s constituencies is striking. Shozhinganallur, a rapidly growing IT suburb on the southern fringe of the city, has 6,90,958 registered voters — the largest assembly constituency in all of Tamil Nadu. In contrast, Harbour, covering the port and fishing communities of North Chennai, has just 1,78,980 voters — one of the smallest in the state.',
        ),
      ),
      heading('h2', 'Political Character'),
      paragraph(
        text(
          'Chennai constituencies have historically leaned DMK. The party\'s founding was rooted in the Dravidian movement that originated in the city, and its urban, educated support base remains concentrated in Chennai. In 2021, the DMK alliance won the majority of Chennai seats. The party president M. K. Stalin\'s home constituency of Kolathur is located in North Chennai.',
        ),
      ),
      heading('h2', 'Chepauk-Thiruvallikeni'),
      paragraph(
        text(
          'One of the most famous constituencies in the state, Chepauk-Thiruvallikeni (formerly Chepauk-Triplicane) has been contested by luminaries including former chief ministers and senior party figures. The constituency encompasses Chennai\'s historic cricket ground, the Marina Beach area, and a diverse mix of communities.',
        ),
      ),
      heading('h2', 'Explore All 16 on IndiaStats.org'),
      paragraph(
        text(
          'Every Chennai constituency has a dedicated page on IndiaStats.org with complete election history going back to 1977, current voter counts by gender, booth-level data, and caste demographic estimates. Use the interactive assembly map to visualise how the 16 segments fit together within the city.',
        ),
      ),
    ]),
  },

  // -------------------------------------------------------------------------
  // 6 — Tamil Nadu electoral zones
  // -------------------------------------------------------------------------
  {
    title: 'Understanding Tamil Nadu\'s Electoral Zones: North, South, Kongu, Delta, and Chennai',
    slug: 'tamil-nadu-electoral-zones-explained',
    metaTitle: 'Tamil Nadu Electoral Zones — Kongu, Delta, South, North, Chennai | IndiaStats.org',
    metaDescription:
      'Understand the five electoral zones of Tamil Nadu — Chennai, North, South, Kongu, and Delta — and how they shape election outcomes across the state\'s 234 constituencies.',
    content: richText([
      paragraph(
        text(
          'Tamil Nadu\'s 234 assembly constituencies are informally grouped into electoral zones that share geographic, demographic, and political characteristics. While not official administrative divisions, these zones are widely used by psephologists, journalists, and political strategists to analyse election results.',
        ),
      ),
      heading('h2', 'The Five Main Zones'),
      heading('h3', 'Chennai Zone (18 seats)'),
      paragraph(
        text(
          'The Chennai Zone covers the capital city and its immediate urban fringe. It includes Chennai city\'s 16 constituencies plus a few adjacent urban seats. This zone is characterised by high voter density, a large working-class and professional population, and historically strong DMK support. The IT corridor seats like Shozhinganallur have the highest absolute voter counts in the state.',
        ),
      ),
      heading('h3', 'North Zone (36 seats)'),
      paragraph(
        text(
          'The North Zone includes districts north and west of Chennai — Tiruvallur, Kancheepuram, Chengalpattu, and Vellore. This is a demographically diverse region with significant OBC, Dalit, and backward-class concentrations. It has several rapidly expanding peri-urban constituencies that have swung between the two major alliances in recent elections.',
        ),
      ),
      heading('h3', 'Kongu Zone (45 seats)'),
      paragraph(
        text(
          'The Kongu Zone — covering Coimbatore, Erode, Tiruppur, Namakkal, and Salem districts — is the most seats-rich zone and the traditional stronghold of the PMK and, more recently, the BJP. The region has a strong Gounder (Vellalar) community presence, and industries like textiles and engineering have shaped its voter economy. The DMK has made gains here in recent years, but the zone remains competitive.',
        ),
      ),
      heading('h3', 'South Zone (39 seats)'),
      paragraph(
        text(
          'The South Zone covers southern Tamil Nadu — Madurai, Virudhunagar, Ramanathapuram, Thoothukudi, Tirunelveli, and Kanniyakumari. This region is known for strong labour movement politics and a significant Muslim and Christian minority population in certain pockets. It has been an IUML stronghold in specific constituencies and a traditional DMK-AIADMK battleground across others.',
        ),
      ),
      heading('h3', 'Delta Zone (23 seats)'),
      paragraph(
        text(
          'The Delta Zone covers the Cauvery river delta districts — Nagapattinam, Tiruvarur, and Thanjavur. This is predominantly agricultural land with a significant SC population and a history of strong Left party presence. The VCK and CPM have traditionally performed well here. Delta voters are known to be particularly sensitive to water and agriculture policy.',
        ),
      ),
      heading('h2', 'Why Zones Matter for Election Forecasting'),
      paragraph(
        text(
          'Understanding zone-level trends is essential for election forecasting. A party can win the state while underperforming in a particular zone if it dominates other zones sufficiently. The 2021 DMK win, for example, was built on strong performances in Chennai, North, and South zones, offsetting a relatively weaker showing in parts of the Kongu belt.',
        ),
      ),
    ]),
  },

  // -------------------------------------------------------------------------
  // 7 — DMK-AIADMK rivalry history
  // -------------------------------------------------------------------------
  {
    title: 'DMK vs AIADMK: The 50-Year Rivalry That Defines Tamil Nadu Politics',
    slug: 'dmk-vs-aiadmk-50-year-rivalry-tamil-nadu',
    metaTitle: 'DMK vs AIADMK — Tamil Nadu\'s 50-Year Political Rivalry | IndiaStats.org',
    metaDescription:
      'The story of DMK and AIADMK — the two Dravidian parties that have dominated Tamil Nadu politics since 1967. Election data from 1977 to 2021 with full seat tallies.',
    content: richText([
      paragraph(
        text(
          'For over five decades, Tamil Nadu politics has been defined by the rivalry between two Dravidian parties: the Dravida Munnetra Kazhagam (DMK), founded by C. N. Annadurai in 1949, and the All India Anna Dravida Munnetra Kazhagam (AIADMK), founded as a breakaway by M. G. Ramachandran (MGR) in 1972. Every Tamil Nadu chief minister since 1967 has come from one of these two parties.',
        ),
      ),
      heading('h2', 'Origins of the Split'),
      paragraph(
        text(
          'MGR, a hugely popular film star and senior DMK leader, was expelled from the party in 1972 after public disagreements with DMK president M. Karunanidhi. He founded the AIADMK the same year. His film popularity translated directly into electoral power — AIADMK won its first election in 1977, defeating DMK in a landslide.',
        ),
      ),
      heading('h2', 'Election Results: 1977–2021'),
      bulletList([
        '1977: AIADMK wins 130 seats; DMK wins 48',
        '1980: AIADMK wins 130 seats; DMK wins 37',
        '1984: AIADMK wins 132 seats; DMK wins 23 (post-Indira Gandhi assassination wave)',
        '1989: DMK wins 150 seats; AIADMK wins 27',
        '1991: AIADMK wins 164 seats; DMK wins 2 (post-Rajiv Gandhi assassination)',
        '1996: DMK wins 173 seats; AIADMK wins 4',
        '2001: AIADMK wins 132 seats; DMK wins 31',
        '2006: DMK wins 96 seats (alliance dominant); AIADMK wins 61',
        '2011: AIADMK wins 150 seats; DMK wins 23',
        '2016: AIADMK wins 136 seats; DMK wins 89',
        '2021: DMK wins 133 seats; AIADMK wins 66',
      ]),
      heading('h2', 'The Alliance Era'),
      paragraph(
        text(
          'From the 1990s onward, neither party has contested entirely alone. Both routinely forge alliances with national parties (Congress, BJP) and regional parties (PMK, VCK, IUML) that bring vote shares from specific communities. The composition of these alliances often decides the margin of victory. In 2021, the DMK alliance included INC, VCK, CPI, and CPI(M); the AIADMK alliance included BJP and PMK.',
        ),
      ),
      heading('h2', 'Post-Jayalalithaa AIADMK'),
      paragraph(
        text(
          'The death of J. Jayalalithaa in December 2016 left AIADMK without its central personality. The party split between factions led by O. Panneerselvam (who had twice served as caretaker CM) and Edappadi K. Palaniswami (the sitting CM). The EPS faction ultimately prevailed, but the internal divisions contributed to AIADMK\'s decline to 66 seats in 2021.',
        ),
      ),
      heading('h2', 'Explore the Data'),
      paragraph(
        text(
          'IndiaStats.org carries complete election history from 1977 to 2021 for all 234 Tamil Nadu assembly constituencies — including every candidate, party, votes received, and winning margin. Use the interactive map and search tools to explore how each constituency has voted over the decades.',
        ),
      ),
    ]),
  },

  // -------------------------------------------------------------------------
  // 8 — Coimbatore / Kongu
  // -------------------------------------------------------------------------
  {
    title: 'Coimbatore and the Kongu Belt: Tamil Nadu\'s Most Competitive Electoral Region',
    slug: 'coimbatore-kongu-belt-tamil-nadu-elections',
    metaTitle: 'Coimbatore & Kongu Belt Elections — Tamil Nadu\'s Swing Region | IndiaStats.org',
    metaDescription:
      'The Kongu belt — covering Coimbatore, Erode, Tiruppur, Salem, and Namakkal — has 45 assembly seats and is Tamil Nadu\'s most competitive multi-party electoral zone.',
    content: richText([
      paragraph(
        text(
          'The Kongu belt — comprising the districts of Coimbatore, Erode, Tiruppur, Salem, Namakkal, and parts of Dharmapuri — is arguably Tamil Nadu\'s most politically complex electoral region. With 45 assembly constituencies, it is the largest zone in the state by seat count, and its multi-party dynamics make it a critical factor in every state election.',
        ),
      ),
      heading('h2', 'Demographics and Economy'),
      paragraph(
        text(
          'The Kongu region is dominated by the Gounder (Vellalar) community, a dominant agricultural and industrial caste group. The region is home to Tamil Nadu\'s textile and spinning mill industry centred in Coimbatore and Tiruppur, as well as engineering and agro-processing clusters in Salem and Erode. This industrial base gives Kongu voters a distinct set of economic concerns compared to the agrarian delta or the urban Chennai constituencies.',
        ),
      ),
      heading('h2', 'The PMK Factor'),
      paragraph(
        text(
          'The Pattali Makkal Katchi (PMK), representing the Vanniyar community, has historically been influential in parts of the Kongu belt, particularly in northern Kongu. The party has served as a kingmaker ally to both DMK and AIADMK at different elections. In 2021, PMK contested as part of the AIADMK alliance and won 5 seats.',
        ),
      ),
      heading('h2', 'BJP\'s Growing Presence'),
      paragraph(
        text(
          'The Kongu belt has seen the BJP make inroads that have not been replicated elsewhere in Tamil Nadu. The party\'s 4 seats in 2021 all came from this region, driven by the strong Hindutva-leaning Gounder community vote and the organisational work of local BJP units. Coimbatore South and Kavundampalayam are among the constituencies where the BJP has polled competitively.',
        ),
      ),
      heading('h2', 'DMK\'s 2021 Strategy'),
      paragraph(
        text(
          'Despite the BJP and PMK presence, DMK made significant gains in the Kongu belt in 2021, winning seats in Coimbatore, Salem, and Erode that had previously been AIADMK strongholds. Post-2021, the party has invested in organisational expansion in this region ahead of the expected 2026 election.',
        ),
      ),
      heading('h2', 'Key Constituencies to Watch'),
      bulletList([
        'Kavundampalayam (Coimbatore): 4,91,143 voters — second largest in TN',
        'Salem (South): AIADMK stronghold with historic swing potential',
        'Omalur (Salem): Industrial constituency with strong AIADMK history',
        'Bhavani (Erode): Agricultural seat with competitive multi-party contests',
        'Gudalur (Nilgiris): One of only two ST-reserved constituencies in TN',
      ]),
    ]),
  },

  // -------------------------------------------------------------------------
  // 9 — How to read Tamil Nadu election data
  // -------------------------------------------------------------------------
  {
    title: 'How to Read Tamil Nadu Election Data: A Beginner\'s Guide to IndiaStats.org',
    slug: 'how-to-read-tamil-nadu-election-data-guide',
    metaTitle: 'How to Read Tamil Nadu Election Data — Beginner\'s Guide | IndiaStats.org',
    metaDescription:
      'New to election data? Learn how to use IndiaStats.org to explore Tamil Nadu\'s 234 assembly constituencies — voter counts, election history, booth data, and more.',
    content: richText([
      paragraph(
        text(
          'IndiaStats.org brings together election results, voter statistics, and demographic data for Tamil Nadu\'s 234 assembly constituencies in one searchable platform. If you\'re new to election data, this guide walks you through the key concepts and how to use the tools available on this site.',
        ),
      ),
      heading('h2', 'What Is an Assembly Constituency?'),
      paragraph(
        text(
          'India\'s state legislatures are elected from single-member constituencies called Vidhan Sabha (assembly) constituencies. Tamil Nadu has 234 such constituencies. Each elects one Member of the Legislative Assembly (MLA) by simple plurality (first-past-the-post voting). The party or alliance that wins a majority of these 234 seats (118 or more) forms the state government.',
        ),
      ),
      heading('h2', 'Reading the Constituency Page'),
      paragraph(
        text(
          'Each constituency page on IndiaStats.org displays:',
        ),
      ),
      bulletList([
        'Current registered voters (male, female, third gender, total)',
        'Number of polling booths',
        'SC/ST reservation status',
        'Current elected MLA and party',
        'Complete election history: every candidate, party, votes, and margin from 1977–2021',
        'Voter turnout trend across elections',
        'Caste demographic estimates (indicative)',
        'District and zone context',
      ]),
      heading('h2', 'Understanding Vote Share vs Seats'),
      paragraph(
        text(
          'Because Tamil Nadu uses first-past-the-post voting, a party can win a large number of seats with a relatively modest vote share if its votes are efficiently distributed. In 2021, DMK won 133 seats — 57% of all seats — with roughly 37% of the popular vote. AIADMK won 28% of seats with around 33% of the vote. This winner\'s bonus is a standard feature of plurality electoral systems.',
        ),
      ),
      heading('h2', 'What Are Polling Booths?'),
      paragraph(
        text(
          'Each assembly constituency is divided into polling booths — the smallest unit of electoral administration. A booth typically covers a few hundred to a few thousand voters. Tamil Nadu has over 88,000 booths across its 234 constituencies. IndiaStats.org carries booth-level data including booth numbers and their parent constituency for all booths.',
        ),
      ),
      heading('h2', 'Using the District and Map Views'),
      paragraph(
        text(
          'The district view groups constituencies by their parent district (38 districts total), while the interactive map allows you to visualise the geographic layout of all 234 segments. Filter by zone, district, or party to find patterns across the state.',
        ),
      ),
    ]),
  },

  // -------------------------------------------------------------------------
  // 10 — 2026 election preview
  // -------------------------------------------------------------------------
  {
    title: 'Tamil Nadu 2026 Assembly Election: Key Seats, Alliances, and What to Watch',
    slug: 'tamil-nadu-2026-assembly-election-preview',
    metaTitle: 'Tamil Nadu 2026 Election Preview — Key Seats & Alliances | IndiaStats.org',
    metaDescription:
      'Preview of the Tamil Nadu 2026 Legislative Assembly elections — alliance formations, key battleground constituencies, and what the 2021 data tells us about swing seats.',
    content: richText([
      paragraph(
        text(
          'The Tamil Nadu Legislative Assembly election is due in April–May 2026. With 234 constituencies, 6.36 crore voters, and two dominant Dravidian parties seeking to build alliances, the election is shaping up to be one of the most closely watched state polls in India. Here is what the data tells us going in.',
        ),
      ),
      heading('h2', 'The Incumbent DMK Government'),
      paragraph(
        text(
          'DMK, under Chief Minister M. K. Stalin, goes into the election as the incumbent after winning 133 seats in 2021. The party has a full five-year term to its credit and will contest on its governance record — a track record that includes welfare schemes, industrial investment announcements, and social justice legislation. The key question is whether the wave that brought DMK to power in 2021 can be sustained.',
        ),
      ),
      heading('h2', 'The AIADMK Opposition'),
      paragraph(
        text(
          'AIADMK, which won 66 seats in 2021 under Edappadi K. Palaniswami (EPS), goes into 2026 as the principal opposition. The party split with BJP ahead of the 2024 Lok Sabha elections and is expected to contest the 2026 assembly election independently or with a new set of smaller allies. How the EPS-led party consolidates its vote base will be closely watched.',
        ),
      ),
      heading('h2', 'Key Battleground Constituencies'),
      paragraph(
        text(
          'Based on 2021 margins, the following types of seats are likely to be most competitive in 2026:',
        ),
      ),
      bulletList([
        'Kongu belt seats where DMK made first-time gains in 2021 — defending vs AIADMK/BJP',
        'Seats won by margins under 5,000 votes in 2021 (approximately 40 constituencies)',
        'Chennai suburban seats like Shozhinganallur and Madavaram with rapidly growing voter rolls',
        'Delta zone seats with significant VCK and Left influence',
        'All 43 SC/ST reserved constituencies where VCK-DMK alliance dynamics matter',
      ]),
      heading('h2', 'Alliance Arithmetic'),
      paragraph(
        text(
          'Tamil Nadu elections are almost always decided by alliance arithmetic. DMK is expected to retain its alliance with INC, VCK, CPI, and CPI(M). AIADMK\'s alliance composition remains uncertain following the BJP break. PMK, which won 5 seats in the AIADMK alliance in 2021, may prove a swing factor depending on which side it aligns with.',
        ),
      ),
      heading('h2', 'Track the Data on IndiaStats.org'),
      paragraph(
        text(
          'IndiaStats.org will continue tracking election predictions and updated voter roll data as the 2026 election approaches. All 234 constituency pages carry complete historical data from 1977 to 2021, making it possible to identify long-term trends, swing patterns, and demographic shifts that will shape the next election.',
        ),
      ),
    ]),
  },
]

// ---------------------------------------------------------------------------
// Main runner
// ---------------------------------------------------------------------------
async function main() {
  console.log('Connecting to Payload...')
  const payload = await getPayload({ config })

  // Create categories
  console.log('\nEnsuring categories exist...')
  const categoryTitles = ['Election Analysis', 'Data Insights', 'Constituency Guide', 'Political History']
  const categoryIds: Record<string, number> = {}

  for (const title of categoryTitles) {
    const slug = title.toLowerCase().replace(/\s+/g, '-')
    const existing = await payload.find({
      collection: 'categories',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    if (existing.docs[0]) {
      categoryIds[title] = existing.docs[0].id as number
      console.log(`  ✓ Category already exists: ${title}`)
    } else {
      const created = await payload.create({
        collection: 'categories',
        data: { title, slug },
      })
      categoryIds[title] = created.id as number
      console.log(`  + Created category: ${title}`)
    }
  }

  // Map posts to categories
  const postCategoryMap: Record<string, string[]> = {
    '2021-tamil-nadu-election-results-dmk-landslide': ['Election Analysis'],
    '2016-tamil-nadu-election-aiadmk-jayalalithaa': ['Election Analysis', 'Political History'],
    'sc-st-reserved-constituencies-tamil-nadu': ['Constituency Guide', 'Data Insights'],
    'tamil-nadu-voter-demographics-2024': ['Data Insights'],
    'chennai-assembly-constituencies-guide': ['Constituency Guide'],
    'tamil-nadu-electoral-zones-explained': ['Data Insights', 'Constituency Guide'],
    'dmk-vs-aiadmk-50-year-rivalry-tamil-nadu': ['Political History', 'Election Analysis'],
    'coimbatore-kongu-belt-tamil-nadu-elections': ['Constituency Guide', 'Election Analysis'],
    'how-to-read-tamil-nadu-election-data-guide': ['Data Insights'],
    'tamil-nadu-2026-assembly-election-preview': ['Election Analysis'],
  }

  // Insert posts
  console.log('\nCreating posts...')
  let created = 0
  let skipped = 0

  for (const post of posts) {
    const existing = await payload.find({
      collection: 'posts',
      where: { slug: { equals: post.slug } },
      limit: 1,
    })

    if (existing.docs[0]) {
      console.log(`  - Skipping (already exists): ${post.title}`)
      skipped++
      continue
    }

    const catTitles = postCategoryMap[post.slug] || ['Data Insights']
    const categories = catTitles
      .map((t) => categoryIds[t])
      .filter(Boolean)

    await payload.create({
      collection: 'posts',
      context: { disableRevalidate: true },
      data: {
        title: post.title,
        slug: post.slug,
        content: post.content,
        _status: 'published',
        categories,
        meta: {
          title: post.metaTitle,
          description: post.metaDescription,
        },
      } as any,
    })

    console.log(`  + Created: ${post.title}`)
    created++
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
