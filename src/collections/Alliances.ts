import type { CollectionConfig } from 'payload'

export const Alliances: CollectionConfig = {
    slug: 'alliances',
    admin: {
        useAsTitle: 'allianceName',
        defaultColumns: ['electionYear', 'allianceName', 'parties'],
        group: 'Election Data',
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            name: 'electionYear',
            type: 'number',
            required: true,
            index: true,
            admin: {
                description: 'Election year (e.g., 2021, 2016)',
            },
        },
        {
            name: 'allianceName',
            type: 'text',
            required: true,
            admin: {
                description: 'Name of the alliance (e.g., Secular Progressive Alliance)',
            },
        },
        {
            name: 'parties',
            type: 'array',
            required: true,
            admin: {
                description: 'List of parties in this alliance',
            },
            fields: [
                {
                    name: 'partyName',
                    type: 'text',
                    required: true,
                },
            ],
        },
        {
            name: 'color',
            type: 'text',
            required: true,
            admin: {
                description: 'Hex color code for the alliance (e.g., #dc2626)',
            },
            validate: (val: string | undefined | null) => {
                if (!val) return 'Color is required'
                if (!/^#[0-9A-Fa-f]{6}$/.test(val)) {
                    return 'Must be a valid hex color (e.g., #dc2626)'
                }
                return true
            },
        },
    ],
}
