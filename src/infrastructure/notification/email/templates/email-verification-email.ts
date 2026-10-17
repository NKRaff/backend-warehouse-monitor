import type { NotificationMessage } from "@application/types/notification-message.js";
import { renderBaseEmailLayout } from "../layouts/base-email-layout.js";
import { renderActionButton } from "../layouts/components/action-button.js";
import { renderCallout } from "../layouts/components/callout.js";
import { APP_ROUTES, buildAppUrl } from "../layouts/components/email-links.js";
import {
	renderGreeting,
	renderHeading,
	renderParagraphs,
} from "../layouts/components/html-utils.js";

export function renderEmailVerificationEmail(
	notification: NotificationMessage,
): string {
	const token = notification.metadata?.token;
	const minutes =
		typeof notification.metadata?.expiresInMinutes === "number"
			? notification.metadata.expiresInMinutes
			: 15;
	const url =
		typeof token === "string"
			? buildAppUrl(APP_ROUTES.verifyEmail, { token })
			: undefined;

	const content = `
		${renderHeading("Confirme seu e-mail")}
		${renderGreeting(notification.recipient.name)}
		${renderParagraphs(
			notification.message ||
				"Confirme que este endereço de e-mail é seu para passar a receber os alertas dos ambientes monitorados.",
		)}
		${url ? renderActionButton({ url, label: "Confirmar e-mail", color: "#16a34a" }) : ""}
		${renderCallout({
			tone: "info",
			content: `O link expira em ${minutes} minutos. Se você não criou ou alterou uma conta, ignore esta mensagem.`,
		})}
	`;

	return renderBaseEmailLayout({
		title: notification.title,
		subtitle: "Verificação de e-mail",
		preheader: "Confirme seu e-mail para receber os alertas do sistema.",
		content,
	});
}
