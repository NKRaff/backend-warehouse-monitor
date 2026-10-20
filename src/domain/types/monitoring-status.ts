export const MonitoringStatus = {
	ENABLE: "enabled",
	DISABLE: "disabled",
} as const;

export type MonitoringStatus =
	(typeof MonitoringStatus)[keyof typeof MonitoringStatus];
