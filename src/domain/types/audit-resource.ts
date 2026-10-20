export const AuditResource = {
	ALERT: "alert",
	DEVICE: "device",
	MEASUREMENT: "measurement",
	NOTIFICATION: "notification",
	TOKEN: "token",
	USER: "user",
	WAREHOUSE: "warehouse",
} as const;

export type AuditResource = (typeof AuditResource)[keyof typeof AuditResource];
