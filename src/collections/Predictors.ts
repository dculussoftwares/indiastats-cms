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
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: {
        description: 'Upload a predictor photo (preferred). Drag & drop or click to upload.',
      },
    },
    {
      name: 'imagePath',
      type: 'text',
      required: false,
      admin: {
        description:
          'Legacy: public image path (e.g. /images/JVC.png). Use the "image" field above instead.',
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
