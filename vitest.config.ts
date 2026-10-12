import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = (path: string) =>
	fileURLToPath(new URL(`./src/${path}`, import.meta.url));

export default defineConfig({
	resolve: {
		alias: {
			"@domain": src("domain"),
			"@application": src("application"),
			"@presentation": src("presentation"),
			"@shared": src("shared"),
		},
	},
	test: {
		environment: "node",
		globals: true,
		silent: true,
		env: {
			NODE_ENV: "test",
			APP_NAME: "warehouse-monitor-test",
			APP_HOST: "127.0.0.1",
			APP_PORT: "3000",
			DB_URI: "mongodb://localhost:27017/warehouse-monitor-test",
			BROKER_URL: "mqtt://localhost:1883",
			BROKER_CLIENT_USERNAME: "test-user",
			BROKER_CLIENT_PASSWORD: "test-pass",
			MAIL_HOST: "smtp.test.local",
			MAIL_PORT: "587",
			MAIL_SECURE: "false",
			MAIL_USER: "mailer",
			MAIL_PASS: "mailer-pass",
			MAIL_FROM: "noreply@test.local",
			JWT_SECRET: "test-jwt-secret-with-enough-length",
			JWT_EXPIRES_IN_MIN: "15",
			COOKIE_SECRET: "test-cookie-secret",
			COOKIE_EXPIRES_IN_MIN: "60",
			BCRYPT_ROUNDS: "4",
			RATE_LIMIT_MAX_REQUESTS: "100",
		},
		coverage: {
			provider: "v8",
			include: ["src/domain/**/*.ts", "src/application/**/*.ts"],
			exclude: ["src/main.ts", "**/*.dto.ts", "**/*.repository.ts"],
			thresholds: {
				lines: 80,
				functions: 80,
				branches: 80,
				statements: 80,
				perFile: true,
			},
		},
		projects: [
			{
				extends: true,
				test: {
					name: "unit",
					include: ["./test/unit/**/*.test.ts"],
				},
			},
			{
				extends: true,
				test: {
					name: "integration",
					include: ["./test/integration/**/*.test.ts"],
					fileParallelism: false,
				},
			},
			{
				extends: true,
				test: {
					name: "e2e",
					include: ["./test/e2e/**/*.e2e.test.ts"],
					fileParallelism: false,
				},
			},
		],
	},
});
