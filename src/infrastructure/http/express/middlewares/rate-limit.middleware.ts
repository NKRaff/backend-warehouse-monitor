import { env } from "@infrastructure/config/env.js";
import rateLimit from "express-rate-limit";

export const rateLimitMiddleware = rateLimit({
	windowMs: env.rateLimit.windowTime,
	limit: env.rateLimit.maxRequest,
	standardHeaders: "draft-8",
	legacyHeaders: false,
	message: {
		status: 429,
		error:
			"Muitas requisições feitas a partir deste IP, tente novamente mais tarde.",
	},
});
