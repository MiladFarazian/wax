/**
 * MockProvider — an in-memory SocialProvider for development.
 *
 * Lets the entire Wax UI run end-to-end with zero backend and zero account
 * risk. It returns realistic, deterministic sample data so we can build and
 * tune the feed/profile/DM screens and measure performance before wiring up
 * the real IGPrivateProvider.
 *
 * Swap this for IGPrivateProvider in src/providers/index.ts when ready.
 */

import type { SocialProvider } from "./SocialProvider";
import type {
  AuthSession,
  Comment,
  Conversation,
  Credentials,
  DirectMessage,
  ID,
  Page,
  Post,
  StoryTray,
  User,
  UserProfile,
} from "@/types/social";

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

function post(n: number): Post {
  const author = user(n);
  return {
    id: `p_${n}`,
    author,
    kind: "image",
    media: [
      {
        url: `https://picsum.photos/seed/wax${n}/800/800`,
        kind: "image",
        width: 800,
        height: 800,
      },
    ],
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
    return paginate(post, cursor);
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
      bio: "Silence the noise. Keep the connection.",
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
