import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateUserStats } from "@/lib/stats-service";

/**
 * MCP Server implementation for DevMeter
 * Implements Model Context Protocol (JSON-RPC 2.0)
 * Supports streamable-http transport
 */

interface JSONRPCRequest {
  jsonrpc: "2.0";
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface JSONRPCResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// Tool definitions exposed by MCP
const TOOLS = [
  {
    name: "get_platform_stats",
    description: "Get overall DevMeter platform statistics including user count, total time tracked, and activity metrics",
    inputSchema: {
      type: "object",
      properties: {
        days: {
          type: "number",
          description: "Number of days to look back for stats (default: 7)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_leaderboard",
    description: "Get the DevMeter leaderboard showing top users by total tracked time or XP",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of users to return (default: 10, max: 100)",
        },
        sortBy: {
          type: "string",
          enum: ["time", "xp", "level"],
          description: "Sort leaderboard by: time (hours tracked), xp, or level",
        },
      },
      required: [],
    },
  },
  {
    name: "get_user_profile",
    description: "Get detailed profile information for a specific DevMeter user",
    inputSchema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "The user ID or profile slug to fetch",
        },
        includeStats: {
          type: "boolean",
          description: "Include detailed statistics in the response (default: true)",
        },
      },
      required: ["userId"],
    },
  },
  {
    name: "search_users",
    description: "Search for DevMeter users by name, email, or username",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (name, email, or username)",
        },
        limit: {
          type: "number",
          description: "Maximum results to return (default: 10)",
        },
      },
      required: ["query"],
    },
  },
];

// Tool execution handlers
async function executeGetPlatformStats(params: Record<string, unknown>) {
  const days = (params.days as number) || 7;

  const [userCount, heartbeatCount] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.heartbeat.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  // Estimate total hours: assuming ~5 min per heartbeat on average
  const estimatedHours = (heartbeatCount * 5) / 60;

  // Count active users in last 7 days
  const activeUsersCount = await prisma.user.count({
    where: {
      heartbeats: {
        some: {
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      },
    },
  });

  return {
    platform: {
      totalUsers: userCount,
      activeUsers: activeUsersCount,
      activeUsersLast7Days: activeUsersCount,
      totalHeartbeatCount: heartbeatCount,
      totalHoursTracked: parseFloat(estimatedHours.toFixed(2)),
      timeframeDays: days,
      lastUpdated: new Date().toISOString(),
    },
  };
}

async function executeGetLeaderboard(params: Record<string, unknown>) {
  const limit = Math.min((params.limit as number) || 10, 100);
  const sortBy = (params.sortBy as string) || "time";

  let orderBy: Record<string, "desc"> = { xp: "desc" };
  if (sortBy === "time") {
    orderBy = { createdAt: "desc" };
  } else if (sortBy === "level") {
    orderBy = { level: "desc" };
  }

  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      profileSlug: true,
      image: true,
      xp: true,
      level: true,
      createdAt: true,
    },
    orderBy,
    take: limit,
  });

  // Get total hours for each user
  const leaderboard = await Promise.all(
    users.map(async (user) => {
      const heartbeats = await prisma.heartbeat.findMany({
        where: { userId: user.id },
      });
      // Estimate hours: assuming ~5 min per heartbeat
      const totalHours = (heartbeats.length * 5) / 60;

      return {
        id: user.id,
        name: user.name,
        profileSlug: user.profileSlug,
        avatar: user.image,
        xp: user.xp,
        level: user.level,
        totalHours: parseFloat(totalHours.toFixed(2)),
        joinedAt: user.createdAt.toISOString(),
      };
    })
  );

  return { leaderboard, sortedBy: sortBy, limit };
}

async function executeGetUserProfile(params: Record<string, unknown>) {
  const userId = params.userId as string;
  const includeStats = params.includeStats !== false;

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: userId },
        { profileSlug: userId },
      ],
      deletedAt: null,
    },
    include: {
      achievements: {
        include: { achievement: true },
      },
    },
  });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const heartbeats = await prisma.heartbeat.findMany({
    where: { userId: user.id },
    select: { timestamp: true },
  });

  // Estimate hours: assuming ~5 min per heartbeat
  const estimatedHours = (heartbeats.length * 5) / 60;
  const lastHeartbeat = heartbeats.length > 0 
    ? new Date(Math.max(...heartbeats.map(h => h.timestamp.getTime())))
    : null;

  const profile = {
    id: user.id,
    name: user.name,
    email: user.email,
    profileSlug: user.profileSlug,
    avatar: user.image,
    xp: user.xp,
    level: user.level,
    totalHours: parseFloat(estimatedHours.toFixed(2)),
    joinedAt: user.createdAt.toISOString(),
    lastActive: lastHeartbeat?.toISOString() || null,
    achievements: user.achievements.map(ua => ({
      id: ua.achievement.id,
      name: ua.achievement.name,
      description: ua.achievement.description,
      icon: ua.achievement.icon,
      unlockedAt: ua.unlockedAt.toISOString(),
    })),
  };

  if (includeStats) {
    try {
      const stats = await calculateUserStats(user.id);
      return { ...profile, stats };
    } catch (error) {
      // Stats might not be available, return profile without stats
      return profile;
    }
  }

  return profile;
}

