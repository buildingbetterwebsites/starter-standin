import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import type { Media } from '@/payload-types'
import './styles.css'

// The account test's only page: every note, with its image when it has one (served from Vercel Blob).
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const payload = await getPayload({ config })
  const notes = await payload.find({ collection: 'notes', depth: 1, limit: 50, sort: '-createdAt' })

  return (
    <main className="home">
      <div className="content">
        <h1>Account test stand-in</h1>
        <p>
          A bare Next.js + Payload site for the course&apos;s account test. Add a note with an image in{' '}
          <Link href="/admin">the admin screen</Link>; it appears here. Health: <Link href="/api/health">/api/health</Link>.
        </p>
        {notes.docs.length === 0 && <p>No notes yet.</p>}
        <ul>
          {notes.docs.map((note) => {
            const image = typeof note.image === 'object' ? (note.image as Media | null) : null
            return (
              <li key={note.id}>
                <strong>{note.title}</strong>
                {note.summary && <p>{note.summary}</p>}
                {image?.url && (
                  // A plain img: the account test wants the Blob address itself, not an optimised copy.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image.url} alt={image.alt} width={240} />
                )}
                {image?.url && <code>{image.url}</code>}
              </li>
            )
          })}
        </ul>
      </div>
    </main>
  )
}
