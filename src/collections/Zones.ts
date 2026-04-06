import type { CollectionConfig } from 'payload'

export const Zones: CollectionConfig = {
    slug: 'zones',
    admin: {
        useAsTitle: 'zoneName',
        defaultColumns: ['zoneId', 'zoneName', 'stateCode', 'districtCount', 'assemblyCount'],
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
            name: 'zoneId',
            type: 'text',
            required: true,
            unique: true,
            admin: {
                description: 'Unique zone identifier (e.g., z1)',
            },
        },
        {
            name: 'zoneName',
            type: 'text',
            required: true,
            admin: {
                description: 'Name of the zone (e.g., Kongu Nadu)',
            },
        },
        {
            name: 'slug',
            type: 'text',
            required: true,
            unique: true,
            admin: {
                description: 'URL-friendly slug (auto-generated usually)',
            },
        },
        {
            name: 'description',
            type: 'textarea',
            admin: {
                description: 'Optional description of the zone geographically',
            },
        },
        {
            name: 'districtCount',
            type: 'number',
        },
        {
            name: 'assemblyCount',
            type: 'number',
        },
    ],
}