async function executeSearchUsers(params: Record<string, unknown>) {
  const query = (params.query as string)?.toLowerCase() || "";
  const limit = Math.min((params.limit as number) || 10, 50);

  if (query.length < 2) {
    throw new Error("Search query must be at least 2 characters");
  }

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { deletedAt: null },
        {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { profileSlug: { contains: query, mode: "insensitive" } },
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      profileSlug: true,
      image: true,
      xp: true,
      level: true,
    },
    take: limit,
  });

  return {
    results: users.map(u => ({
      id: u.id,
      name: u.name,
      profileSlug: u.profileSlug,
      avatar: u.image,
      xp: u.xp,
      level: u.level,
    })),
    count: users.length,
    query,
  };
}

// MCP request handler
async function handleMCPRequest(request: JSONRPCRequest): Promise<JSONRPCResponse> {
  try {
    switch (request.method) {
      case "initialize":
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {},
              resources: {},
            },
            serverInfo: {
              name: "devmeter-web",
              version: "1.0.0",
            },
          },
        };

      case "tools/list":
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: { tools: TOOLS },
        };

      case "tools/call": {
        const { name, arguments: args } = request.params as { name: string; arguments: Record<string, unknown> };

        let result;
        switch (name) {
          case "get_platform_stats":
            result = await executeGetPlatformStats(args);
            break;
          case "get_leaderboard":
            result = await executeGetLeaderboard(args);
            break;
          case "get_user_profile":
            result = await executeGetUserProfile(args);
            break;
          case "search_users":
            result = await executeSearchUsers(args);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          jsonrpc: "2.0",
          id: request.id,
          result,
        };
      }

      case "resources/list":
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            resources: [
              {
                uri: "devmeter://leaderboard",
                name: "DevMeter Leaderboard",
                description: "Real-time leaderboard of top DevMeter users",
              },
              {
                uri: "devmeter://api-docs",
                name: "DevMeter API Documentation",
                description: "OpenAPI specification for DevMeter API",
              },
            ],
          },
        };

      case "resources/read": {
        const uri = request.params?.uri as string;

        if (uri === "devmeter://leaderboard") {
          const leaderboard = await executeGetLeaderboard({ limit: 20 });
          return {
            jsonrpc: "2.0",
            id: request.id,
            result: {
              contents: [
                {
                  uri,
                  mimeType: "application/json",
                  text: JSON.stringify(leaderboard, null, 2),
                },
              ],
            },
          };
        }

        if (uri === "devmeter://api-docs") {
          return {
            jsonrpc: "2.0",
            id: request.id,
            result: {
              contents: [
                {
                  uri,
                  mimeType: "text/markdown",
                  text: `# DevMeter API Documentation

## Base URL
https://devmeter-v2.zaidcode.me

## Endpoints

### GET /api/stats/:userId
Get user statistics and activity data.

### GET /api/leaderboard
Get the global leaderboard.

### GET /api/user/:userId
Get user profile information.

### POST /api/heartbeat
Record coding activity (requires authentication).

## Authentication
Use Bearer tokens from OAuth/OIDC endpoints.
Scopes: read:stats, read:user, write:heartbeat
`,
                },
              ],
            },
          };
        }

        throw new Error(`Unknown resource: ${uri}`);
      }

      default:
        return {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32601,
            message: "Method not found",
          },
        };
    }
  } catch (error) {
    return {
      jsonrpc: "2.0",
      id: request.id,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : "Internal server error",
      },
    };
  }
}

// HTTP handler for streamable-http transport
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // Handle application/json
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const jsonrpcRequest = body as JSONRPCRequest;

      const response = await handleMCPRequest(jsonrpcRequest);
      return NextResponse.json(response);
    }

    // Handle streaming protocol (newline-delimited JSON)
    if (contentType.includes("application/x-ndjson")) {
      const text = await request.text();
      const lines = text.trim().split("\n");

      const responses: JSONRPCResponse[] = [];
      for (const line of lines) {
        if (line.trim()) {
          try {
            const jsonrpcRequest = JSON.parse(line) as JSONRPCRequest;
            const response = await handleMCPRequest(jsonrpcRequest);
            responses.push(response);
          } catch (e) {
            responses.push({
              jsonrpc: "2.0",
              id: null,
              error: {
                code: -32700,
                message: "Parse error",
              },
            });
          }
        }
      }

      const responseText = responses.map(r => JSON.stringify(r)).join("\n");
      return new NextResponse(responseText, {
        headers: {
          "Content-Type": "application/x-ndjson",
        },
      });
    }

    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32700,
          message: "Invalid content-type. Use application/json or application/x-ndjson",
        },
      },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : "Internal server error",
        },
      },
      { status: 500 }
    );
  }
}
