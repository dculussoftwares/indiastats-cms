import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

export const Authors: CollectionConfig = {
  slug: 'authors',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'jobTitle'],
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'jobTitle',
      type: 'text',
      admin: {
        description: 'e.g. "Data Editor" — shown in bylines and Person schema for E-E-A-T',
      },
    },
    {
      name: 'bio',
      type: 'textarea',
      admin: {
        description: 'Short bio (1-2 sentences) — shown on the author and used in structured data',
      },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
  ],
  timestamps: true,
}
