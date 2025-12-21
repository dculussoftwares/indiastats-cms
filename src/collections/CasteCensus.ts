import type { CollectionConfig } from 'payload'

export const CasteCensus: CollectionConfig = {
    slug: 'caste-census',
    admin: {
        useAsTitle: 'assemblyName',
        defaultColumns: ['assemblyId', 'assemblyName', 'rank1Caste', 'rank1Percentage'],
        group: 'Census Data',
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            name: 'stateCode',
            type: 'text',
            required: true,
            index: true,
            defaultValue: 'TN',
            admin: {
                description: 'State code (e.g., TN, KA, AP)',
            },
        },
        {
            name: 'assemblyId',
            type: 'text',
            required: true,
            index: true,
            admin: {
                description: 'Assembly ID (e.g., ac001)',
            },
        },
        {
            name: 'assemblyName',
            type: 'text',
            required: true,
            admin: {
                description: 'Assembly name for reference',
            },
        },
        {
            name: 'rank1Caste',
            type: 'text',
            admin: {
                description: 'Highest population caste/community',
            },
        },
        {
            name: 'rank1Percentage',
            type: 'number',
            admin: {
                description: 'Percentage of rank 1 caste',
            },
        },
        {
            name: 'rank2Caste',
            type: 'text',
        },
        {
            name: 'rank2Percentage',
            type: 'number',
        },
        {
            name: 'rank3Caste',
            type: 'text',
        },
        {
            name: 'rank3Percentage',
            type: 'number',
        },
        {
            name: 'rank4Caste',
            type: 'text',
        },
        {
            name: 'rank4Percentage',
            type: 'number',
        },
        {
            name: 'rank5Caste',
            type: 'text',
        },
        {
            name: 'rank5Percentage',
            type: 'number',
        },
    ],
}
