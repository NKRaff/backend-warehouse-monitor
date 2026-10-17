import type { NotificationMessage } from "@application/types/notification-message.js";
import { renderBaseEmailLayout } from "../layouts/base-email-layout.js";
import { renderActionButton } from "../layouts/components/action-button.js";
import {
	renderGreeting,
	renderHeading,
	renderParagraphs,
} from "../layouts/components/html-utils.js";

export function renderGenericNotificationEmail(
	notification: NotificationMessage,
): string {
	const url = notification.metadata?.actionUrl;
	const actionLabel = notification.metadata?.actionLabel;

	const content = `
	${renderHeading(notification.title)}
	${renderGreeting(notification.recipient.name)}
	${renderParagraphs(notification.message)}
	${typeof url === "string" ? renderActionButton({ url, label: typeof actionLabel === "string" ? actionLabel : "Acessar o sistema" }) : ""}
`;
	return renderBaseEmailLayout({
		title: notification.title,
		subtitle: "Notificação",
		preheader: notification.message.slice(0, 90),
		content,
	});
}
