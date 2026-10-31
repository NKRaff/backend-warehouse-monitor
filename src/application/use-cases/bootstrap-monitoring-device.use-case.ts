import type { IMqttClient } from "@application/ports/mqtt-client.interface.js";
import type { IDeviceRepository } from "@application/repositories/device.interface.js";

export class BootstrapMonitoringDeviceUseCase {
	private static _instance: BootstrapMonitoringDeviceUseCase;

	private constructor(
		private readonly deviceRepo: IDeviceRepository,
		private readonly mqttClient: IMqttClient,
	) {}

	static instance(
		deviceRepo: IDeviceRepository,
		mqttClient: IMqttClient,
	): BootstrapMonitoringDeviceUseCase {
		if (!BootstrapMonitoringDeviceUseCase._instance) {
			BootstrapMonitoringDeviceUseCase._instance =
				new BootstrapMonitoringDeviceUseCase(deviceRepo, mqttClient);
		}
		return BootstrapMonitoringDeviceUseCase._instance;
	}

	async execute(): Promise<void> {
		const devices = await this.deviceRepo.findAllMonitoringOn();

		for (const device of devices) {
			await this.mqttClient.subscribe(`device/${device.mac}/telemetry`);
			await this.mqttClient.subscribe(`device/${device.mac}/error`);
		}
	}
}
