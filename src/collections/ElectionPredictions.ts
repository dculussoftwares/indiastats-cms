import type { CollectionConfig } from 'payload'

const normalizeText = (value: unknown): string | null => {
    if (typeof value !== 'string') return null

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
}

const toRelationshipId = (value: unknown): string | null => {
    if (typeof value === 'string' || typeof value === 'number') {
        return String(value)
    }

    if (value && typeof value === 'object' && 'id' in value) {
        const id = (value as { id?: unknown }).id
        if (typeof id === 'string' || typeof id === 'number') {
            return String(id)
        }
    }

    return null
}

export const ElectionPredictions: CollectionConfig = {
    slug: 'election-predictions',
    admin: {
        useAsTitle: 'assemblyId',
        defaultColumns: [
            'assemblyId',
            'electionYear',
            'predictor',
            'predictedWinningParty',
            'predictionType',
        ],
        group: 'Election Data',
    },
    access: {
        read: () => true,
    },
    hooks: {
        beforeValidate: [
            ({ data }) => {
                const mutableData = data as Record<string, unknown> | undefined

                if (!mutableData) {
                    return data
                }

                const predictedWinningParty = normalizeText(mutableData.predictedWinningParty)
                mutableData.predictedWinningParty = predictedWinningParty

                const closeParties = Array.isArray(mutableData.closeParties)
                    ? mutableData.closeParties
                          .map((entry) => {
                              if (!entry || typeof entry !== 'object') return null

                              const partyCode = normalizeText(
                                  (entry as { partyCode?: unknown }).partyCode,
                              )

                              if (!partyCode) return null

                              return { partyCode }
                          })
                          .filter((entry): entry is { partyCode: string } => entry !== null)
                    : []

                mutableData.closeParties = closeParties

                if (predictedWinningParty === null && closeParties.length === 0) {
                    throw new Error(
                        'closeParties must contain at least one party when predictedWinningParty is null.',
                    )
                }

                const predictorId = toRelationshipId(mutableData.predictor)
                const assemblyId = normalizeText(mutableData.assemblyId)
                const electionYear =
                    typeof mutableData.electionYear === 'number'
                        ? mutableData.electionYear
                        : Number(mutableData.electionYear)

                if (predictorId && assemblyId && Number.isFinite(electionYear)) {
                    mutableData.predictionKey = `${predictorId}:${assemblyId}:${electionYear}`
                }

                return mutableData
            },
        ],
    },
    fields: [
        {
            name: 'stateCode',
            type: 'text',
            required: true,
            index: true,
            defaultValue: 'TN',
            admin: {
                description: 'State code (for example TN)',
            },
        },
        {
            name: 'electionYear',
            type: 'number',
            required: true,
            index: true,
        },
        {
            name: 'predictor',
            type: 'relationship',
            relationTo: 'predictors',
            required: true,
        },
        {
            name: 'assemblyDoc',
            type: 'relationship',
            relationTo: 'assemblies',
            required: true,
        },
        {
            name: 'assemblyId',
            type: 'text',
            required: true,
            index: true,
            admin: {
                description: 'Stable public assembly identifier (for example ac001)',
            },
        },
        {
            name: 'predictedWinningParty',
            type: 'text',
            index: true,
            admin: {
                description: 'Leave empty when the predictor only names close parties.',
            },
        },
        {
            name: 'predictionType',
            type: 'text',
            required: true,
        },
        {
            name: 'isCloseContest',
            type: 'checkbox',
            required: true,
            defaultValue: false,
        },
        {
            name: 'closeParties',
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
            name: 'additionalNotes',
            type: 'textarea',
        },
        {
            name: 'predictionKey',
            type: 'text',
            required: true,
            unique: true,
            admin: {
                readOnly: true,
                description:
                    'Internal unique key derived from predictor, assemblyId, and electionYear.',
            },
        },
    ],
}
