import type { CollectionConfig } from 'payload'

export const ElectionHistory: CollectionConfig = {
    slug: 'election-history',
    admin: {
        useAsTitle: 'candidateName',
        defaultColumns: ['assemblyId', 'electionYear', 'candidateName', 'candidateParty', 'candidateVotes'],
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
            index: true,
            admin: {
                description: 'Reference to assembly',
            },
        },
        {
            name: 'assemblyName',
            type: 'text',
        },
        {
            name: 'assemblyNo',
            type: 'number',
        },
        {
            name: 'electionYear',
            type: 'number',
            required: true,
            index: true,
            admin: {
                description: 'Election year (e.g., 1972, 2021)',
            },
        },
        {
            name: 'totalVoters',
            type: 'number',
        },
        {
            name: 'votesPolled',
            type: 'number',
        },
        {
            name: 'candidateName',
            type: 'text',
            required: true,
        },
        {
            name: 'candidateParty',
            type: 'text',
            index: true,
        },
        {
            name: 'candidateVotes',
            type: 'number',
            required: true,
        },
    ],
}
