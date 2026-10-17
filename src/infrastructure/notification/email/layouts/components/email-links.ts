import { env } from "@infrastructure/config/env.js";

export const APP_ROUTES = {
	passwordSetup: "/definir-senha",
	passwordReset: "/redefinir-senha",
	forgotPassword: "/esqueci-senha",
	verifyEmail: "/verificar-email",
	alerts: "/alertas",
} as const;

export function buildAppUrl(path: string, params: Record<string, string> = {}) {
	const url = new URL(path, env.frontend.url);
	for (const [key, value] of Object.entries(params)) {
		url.searchParams.set(key, value);
	}
	return url.toString();
}
