import type { MeasurementType } from "@domain/types/measurement-type.js";

export type ListAllMeasurementInputDto = {
	filter: {
		deviceId?: string | undefined;
		warehouseId?: string | undefined;
		type?: MeasurementType | undefined;
		startDate?: Date | undefined;
		endDate?: Date | undefined;
	};
	pagination?:
		| {
				offSet: number;
				limit: number;
		  }
		| undefined;
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
