# TradeKav Community — Product & Implementation Specification

## 1. Vision

TradeKav Community is a hybrid of:

- **Threads / X** — short-form posts and discovery
- **Old-school forums / Reddit** — persistent, topic-oriented discussions
- **TradeKav Trade Journal** — real trading data, trade reviews, charts, and lessons

The goal is **not** to build another generic social network.

The core principle is:

> **Evidence + reasoning + discussion over hype and signals.**

The Community should help traders share what they actually saw, why they acted, what happened afterward, and what they learned.

---

# 2. Core Content Model

There are two different content primitives.

## Community Posts

Shorter, social/discovery-oriented content.

Examples:

- Market analysis
- Questions
- Trade reviews
- Educational posts
- General discussions
- "What would you do here?"
- Short market observations

Posts appear in feeds and can be associated with:

- Users
- Symbols
- Community categories
- TradeKav trades
- Forum discussions

## Forum Threads

Longer-lived, structured discussions.

Examples:

- "How do you identify a valid liquidity sweep?"
- "Best way to backtest a price-action strategy?"
- "How should XAUUSD be traded during London?"

Threads belong to a forum category and contain replies.

### Why keep both?

They solve different discovery problems.

A Community Post is:

> "Something worth showing people now."

A Forum Thread is:

> "A discussion worth keeping and finding later."

---

# 3. Distribution Model

TradeKav does not initially have the social graph of X/Threads.

Therefore, a simple global feed is not sufficient.

A user's Community feed can initially be generated from:

1. Posts from followed users
2. Posts involving followed symbols
3. Posts in followed categories
4. Recent/popular posts
5. Relevant posts based on engagement

Later, this can evolve into a recommendation system.

### Important

Do **not** create a persistent `CommunityFeed` or `PostRecommendation` table for the MVP.

The feed should initially be derived from existing data.

---

# 4. Social Graph

Users can follow:

### Users

Example:

> Follow @Trader123

This contributes that user's posts to the feed.

### Symbols

Example:

> Follow XAUUSD

The user receives relevant:

- XAUUSD analysis
- XAUUSD trade reviews
- XAUUSD discussions

### Categories

Example:

> Follow Price Action

The user receives posts related to Price Action.

This gives TradeKav a useful discovery mechanism even before it has a large social graph.

---

# 5. Community Post Types

```text
GENERAL
QUESTION
MARKET_ANALYSIS
TRADE_REVIEW
EDUCATION
DISCUSSION
```

### GENERAL

Normal community posts.

### QUESTION

Questions intended to generate discussion.

Example:

> How do you determine whether a liquidity sweep is valid?

### MARKET_ANALYSIS

Market observations or analysis.

Example:

> XAUUSD swept the Asian high and rejected before NY.

### TRADE_REVIEW

A post connected to an actual TradeKav journal entry.

### EDUCATION

Educational explanations, concepts, techniques, etc.

### DISCUSSION

Open-ended discussions.

---

# 6. TradeKav Trade Integration

This is one of the most important differentiators of the Community.

A user should be able to:

```text
Trade Journal
      ↓
Select Trade
      ↓
Share to Community
      ↓
CommunityPost
```

The CommunityPost stores an optional reference to the original TradeKav trade.

```text
CommunityPost
      │
      └── tradeId
             │
             ▼
           Trade
```

## Public trade information

The existence of a `tradeId` must NOT mean that the entire journal entry becomes public.

The user explicitly chooses what information is exposed.

Possible public fields:

- Symbol
- Direction
- Entry
- Exit
- Setup
- Entry timeframe
- Analysis timeframe
- Risk/reward
- Result in R
- Chart
- Screenshots
- Trade thesis
- Review
- Lessons

Possible private fields:

- Account balance
- Account ID
- Broker
- Position size
- Dollar P&L
- Private notes

The Community layer should only expose fields explicitly marked as shareable.

---

# 7. Trade → Community Workflow

Example:

```text
User closes XAUUSD trade
        ↓
Trade Journal review
        ↓
"Share to Community"
        ↓
Choose public information
        ↓
Add commentary
        ↓
Publish CommunityPost
```

The resulting post could look like:

