import type { PortableTextComponents } from 'next-sanity'

export const portableTextComponents: PortableTextComponents = {
  block: {
    h1: ({ children }) => <h2>{children}</h2>,
  },
}

