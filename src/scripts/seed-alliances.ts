import { getPayload } from 'payload'
import config from '@payload-config'

const allianceData = {
    "2021": [
        {
            "alliance_name": "Secular Progressive Alliance (SPA)",
            "parties": ["DMK", "INC", "VCK", "CPI(M)", "CPI", "IUML", "MDMK", "KMDK", "MMK", "TVK(V)"]
        },
        {
            "alliance_name": "National Democratic Alliance (NDA)",
            "parties": ["AIADMK", "BJP", "PMK", "TMC(M)"]
        }
    ],
    "2016": [
        {
            "alliance_name": "DMK Alliance",
            "parties": ["DMK", "INC", "IUML", "PT", "MMK"]
        },
        {
            "alliance_name": "AIADMK (Solo)",
            "parties": ["AIADMK"]
        },
        {
            "alliance_name": "People's Welfare Front (PWF)",
            "parties": ["DMDK", "MDMK", "VCK", "CPI", "CPI(M)", "TMC(M)"]
        }
    ],
    "2011": [
        {
            "alliance_name": "AIADMK Alliance",
            "parties": ["AIADMK", "DMDK", "CPI(M)", "CPI", "MMK", "PT", "AIFB", "MNMK", "SMK"]
        },
        {
            "alliance_name": "Democratic Progressive Alliance (DPA)",
            "parties": ["DMK", "INC", "PMK", "VCK", "KNMK", "IUML"]
        }
    ],
    "2006": [
        {
            "alliance_name": "Democratic Progressive Alliance (DPA)",
            "parties": ["DMK", "INC", "PMK", "CPI", "CPI(M)", "IUML"]
        },
        {
            "alliance_name": "AIADMK Alliance",
            "parties": ["AIADMK", "MDMK", "VCK", "AINL", "JD(S)"]
        }
    ],
    "2001": [
        {
            "alliance_name": "Secular Democratic Progressive Alliance",
            "parties": ["AIADMK", "TMC(M)", "INC", "PMK", "CPI", "CPI(M)", "AIFB", "IUML"]
        },
        {
            "alliance_name": "NDA / DMK Alliance",
            "parties": ["DMK", "BJP", "MADMK", "PNK", "MGRK", "PT"]
        }
    ],
    "1996": [
        {
            "alliance_name": "DMK-TMC Alliance",
            "parties": ["DMK", "TMC(M)", "CPI", "INL"]
        },
        {
            "alliance_name": "AIADMK-INC Alliance",
            "parties": ["AIADMK", "INC"]
        }
    ],
    "1991": [
        {
            "alliance_name": "AIADMK-INC Alliance",
            "parties": ["AIADMK", "INC", "ICS(SCS)"]
        },
        {
            "alliance_name": "National Front (NF)",
            "parties": ["DMK", "CPI(M)", "CPI", "JD", "TMK"]
        }
    ],
    "1989": [
        {
            "alliance_name": "DMK Alliance (National Front)",
            "parties": ["DMK", "CPI(M)", "JD"]
        },
        {
            "alliance_name": "AIADMK (Jayalalithaa) Faction",
            "parties": ["AIADMK(J)", "CPI"]
        },
        {
            "alliance_name": "AIADMK (Janaki) Faction",
            "parties": ["AIADMK(JA)"]
        },
        {
            "alliance_name": "INC (Solo)",
            "parties": ["INC"]
        }
    ],
    "1984": [
        {
            "alliance_name": "AIADMK-INC Alliance",
            "parties": ["AIADMK", "INC", "GKC"]
        },
        {
            "alliance_name": "DMK Alliance",
            "parties": ["DMK", "CPI", "CPI(M)", "Janata Party"]
        }
    ],
    "1980": [
        {
            "alliance_name": "AIADMK Alliance",
            "parties": ["AIADMK", "CPI", "CPI(M)", "GKNC", "AIFB"]
        },
        {
            "alliance_name": "DMK-INC(I) Alliance",
            "parties": ["DMK", "INC(I)", "IUML"]
        }
    ],
    "1977": [
        {
            "alliance_name": "AIADMK-led Front",
            "parties": ["AIADMK", "CPI(M)", "IUML", "AIFB"]
        },
        {
            "alliance_name": "INC(I)-CPI Alliance",
            "parties": ["INC(I)", "CPI"]
        },
        {
            "alliance_name": "DMK (Solo)",
            "parties": ["DMK"]
        },
        {
            "alliance_name": "Janata Party (Solo)",
            "parties": ["Janata Party"]
        }
    ]
}

async function seedAlliances() {
    const payload = await getPayload({ config })

    console.log('Starting alliance seed...')

    // Delete existing alliances
    const existing = await payload.find({ collection: 'alliances', limit: 1000 })
    if (existing.docs.length > 0) {
        console.log(`Deleting ${existing.docs.length} existing alliances...`)
        for (const doc of existing.docs) {
            await payload.delete({ collection: 'alliances', id: doc.id })
        }
    }

    let count = 0

    for (const [year, alliances] of Object.entries(allianceData)) {
        for (const alliance of alliances) {
            await payload.create({
                collection: 'alliances',
                data: {
                    electionYear: parseInt(year, 10),
                    allianceName: alliance.alliance_name,
                    parties: alliance.parties.map(p => ({ partyName: p })),
                },
            })
            count++
            console.log(`Created: ${year} - ${alliance.alliance_name}`)
        }
    }

    console.log(`\nDone! Created ${count} alliance records.`)
    process.exit(0)
}

seedAlliances().catch(console.error)