> **XAUUSD — Liquidity Sweep**
>
> I entered after the London high was swept and M1 MSS confirmed the reversal.
>
> Result: +2.1R
>
> [Chart]
>
> [View Trade]

---

# 8. Community → Trade Workflow

A community post containing a public trade can expose:

> **View Trade**

The user sees the public version of the journal entry.

Later, TradeKav can allow:

> **Use this setup in my journal**

This could pre-fill:

- Symbol
- Setup
- Analysis timeframe
- Entry timeframe
- Relevant tags

The user still creates their own trade.

The original trade is never copied as actual trading/account data.

---

# 9. Trade Review Ideas

Trade Review posts should be a first-class use case.

Examples:

### Failed trade

> I thought this was a valid liquidity sweep, but I entered before confirmation.

### Successful trade

> The setup worked exactly as planned. The key confirmation was M1 MSS after the sweep.

### Lesson

> My biggest mistake was moving the stop loss after entry.

This turns the Community into a learning system rather than a signal feed.

---

# 10. "What Would You Do?" Posts

A user can publish a chart before entering a trade.

Example:

> **What would you do here?**
>
> XAUUSD — London session

Possible future interaction:

```text
LONG
SHORT
WAIT
```

Then the author can later reveal:

> What I actually did: LONG

and optionally connect the result to the resulting TradeKav trade.

This creates a:

```text
Prediction
     ↓
Execution
     ↓
Outcome
     ↓
Review
```

loop.

This feature can be implemented later without changing the fundamental CommunityPost model.

---

# 11. Accountability / Pre-Outcome Publishing

One particularly valuable future feature is publishing the thesis **before** the trade outcome is known.

Example:

```text
Market Thesis
      ↓
Trade opened
      ↓
Trade closed
      ↓
CommunityPost updated with outcome
```

This reduces hindsight bias.

It also encourages accountability instead of users only publishing winning trades.

---

# 12. Anonymous Trade Sharing

Users should optionally be able to publish anonymously.

Example:

```text
XAUUSD
Long
Liquidity Sweep
M1 Entry / H1 Analysis
+2R
```

without exposing their identity or account information.

The post still belongs internally to the author for moderation, ownership, editing, etc.

---

# 13. Symbols

Symbols should be normalized entities rather than a raw `String[]`.

Example:

```text
CommunitySymbol
    XAUUSD
    EURUSD
    BTCUSD
    XAGUSD
```

Posts can reference multiple symbols.

Example:

```text
XAUUSD
DXY
EURUSD
```

This enables future symbol pages:

```text
/community/symbols/XAUUSD
```

with:

- Latest posts
- Trending posts
- Market analysis
- Trade reviews
- Discussions

---

# 14. Community Categories

Categories provide intentional organization.

Examples:

- Price Action
- Trading Psychology
- Risk Management
- Strategies
- Technical Analysis
- Fundamental Analysis
- Trading Tools
- Beginner Trading
- Trading Journal

Categories are useful both for:

- discovery
- following
- filtering
- feed generation

---

# 15. Forum Categories

Forum categories are intentionally separate from Community categories.

A forum category represents a persistent discussion area.

Example:

```text
Trading Concepts
├── Price Action
├── Market Structure
├── Liquidity
└── Indicators
```

This should not be forced into the same model as the social-feed categories.

---

# 16. Community Comments

Community posts support comments.

Comments should support nesting:

```text
Post
 ├── Comment
 │    ├── Reply
 │    └── Reply
 └── Comment
```

This allows actual discussions rather than only flat comments.

---

# 17. Forum Replies

Forum threads have dedicated replies.

Example:

```text
ForumThread
 ├── ForumReply
 ├── ForumReply
 └── ForumReply
```

One reply can optionally be marked as the solution:

```text
isSolution = true
```

This is especially useful for questions.

---

# 18. Likes

Users can like Community Posts.

The relation table is the source of truth:

```text
CommunityLike
```

while:

```text
CommunityPost.likes
```

is a denormalized counter for fast reads.

The same principle applies to:

- comments
- views
- reply counts

if those counters are introduced later.

---

# 19. Bookmarks

Users should be able to save useful posts.

Example:

> "I want to come back to this setup later."

Use:

```text
CommunityBookmark
```

This should be part of the initial schema because trading content is highly reference-oriented.

---

# 20. Media

Community posts need to support:

