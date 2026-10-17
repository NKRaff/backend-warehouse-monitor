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

export function renderPasswordSetupEmail(
	notification: NotificationMessage,
): string {
	const token = notification.metadata?.token;
	const url =
		typeof token === "string"
			? buildAppUrl(APP_ROUTES.passwordSetup, { token })
			: undefined;

	const content = `
		${renderHeading("Defina sua senha")}
		${renderGreeting(notification.recipient.name)}
		${renderParagraphs(notification.message)}
		${url ? renderActionButton({ url, label: "Definir minha senha" }) : ""}
		${renderCallout({
			tone: "info",
			content:
				"Por segurança, o link expira em 15 minutos e não deve ser compartilhado. " +
				"Se ele expirar, solicite um novo pela opção de recuperação de senha.",
		})}
	`;

	return renderBaseEmailLayout({
		title: notification.title,
		subtitle: "Ativação de conta",
		preheader: "Defina sua senha para acessar o Warehouse Monitor.",
		content,
		footerNote:
			"Não esperava este convite? Ignore este e-mail ou fale com o administrador.",
	});
}
