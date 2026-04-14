import type { CollectionConfig } from 'payload'

export const Assemblies: CollectionConfig = {
    slug: 'assemblies',
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['assemblyId', 'name', 'districtName', 'noOfBooths'],
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
            name: 'assemblyId',
            type: 'text',
            required: true,
            unique: true,
            admin: {
                description: 'Unique assembly identifier (e.g., ac001)',
            },
        },
        {
            name: 'name',
            type: 'text',
            required: true,
            admin: {
                description: 'Assembly name (bilingual)',
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
            name: 'districtId',
            type: 'text',
            index: true,
            admin: {
                description: 'District ID reference (e.g., dt1)',
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
                description: 'URL-friendly slug (e.g., ambattur)',
            },
        },
        {
            name: 'noOfBooths',
            type: 'number',
            required: true,
            defaultValue: 0,
        },
        {
            name: 'electedMla',
            type: 'json',
            admin: {
                description: 'Current elected MLA data',
            },
        },
        {
            name: 'voters',
            type: 'json',
            admin: {
                description: 'Current voter statistics (male, female, trans, total, isReservedAc)',
            },
        },
        {
            name: 'lastElectionVoters',
            type: 'json',
            admin: {
                description: '2019 voter data',
            },
        },
        {
            name: 'description',
            type: 'textarea',
            admin: {
                description: 'AI-generated constituency description',
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
        {
            name: 'knownBusinesses',
            type: 'json',
            admin: {
                description: 'AI-extracted business, education, healthcare, transport, and landmark data',
                readOnly: true,
            },
        },
    ],
}
