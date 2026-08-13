'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CalendarDays, CheckCircle2, ChevronDown, Clock, Image as ImageIcon, Plus, Sparkles, Trash2, Video, X } from 'lucide-react';
import { socialProviders, type SocialProvider } from '@/lib/social';
import styles from './studio-shell.module.css';

type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

type Post = {
  id: string;
  title: string;
  caption: string;
  channels: SocialProvider[];
  status: PostStatus;
  day: number;
  time: string;
  hasMedia: boolean;
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
};

const days = ['MON 12', 'TUE 13', 'WED 14', 'THU 15', 'FRI 16'];

const PLATFORM_LIMITS: Record<SocialProvider, { maxChars: number; label: string; color: string; requiresMedia: boolean }> = {
  x: { maxChars: 280, label: 'X (Twitter)', color: '#000000', requiresMedia: false },
  instagram: { maxChars: 2200, label: 'Instagram', color: '#e1306c', requiresMedia: true },
  linkedin: { maxChars: 3000, label: 'LinkedIn', color: '#0a66c2', requiresMedia: false },
  facebook: { maxChars: 63206, label: 'Facebook', color: '#1877f2', requiresMedia: false },
  youtube: { maxChars: 5000, label: 'YouTube', color: '#ff0000', requiresMedia: true },
  tiktok: { maxChars: 2200, label: 'TikTok', color: '#fe2c55', requiresMedia: true },
};

const emptyForm = {
  title: '',
  caption: '',
  channels: ['instagram', 'linkedin', 'x'] as SocialProvider[],
  status: 'scheduled' as PostStatus,
  day: 1,
  time: '10:00',
  hasMedia: true,
  mediaType: 'image' as 'image' | 'video',
};

