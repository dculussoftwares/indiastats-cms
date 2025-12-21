import type { CollectionConfig } from 'payload'

export const Booths: CollectionConfig = {
    slug: 'booths',
    admin: {
        useAsTitle: 'boothId',
        defaultColumns: ['boothId', 'assemblyId', 'streetName', 'wardAddress'],
        group: 'Election Data',
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
            name: 'boothId',
            type: 'text',
            required: true,
            admin: {
                description: 'Booth identifier',
            },
        },
        {
            name: 'assemblyId',
            type: 'text',
            required: true,
            index: true,
            admin: {
                description: 'Reference to assembly',
            },
        },
        {
            name: 'districtId',
            type: 'text',
            index: true,
            admin: {
                description: 'Reference to district',
            },
        },
        {
            name: 'wardAddress',
            type: 'text',
        },
        {
            name: 'pdfLink',
            type: 'text',
            admin: {
                description: 'Link to voter list PDF',
            },
        },
        {
            name: 'streetName',
            type: 'text',
        },
    ],
}
