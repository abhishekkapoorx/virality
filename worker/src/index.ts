import "dotenv/config";

const port = Number(process.env.PORT || 4010);
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

// Worker process bootstrap; queue consumers are added in next milestone.
console.log(`Worker booted on port ${port} with Redis ${redisUrl}`);