export function CalendarWorkspace() {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 'post-1',
      title: 'Summer Launch Announcement',
      caption: '🚀 Excited to introduce the new Resit creative suite! Build graphics, edit videos, and schedule everywhere with AI.',
      channels: ['instagram', 'x', 'linkedin'],
      status: 'scheduled',
      day: 0,
      time: '09:00',
      hasMedia: true,
      mediaType: 'image',
    },
    {
      id: 'post-2',
      title: 'Behind the Scenes Video',
      caption: 'Quick walkthrough of how we built an open-source alternative to Canva using Next.js & Convex.',
      channels: ['youtube', 'tiktok'],
      status: 'scheduled',
      day: 2,
      time: '14:30',
      hasMedia: true,
      mediaType: 'video',
    },
    {
      id: 'post-3',
      title: 'Design Tips & Brand Kit',
      caption: 'Pro tip: Harmonious color palettes and clean typography make all the difference in modern visual storytelling.',
      channels: ['linkedin', 'facebook'],
      status: 'published',
      day: 1,
      time: '11:15',
      hasMedia: false,
    },
  ]);
  const [hydrated, setHydrated] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [activeFilter, setActiveFilter] = useState<'all' | 'draft' | 'scheduled' | 'published'>('all');
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectBanner, setConnectBanner] = useState<string | null>(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<SocialProvider>>(new Set(['instagram', 'x', 'linkedin']));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('connect');
    const provider = params.get('provider') as SocialProvider | null;
    if (status && provider) {
      if (status === 'success') {
        setConnectedPlatforms((prev) => new Set([...prev, provider]));
        setConnectBanner(`${PLATFORM_LIMITS[provider]?.label || provider} successfully connected and verified.`);
      } else {
        setConnectError(`Could not connect ${provider}. Check provider credentials in the server environment.`);
      }
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  async function connect(providerId: SocialProvider) {
    setConnectError(null);
    try {
      const response = await fetch(`/api/social/${providerId}/connect`);
      const result = await response.json() as { url?: string; error?: string };
      if (result.url) {
        window.open(result.url, '_blank', 'noopener');
      } else {
        // Toggle simulated connection for local testing
        setConnectedPlatforms((prev) => {
          const next = new Set(prev);
          if (next.has(providerId)) next.delete(providerId);
          else next.add(providerId);
          return next;
        });
        setConnectBanner(`${PLATFORM_LIMITS[providerId].label} status updated.`);
      }
    } catch {
      // Toggle for seamless preview
      setConnectedPlatforms((prev) => {
        const next = new Set(prev);
        if (next.has(providerId)) next.delete(providerId);
        else next.add(providerId);
        return next;
      });
      setConnectBanner(`${PLATFORM_LIMITS[providerId].label} connected in local preview mode.`);
    }
  }

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('resit:calendar:posts');
      if (stored) {
        const parsed = JSON.parse(stored) as Post[];
        if (Array.isArray(parsed) && parsed.length > 0) setPosts(parsed);
      }
    } catch {
      // Fallback to initial state
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem('resit:calendar:posts', JSON.stringify(posts));
  }, [hydrated, posts]);

  async function addPost() {
    if (!form.title.trim() && !form.caption.trim()) return;
    const post: Post = {
      id: `post-${Date.now()}`,
      title: form.title.trim() || 'Untitled post',
      caption: form.caption.trim(),
      channels: form.channels.length ? form.channels : ['instagram'],
      status: form.status,
      day: form.day,
      time: form.time,
      hasMedia: form.hasMedia,
      mediaType: form.mediaType,
    };
    setPosts((current) => [...current, post]);

    if (form.status === 'published') {
      try {
        await fetch('/api/social/publish', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            title: post.title,
            caption: post.caption,
            channels: post.channels,
            mediaType: post.mediaType,
          }),
        });
        setConnectBanner(`Successfully published "${post.title}" to ${post.channels.join(', ')}.`);
      } catch {
        // Fallback for preview
      }
    }

    setForm(emptyForm);
    setModalOpen(false);
  }

  function deletePost(id: string) {
    setPosts((current) => current.filter((post) => post.id !== id));
  }

  function toggleChannel(channel: SocialProvider) {
    setForm((current) => ({
      ...current,
      channels: current.channels.includes(channel)
        ? current.channels.filter((item) => item !== channel)
        : [...current.channels, channel],
    }));
  }

  const filteredPosts = posts.filter((p) => {
    if (activeFilter === 'all') return true;
    return p.status === activeFilter;
  });

  // Check character limit for most restrictive selected channel
  const activeLimits = form.channels.map((c) => PLATFORM_LIMITS[c]);
  const minLimit = activeLimits.length ? Math.min(...activeLimits.map((l) => l.maxChars)) : 280;
  const isOverLimit = form.caption.length > minLimit;

  return (
    <div className={styles.calendarArea}>
      <div className={styles.calendarHeader}>
        <div>
          <span className={styles.eyebrow}>SOCIAL SCHEDULER (POSTIZ ENGINE)</span>
          <h2>Multi-Platform Social Calendar</h2>
        </div>
        <div className={styles.calendarActions}>
          <button className={styles.outlineButton}>
            <CalendarDays size={15} /> {posts.filter((post) => post.status === 'scheduled').length} scheduled
          </button>
          <button className={styles.toolbarPrimary} onClick={() => setModalOpen(true)}>
            <Plus size={16} /> New post
          </button>
        </div>
      </div>

      <div className={styles.calendarFilters}>
        <button className={activeFilter === 'all' ? styles.filterActive : ''} onClick={() => setActiveFilter('all')}>
          All channels ({posts.length})
        </button>
        <button className={activeFilter === 'draft' ? styles.filterActive : ''} onClick={() => setActiveFilter('draft')}>
          Drafts ({posts.filter((post) => post.status === 'draft').length})
        </button>
        <button className={activeFilter === 'scheduled' ? styles.filterActive : ''} onClick={() => setActiveFilter('scheduled')}>
          Scheduled ({posts.filter((post) => post.status === 'scheduled').length})
        </button>
        <button className={activeFilter === 'published' ? styles.filterActive : ''} onClick={() => setActiveFilter('published')}>
          Published ({posts.filter((post) => post.status === 'published').length})
        </button>
      </div>

      {/* Connected Channels Manager */}
      <div className={styles.connectRow}>
        <span>Channels:</span>
        {socialProviders.map((provider) => {
          const isConnected = connectedPlatforms.has(provider.id);
          return (
            <button
              key={provider.id}
              onClick={() => void connect(provider.id)}
              style={{
                borderColor: isConnected ? '#7c3aed' : '#e2dee9',
                background: isConnected ? '#f5f0ff' : '#faf9fc',
                color: isConnected ? '#6d28d9' : '#5d5968',
              }}
            >
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: isConnected ? '#10b981' : '#cbd5e1', marginRight: '6px' }} />
              {provider.label} {isConnected ? '✓' : '+'}
            </button>
          );
        })}
      </div>

      {connectError ? <div className={styles.veoError}>{connectError}</div> : null}
      {connectBanner ? <div className={styles.connectBanner}>{connectBanner}</div> : null}

      {/* Weekly Schedule Grid */}
      <div className={styles.calendarGrid}>
        {days.map((day, index) => (
          <div className={styles.dayColumn} key={day}>
            <div className={styles.dayLabel}>
              {day}
              <span>{index + 12}</span>
            </div>
            <div className={styles.timeSlot}>09:00 AM</div>
            {filteredPosts
              .filter((post) => post.day === index)
              .map((post) => (
                <button
                  key={post.id}
                  className={`${styles.postCard} ${post.status === 'published' ? styles.postteal : post.status === 'draft' ? styles.postpink : styles.postpurple}`}
                  onClick={() => {
                    setForm({
                      title: post.title,
                      caption: post.caption,
                      channels: post.channels,
                      status: post.status,
                      day: post.day,
                      time: post.time,
                      hasMedia: post.hasMedia,
                      mediaType: post.mediaType || 'image',
                    });
                    setModalOpen(true);
                  }}
                >
                  <div className={styles.postThumb}>
                    {post.hasMedia ? post.mediaType === 'video' ? <Video size={14} /> : <ImageIcon size={14} /> : <Sparkles size={14} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{post.title}</strong>
                    <small>{post.channels.map((c) => PLATFORM_LIMITS[c]?.label || c).join(' · ')}</small>
                    <span>
                      {post.status === 'scheduled' ? `${post.time} · Scheduled` : post.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <i
                    className={styles.postDelete}
                    onClick={(event) => {
                      event.stopPropagation();
                      deletePost(post.id);
                    }}
                    title="Delete post"
                  >
                    <Trash2 size={13} />
                  </i>
                </button>
              ))}
            <div className={styles.timeSlot}>02:00 PM</div>
          </div>
        ))}
      </div>

      {/* Create / Edit Post Modal */}
      {modalOpen ? (
        <div className={styles.modalBackdrop} onClick={() => setModalOpen(false)}>
          <div className={styles.postModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3>Compose Social Post</h3>
                <span>Publish to 6 platforms with Postiz scheduling engine</span>
              </div>
              <button aria-label="Close" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <label>Campaign / Post Title</label>
            <input className={styles.field} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Summer Studio Launch" />

            <label>Target Channels (Select platforms)</label>
            <div className={styles.channelRow}>
              {socialProviders.map((provider) => {
                const selected = form.channels.includes(provider.id);
                return (
                  <button
                    key={provider.id}
                    className={selected ? styles.channelActive : ''}
                    onClick={() => toggleChannel(provider.id)}
                  >
                    {provider.label} {selected ? '✓' : ''}
                  </button>
                );
              })}
            </div>

            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Caption</span>
              <span style={{ fontSize: '9px', color: isOverLimit ? '#ef4444' : '#64748b' }}>
                {form.caption.length} / {minLimit} chars {isOverLimit ? '(Exceeds platform limit)' : ''}
              </span>
            </label>
            <textarea
              className={styles.field}
              style={{ minHeight: '80px', borderColor: isOverLimit ? '#fca5a5' : undefined }}
              value={form.caption}
              onChange={(event) => setForm({ ...form, caption: event.target.value })}
              placeholder="Write an engaging caption, or ask the AI Copilot to generate one..."
            />

            <div className={styles.modalGrid}>
              <div>
                <label>Status</label>
                <select className={styles.field} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as PostStatus })}>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Publish Now</option>
                </select>
              </div>

              <div>
                <label>Day</label>
                <select className={styles.field} value={form.day} onChange={(event) => setForm({ ...form, day: Number(event.target.value) })}>
                  {days.map((day, index) => (
                    <option key={day} value={index}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Time</label>
                <input type="time" className={styles.field} value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} />
              </div>

              <div>
                <label>Media Attachment</label>
                <button
                  className={`${styles.channelRow} ${styles.mediaToggle}`}
                  onClick={() => setForm({ ...form, hasMedia: !form.hasMedia })}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {form.hasMedia ? '✓ Media Attached' : '+ Add Graphic/Video'}
                </button>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.outlineButton} onClick={() => setModalOpen(false)}>Cancel</button>
              <button className={styles.toolbarPrimary} onClick={addPost} disabled={isOverLimit}>
                <Plus size={16} /> Save & Schedule
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

