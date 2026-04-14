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
            name: 'zoneId',
            type: 'text',
            index: true,
            admin: {
                description: 'Zone ID reference (e.g., z1)',
            },
        },
        {
            name: 'zoneName',
            type: 'text',
            admin: {
                description: 'Zone Name (e.g., Kongu Nadu)',
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
        {
            name: 'description',
            type: 'textarea',
            admin: {
                description: 'AI-generated district description',
                readOnly: true,
            },
        },
        {
            name: 'metaDescription',
            type: 'textarea',
            admin: {
                description: 'AI-generated SEO meta description (150-160 chars)',
                readOnly: true,
            },
        },
    ],
}
