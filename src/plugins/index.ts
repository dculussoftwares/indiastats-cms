import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin } from '@payloadcms/plugin-search'
import { azureStorage } from '@payloadcms/storage-azure'
import { s3Storage } from '@payloadcms/storage-s3'
import { Plugin } from 'payload'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { searchFields } from '@/search/fieldOverrides'
import { beforeSyncWithSearch } from '@/search/beforeSync'

import { Page, Post } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

const generateTitle: GenerateTitle<Post | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | IndiaStats.org` : 'IndiaStats.org - India Election Data'
}

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

// Generate meta description from content
const generateDescription = ({ doc }: { doc: Post | Page }) => {
  // If there's a custom meta description, use it
  if (doc?.meta?.description) return doc.meta.description as string

  // Otherwise generate from title
  if (doc?.title) {
    return `Learn more about ${doc.title} on IndiaStats.org - Comprehensive election data, voter statistics, and political insights for Indian elections.`
  }

  return 'Comprehensive election data, voter statistics, and political insights for Indian elections.'
}

export const plugins: Plugin[] = [
  redirectsPlugin({
    collections: ['pages', 'posts'],
    overrides: {
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: 'You will need to rebuild the website when changing this field.',
              },
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  nestedDocsPlugin({
    collections: ['categories'],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  seoPlugin({
    generateTitle,
    generateURL,
    generateDescription,
    uploadsCollection: 'media',
    fields: ({ defaultFields }) => [
      ...defaultFields,
      {
        name: 'keywords',
        type: 'text',
        admin: {
          description: 'Comma-separated keywords for SEO',
        },
      },
    ],
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formOverrides: {
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
  }),
  searchPlugin({
    collections: ['posts'],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields]
      },
    },
  }),
  // Cloudflare R2 (S3 API) for media files. Active only when R2_BUCKET is set.
  // Files are served directly from the public R2 domain (R2_PUBLIC_URL), not proxied by the app.
  ...(process.env.R2_BUCKET
    ? [
        s3Storage({
          collections: {
            media: {
              disablePayloadAccessControl: true,
              generateFileURL: ({ filename, prefix }) =>
                `${process.env.R2_PUBLIC_URL}/${prefix ? `${prefix}/` : ''}${filename}`,
            },
          },
          bucket: process.env.R2_BUCKET,
          config: {
            credentials: {
              accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
              secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
            },
            region: 'auto', // required by R2
            endpoint: process.env.R2_ENDPOINT,
            forcePathStyle: true,
          },
        }),
      ]
    : []),
  // Azure Blob Storage for media files (legacy; only when its env vars are set and R2 is not)
  ...(!process.env.R2_BUCKET &&
  process.env.AZURE_STORAGE_CONNECTION_STRING &&
  process.env.AZURE_STORAGE_ACCOUNT_BASEURL
    ? [
        azureStorage({
          collections: {
            media: true,
          },
          connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
          containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'indiastats-cms-media',
          allowContainerCreate: true,
          baseURL: process.env.AZURE_STORAGE_ACCOUNT_BASEURL,
        }),
      ]
    : []),
]
