import type { MeasurementType } from "@domain/types/measurement-type.js";
import type { Device } from "./device.js";
import type { Warehouse } from "./warehouse.js";

type MeasurementProps = {
	readonly id: string;
	readonly device: Device;
	readonly warehouse: Warehouse;
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

	get device(): Device {
		return this.props.device;
	}

	get warehouse(): Warehouse {
		return this.props.warehouse;
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
