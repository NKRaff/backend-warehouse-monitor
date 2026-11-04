import type { IDeviceRepository } from "@application/repositories/device.interface.js";
import type { Device } from "@domain/entities/device.js";
import { DeviceStatus } from "@domain/types/device-status.js";
import type { lastMeasurements } from "@domain/types/last-measurements-ids.js";
import { MonitoringStatus } from "@domain/types/monitoring-status.js";
import {
	deviceToDomain,
	deviceToPersistence,
} from "../mappers/device.mapper.js";
import { DeviceModel } from "../models/device.model.js";

export class DeviceRepository implements IDeviceRepository {
	private static _instance: DeviceRepository;

	private constructor() {}

	static instance(): DeviceRepository {
		if (!DeviceRepository._instance) {
			DeviceRepository._instance = new DeviceRepository();
		}
		return DeviceRepository._instance;
	}

	async unlinkWarehouse(warehouseId: string): Promise<void> {
		await DeviceModel.updateMany(
			{ warehouseId },
			{
				$set: { deviceStatus: DeviceStatus.OFFLINE },
				$unset: { warehouseId: "" },
			},
		);
	}

	async save(device: Device): Promise<void> {
		await DeviceModel.create(deviceToPersistence(device));
	}

	async findById(mac: string): Promise<Device | null> {
		const device = await DeviceModel.findById(mac);
		return device ? deviceToDomain(device) : null;
	}

	async updateById(device: {
		mac: string;
		name?: string;
		warehouseId?: string;
		lastMeasurementId?: lastMeasurements;
		deviceStatus?: DeviceStatus;
		monitoringStatus?: MonitoringStatus;
	}): Promise<void> {
		await DeviceModel.findByIdAndUpdate(device.mac, {
			$set: {
				...(device.name && { name: device.name }),
				...(device.warehouseId && { warehouseId: device.warehouseId }),
				...(device.lastMeasurementId && {
					lastMeasurementId: device.lastMeasurementId,
				}),
				...(device.deviceStatus && { deviceStatus: device.deviceStatus }),
				...(device.monitoringStatus && {
					monitoringStatus: device.monitoringStatus,
				}),
			},
		});
	}

	async deleteById(mac: string): Promise<void> {
		await DeviceModel.findByIdAndDelete(mac);
	}

	async findAll(offset: number, limit: number): Promise<Device[]> {
		const devices = await DeviceModel.find().skip(offset).limit(limit);

		return devices.map((device) => {
			return deviceToDomain(device);
		});
	}

	async findAllMonitoringOn(): Promise<Device[]> {
		const devices = await DeviceModel.find({
			monitoringStatus: MonitoringStatus.ENABLE,
			warehouseId: {
				$exists: true,
			},
		});

		return devices.map((device) => {
			return deviceToDomain(device);
		});
	}

	async getAverageMonitoring(warehouseId: string) {
		const [result] = await DeviceModel.aggregate([
			{
				$match: {
					warehouseId,
					monitoringStatus: MonitoringStatus.ENABLE,
					lastMeasurementId: { $exists: true },
				},
			},
			{
				$project: {
					measurementIds: [
						"$lastMeasurementId.temperatureId",
						"$lastMeasurementId.humidityId",
					],
				},
			},
			{
				$unwind: "$measurementIds",
			},
			{
				$lookup: {
					from: "measurements",
					localField: "measurementIds",
					foreignField: "_id",
					as: "measurement",
				},
			},
			{
				$unwind: "$measurement",
			},
			{
				$group: {
					_id: "$measurement.type",
					average: {
						$avg: "$measurement.value",
					},
				},
			},
			{
				$group: {
					_id: null,
					averages: {
						$push: {
							type: "$_id",
							value: "$average",
						},
					},
				},
			},
			{
				$project: {
					_id: 0,
					temperature: {
						$round: [
							{
								$ifNull: [
									{
										$arrayElemAt: [
											{
												$map: {
													input: {
														$filter: {
															input: "$averages",
															as: "item",
															cond: {
																$eq: ["$$item.type", "temperature"],
															},
														},
													},
													as: "item",
													in: "$$item.value",
												},
											},
											0,
										],
									},
									null,
								],
							},
							2,
						],
					},
					humidity: {
						$round: [
							{
								$ifNull: [
									{
										$arrayElemAt: [
											{
												$map: {
													input: {
														$filter: {
															input: "$averages",
															as: "item",
															cond: {
																$eq: ["$$item.type", "humidity"],
															},
														},
													},
													as: "item",
													in: "$$item.value",
												},
											},
											0,
										],
									},
									null,
								],
							},
							2,
						],
					},
				},
			},
		]);

		return (
			result ?? {
				temperature: null,
				humidity: null,
			}
		);
	}
}
