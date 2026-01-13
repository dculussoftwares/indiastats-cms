import type { CollectionConfig } from 'payload'

export const Districts: CollectionConfig = {
    slug: 'districts',
    admin: {
        useAsTitle: 'districtName',
        defaultColumns: ['districtId', 'districtName'],
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
            name: 'districtId',
            type: 'text',
            required: true,
            unique: true,
            admin: {
                description: 'Unique district identifier (e.g., dt1)',
            },
        },
        {
            name: 'districtName',
            type: 'text',
            required: true,
            admin: {
                description: 'District name (bilingual)',
            },
        },
        {
            name: 'slug',
            type: 'text',
            unique: true,
            index: true,
            admin: {
                description: 'URL-friendly slug (e.g., tiruvallur)',
            },
        },
    ],
}
