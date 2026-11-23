import React, { useMemo, useState } from 'react';
import {
  Check,
  Edit3,
  MapPin,
  UserCheck,
} from 'lucide-react';
import { BrandLogoMark } from './brand/BrandLogo';
import { AGENT_TEAMS, AI_AGENTS } from '../utils/aiAgentsRegistry';
import { useApp } from '../context/AppContext';
import {
  useWorkspaceIntelligence,
  type CreatorProfileData,
} from '../context/WorkspaceIntelligenceContext';
import { getUniversalMicroCopy } from '../utils/displayCopy';

export const AboutPlatformView: React.FC = () => {
  const { language } = useApp();
  const micro = useMemo(() => getUniversalMicroCopy(language), [language]);
  const { creatorProfile, setCreatorProfile, showToast } = useWorkspaceIntelligence();
  const [activeTab, setActiveTab] = useState<'platform' | 'creator'>('platform');
  const [editingCreator, setEditingCreator] = useState(false);
  const [draft, setDraft] = useState<CreatorProfileData>(creatorProfile);

  const rawCreatorName = (creatorProfile.name || '').trim();
  const isPlaceholderCreator =
    !rawCreatorName || /platform creator|unverified/i.test(rawCreatorName);
  const creatorDisplayName = isPlaceholderCreator ? micro.about.creatorName : rawCreatorName;
  const rawCreatorRole = (creatorProfile.role || '').trim();
  const creatorDisplayRole =
    !rawCreatorRole || /founder & product architect/i.test(rawCreatorRole)
      ? micro.about.creatorRole
      : rawCreatorRole;
  const creatorDisplayLocation = creatorProfile.location || micro.about.creatorLocation;

  const handleSaveCreator = (e: React.FormEvent) => {
    e.preventDefault();
    setCreatorProfile({
      name: draft.name.trim() || micro.about.creatorName,
      role: draft.role.trim(),
      organization: draft.organization.trim(),
      location: draft.location.trim(),
      missionNote: draft.missionNote.trim(),
      publicWebsite: draft.publicWebsite.trim(),
      publicContact: draft.publicContact.trim(),
    });
    setEditingCreator(false);
    showToast('Creator profile updated.', 'success');
  };

  return (
    <div className="space-y-6" data-testid="about-platform-view">
      {/* Compact Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-hairline)] pb-5">
        <div className="flex items-center gap-4">
          <BrandLogoMark className="w-11 h-11" />
          <h1 className="font-display text-3xl sm:text-4xl font-semibold">
            {micro.about.title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('platform')}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'platform'
                ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)]'
                : 'border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
            }`}
          >
            {micro.about.platformTab}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('creator')}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'creator'
                ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)]'
                : 'border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
            }`}
          >
            {micro.about.creatorTab}
          </button>
        </div>
      </div>

      {activeTab === 'platform' ? (
        <div className="space-y-6">
          {/* Mission + Minimal Creator Spotlight */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-6 flex flex-col justify-center">
              <p className="text-sm sm:text-base text-[var(--text-primary)] leading-relaxed">
                {micro.about.mission}
              </p>
            </div>

            <div
              data-testid="about-creator-spotlight"
              className="lg:col-span-5 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-6 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-primary)]">
                  {micro.about.creatorBadge}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                  <MapPin className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  {creatorDisplayLocation}
                </span>
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
                  {creatorDisplayName}
                </h2>
                <p className="text-xs font-medium text-[var(--text-secondary)] mt-0.5">
                  {creatorDisplayRole}
                </p>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {micro.about.creatorNote}
              </p>
            </div>
          </div>

          {/* Compact 10-Agent Directory */}
          <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-5 sm:p-6 space-y-4">
            <h2 className="font-display text-xl font-semibold">
              {micro.about.agentsHeading}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {AGENT_TEAMS.map((team) => {
                const members = AI_AGENTS.filter((a) => a.teamId === team.id);
                return (
                  <div
                    key={team.id}
                    className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-2.5"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                      {team.shortName}
                    </p>
                    <ul className="space-y-1.5">
                      {members.map((agent) => (
                        <li
                          key={agent.id}
                          title={agent.description}
                          className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-2"
                        >
                          <p className="text-xs font-semibold">{agent.name}</p>
                          <p className="text-[11px] text-[var(--text-muted)] truncate">
                            {agent.shortRole}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-6 space-y-5 max-w-3xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary)]/12 text-[var(--accent-primary)] flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{creatorDisplayName}</h2>
                <p className="text-xs text-[var(--text-secondary)]">{creatorDisplayRole}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setDraft({
                  ...creatorProfile,
                  name: creatorDisplayName,
                  role: creatorDisplayRole,
                  location: creatorDisplayLocation,
                });
                setEditingCreator((v) => !v);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium border border-[var(--border-hairline)] hover:border-[var(--accent-primary)] cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {editingCreator ? micro.back : 'Edit'}
            </button>
          </div>

          {editingCreator ? (
            <form onSubmit={handleSaveCreator} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Creator Name</label>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Role / Title</label>
                  <input
                    type="text"
                    value={draft.role}
                    onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Organization</label>
                  <input
                    type="text"
                    value={draft.organization}
                    onChange={(e) => setDraft({ ...draft, organization: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Location</label>
                  <input
                    type="text"
                    value={draft.location}
                    onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">
                    Public Website (optional)
                  </label>
                  <input
                    type="url"
                    value={draft.publicWebsite}
                    onChange={(e) => setDraft({ ...draft, publicWebsite: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">
                    Public Contact (optional)
                  </label>
                  <input
                    type="text"
                    value={draft.publicContact}
                    onChange={(e) => setDraft({ ...draft, publicContact: e.target.value })}
                    placeholder="Public email or handle"
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Mission Note</label>
                <textarea
                  rows={3}
                  value={draft.missionNote}
                  onChange={(e) => setDraft({ ...draft, missionNote: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--glass-input-bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold bg-[var(--accent-primary)] text-[var(--accent-contrast)]"
              >
                <Check className="w-4 h-4" />
                Save Creator Profile
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3">
                  <p className="text-[var(--text-muted)]">Organization</p>
                  <p className="font-medium mt-0.5">{creatorProfile.organization || 'Not specified'}</p>
                </div>
                <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3">
                  <p className="text-[var(--text-muted)]">Location</p>
                  <p className="font-medium mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    {creatorProfile.location || 'Not specified'}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3">
                  <p className="text-[var(--text-muted)]">Public Website</p>
                  <p className="font-medium mt-0.5">
                    {creatorProfile.publicWebsite || 'Not configured yet'}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3">
                  <p className="text-[var(--text-muted)]">Public Contact</p>
                  <p className="font-medium mt-0.5">
                    {creatorProfile.publicContact || 'Not configured yet'}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
                <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">Mission</p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {creatorProfile.missionNote}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
