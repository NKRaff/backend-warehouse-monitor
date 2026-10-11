import type { MeasurementType } from "@domain/types/measurement-type.js";

type MeasurementProps = {
	readonly id: string;
	readonly deviceId: string;
	readonly warehouseId: string;
	readonly type: MeasurementType;
	readonly value: number;
	readonly createdAt: Date;
};

export class Measurement {
	private constructor(private props: MeasurementProps) {}

	static create(props: MeasurementProps): Measurement {
		return new Measurement(props);
	}

	static restore(props: MeasurementProps): Measurement {
		return new Measurement(props);
	}

	get id(): string {
		return this.props.id;
	}

	get deviceId(): string {
		return this.props.deviceId;
	}

	get warehouseId(): string {
		return this.props.warehouseId;
	}

	get type(): MeasurementType {
		return this.props.type;
	}

	get value(): number {
		return this.props.value;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}
}