- Chart screenshots
- Trade screenshots
- Annotated charts
- Multiple images

Do not put multiple image URLs directly into `CommunityPost`.

Use a dedicated media/attachment model.

If TradeKav already has a generic media/file system, reuse it rather than creating a second storage abstraction.

---

# 21. Moderation

Moderation is important from the beginning.

Users should be able to report:

- Posts
- Comments
- Forum threads
- Forum replies

Possible report reasons:

```text
SPAM
HARASSMENT
MISINFORMATION
SCAM
INAPPROPRIATE
OTHER
```

Possible statuses:

```text
PENDING
REVIEWED
DISMISSED
ACTION_TAKEN
```

Content itself should have:

```text
ACTIVE
HIDDEN
DELETED
```

---

# 22. Content Privacy

Community content and journal data have different privacy requirements.

A TradeKav trade remains private unless the user explicitly shares it.

Community visibility can support:

```text
PUBLIC
FOLLOWERS_ONLY
```

Future visibility levels can be added if necessary.

---

# 23. Reputation

Do NOT implement a full reputation system in the initial schema.

It can be added later based on:

- useful replies
- accepted solutions
- community engagement
- report history
- account age
- contribution quality

The initial schema does not need to know how reputation will be calculated.

---

# 24. Notifications

Notifications should be implemented as a separate system.

Potential future events:

- Someone liked your post
- Someone commented
- Someone replied to your comment
- Someone followed you
- Someone answered your forum question
- Someone marked your answer as the solution
- Someone mentioned you
- A followed symbol has significant activity

Do not couple notification storage directly to the Community schema.

---

# 25. Future Feed / Recommendation System

Do not implement this as part of the initial database schema.

Eventually the feed can use:

```text
Author relationship
+
Symbol interest
+
Category interest
+
Recency
+
Engagement
+
Author quality
+
Content type
```

Later, TradeKav can introduce a proper recommendation system without changing the core content model.

---

# 26. Final Prisma Schema

> The exact `User` and `Trade` relation names must be reconciled with the existing TradeKav schema before migration.

