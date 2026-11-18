import type { MeasurementType } from "@domain/types/measurement-type.js";

export type ListAllMeasurementInputDto = {
	filter: {
		deviceId?: string;
		warehouseId?: string;
		type?: MeasurementType;
		startDate?: Date;
		endDate?: Date;
	};
	pagination?: {
		offset: number;
		limit: number;
	};
};

export type ListAllMeasurementOutputDto = {
	message: string;
	measurements: {
		id: string;
		deviceId: string;
		warehouseId: string;
		type: MeasurementType;
		value: number;
		createdAt: Date;
	}[];
};
