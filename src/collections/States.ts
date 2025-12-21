import type { CollectionConfig } from 'payload'

export const States: CollectionConfig = {
    slug: 'states',
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['stateCode', 'name', 'slug'],
        group: 'Configuration',
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            name: 'stateCode',
            type: 'text',
            required: true,
            unique: true,
            admin: {
                description: 'State code (e.g., TN, KA, AP)',
            },
        },
        {
            name: 'slug',
            type: 'text',
            required: true,
            unique: true,
            admin: {
                description: 'URL slug (e.g., tamil-nadu, karnataka)',
            },
        },
        {
            name: 'name',
            type: 'text',
            required: true,
            admin: {
                description: 'Full state name (e.g., Tamil Nadu)',
            },
        },
        {
            name: 'majorParties',
            type: 'array',
            admin: {
                description: 'Major political parties in this state',
            },
            fields: [
                {
                    name: 'partyCode',
                    type: 'text',
                    required: true,
                },
            ],
        },
        {
            name: 'blocs',
            type: 'array',
            admin: {
                description: 'Political blocs/alliances configuration',
            },
            fields: [
                {
                    name: 'blocName',
                    type: 'text',
                    required: true,
                },
                {
                    name: 'parties',
                    type: 'array',
                    fields: [
                        {
                            name: 'partyCode',
                            type: 'text',
                            required: true,
                        },
                    ],
                },
                {
                    name: 'leaderImage',
                    type: 'text',
                    admin: {
                        description: 'Path to leader image',
                    },
                },
                {
                    name: 'color',
                    type: 'text',
                    admin: {
                        description: 'Hex color code for bloc',
                    },
                },
            ],
        },
        {
            name: 'partyColors',
            type: 'json',
            admin: {
                description: 'Party-to-color mapping (JSON object)',
            },
        },
        {
            name: 'leaderImages',
            type: 'json',
            admin: {
                description: 'Party-to-leader-image mapping (JSON object)',
            },
        },
        {
            name: 'mapGeoJson',
            type: 'text',
            admin: {
                description: 'Path to state GeoJSON file',
            },
        },
    ],
}
