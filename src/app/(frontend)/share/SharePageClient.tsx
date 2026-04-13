'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { buildFriendShareLink, buildUTMUrl, SHARE_PRESETS } from '@/utilities/utm'
import {
  Copy,
  Check,
  UserPlus,
  Trash2,
  Link as LinkIcon,
  Users,
  MessageCircle,
  Send,
  Facebook,
  Linkedin,
  Mail,
  Youtube,
  Zap,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Friend {
  id: string
  name: string
  addedAt: string
}

interface CopiedState {
  friendId: string
  channel: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://indiastats.org'

const DESTINATION_PAGES = [
  { label: 'Home', path: '/' },
  { label: 'Tamil Nadu', path: '/tamil-nadu' },
  { label: 'Assembly Map', path: '/tamil-nadu/assembly-map' },
  { label: 'Election Data', path: '/election-data' },
  { label: 'Caste Demographics', path: '/tamil-nadu/caste-demographics' },
  { label: 'Dashboard', path: '/tamil-nadu/dashboard' },
]

const CHANNEL_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  whatsapp: {
    label: 'WhatsApp',
    icon: <MessageCircle className="h-4 w-4" />,
    color: 'bg-green-100 text-green-700 border-green-200',
  },
  telegram: {
    label: 'Telegram',
    icon: <Send className="h-4 w-4" />,
    color: 'bg-sky-100 text-sky-700 border-sky-200',
  },
  twitter: {
    label: 'X / Twitter',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    color: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  },
  facebook: {
    label: 'Facebook',
    icon: <Facebook className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  instagram: {
    label: 'Instagram',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    color: 'bg-pink-100 text-pink-700 border-pink-200',
  },
  linkedin: {
    label: 'LinkedIn',
    icon: <Linkedin className="h-4 w-4" />,
    color: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  newsletter: {
    label: 'Newsletter',
    icon: <Mail className="h-4 w-4" />,
    color: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  youtube: {
    label: 'YouTube',
    icon: <Youtube className="h-4 w-4" />,
    color: 'bg-red-100 text-red-700 border-red-200',
  },
  reddit: {
    label: 'Reddit',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
      </svg>
    ),
    color: 'bg-orange-100 text-orange-700 border-orange-200',
  },
}

const STORAGE_KEY = 'indiastats_share_friends'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadFriends(): Friend[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Friend[]) : []
  } catch {
    return []
  }
}

function saveFriends(friends: Friend[]): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(friends))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CopyButton({ url, friendId, channel, copied, onCopy }: {
  url: string
  friendId: string
  channel: string
  copied: CopiedState | null
  onCopy: (url: string, friendId: string, channel: string) => void
}) {
  const isCopied = copied?.friendId === friendId && copied?.channel === channel
  return (
    <button
      onClick={() => onCopy(url, friendId, channel)}
      className={`flex items-center gap-1 px-2 py-1 rounded text-xs border transition-colors ${
        isCopied
          ? 'bg-green-50 border-green-300 text-green-700'
          : 'bg-white border-border hover:border-red-300 hover:text-red-600'
      }`}
      title="Copy link"
    >
      {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {isCopied ? 'Copied' : 'Copy'}
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SharePageClient() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [nameInput, setNameInput] = useState('')
  const [selectedPage, setSelectedPage] = useState(DESTINATION_PAGES[1]!) // Tamil Nadu default
  const [copied, setCopied] = useState<CopiedState | null>(null)
  const [expandedFriend, setExpandedFriend] = useState<string | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    setFriends(loadFriends())
  }, [])

  const addFriend = useCallback(() => {
    const name = nameInput.trim()
    if (!name) return

    const isDuplicate = friends.some(
      (f) => f.name.toLowerCase() === name.toLowerCase(),
    )
    if (isDuplicate) return

    const updated = [
      ...friends,
      { id: crypto.randomUUID(), name, addedAt: new Date().toISOString() },
    ]
    setFriends(updated)
    saveFriends(updated)
    setNameInput('')
  }, [nameInput, friends])

  const removeFriend = useCallback((id: string) => {
    const updated = friends.filter((f) => f.id !== id)
    setFriends(updated)
    saveFriends(updated)
    if (expandedFriend === id) setExpandedFriend(null)
  }, [friends, expandedFriend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addFriend()
  }

  const handleCopy = useCallback(async (url: string, friendId: string, channel: string) => {
    await navigator.clipboard.writeText(url)
    setCopied({ friendId, channel })
    setTimeout(() => setCopied(null), 2000)
  }, [])

  const baseUrl = `${BASE_URL}${selectedPage.path === '/' ? '' : selectedPage.path}`

  return (
    <div className="container max-w-3xl py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold border-l-4 border-red-600 pl-3 mb-1">
          Share &amp; Track
        </h1>
        <p className="text-muted-foreground text-sm pl-4">
          Generate personalised links for each friend. When they visit, analytics shows you
          exactly who shared which channel.
        </p>
      </div>

      {/* Destination picker */}
      <Card className="border border-border rounded">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-red-600" />
            Destination page
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {DESTINATION_PAGES.map((page) => (
            <button
              key={page.path}
              onClick={() => setSelectedPage(page)}
              className={`px-3 py-1.5 rounded text-sm border transition-colors ${
                selectedPage.path === page.path
                  ? 'border-red-600 bg-red-50 text-red-700 font-medium'
                  : 'border-border hover:border-red-300'
              }`}
            >
              {page.label}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Quick share links (no friend name) */}
      <Card className="border border-border rounded">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-red-600" />
            Quick share links
            <span className="text-xs font-normal text-muted-foreground ml-1">— no name needed</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.keys(SHARE_PRESETS).map((channel) => {
            const meta = CHANNEL_META[channel]
            if (!meta) return null
            const url = buildUTMUrl(baseUrl, channel)
            return (
              <div key={channel} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium w-32 shrink-0 ${meta.color}`}
                >
                  {meta.icon}
                  {meta.label}
                </div>
                <input
                  readOnly
                  value={url}
                  className="flex-1 text-xs bg-muted px-2 py-1 rounded border border-border font-mono truncate"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <CopyButton
                  url={url}
                  friendId="__quick__"
                  channel={channel}
                  copied={copied}
                  onCopy={handleCopy}
                />
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Add friend */}
      <Card className="border border-border rounded">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-red-600" />
            Add a friend
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="Friend's name (e.g. Ravi, Kumar)"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button
            onClick={addFriend}
            disabled={!nameInput.trim()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Add
          </Button>
        </CardContent>
      </Card>

      {/* Friends list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold border-l-4 border-red-600 pl-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Friends
            {friends.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {friends.length}
              </Badge>
            )}
          </h2>
        </div>

        {friends.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-12 border border-dashed border-border rounded">
            No friends added yet. Add a friend above to generate personalised links.
          </div>
        ) : (
          <div className="space-y-3">
            {friends.map((friend) => {
              const isExpanded = expandedFriend === friend.id
              return (
                <Card key={friend.id} className="border border-border rounded">
                  {/* Friend header row */}
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => setExpandedFriend(isExpanded ? null : friend.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-700 font-bold text-sm uppercase">
                        {friend.name[0]}
                      </div>
                      <span className="font-medium">{friend.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {isExpanded ? 'Hide links' : 'Show links'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFriend(friend.id)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded: links per channel */}
                  {isExpanded && (
                    <div className="border-t border-border px-4 pb-4 pt-3 space-y-2">
                      <p className="text-xs text-muted-foreground mb-3">
                        Each link tracks both <strong>{friend.name}</strong> and the channel in GA4 → Acquisition.
                      </p>
                      {Object.keys(SHARE_PRESETS).map((channel) => {
                        const meta = CHANNEL_META[channel]
                        if (!meta) return null
                        const url = buildFriendShareLink(baseUrl, friend.name, channel)
                        return (
                          <div key={channel} className="flex items-center gap-2">
                            <div
                              className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium w-32 shrink-0 ${meta.color}`}
                            >
                              {meta.icon}
                              {meta.label}
                            </div>
                            <input
                              readOnly
                              value={url}
                              className="flex-1 text-xs bg-muted px-2 py-1 rounded border border-border font-mono truncate"
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                            />
                            <CopyButton
                              url={url}
                              friendId={friend.id}
                              channel={channel}
                              copied={copied}
                              onCopy={handleCopy}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* How to read results */}
      <Card className="border border-border rounded bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            How to read results in GA4
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>Reports → Acquisition → Traffic acquisition</p>
          <p>
            Dimension: <code className="bg-muted px-1 rounded text-xs">Session source / medium</code> → shows which channel drove visits
          </p>
          <p>
            Add secondary dimension: <code className="bg-muted px-1 rounded text-xs">Session manual ad content</code> → shows which friend&apos;s link was clicked
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
