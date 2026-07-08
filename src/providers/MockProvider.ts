/**
 * MockProvider — an in-memory SocialProvider for development.
 *
 * Lets the entire Wax UI run end-to-end with zero backend and zero account
 * risk. It returns realistic, deterministic sample data so we can build and
 * tune the feed/profile/DM screens and measure performance before wiring up
 * the real IGPrivateProvider.
 *
 * Swap this for IGPrivateProvider in src/providers/index.ts when ready.
 *
 * Fault injection (the Phase 4 resilience drill, docs/SPRINT.md §6): set
 * EXPO_PUBLIC_WAX_SIMULATE to exercise the feed's degraded states without real
 * Instagram — "network" | "rate_limited" | "account_flagged" | "auth_failed" |
 * "upstream_changed" make getFeed throw that SocialProviderError; "empty" shows
 * the empty state; "slow" delays so you can see the loading state.
 */

import type { SocialProvider } from "./SocialProvider";
import { SocialProviderError } from "./SocialProvider";
import type {
  AuthSession,
  Comment,
  Conversation,
  CreatePostInput,
  Credentials,
  DirectMessage,
  ID,
  Notification,
  NotificationKind,
  Page,
  Post,
  StoryTray,
  User,
  UserProfile,
} from "@/types/social";

type SimMode =
  | "off"
  | "network"
  | "rate_limited"
  | "account_flagged"
  | "auth_failed"
  | "upstream_changed"
  | "empty"
  | "slow";

const SIMULATE: SimMode = (process.env.EXPO_PUBLIC_WAX_SIMULATE as SimMode) ?? "off";

const SIM_ERROR_CODES: SocialProviderError["code"][] = [
  "network",
  "rate_limited",
  "account_flagged",
  "auth_failed",
  "upstream_changed",
];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Applies EXPO_PUBLIC_WAX_SIMULATE to a feed read: delays or throws. */
async function simulateFeed(): Promise<void> {
  if (SIMULATE === "slow") {
    await delay(2500);
    return;
  }
  if ((SIM_ERROR_CODES as string[]).includes(SIMULATE)) {
    throw new SocialProviderError(`Simulated ${SIMULATE}`, SIMULATE as SocialProviderError["code"]);
  }
}

const ME: User = {
  id: "u_me",
  username: "you",
  fullName: "You",
  avatarUrl: "https://i.pravatar.cc/150?img=12",
};

function user(n: number): User {
  return {
    id: `u_${n}`,
    username: `friend_${n}`,
    fullName: `Friend ${n}`,
    avatarUrl: `https://i.pravatar.cc/150?img=${(n % 70) + 1}`,
    isVerified: n % 5 === 0,
  };
}

const SAMPLE_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

function post(n: number): Post {
  const author = user(n);
  // Deterministically sprinkle in carousels and (non-Reel) videos so the feed
  // exercises PostCard's carousel/video affordances, not just single photos.
  const isCarousel = n % 5 === 2;
  const isVideo = !isCarousel && n % 7 === 3;

  const media = isCarousel
    ? [0, 1, 2].map((i) => ({
        url: `https://picsum.photos/seed/wax${n}_${i}/800/800`,
        kind: "image" as const,
        width: 800,
        height: 800,
      }))
    : [
        {
          url: `https://picsum.photos/seed/wax${n}/800/800`,
          kind: isVideo ? ("video" as const) : ("image" as const),
          ...(isVideo ? { videoUrl: SAMPLE_VIDEO } : {}),
          width: 800,
          height: 800,
        },
      ];

  return {
    id: `p_${n}`,
    author,
    kind: isCarousel ? "carousel" : isVideo ? "video" : "image",
    media,
    caption: `A calm moment, no noise. #${n}`,
    likeCount: 50 + ((n * 37) % 900),
    commentCount: (n * 7) % 60,
    likedByMe: n % 4 === 0,
    savedByMe: n % 6 === 0,
    createdAt: new Date(1_700_000_000_000 + n * 3_600_000).toISOString(),
  };
}

const PAGE_SIZE = 12;

function paginate<T>(make: (n: number) => T, cursor?: string): Page<T> {
  const start = cursor ? parseInt(cursor, 10) : 0;
  const items = Array.from({ length: PAGE_SIZE }, (_, i) => make(start + i));
  return { items, nextCursor: String(start + PAGE_SIZE) };
}

export class MockProvider implements SocialProvider {
  readonly name = "mock";
  private currentUserId: ID | null = null;
  private newPostSeq = 0;

  async login(_credentials: Credentials): Promise<AuthSession> {
    this.currentUserId = ME.id;
    return { userId: ME.id, token: "mock-token", createdAt: new Date(1_700_000_000_000).toISOString() };
  }

