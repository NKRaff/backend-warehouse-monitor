export const DeviceStatus = {
	ONLINE: "online",
	OFFLINE: "offline",
	ERROR: "error",
} as const;

export type DeviceStatus = (typeof DeviceStatus)[keyof typeof DeviceStatus];
