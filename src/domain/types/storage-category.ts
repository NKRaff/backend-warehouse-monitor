export const StorageCategory = {
	FOOD: "food",
	PHARMACEUTICAL: "pharmaceutical",
	CHEMICAL: "chemical",
	ELECTRONIC: "electronic",
	GENERAL: "general",
} as const;

export type StorageCategory =
	(typeof StorageCategory)[keyof typeof StorageCategory];
