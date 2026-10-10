import { InternalServerError } from "@shared/errors/internal-server-error.js";
import "dotenv/config";

function getEnv(name: string, defaultValue?: string): string {
	const value = process.env[name] ?? defaultValue;

	if (!value) {
		throw new InternalServerError(`Variável de ambiente ${name} não definida`);
	}

	return value.trim();
}

function getNumber(name: string, defaultValue?: string): number {
	const value = getEnv(name, defaultValue);
	const parsed = Number(value);

	if (Number.isNaN(parsed)) {
		throw new InternalServerError(
			`Variável de ambiente ${name} deve ser um numero`,
		);
	}

	return parsed;
}

function getBoolean(name: string, defaultValue?: string): boolean {
	const value = getEnv(name, defaultValue).toLowerCase();

	if (value !== "true" && value !== "false") {
		throw new InternalServerError(`Variável de ambiente ${value} não definida`);
	}

	return value === "true";
}

export const env = {
	app: {
		nodeEnv: getEnv("NODE_ENV", "development"),
		name: getEnv("APP_NAME"),
		host: getEnv("APP_HOST", "0.0.0.0"),
		port: getNumber("APP_PORT", "3000"),
	},

	database: {
		URI: getEnv("DB_URI"),
	},

	mqtt: {
		URL: getEnv("BROKER_URL"),
		username: getEnv("BROKER_CLIENT_USERNAME"),
		password: getEnv("BROKER_CLIENT_PASSWORD"),
	},

	smtp: {
		host: getEnv("MAIL_HOST"),
		port: getNumber("MAIL_PORT"),
		secure: getBoolean("MAIL_SECURE"),
		user: getEnv("MAIL_USER"),
		password: getEnv("MAIL_PASS"),
		from: getEnv("MAIL_FROM"),
	},

	jwt: {
		secret: getEnv("JWT_SECRET"),
		expiresInMs: getNumber("JWT_EXPIRES_IN_MIN") * 60 * 1000,
	},

	cookie: {
		secret: getEnv("COOKIE_SECRET"),
		expiresIn: getNumber("COOKIE_EXPIRES_IN_MIN") * 60 * 1000,
		httpOnly: getBoolean("COOKIE_HTTP_ONLY", "true"),
		secure: getBoolean("COOKIE_SECURE", "false"),
		sameSite: getEnv("COOKIE_SAME_SITE", "lax"),
	},

	cors: {
		origin: getEnv("CORS_ORIGIN", "http://localhost:3000"),
		credentials: getBoolean("CORS_CREDENTIALS", "true"),
	},

	security: {
		bcryptRounds: getNumber("BCRYPT_ROUNDS"),
	},

	rateLimit: {
		maxRequest: getNumber("RATE_LIMIT_MAX_REQUESTS"),
	},
};
