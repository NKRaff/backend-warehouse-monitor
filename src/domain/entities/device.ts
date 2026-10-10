import type { DeviceStatus } from "@domain/types/device-status.js";
import type { MonitoringStatus } from "@domain/types/monitoring-status.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";
import type { Measurement } from "./measurement.js";
import type { Warehouse } from "./warehouse.js";

type DeviceProps = {
	readonly mac: string;
	name: string;
	warehouse: Warehouse;
	lastMeasurement: Measurement;
	deviceStatus: DeviceStatus;
	monitoringStatus: MonitoringStatus;
};

export class Device {
	private constructor(private props: DeviceProps) {}

	static create(props: DeviceProps): Device {
		props.name = props.name.trim();

		if (props.name.length < 4) {
			throw new UnprocessableEntityError(
				"Nome do dispositivo deve ter no minimo 4 caracteres",
			);
		}

		return new Device(props);
	}

	static restore(props: DeviceProps): Device {
		return new Device(props);
	}

	enableMonitoring(): void {
		this.props.monitoringStatus = "enabled";
	}

	disableMonitoring(): void {
		this.props.monitoringStatus = "disabled";
	}

	updateMeasurement(measurement: Measurement): void {
		if (this.props.monitoringStatus === "disabled") {
			return;
		}

		this.props.lastMeasurement = measurement;
	}

	get mac(): string {
		return this.props.mac;
	}

	get name(): string {
		return this.props.name;
	}

	get warehouse(): Warehouse {
		return this.props.warehouse;
	}

	get lastMeasurement(): Measurement {
		return this.props.lastMeasurement;
	}

	get deviceStatus(): DeviceStatus {
		return this.props.deviceStatus;
	}

	get monitoringStatus(): MonitoringStatus {
		return this.props.monitoringStatus;
	}
}