```prisma
// ============================================================
// COMMUNITY
// ============================================================

enum CommunityPostType {
  GENERAL
  QUESTION
  MARKET_ANALYSIS
  TRADE_REVIEW
  EDUCATION
  DISCUSSION
}

enum CommunityContentStatus {
  ACTIVE
  HIDDEN
  DELETED
}

enum CommunityVisibility {
  PUBLIC
  FOLLOWERS_ONLY
}

model CommunityPost {
  id        String @id @default(cuid())
  content   String

  type       CommunityPostType      @default(GENERAL)
  status     CommunityContentStatus @default(ACTIVE)
  visibility CommunityVisibility     @default(PUBLIC)

  authorId String
  author   User @relation(fields: [authorId], references: [id])

  isAnonymous Boolean @default(false)

  categoryId String?
  category   CommunityCategory? @relation(fields: [categoryId], references: [id])

  threadId String?
  thread   ForumThread? @relation(fields: [threadId], references: [id])

  tradeId String?
  trade   Trade? @relation(
    fields: [tradeId],
    references: [id],
    onDelete: SetNull
  )

  likes    Int @default(0)
  comments Int @default(0)
  views    Int @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  symbols      CommunityPostSymbol[]
  likesRel     CommunityLike[]
  commentsRel  CommunityComment[]
  bookmarks    CommunityBookmark[]
  media        CommunityPostMedia[]
  
  @@index([authorId, createdAt])
  @@index([categoryId, createdAt])
  @@index([threadId])
  @@index([tradeId])
  @@index([status, createdAt])
  @@index([createdAt])
}


// ============================================================
// COMMENTS
// ============================================================

model CommunityComment {
  id      String @id @default(cuid())
  content String

  status CommunityContentStatus @default(ACTIVE)

  postId String
  post   CommunityPost @relation(
    fields: [postId],
    references: [id],
    onDelete: Cascade
  )

  authorId String
  author   User @relation(fields: [authorId], references: [id])

  parentId String?
  parent   CommunityComment? @relation(
    "CommentReplies",
    fields: [parentId],
    references: [id],
    onDelete: Cascade
  )

  replies CommunityComment[] @relation("CommentReplies")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([postId, createdAt])
  @@index([authorId])
  @@index([parentId])
}


// ============================================================
// LIKES
// ============================================================

model CommunityLike {
  id String @id @default(cuid())

  postId String
  post   CommunityPost @relation(
    fields: [postId],
    references: [id],
    onDelete: Cascade
  )

  userId String
  user   User @relation(fields: [userId], references: [id])

  createdAt DateTime @default(now())

  @@unique([postId, userId])
  @@index([userId])
}


// ============================================================
// BOOKMARKS
// ============================================================

model CommunityBookmark {
  userId String
  postId String

  user User @relation(
    fields: [userId],
    references: [id],
    onDelete: Cascade
  )

  post CommunityPost @relation(
    fields: [postId],
    references: [id],
    onDelete: Cascade
  )

  createdAt DateTime @default(now())

  @@id([userId, postId])
  @@index([postId])
}


// ============================================================
// MEDIA
// ============================================================

model CommunityPostMedia {
  id String @id @default(cuid())

  postId String
  post   CommunityPost @relation(
    fields: [postId],
    references: [id],
    onDelete: Cascade
  )

  url       String
  type      String
  sortOrder Int @default(0)

  createdAt DateTime @default(now())

  @@index([postId, sortOrder])
}


// ============================================================
// SYMBOLS
// ============================================================

model CommunitySymbol {
  id     String @id @default(cuid())
  symbol String @unique
  name   String?

  posts     CommunityPostSymbol[]
  followers CommunitySymbolFollow[]
}

model CommunityPostSymbol {
  postId   String
  symbolId String

  post   CommunityPost  @relation(
    fields: [postId],
    references: [id],
    onDelete: Cascade
  )

  symbol CommunitySymbol @relation(
    fields: [symbolId],
    references: [id],
    onDelete: Cascade
  )

  @@id([postId, symbolId])
  @@index([symbolId, postId])
}


// ============================================================
// COMMUNITY CATEGORIES
// ============================================================

model CommunityCategory {
  id          String @id @default(cuid())
  nameEn      String
  nameFa      String
  description String?
  icon        String?
  order       Int @default(0)

  posts     CommunityPost[]
  followers CommunityCategoryFollow[]

  @@index([order])
}


// ============================================================
// FORUM
// ============================================================

model ForumCategory {
  id          String @id @default(cuid())
  nameEn      String
  nameFa      String
  description String?
  icon        String?
  order       Int @default(0)

  threads ForumThread[]

  @@index([order])
}

model ForumThread {
  id      String @id @default(cuid())
  title   String
  content String

  status CommunityContentStatus @default(ACTIVE)

  categoryId String
  category   ForumCategory @relation(
    fields: [categoryId],
    references: [id]
  )

  authorId String
  author   User @relation(fields: [authorId], references: [id])

  isSolved Boolean @default(false)
  views    Int @default(0)
  replies  Int @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  repliesRel ForumReply[]
  posts      CommunityPost[]

  @@index([categoryId, createdAt])
  @@index([authorId])
  @@index([status, createdAt])
}

model ForumReply {
  id      String @id @default(cuid())
  content String

  status CommunityContentStatus @default(ACTIVE)

  threadId String
  thread   ForumThread @relation(
    fields: [threadId],
    references: [id],
    onDelete: Cascade
  )

  authorId String
  author   User @relation(fields: [authorId], references: [id])

  isSolution Boolean @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([threadId, createdAt])
  @@index([authorId])
}


// ============================================================
// USER FOLLOWS
// ============================================================

model CommunityFollow {
  followerId  String
  followingId String

  follower User @relation(
    "CommunityFollowing",
    fields: [followerId],
    references: [id]
  )

  following User @relation(
    "CommunityFollowers",
    fields: [followingId],
    references: [id]
  )

  createdAt DateTime @default(now())

  @@id([followerId, followingId])
  @@index([followingId])
}


// ============================================================
// CATEGORY FOLLOWS
// ============================================================

model CommunityCategoryFollow {
  userId     String
  categoryId String

  user User @relation(
    fields: [userId],
    references: [id],
    onDelete: Cascade
  )

  category CommunityCategory @relation(
    fields: [categoryId],
    references: [id],
    onDelete: Cascade
  )

  createdAt DateTime @default(now())

  @@id([userId, categoryId])
  @@index([categoryId])
}


// ============================================================
// SYMBOL FOLLOWS
// ============================================================

model CommunitySymbolFollow {
  userId   String
  symbolId String

  user User @relation(
    fields: [userId],
    references: [id],
    onDelete: Cascade
  )

  symbol CommunitySymbol @relation(
    fields: [symbolId],
    references: [id],
    onDelete: Cascade
  )

  createdAt DateTime @default(now())

  @@id([userId, symbolId])
  @@index([symbolId])
}


// ============================================================
// MODERATION
// ============================================================

enum CommunityReportTargetType {
  POST
  COMMENT
  THREAD
  REPLY
}

enum CommunityReportReason {
  SPAM
  HARASSMENT
  MISINFORMATION
  SCAM
  INAPPROPRIATE
  OTHER
}

enum CommunityReportStatus {
  PENDING
  REVIEWED
  DISMISSED
  ACTION_TAKEN
}

model CommunityReport {
  id String @id @default(cuid())

  reason CommunityReportReason
  status CommunityReportStatus @default(PENDING)
  note String?

  reporterId String
  reporter   User @relation(fields: [reporterId], references: [id])

  targetType CommunityReportTargetType
  targetId   String

  createdAt  DateTime @default(now())
  reviewedAt DateTime?

  @@index([targetType, targetId])
  @@index([status, createdAt])
  @@index([reporterId])
}
```

