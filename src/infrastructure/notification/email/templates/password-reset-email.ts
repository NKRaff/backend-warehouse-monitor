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

export function renderPasswordResetEmail(
	notification: NotificationMessage,
): string {
	const token = notification.metadata?.token;
	const url =
		typeof token === "string"
			? buildAppUrl(APP_ROUTES.passwordReset, { token })
			: undefined;

	const content = `
		${renderHeading("Redefinição de senha")}
		${renderGreeting(notification.recipient.name)}
		${renderParagraphs(
			notification.message ||
				"Recebemos uma solicitação para redefinir a senha da sua conta. " +
					"Se foi você, use o botão abaixo. O link expira em 15 minutos.",
		)}
		${url ? renderActionButton({ url, label: "Redefinir minha senha" }) : ""}
		${renderCallout({
			tone: "warning",
			title: "Não foi você?",
			content:
				"Ignore este e-mail. Sua senha atual continua a mesma até que um novo link seja usado.",
		})}
	`;

	return renderBaseEmailLayout({
		title: notification.title,
		subtitle: "Segurança da conta",
		preheader:
			"Use o link para criar uma nova senha. Ele expira em 15 minutos.",
		content,
		footerNote:
			"Por segurança, nunca compartilhe links de redefinição de senha.",
	});
}
