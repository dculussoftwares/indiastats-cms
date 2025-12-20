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
    ],
}
