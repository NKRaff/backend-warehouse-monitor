import type { NotificationMessage } from "@application/types/notification-message.js";
import { renderBaseEmailLayout } from "../layouts/base-email-layout.js";
import { renderActionButton } from "../layouts/components/action-button.js";
import {
	escapeHtml,
	renderParagraphs,
} from "../layouts/components/html-utils.js";

export function renderGenericNotificationEmail(
	notification: NotificationMessage,
): string {
	const url = notification.metadata?.actionUrl;
	const actionLabel = notification.metadata?.actionLabel;

	const content = `
		<h1 style="
			margin: 0 0 20px;
			color: #0f172a;
			font-size: 24px;
		">
			${escapeHtml(notification.title)}
		</h1>

		<p>Olá, <strong>${escapeHtml(notification.recipient.name)}</strong>.</p>

		${renderParagraphs(notification.message)}

		${
			typeof url === "string"
				? renderActionButton({
						url,
						label:
							typeof actionLabel === "string"
								? actionLabel
								: "Acessar o sistema",
					})
				: ""
		}
	`;

	return renderBaseEmailLayout({
		title: notification.title,
		subtitle: "Notificação",
		content,
	});
}
