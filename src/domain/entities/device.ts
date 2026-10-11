import type { DeviceStatus } from "@domain/types/device-status.js";
import type { MonitoringStatus } from "@domain/types/monitoring-status.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";

type DeviceProps = {
	readonly mac: string;
	name: string;
	warehouseId: string;
	lastMeasurementId: string;
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

	updateMeasurement(measurementId: string): void {
		if (this.props.monitoringStatus === "disabled") {
			return;
		}

		this.props.lastMeasurementId = measurementId;
	}

	get mac(): string {
		return this.props.mac;
	}

	get name(): string {
		return this.props.name;
	}

	get warehouseId(): string {
		return this.props.warehouseId;
	}

	get lastMeasurementId(): string {
		return this.props.lastMeasurementId;
	}

	get deviceStatus(): DeviceStatus {
		return this.props.deviceStatus;
	}

	get monitoringStatus(): MonitoringStatus {
		return this.props.monitoringStatus;
	}
}
