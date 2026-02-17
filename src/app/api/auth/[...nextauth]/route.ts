import { handlers } from "@/lib/auth";

// Force dynamic rendering - auth needs runtime database access
export const dynamic = "force-dynamic";

export const { GET, POST } = handlers;
