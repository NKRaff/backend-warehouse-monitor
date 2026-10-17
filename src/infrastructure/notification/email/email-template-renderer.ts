import type { NotificationMessage } from "@application/types/notification-message.js";
import { renderAlertEmail } from "./templates/alert-email.js";
import { renderEmailVerificationEmail } from "./templates/email-verification-email.js";
import { renderGenericNotificationEmail } from "./templates/generic-notification-email.js";
import { renderPasswordResetEmail } from "./templates/password-reset-email.js";
import { renderPasswordSetupEmail } from "./templates/password-setup-email.js";

export function renderNotificationEmail(
	notification: NotificationMessage,
): string {
	switch (notification.type) {
		case "register_user":
			return renderPasswordSetupEmail(notification);

		case "password_reset":
			return renderPasswordResetEmail(notification);

		case "email_verification":
			return renderEmailVerificationEmail(notification);

		default:
			if (
				notification.severity === "warning" ||
				notification.severity === "critical"
			) {
				return renderAlertEmail(notification);
			}

			return renderGenericNotificationEmail(notification);
	}
}
