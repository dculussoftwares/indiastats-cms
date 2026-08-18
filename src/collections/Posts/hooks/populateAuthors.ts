import type { CollectionAfterReadHook } from 'payload'
import { Author } from 'src/payload-types'

// GraphQL will not return mutated author data that differs from the underlying schema,
// so we populate an alternative `populatedAuthors` field here, hidden from the admin UI
export const populateAuthors: CollectionAfterReadHook = async ({ doc, req, req: { payload } }) => {
  if (doc?.authors && doc?.authors?.length > 0) {
    const authorDocs: Author[] = []

    for (const author of doc.authors) {
      try {
        const authorDoc = await payload.findByID({
          id: typeof author === 'object' ? author?.id : author,
          collection: 'authors',
          depth: 0,
          req,
        })

        if (authorDoc) {
          authorDocs.push(authorDoc)
        }

        if (authorDocs.length > 0) {
          doc.populatedAuthors = authorDocs.map((authorDoc) => ({
            id: authorDoc.id,
            name: authorDoc.name,
            jobTitle: authorDoc.jobTitle,
            bio: authorDoc.bio,
          }))
        }
      } catch {
        // swallow error
      }
    }
  }

  return doc
}
