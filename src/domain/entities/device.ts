import { DeviceStatus } from "@domain/types/device-status.js";
import { MonitoringStatus } from "@domain/types/monitoring-status.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";

type DeviceProps = {
	readonly mac: string;
	name: string;
	warehouseId?: string | undefined;
	lastMeasurementId?: string | undefined;
	deviceStatus: DeviceStatus;
	monitoringStatus: MonitoringStatus;
};

export class Device {
	private constructor(private props: DeviceProps) {}

	static create(
		props: Omit<
			DeviceProps,
			"lastMeasurementId" | "deviceStatus" | "monitoringStatus"
		>,
	): Device {
		const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

		if (!macRegex.test(props.mac)) {
			throw new UnprocessableEntityError("Endereço mac invalido");
		}

		props.name = props.name.trim();

		if (props.name.length < 4) {
			throw new UnprocessableEntityError(
				"Nome do dispositivo deve ter no minimo 4 caracteres",
			);
		}

		return new Device({
			...props,
			deviceStatus: DeviceStatus.ONLINE,
			monitoringStatus: MonitoringStatus.DISABLE,
		});
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

	get warehouseId(): string | undefined {
		return this.props.warehouseId;
	}

	get lastMeasurementId(): string | undefined {
		return this.props.lastMeasurementId;
	}

	get deviceStatus(): DeviceStatus {
		return this.props.deviceStatus;
	}

	get monitoringStatus(): MonitoringStatus {
		return this.props.monitoringStatus;
	}
}
