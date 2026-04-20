import type { CollectionConfig } from 'payload'

export const Predictors: CollectionConfig = {
    slug: 'predictors',
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'imagePath', 'isActive'],
        group: 'Election Data',
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
            unique: true,
        },
        {
            name: 'imagePath',
            type: 'text',
            required: true,
            admin: {
                description: 'Public image path (for example /images/JVC.png)',
            },
        },
        {
            name: 'bio',
            type: 'textarea',
        },
        {
            name: 'isActive',
            type: 'checkbox',
            required: true,
            defaultValue: true,
        },
    ],
}
