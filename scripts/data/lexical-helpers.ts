export type LexicalNode = Record<string, unknown>

export function text(content: string, bold = false): LexicalNode {
  return { type: 'text', text: content, format: bold ? 1 : 0, version: 1 }
}

export function paragraph(...children: LexicalNode[]): LexicalNode {
  return { type: 'paragraph', children, direction: 'ltr', format: '', indent: 0, version: 1 }
}

export function heading(tag: 'h2' | 'h3', content: string): LexicalNode {
  return {
    type: 'heading',
    tag,
    children: [text(content)],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  }
}

export function listItem(content: string): LexicalNode {
  return {
    type: 'listitem',
    children: [text(content)],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
    value: 1,
  }
}

export function bulletList(items: string[]): LexicalNode {
  return {
    type: 'list',
    listType: 'bullet',
    children: items.map(listItem),
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
    start: 1,
    tag: 'ul',
  }
}

export function richText(children: LexicalNode[]) {
  return {
    root: {
      type: 'root',
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

export interface BlogPostSeed {
  title: string
  slug: string
  metaTitle: string
  metaDescription: string
  content: ReturnType<typeof richText>
  pexelsQuery: string
  categories: string[]
}