---

# 27. Important Implementation Notes

## Denormalized counters

These fields:

```text
CommunityPost.likes
CommunityPost.comments
CommunityPost.views
ForumThread.replies
ForumThread.views
```

are cached counters.

The underlying relations remain the source of truth.

For example:

```text
CommunityLike records
        ↓
     count()
        ↓
CommunityPost.likes
```

Counter updates should happen transactionally where possible.

---

## Trade deletion

Use:

```text
Trade → CommunityPost
```

with:

```text
onDelete: SetNull
```

A deleted journal trade should not automatically destroy community content.

The post can remain as historical content, with the trade reference removed.

---

## Anonymous posts

`isAnonymous` hides the author from normal users.

It does **not** remove the internal author relationship.

Moderators must still be able to identify the author.

---

## Moderation

`HIDDEN` should mean the content is no longer publicly visible but is retained internally.

`DELETED` should normally mean soft deletion rather than physical deletion.

This preserves moderation history and prevents broken references.

---

# 28. MVP Implementation Order

### Phase 1 — Foundation

Implement:

- CommunityPost
- CommunityComment
- CommunityLike
- CommunityCategory
- CommunitySymbol
- CommunityPostSymbol
- basic feed

### Phase 2 — Trade integration

Implement:

- `tradeId`
- Share Trade to Community
- Public trade representation
- Trade privacy controls
- Trade Review posts
- View public trade

### Phase 3 — Forum

Implement:

- ForumCategory
- ForumThread
- ForumReply
- Solved threads
- Forum discovery

### Phase 4 — Social graph

Implement:

- Follow users
- Follow symbols
- Follow categories
- Following feed

### Phase 5 — Content utilities

Implement:

- Bookmarks
- Media
- Anonymous posts
- Nested comments

### Phase 6 — Moderation

Implement:

- Reports
- Content status
- Moderation dashboard
- Admin actions

### Phase 7 — Advanced Community

Later:

- "What would you do?"
- Polls
- Prediction → outcome
- Community feedback attached to trades
- Reputation
- Mentions
- Notifications
- Trending
- Personalized recommendations
- Setup-specific communities
- Community knowledge pages

---

# 29. Product Principle

The Community should always reinforce this loop:

```text
OBSERVE
   ↓
ANALYZE
   ↓
DECIDE
   ↓
TRADE
   ↓
REVIEW
   ↓
SHARE
   ↓
DISCUSS
   ↓
LEARN
   ↓
IMPROVE
```

The existing Trade Journal owns:

```text
OBSERVE → ANALYZE → DECIDE → TRADE → REVIEW
```

The Community extends it with:

```text
SHARE → DISCUSS → LEARN
```

That integration is the main reason the TradeKav Community can be meaningfully different from a generic trading forum or an X/Threads clone.