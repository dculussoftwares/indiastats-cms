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
    ],
}
