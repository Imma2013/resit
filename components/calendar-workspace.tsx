'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, ChevronDown, Image as ImageIcon, Plus, Trash2, X } from 'lucide-react';
import { socialProviders } from '@/lib/social';
import styles from './studio-shell.module.css';

type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

type Post = {
  id: string;
  title: string;
  caption: string;
  channels: string[];
  status: PostStatus;
  day: number;
  time: string;
  hasMedia: boolean;
};

const channelOptions = ['YouTube', 'TikTok', 'Facebook', 'Instagram', 'X'];
const days = ['MON 12', 'TUE 13', 'WED 14', 'THU 15', 'FRI 16'];

const emptyForm = {
  title: '',
  caption: '',
  channels: ['Instagram'] as string[],
  status: 'draft' as PostStatus,
  day: 0,
  time: '09:00',
  hasMedia: false,
};

export function CalendarWorkspace() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectBanner, setConnectBanner] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('connect');
    const provider = params.get('provider');
    if (status && provider) {
      setConnectBanner(status === 'success'
        ? `${provider} connected. Refresh tokens will persist once a Convex deployment is configured.`
        : `Could not connect ${provider}. Check the provider credentials in the server environment.`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  async function connect(providerId: string) {
    setConnectError(null);
    try {
      const response = await fetch(`/api/social/${providerId}/connect`);
      const result = await response.json() as { url?: string; error?: string };
      if (result.url) {
        window.open(result.url, '_blank', 'noopener');
      } else {
        setConnectError(result.error || 'Could not start the connection.');
      }
    } catch {
      setConnectError('The connection service is unavailable.');
    }
  }

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('resit:calendar:posts');
      if (stored) {
        const parsed = JSON.parse(stored) as Post[];
        if (Array.isArray(parsed)) setPosts(parsed);
      }
    } catch {
      // Keep demo mode usable when local storage is unavailable.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem('resit:calendar:posts', JSON.stringify(posts));
  }, [hydrated, posts]);

  function addPost() {
    if (!form.title.trim() && !form.caption.trim()) return;
    const post: Post = {
      id: `post-${Date.now()}`,
      title: form.title.trim() || 'Untitled post',
      caption: form.caption.trim(),
      channels: form.channels.length ? form.channels : ['Instagram'],
      status: form.status,
      day: form.day,
      time: form.time,
      hasMedia: form.hasMedia,
    };
    setPosts((current) => [...current, post]);
    setForm(emptyForm);
    setModalOpen(false);
  }

  function deletePost(id: string) {
    setPosts((current) => current.filter((post) => post.id !== id));
  }

  function toggleChannel(channel: string) {
    setForm((current) => ({
      ...current,
      channels: current.channels.includes(channel)
        ? current.channels.filter((item) => item !== channel)
        : [...current.channels, channel],
    }));
  }

  const colorFor = (post: Post) => {
    if (post.status === 'draft') return 'pink';
    if (post.status === 'published') return 'teal';
    if (post.status === 'failed') return 'yellow';
    return 'purple';
  };

  return (
    <div className={styles.calendarArea}>
      <div className={styles.calendarHeader}>
        <div><span className={styles.eyebrow}>SOCIAL SCHEDULER</span><h2>Content calendar</h2></div>
        <div className={styles.calendarActions}>
          <button className={styles.outlineButton}><CalendarDays size={15} /> {posts.filter((post) => post.status === 'scheduled').length} scheduled</button>
          <button className={styles.toolbarPrimary} onClick={() => setModalOpen(true)}><Plus size={16} /> New post</button>
        </div>
      </div>
      <div className={styles.calendarFilters}>
        <button className={styles.filterActive}>All channels</button>
        <button>Drafts ({posts.filter((post) => post.status === 'draft').length})</button>
        <button>Scheduled</button>
        <button>Published</button>
      </div>
      <div className={styles.connectRow}>
        <span>Connected channels</span>
        {socialProviders.map((provider) => (
          <button key={provider.id} onClick={() => void connect(provider.id)}>{provider.label}</button>
        ))}
      </div>
      {connectError ? <div className={styles.veoError}>{connectError}</div> : null}
      {connectBanner ? <div className={styles.connectBanner}>{connectBanner}</div> : null}
      <div className={styles.calendarGrid}>
        {days.map((day, index) => (
          <div className={styles.dayColumn} key={day}>
            <div className={styles.dayLabel}>{day}<span>{index + 2}</span></div>
            <div className={styles.timeSlot}>09:00</div>
            {posts.filter((post) => post.day === index).map((post) => (
              <button key={post.id} className={`${styles.postCard} ${styles[`post${colorFor(post)}`]}`}>
                <div className={styles.postThumb}>{post.hasMedia ? <ImageIcon size={15} /> : null}</div>
                <div>
                  <strong>{post.title}</strong>
                  <small>{post.channels.join('  /  ')}</small>
                  <span>{post.status === 'scheduled' ? `${post.time} · Scheduled` : post.status}</span>
                </div>
                <i className={styles.postDelete} onClick={(event) => { event.stopPropagation(); deletePost(post.id); }}><Trash2 size={13} /></i>
              </button>
            ))}
            <div className={styles.timeSlot}>14:00</div>
          </div>
        ))}
      </div>

      {modalOpen ? (
        <div className={styles.modalBackdrop} onClick={() => setModalOpen(false)}>
          <div className={styles.postModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}><div><h3>New post</h3><span>Schedule or save a draft for your channels</span></div><button aria-label="Close" onClick={() => setModalOpen(false)}><X size={18} /></button></div>
            <label>Title</label>
            <input className={styles.field} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Summer campaign" />
            <label>Caption</label>
            <textarea className={styles.field} value={form.caption} onChange={(event) => setForm({ ...form, caption: event.target.value })} placeholder="Write a caption, or ask the Copilot to write one." />
            <label>Channels</label>
            <div className={styles.channelRow}>{channelOptions.map((channel) => <button key={channel} className={form.channels.includes(channel) ? styles.channelActive : ''} onClick={() => toggleChannel(channel)}>{channel}</button>)}</div>
            <div className={styles.modalGrid}>
              <div><label>Status</label><select className={styles.field} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as PostStatus })}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="published">Published now</option></select></div>
              <div><label>Day</label><select className={styles.field} value={form.day} onChange={(event) => setForm({ ...form, day: Number(event.target.value) })}>{days.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></div>
              <div><label>Time</label><input type="time" className={styles.field} value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} /></div>
              <div><label>Media</label><button className={`${styles.channelRow} ${styles.mediaToggle}`} onClick={() => setForm({ ...form, hasMedia: !form.hasMedia })}>{form.hasMedia ? 'Has attachment' : 'Add attachment'}</button></div>
            </div>
            <div className={styles.modalActions}><button className={styles.outlineButton} onClick={() => setModalOpen(false)}>Cancel</button><button className={styles.toolbarPrimary} onClick={addPost}><Plus size={16} /> Create post</button></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
