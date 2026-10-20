export const MeasurementType = {
	TEMPERATURE: "temperature",
	HUMIDITY: "humidity",
} as const;

export type MeasurementType =
	(typeof MeasurementType)[keyof typeof MeasurementType];
