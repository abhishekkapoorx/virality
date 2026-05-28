import "dotenv/config";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { buildGenerateDraftResponse, type WorkflowContextBundle } from "@linkedin-agent/shared";

import { createContainer } from "./container.js";

type DraftQueuePayload = {
	tenantId: string;
	userId: string;
	telegramUserId?: string | null;
	updateRequest?: string;
	source: "manual" | "schedule";
	dayKey?: string;
};

const port = Number(process.env.PORT || 4010);
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const apiUrl = process.env.API_URL?.trim();
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN?.trim();

if (!apiUrl) {
	console.warn("API_URL unset — scheduled draft jobs will fall back to stub context loading.");
}

if (!telegramBotToken) {
	console.warn("TELEGRAM_BOT_TOKEN unset — finished drafts cannot be delivered to Telegram.");
}

const workerContainer = createContainer();
const redisConnection = new IORedis(redisUrl, {
	maxRetriesPerRequest: null
});

const draftWorker = new Worker<DraftQueuePayload>(
	"scheduled-draft-generation",
	async (job) => {
		const context = (await workerContainer.configSource.loadContext({
			tenantId: job.data.tenantId,
			userId: job.data.userId,
			userFeedback: job.data.updateRequest
		})) as WorkflowContextBundle;

		const response = buildGenerateDraftResponse(job.data.userId, context, job.data.updateRequest);
		if (telegramBotToken && job.data.telegramUserId) {
			const telegramMessage = [
				"Your draft is ready.",
				"",
				response.post,
				"",
				"Reply with more feedback if you want a refinement."
			].join("\n");

			await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
				method: "POST",
				headers: {
					"content-type": "application/json"
				},
				body: JSON.stringify({
					chat_id: job.data.telegramUserId,
					text: telegramMessage
				})
			});
		}
		console.log(
			`Generated ${job.data.source} draft for ${job.data.userId}${job.data.dayKey ? ` on ${job.data.dayKey}` : ""}`
		);
		console.log(response.post);
		return response;
	},
	{
		connection: redisConnection
	}
);

console.log(`Worker booted on port ${port} with Redis ${redisUrl}`);

draftWorker.on("completed", (job) => {
	console.log(`Completed scheduled draft job ${job.id}`);
});

draftWorker.on("failed", (job, err) => {
	console.error(`Scheduled draft job ${job?.id ?? "unknown"} failed`, err);
});