  async logout(): Promise<void> {
    this.currentUserId = null;
  }

  async restoreSession(token: string): Promise<AuthSession | null> {
    if (token !== "mock-token") return null;
    this.currentUserId = ME.id;
    return { userId: ME.id, token, createdAt: new Date(1_700_000_000_000).toISOString() };
  }

  getCurrentUserId(): ID | null {
    return this.currentUserId;
  }

  async getFeed(cursor?: string): Promise<Page<Post>> {
    await simulateFeed();
    if (SIMULATE === "empty") return { items: [], nextCursor: undefined };
    return paginate(post, cursor);
  }

  async createPost({ imageUri, caption }: CreatePostInput): Promise<Post> {
    return {
      id: `p_new_${++this.newPostSeq}`,
      author: ME,
      kind: "image",
      media: [{ url: imageUri, kind: "image", width: 1080, height: 1080 }],
      caption,
      likeCount: 0,
      commentCount: 0,
      likedByMe: false,
      savedByMe: false,
      createdAt: new Date().toISOString(),
    };
  }

  async getStoryTrays(): Promise<StoryTray[]> {
    return Array.from({ length: 8 }, (_, i) => ({
      user: user(i + 1),
      items: [
        {
          id: `s_${i}`,
          media: { url: `https://picsum.photos/seed/story${i}/600/1000`, kind: "image" },
          createdAt: new Date(1_700_000_000_000).toISOString(),
          expiresAt: new Date(1_700_086_400_000).toISOString(),
        },
      ],
      seen: i % 3 === 0,
    }));
  }

  async getProfile(userId: ID): Promise<UserProfile> {
    const base = userId === ME.id ? ME : user(parseInt(userId.replace("u_", ""), 10) || 1);
    return {
      ...base,
      bio: "📷 photos & everyday moments\n🌤️ chasing good light",
      postCount: 42,
      followerCount: 1280,
      followingCount: 310,
      isFollowedByMe: false,
    };
  }

  async getUserPosts(_userId: ID, cursor?: string): Promise<Page<Post>> {
    return paginate(post, cursor);
  }

  async setFollow(_userId: ID, _follow: boolean): Promise<void> {}
  async setLike(_postId: ID, _like: boolean): Promise<void> {}
  async setSave(_postId: ID, _save: boolean): Promise<void> {}

  async getComments(_postId: ID, cursor?: string): Promise<Page<Comment>> {
    return paginate(
      (n) => ({
        id: `c_${n}`,
        author: user(n),
        text: "Love this 🐝",
        likeCount: n % 10,
        likedByMe: false,
        createdAt: new Date(1_700_000_000_000).toISOString(),
      }),
      cursor,
    );
  }

  async addComment(postId: ID, text: string): Promise<Comment> {
    return {
      id: `c_new`,
      author: ME,
      text,
      likeCount: 0,
      likedByMe: false,
      createdAt: new Date(1_700_000_000_000).toISOString(),
    };
  }

  async getActivity(cursor?: string): Promise<Page<Notification>> {
    const kinds: NotificationKind[] = ["like", "follow", "comment", "mention"];
    return paginate((n) => {
      const kind = kinds[n % kinds.length];
      const texts: Record<NotificationKind, string> = {
        like: "liked your photo.",
        follow: "started following you.",
        comment: 'commented: "So good 🐝"',
        mention: "mentioned you in a comment.",
      };
      return {
        id: `n_${n}`,
        kind,
        actor: user(n + 1),
        text: texts[kind],
        postThumbUrl: kind === "follow" ? undefined : `https://picsum.photos/seed/wax${n}/200/200`,
        createdAt: new Date(1_700_000_000_000 - n * 3_600_000).toISOString(),
        isFollowingActor: n % 3 === 0,
      };
    }, cursor);
  }

  async getConversations(cursor?: string): Promise<Page<Conversation>> {
    return paginate(
      (n) => ({
        id: `conv_${n}`,
        participants: [ME, user(n)],
        lastMessagePreview: "See you soon!",
        unread: n % 3 === 0,
        updatedAt: new Date(1_700_000_000_000).toISOString(),
      }),
      cursor,
    );
  }

  async getMessages(conversationId: ID, cursor?: string): Promise<Page<DirectMessage>> {
    return paginate(
      (n) => ({
        id: `m_${n}`,
        conversationId,
        sender: n % 2 === 0 ? ME : user(n),
        text: "Hey there 👋",
        createdAt: new Date(1_700_000_000_000).toISOString(),
      }),
      cursor,
    );
  }

  async sendMessage(conversationId: ID, text: string): Promise<DirectMessage> {
    return {
      id: `m_new`,
      conversationId,
      sender: ME,
      text,
      createdAt: new Date(1_700_000_000_000).toISOString(),
    };
  }
}
