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
    ],
}
