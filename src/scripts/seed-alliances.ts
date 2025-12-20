import { getPayload } from 'payload'
import config from '@payload-config'

const allianceData = {
    "2021": [
        {
            "alliance_name": "Secular Progressive Alliance (SPA)",
            "parties": ["DMK", "INC", "CPI", "CPI(M)", "VCK", "MDMK", "IUML", "KMDK"]
        },
        {
            "alliance_name": "National Democratic Alliance (NDA)",
            "parties": ["AIADMK", "BJP", "PMK"]
        }
    ],
    "2016": [
        {
            "alliance_name": "AIADMK (Solo)",
            "parties": ["AIADMK"]
        },
        {
            "alliance_name": "DMK Alliance",
            "parties": ["DMK", "INC"]
        },
        {
            "alliance_name": "People's Welfare Front (Third Front)",
            "parties": ["DMDK", "CPI", "CPI(M)", "MDMK", "VCK", "TMC"]
        },
        {
            "alliance_name": "PMK (Solo)",
            "parties": ["PMK"]
        }
    ],
    "2011": [
        {
            "alliance_name": "AIADMK Alliance",
            "parties": ["AIADMK", "DMDK", "CPI", "CPI(M)"]
        },
        {
            "alliance_name": "DMK Alliance",
            "parties": ["DMK", "INC", "VCK", "IUML", "Puthiya Tamilagam"]
        }
    ],
    "2006": [
        {
            "alliance_name": "Democratic Progressive Alliance (DPA)",
            "parties": ["DMK", "INC", "PMK", "CPI", "CPI(M)", "IUML"]
        },
        {
            "alliance_name": "Democratic People Alliance",
            "parties": ["AIADMK", "MDMK", "VCK"]
        }
    ],
    "2001": [
        {
            "alliance_name": "Secular Democratic Progressive Alliance",
            "parties": ["AIADMK", "INC", "TMC(M)", "PMK", "CPI", "CPI(M)"]
        },
        {
            "alliance_name": "DMK Alliance",
            "parties": ["DMK", "BJP"]
        }
    ],
    "1996": [
        {
            "alliance_name": "DMK Alliance",
            "parties": ["DMK", "TMC(M)", "CPI"]
        },
        {
            "alliance_name": "AIADMK Alliance",
            "parties": ["AIADMK", "INC"]
        }
    ],
    "1991": [
        {
            "alliance_name": "AIADMK Alliance",
            "parties": ["AIADMK", "INC"]
        },
        {
            "alliance_name": "DMK Alliance (National Front)",
            "parties": ["DMK", "CPI", "CPI(M)", "JD"]
        }
    ],
    "1989": [
        {
            "alliance_name": "DMK Alliance (National Front)",
            "parties": ["DMK", "CPI", "CPI(M)", "JD"]
        },
        {
            "alliance_name": "AIADMK(J) Faction",
            "parties": ["AIADMK(J)"]
        },
        {
            "alliance_name": "AIADMK(JA) Faction",
            "parties": ["AIADMK(JA)"]
        },
        {
            "alliance_name": "INC (Solo)",
            "parties": ["INC"]
        }
    ],
    "1984": [
        {
            "alliance_name": "AIADMK Alliance",
            "parties": ["AIADMK", "INC"]
        },
        {
            "alliance_name": "DMK (Solo)",
            "parties": ["DMK"]
        }
    ],
    "1980": [
        {
            "alliance_name": "AIADMK Alliance",
            "parties": ["AIADMK", "AIFB", "CPI", "CPI(M)", "GKNC"]
        },
        {
            "alliance_name": "DMK Alliance",
            "parties": ["DMK", "INC(I)"]
        }
    ],
    "1977": [
        {
            "alliance_name": "AIADMK Alliance",
            "parties": ["AIADMK", "CPI(M)"]
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
