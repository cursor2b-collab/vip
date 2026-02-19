import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// 游戏API配置
const GAME_API_BASE_URL = Deno.env.get("GAME_API_BASE_URL") || "https://dcyqv8f2id.com/api/v2";
const CLIENT_ID = Deno.env.get("GAME_API_CLIENT_ID") || "";
const CLIENT_SECRET = Deno.env.get("GAME_API_CLIENT_SECRET") || "";

// 白名单配置
const ALLOWED_ORIGINS = Deno.env.get("ALLOWED_ORIGINS")?.split(",") || [];
const ALLOWED_IPS = Deno.env.get("ALLOWED_IPS")?.split(",") || [];
const REQUIRE_AUTH = Deno.env.get("REQUIRE_AUTH") !== "false"; // 默认需要认证
const API_KEY = Deno.env.get("API_KEY") || ""; // 可选的 API Key 验证

// Token缓存接口
interface TokenCache {
  token: string;
  expiration: number;
}

// 游戏API响应接口
interface GameApiResponse<T = any> {
  success: boolean;
  message?: T;
  errorCode?: number;
}

// Token管理类
class TokenManager {
  private static cache: TokenCache | null = null;
  private static supabase: any = null;

  static init(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  // 从数据库函数获取有效token
  static async getToken(): Promise<string | null> {
    // 先检查内存缓存
    if (this.cache && this.cache.expiration > Date.now() / 1000 + 300) {
      return this.cache.token;
    }

    // 使用数据库函数获取有效token
    try {
      if (this.supabase) {
        const { data, error } = await this.supabase.rpc("get_valid_game_api_token");
        
        if (error) {
          console.error("Error getting token from database:", error);
          return null;
        }

        if (data) {
          // 从数据库获取完整的token信息以更新缓存
          const { data: tokenData } = await this.supabase
            .from("game_api_tokens")
            .select("token, expiration")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (tokenData && tokenData.expiration > Date.now() / 1000 + 300) {
            this.cache = { token: tokenData.token, expiration: tokenData.expiration };
            return tokenData.token;
          }
        }
      }
    } catch (error) {
      console.log("Token not found in database, will create new one:", error);
    }

    return null;
  }

  // 保存token到数据库（使用数据库函数）
  static async saveToken(token: string, expiration: number): Promise<void> {
    this.cache = { token, expiration };

    if (this.supabase) {
      try {
        // 使用数据库函数保存token
        const { error } = await this.supabase.rpc("save_game_api_token", {
          p_token: token,
          p_expiration: expiration,
        });

        if (error) {
          console.error("Failed to save token:", error);
          // 如果函数失败，尝试直接插入
          await this.supabase
            .from("game_api_tokens")
            .insert({
              token,
              expiration,
              created_at: new Date().toISOString(),
            });
        }
      } catch (error) {
        console.error("Failed to save token:", error);
      }
    }
  }

  // 创建新token（带速率限制检查）
  static async createToken(): Promise<string> {
    // 检查环境变量是否设置
    if (!CLIENT_ID || !CLIENT_SECRET) {
      const missingVars = [];
      if (!CLIENT_ID) missingVars.push("GAME_API_CLIENT_ID");
      if (!CLIENT_SECRET) missingVars.push("GAME_API_CLIENT_SECRET");
      throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`);
    }

    // 检查速率限制（每30秒5次）
    if (this.supabase) {
      const { data: rateLimitOk } = await this.supabase.rpc("check_rate_limit", {
        p_endpoint: "/auth/createtoken",
        p_limit_count: 5,
        p_time_window_seconds: 30,
      });

      if (!rateLimitOk) {
        throw new Error("Rate limit exceeded: 5 requests per 30 seconds");
      }
    }

    try {
      const response = await fetch(`${GAME_API_BASE_URL}/auth/createtoken`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET,
        }),
      });

      if (!response.ok) {
        // 尝试读取错误响应体
        let errorMessage = `Failed to create token: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = `Failed to create token: ${response.status} - ${errorData.message}`;
          } else if (errorData.error) {
            errorMessage = `Failed to create token: ${response.status} - ${errorData.error}`;
          }
        } catch (e) {
          // 如果无法解析JSON，使用状态文本
          errorMessage = `Failed to create token: ${response.status} ${response.statusText}`;
        }
        console.error("Token creation failed:", {
          status: response.status,
          statusText: response.statusText,
          url: `${GAME_API_BASE_URL}/auth/createtoken`,
          hasClientId: !!CLIENT_ID,
          hasClientSecret: !!CLIENT_SECRET,
        });
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.token || !data.expiration) {
        console.error("Invalid token response:", data);
        throw new Error("Invalid token response: missing token or expiration");
      }

