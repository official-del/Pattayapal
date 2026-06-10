# Mock Data Spec

Use consistent mock data across all demo variants so stakeholders compare design direction, not content differences.

## Creators

Fields:

```js
{
  id: "creator-01",
  name: "Nora Lens",
  username: "noralens",
  profession: "Photographer",
  location: "Pattaya, Thailand",
  rank: "Gold",
  rating: 4.9,
  reviews: 128,
  coinBalance: 12840,
  gas: 86,
  skills: ["Portrait", "Events", "Retouching"],
  bio: "Creator focused on vibrant lifestyle and brand campaigns.",
  avatarColor: "#ff6b1a",
  coverColor: "#101014"
}
```

Recommended creator roles:

- Photographer
- Videographer
- Graphic Designer
- Web Developer
- Editor
- Motion Designer
- Marketing Creator
- Production Designer

## Works

Fields:

```js
{
  id: "work-01",
  creatorId: "creator-01",
  title: "Neon Beach Campaign",
  category: "Photography",
  type: "image",
  views: 18420,
  likes: 862,
  status: "published",
  description: "A vibrant campaign shoot for a nightlife brand.",
  accentColor: "#fbca1f"
}
```

Categories:

- Photography
- Video
- Branding
- Web
- Product
- Motion
- Content
- Campaign

## Feed Posts

Fields:

```js
{
  id: "post-01",
  authorId: "creator-01",
  type: "showcase",
  text: "New campaign frame just dropped.",
  workId: "work-01",
  likes: 120,
  comments: 18,
  shares: 7,
  createdAt: "2h ago"
}
```

Post types:

- showcase
- hiring
- looking-for-work
- milestone
- quest

## Jobs

Fields:

```js
{
  id: "job-01",
  title: "Shoot product photos for cafe launch",
  client: "Harbor Cafe",
  creatorId: "creator-01",
  budget: 4500,
  status: "active",
  dueDate: "2026-06-18",
  category: "Photography"
}
```

Statuses:

- pending
- active
- completed
- rejected

## Quests

Fields:

```js
{
  id: "quest-01",
  title: "Upload 3 portfolio works",
  reward: 250,
  progress: 2,
  target: 3,
  status: "active"
}
```

Quest examples:

- Upload 3 portfolio works
- Comment on 5 creator posts
- Complete one job
- Invite a client
- Update profile skills

## Wallet Transactions

Fields:

```js
{
  id: "txn-01",
  type: "reward",
  label: "Quest reward",
  amount: 250,
  createdAt: "Today",
  status: "completed"
}
```

Types:

- reward
- payment
- withdrawal
- bonus
- refund

## Messages

Fields:

```js
{
  id: "msg-01",
  conversationId: "conv-01",
  senderId: "creator-01",
  text: "I can send the first draft tomorrow.",
  createdAt: "10:24",
  mine: true
}
```

## Notifications

Fields:

```js
{
  id: "note-01",
  type: "coin",
  title: "Coin reward received",
  body: "You earned 250 coins from a daily quest.",
  createdAt: "5m ago",
  read: false
}
```

Types:

- job
- message
- coin
- rank
- quest
- system

