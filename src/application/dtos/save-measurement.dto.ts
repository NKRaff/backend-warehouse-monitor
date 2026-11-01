export type SaveMeasurementInputDto = {
	deviceId: string;
	values: {
		temperature: number;
		humidity: number;
	};
	createdAt: Date;
};

export type SaveMeasurementOutputDto = {
	message: string;
};
