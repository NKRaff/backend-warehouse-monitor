export const AlertType = {
	DEVICE_OFFLINE: "device_offline",
	DEVICE_ERROR: "device_error",
	MEASUREMENT_OUR_OF_LIMITS: "measurement_out_of_limits",
	REGISTER_USER: "register_user",
	PASSWORD_SETUP: "password_setup",
	PASSWORD_RESET: "password_reset",
	EMAIL_VERIFICATION: "email_verification",
} as const;

export type AlertType = (typeof AlertType)[keyof typeof AlertType];