      await this.saveToken(data.token, data.expiration);
      return data.token;
    } catch (error) {
      // 如果是我们自己的错误，直接抛出
      if (error.message && error.message.includes("Failed to create token")) {
        throw error;
      }
      // 其他错误（网络错误等）
      console.error("Token creation error:", error);
      throw new Error(`Failed to create token: ${error.message || "Unknown error"}`);
    }
  }

  // 获取有效token（自动刷新）
  static async getValidToken(): Promise<string> {
    let token = await this.getToken();
    
    if (!token) {
      token = await this.createToken();
    }

    return token;
  }
}

// 游戏API客户端类
class GameApiClient {
  private baseUrl: string;
  public supabase: any;

  constructor(baseUrl: string, supabaseClient: any) {
    this.baseUrl = baseUrl;
    this.supabase = supabaseClient;
    TokenManager.init(supabaseClient);
  }

  // 发送认证请求（带日志记录）
  private async request(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<Response> {
    const startTime = Date.now();
    const token = await TokenManager.getValidToken();
    
    const url = `${this.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    };

    if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
      options.body = JSON.stringify(data);
    }

    let response = await fetch(url, options);
    const executionTime = Date.now() - startTime;

    // 如果token过期，重试一次
    if (response.status === 401) {
      const newToken = await TokenManager.createToken();
      options.headers = {
        ...options.headers,
        "Authorization": `Bearer ${newToken}`,
      };
      response = await fetch(url, options);
    }

    // 记录API调用日志
    try {
      const responseBody = await response.clone().json().catch(() => null);
      await this.supabase.rpc("log_api_call", {
        p_endpoint: endpoint,
        p_method: method,
        p_request_body: data || null,
        p_response_body: responseBody,
        p_status_code: response.status,
        p_error_message: response.status >= 400 ? `HTTP ${response.status}` : null,
        p_execution_time_ms: executionTime,
      });
    } catch (error) {
      console.error("Failed to log API call:", error);
    }

    return response;
  }

  // 2.2 获取供应商列表
  async getVendorsList(): Promise<GameApiResponse> {
    const response = await this.request("GET", "/vendors/list");
    return await response.json();
  }

  // 2.3 获取游戏列表
  async getGamesList(vendorCode: string, language: string = "zh"): Promise<GameApiResponse> {
    const response = await this.request("POST", "/games/list", {
      vendorCode,
      language,
    });
    return await response.json();
  }

  // 2.4 获取迷你游戏列表
  async getMiniGamesList(): Promise<GameApiResponse> {
    const response = await this.request("GET", "/games/mini/list");
    return await response.json();
  }

  // 2.5 获取游戏详情
  async getGameDetail(vendorCode: string, gameCode: string): Promise<GameApiResponse> {
    const response = await this.request("POST", "/game/detail", {
      vendorCode,
      gameCode,
    });
    return await response.json();
  }

  // 2.6 获取启动URL
  async getLaunchUrl(
    vendorCode: string,
    gameCode: string,
    userCode: string,
    language: string = "zh",
    lobbyUrl?: string
  ): Promise<GameApiResponse<string>> {
    const data: any = {
      vendorCode,
      gameCode,
      userCode,
      language,
    };
    
    if (lobbyUrl) {
      data.lobbyUrl = lobbyUrl;
    }

    const response = await this.request("POST", "/game/launch-url", data);
    return await response.json();
  }

  // 2.11 创建用户
  async createUser(userCode: string): Promise<GameApiResponse> {
    const response = await this.request("POST", "/user/create", { userCode });
    return await response.json();
  }

  // 2.12 获取用户余额
  async getUserBalance(userCode: string): Promise<GameApiResponse<number>> {
    const response = await this.request("POST", "/user/balance", { userCode });
    return await response.json();
  }

  // 2.13 存款
  async deposit(
    userCode: string,
    balance: number,
    orderNo?: string,
    vendorCode?: string
  ): Promise<GameApiResponse<number>> {
    const data: any = { userCode, balance };
    if (orderNo) data.orderNo = orderNo;
    if (vendorCode) data.vendorCode = vendorCode;

    const response = await this.request("POST", "/user/deposit", data);
    return await response.json();
  }

  // 2.14 提款
  async withdraw(
    userCode: string,
    balance: number,
    orderNo?: string,
    vendorCode?: string
  ): Promise<GameApiResponse<number>> {
    const data: any = { userCode, balance };
    if (orderNo) data.orderNo = orderNo;
    if (vendorCode) data.vendorCode = vendorCode;

    const response = await this.request("POST", "/user/withdraw", data);
    return await response.json();
  }

  // 2.15 全部提款
  async withdrawAll(userCode: string, vendorCode?: string): Promise<GameApiResponse<number>> {
    const data: any = { userCode };
    if (vendorCode) data.vendorCode = vendorCode;

    const response = await this.request("POST", "/user/withdraw-all", data);
    return await response.json();
  }

  // 2.16 获取用户余额日志
  async getUserBalanceHistory(orderNo: string): Promise<GameApiResponse> {
    const response = await this.request("POST", "/user/balance-history", { orderNo });
    return await response.json();
  }

  // 2.21 获取投注历史V2（带速率限制检查）
  async getBettingHistoryV2(
    startDate: string,
    limit: number = 5000,
    vendorCode?: string
  ): Promise<GameApiResponse> {
    // 检查速率限制（每秒1次）
    const { data: rateLimitOk } = await this.supabase.rpc("check_rate_limit", {
      p_endpoint: "/betting/history/by-date-v2",
      p_limit_count: 1,
      p_time_window_seconds: 1,
    });

    if (!rateLimitOk) {
      throw new Error("Rate limit exceeded: 1 request per second");
    }

    const data: any = { startDate, limit };
    if (vendorCode) data.vendorCode = vendorCode;

    const response = await this.request("POST", "/betting/history/by-date-v2", data);
    return await response.json();
  }

  // 2.8 获取投注历史（按ID）
  async getBettingHistoryById(id: number): Promise<GameApiResponse> {
    const response = await this.request("POST", "/betting/history/by-id", { id });
    return await response.json();
  }

  // 2.9 获取交易历史（按ID）
  async getTransactionHistoryById(id: number): Promise<GameApiResponse> {
    const response = await this.request("POST", "/transaction/history/by-id", { id });
    return await response.json();
  }

  // 2.22 获取投注详情页面URL
  async getBettingDetailUrl(id: number, language: string = "zh"): Promise<GameApiResponse<string>> {
    const response = await this.request("POST", "/betting/history/detail", {
      id,
      language,
    });
    return await response.json();
  }

  // 2.10 获取代理余额
  async getAgentBalance(): Promise<GameApiResponse<number>> {
    const response = await this.request("GET", "/agent/balance");
    return await response.json();
  }

  // 2.17 设置用户RTP
  async setUserRtp(vendorCode: string, userCode: string, rtp: number): Promise<GameApiResponse> {
    if (rtp < 30 || rtp > 99) {
      throw new Error("RTP值必须在30-99之间");
    }

    const response = await this.request("POST", "/game/user/set-rtp", {
      vendorCode,
      userCode,
      rtp,
    });
    return await response.json();
  }

  // 2.18 获取用户RTP
  async getUserRtp(vendorCode: string, userCode: string): Promise<GameApiResponse<number>> {
    const response = await this.request("POST", "/game/user/get-rtp", {
      vendorCode,
      userCode,
    });
    return await response.json();
  }

  // 2.19 重置用户RTP
  async resetUserRtp(vendorCode: string, rtp: number): Promise<GameApiResponse<number>> {
    if (rtp < 30 || rtp > 99) {
      throw new Error("RTP值必须在30-99之间");
    }

    const response = await this.request("POST", "/game/users/reset-rtp", {
      vendorCode,
      rtp,
    });
    return await response.json();
  }

  // 2.20 批量设置用户RTP（带速率限制检查）
  async batchSetUserRtp(vendorCode: string, userRtpList: Array<{userCode: string, rtp: number}>): Promise<GameApiResponse> {
    if (userRtpList.length > 500) {
      throw new Error("批量设置RTP最多支持500个用户");
    }

    // 检查速率限制（每3秒1次）
    const { data: rateLimitOk } = await this.supabase.rpc("check_rate_limit", {
      p_endpoint: "/game/users/batch-rtp",
      p_limit_count: 1,
      p_time_window_seconds: 3,
    });

    if (!rateLimitOk) {
      throw new Error("Rate limit exceeded: 1 request per 3 seconds");
    }

    const response = await this.request("POST", "/game/users/batch-rtp", {
      vendorCode,
      data: userRtpList,
    });
    return await response.json();
  }

  // 1.3 API状态检查
  async getStatus(): Promise<GameApiResponse> {
    const response = await fetch(`${this.baseUrl}/status`);
    return await response.json();
  }
}

// 白名单验证函数
async function validateRequest(req: Request, supabase: any): Promise<{ allowed: boolean; error?: string }> {
  // 1. 验证 Origin（如果配置了白名单）
  if (ALLOWED_ORIGINS.length > 0) {
    const origin = req.headers.get("origin") || req.headers.get("referer");
    if (origin) {
      const originUrl = new URL(origin);
      const isAllowed = ALLOWED_ORIGINS.some(allowed => {
        try {
          const allowedUrl = new URL(allowed);
          return originUrl.hostname === allowedUrl.hostname || originUrl.hostname.endsWith(`.${allowedUrl.hostname}`);
        } catch {
          // 如果配置的不是完整URL，直接比较字符串
          return origin.includes(allowed);
        }
      });
      
      if (!isAllowed) {
        return { allowed: false, error: `Origin not allowed: ${origin}` };
      }
    } else if (ALLOWED_ORIGINS.length > 0) {
      return { allowed: false, error: "Origin header missing" };
    }
  }

  // 2. 验证 IP 地址（如果配置了白名单）
  if (ALLOWED_IPS.length > 0) {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    const isAllowed = ALLOWED_IPS.some(allowedIp => {
      // 支持 CIDR 格式（如 192.168.1.0/24）
      if (allowedIp.includes("/")) {
        // 简单的 CIDR 检查（可以进一步优化）
        const [ip, mask] = allowedIp.split("/");
        return clientIp.startsWith(ip.substring(0, parseInt(mask) / 8));
      }
      return clientIp === allowedIp || clientIp.startsWith(allowedIp);
    });
    
    if (!isAllowed) {
      return { allowed: false, error: `IP not allowed: ${clientIp}` };
    }
  }

  // 3. 验证 JWT Token（如果启用了认证）
  if (REQUIRE_AUTH) {
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // 如果没有 JWT，尝试使用 API Key
      if (API_KEY) {
        const apiKeyHeader = req.headers.get("x-api-key");
        if (apiKeyHeader === API_KEY) {
          return { allowed: true };
        }
      }
      return { allowed: false, error: "Authorization header missing or invalid" };
    }

    const token = authHeader.replace("Bearer ", "");
    
    try {
      // 验证 JWT token
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return { allowed: false, error: "Invalid or expired token" };
      }
      
      // 可以在这里添加额外的用户权限检查
      // 例如：检查用户角色、是否激活等
      
    } catch (error) {
      return { allowed: false, error: `Token validation failed: ${error.message}` };
    }
  }

  // 4. 验证 API Key（如果配置了且没有使用 JWT）
  if (API_KEY && !REQUIRE_AUTH) {
    const apiKeyHeader = req.headers.get("x-api-key");
    if (apiKeyHeader !== API_KEY) {
      return { allowed: false, error: "Invalid API key" };
    }
  }

  return { allowed: true };
}

// 主处理函数
Deno.serve(async (req: Request) => {
  // 初始化Supabase客户端（用于验证）
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 获取请求的 Origin 用于 CORS
  const requestOrigin = req.headers.get("origin");
  const allowedOrigin = ALLOWED_ORIGINS.length > 0 && requestOrigin 
    ? (ALLOWED_ORIGINS.some(allowed => {
        try {
          const allowedUrl = new URL(allowed);
          const originUrl = new URL(requestOrigin);
          return originUrl.hostname === allowedUrl.hostname || originUrl.hostname.endsWith(`.${allowedUrl.hostname}`);
        } catch {
          return requestOrigin.includes(allowed);
        }
      }) ? requestOrigin : ALLOWED_ORIGINS[0] 
    : "*";

  // CORS处理 - 必须在所有响应中包含CORS头
  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, X-API-Key",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // 白名单验证
    const validation = await validateRequest(req, supabase);
    if (!validation.allowed) {
      console.warn("Request blocked:", {
        ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
        origin: req.headers.get("origin"),
        path: new URL(req.url).pathname,
        reason: validation.error,
      });
      
      return new Response(
        JSON.stringify({
          success: false,
          errorCode: 403,
          message: validation.error || "Access denied",
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // 初始化游戏API客户端
    const gameApi = new GameApiClient(GAME_API_BASE_URL, supabase);

    // 解析请求
    const url = new URL(req.url);
    // 提取 /functions/v1/game-api 之后的部分
    // 例如: /functions/v1/game-api/games/mini/list -> /games/mini/list
    let path = url.pathname;
    const gameApiIndex = path.indexOf('/game-api');
    if (gameApiIndex !== -1) {
      path = path.substring(gameApiIndex + '/game-api'.length);
    }
    // 如果没有找到，尝试直接使用pathname（开发环境可能不同）
    if (!path || path === url.pathname) {
      path = url.pathname.replace(/^.*\/game-api/, '');
    }
    // 确保路径以 / 开头
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    // 如果路径为空，默认为根路径
    if (path === '/') {
      path = '/status';
    }
    const method = req.method;

    // 路由处理
    let result: GameApiResponse;

    switch (path) {
      case "/vendors/list":
        if (method === "GET") {
          result = await gameApi.getVendorsList();
        } else {
          throw new Error("Method not allowed");
        }
        break;

      case "/games/list":
        if (method === "POST") {
          const body = await req.json();
          result = await gameApi.getGamesList(body.vendorCode, body.language || "zh");
        } else {
          throw new Error("Method not allowed");
        }
        break;

      case "/games/mini/list":
        if (method === "GET") {
          result = await gameApi.getMiniGamesList();
        } else {
          throw new Error("Method not allowed");
        }
        break;

      case "/game/detail":
        if (method === "POST") {
          const body = await req.json();
          result = await gameApi.getGameDetail(body.vendorCode, body.gameCode);
        } else {
          throw new Error("Method not allowed");
        }
        break;

      case "/game/launch-url":
        if (method === "POST") {
          const body = await req.json();
          result = await gameApi.getLaunchUrl(
            body.vendorCode,
            body.gameCode,
            body.userCode,
            body.language || "zh",
            body.lobbyUrl
          );
        } else {
          throw new Error("Method not allowed");
        }
        break;

      case "/user/create":
        if (method === "POST") {
          const body = await req.json();
          result = await gameApi.createUser(body.userCode);
        } else {
          throw new Error("Method not allowed");
        }
        break;

      case "/user/balance":
        if (method === "POST") {
          const body = await req.json();
          result = await gameApi.getUserBalance(body.userCode);
        } else {
          throw new Error("Method not allowed");
        }
        break;

      case "/user/deposit":
        if (method === "POST") {
          const body = await req.json();
          result = await gameApi.deposit(
            body.userCode,
            body.balance,
            body.orderNo,
            body.vendorCode
          );
        } else {
          throw new Error("Method not allowed");
        }
        break;

      case "/user/withdraw":
        if (method === "POST") {
          const body = await req.json();
          result = await gameApi.withdraw(
            body.userCode,
            body.balance,
            body.orderNo,
            body.vendorCode
          );
        } else {
          throw new Error("Method not allowed");
        }
        break;

      case "/user/withdraw-all":
        if (method === "POST") {
          const body = await req.json();
          result = await gameApi.withdrawAll(body.userCode, body.vendorCode);
        } else {
          throw new Error("Method not allowed");
        }
        break;

      case "/user/balance-history":
        if (method === "POST") {
          const body = await req.json();
          result = await gameApi.getUserBalanceHistory(body.orderNo);
        } else {
          throw new Error("Method not allowed");
        }
        break;

      case "/betting/history/by-date-v2":
        if (method === "POST") {
          const body = await req.json();
          result = await gameApi.getBettingHistoryV2(
            body.startDate,
            body.limit || 5000,
            body.vendorCode
          );
        } else {
          throw new Error("Method not allowed");
        }
        break;

      case "/betting/history/by-id":
        if (method === "POST") {
          const body = await req.json();
          result = await gameApi.getBettingHistoryById(body.id);
        } else {
          throw new Error("Method not allowed");
        }
        break;

      case "/transaction/history/by-id":
        if (method === "POST") {
          const body = await req.json();
          result = await gameApi.getTransactionHistoryById(body.id);
        } else {
          throw new Error("Method not allowed");
        }
        break;

      case "/betting/history/detail":
        if (method === "POST") {
          const body = await req.json();
          result = await gameApi.getBettingDetailUrl(body.id, body.language || "zh");
        } else {
          throw new Error("Method not allowed");
        }
        break;

      case "/agent/balance":
        if (method === "GET") {
          result = await gameApi.getAgentBalance();
        } else {
          throw new Error("Method not allowed");
        }
        break;

      case "/game/user/set-rtp":
        if (method === "POST") {
          const body = await req.json();
          result = await gameApi.setUserRtp(body.vendorCode, body.userCode, body.rtp);
        } else {
          throw new Error("Method not allowed");
        }
        break;

      case "/game/user/get-rtp":
        if (method === "POST") {
          const body = await req.json();
          result = await gameApi.getUserRtp(body.vendorCode, body.userCode);
        } else {
          throw new Error("Method not allowed");
        }
        break;

      case "/game/users/reset-rtp":
        if (method === "POST") {
          const body = await req.json();
          result = await gameApi.resetUserRtp(body.vendorCode, body.rtp);
        } else {
          throw new Error("Method not allowed");
        }
        break;

      case "/game/users/batch-rtp":
        if (method === "POST") {
          const body = await req.json();
          result = await gameApi.batchSetUserRtp(body.vendorCode, body.data);
        } else {
          throw new Error("Method not allowed");
        }
        break;

      case "/status":
        if (method === "GET") {
          result = await gameApi.getStatus();
        } else {
          throw new Error("Method not allowed");
        }
        break;

      default:
        return new Response(
          JSON.stringify({ success: false, errorCode: 404, message: `Not found: ${path}` }),
          {
            status: 404,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        errorCode: 500,
        message: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});
