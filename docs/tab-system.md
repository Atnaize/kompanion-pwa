# Tab system unification

## Problem

We currently have **three** visual languages for switching between views, and
they're applied to the same *kind* of job inconsistently.

| Style | Where | Looks like |
|---|---|---|
| **Underline tabs** (`Tabs` / `TabList` / `Tab`) | Stats, Challenges, Friends, Activity detail, Admin | Row of labels with an orange underline under the active one |
| **Segmented control** (hand-rolled, now `SegmentedControl`) | Clubs list, Club detail | Pill track with one raised white segment |
| **Pill toggle** | Notifications (All / Unread) | Two small rounded pills, active one tinted orange |

The underline tabs and the segmented control do the *identical* job —
page-level switching between 2–4 mutually exclusive views — but look different
depending on which screen you're on. That's the inconsistency worth fixing.

## Proposal

Adopt **one rule**, keyed to *purpose* not screen:

1. **Page-level view switching (2–4 views) → `SegmentedControl`.**
   Stats (Overview/Calendar/Charts/Comparison), Challenges (Active/Completed/
   Invites), Friends (Friends/Incoming/Outgoing), Activity detail
   (Overview/Map/Charts/…), Clubs.
   The segmented control reads more clearly as "switch between these N views"
   and already shipped on the club pages.

2. **Binary filters → keep the pill toggle.**
   Notifications All/Unread is a *filter on one list*, not a view switch.
   Leaving it as a lightweight pill is correct and keeps it visually distinct
   from view-switching, which is a feature, not a bug.

3. **Many tabs / scrollable tab rows → underline tabs.**
   Activity detail has up to 6 tabs (Overview, Map, Charts, Laps, Segments,
   Photos). A segmented control can't hold 6 segments on a 320px phone, so
   keep underline tabs (with the existing `fade` horizontal scroll) when there
   are 5+ tabs.

So: **2–4 views → segmented; 5+ → underline; binary filter → pill.** Today the
split is arbitrary; this makes it predictable.

## The component

`SegmentedControl` (in `components/ui`) is now the shared primitive, extracted
from the duplicate copies that were inline in `ClubsPage` and `ClubDetailPage`:

```tsx
<SegmentedControl
  value={tab}
  onChange={setTab}
  options={[
    { value: 'overview', label: t('clubs.tabs.overview') },
    { value: 'feed', label: t('clubs.tabs.feed') },
    { value: 'chat', label: t('clubs.tabs.chat') },
    { value: 'board', label: t('clubs.tabs.board') },
  ]}
/>
```

- `variant="mono"` (default): uppercase + letterspaced, for page view switching.
- `variant="plain"`: sentence case, for lighter contexts.
- `options[].count`: optional trailing badge (used by the clubs list tabs).

## Visual change involved, screen by screen

What actually changes on screen if we adopt the rule:

- **Stats** — the underline row (Overview · Calendar · Charts · Comparison)
  becomes a pill track with the active view raised. The sticky-on-scroll
  behaviour stays; only the control's skin changes.
- **Challenges** — Active/Completed/Invites underline → segmented. Counts
  (e.g. "Invites 3") move into the segment as a trailing badge.
- **Friends** — Friends/Incoming/Outgoing underline → segmented, with the
  incoming/outgoing counts as badges.
- **Activity detail** — **no change**: 6 tabs, stays underline (rule #3).
- **Notifications** — **no change**: stays a binary pill (rule #2).
- **Clubs** — **no change**: already segmented (the reference implementation).

Net effect: the three biggest tabbed pages (Stats, Challenges, Friends) move
from underline to the same segmented pill the clubs use, so the core tabbed
surfaces finally match. Activity detail and Notifications intentionally stay as
they are because their purpose differs.

## Risk / cost

- Low logic risk — `Tabs`/`TabPanel` state handling is unchanged; we only swap
  the control that renders the tab row. Panels can stay as plain conditional
  renders (as the club pages already do) or keep using `TabPanel`.
- The sticky-tabs-on-scroll wrapper (Stats, Activity detail) is independent of
  the control skin, so it keeps working.
- One thing to verify: 4 segments + long localized labels (French) at 320px.
  `Challenges` FR labels (Actifs / Terminés / Invitations) are the tightest —
  worth a quick check; if they overflow we drop those to `variant="plain"` or
  abbreviate.

## Recommendation

Do it as its own focused pass after the current consistency batch, migrating
Stats → Challenges → Friends one at a time so each can be eyeballed. Keep
Activity detail (underline) and Notifications (pill) as the documented
exceptions.
