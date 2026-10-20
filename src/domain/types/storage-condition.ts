export const StorageCondition = {
	AMBIENT: "ambient",
	COLD: "cold",
	FROZEN: "frozen",
} as const;

export type StorageCondition =
	(typeof StorageCondition)[keyof typeof StorageCondition];
