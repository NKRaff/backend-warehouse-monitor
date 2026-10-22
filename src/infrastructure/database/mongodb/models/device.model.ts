import { DeviceStatus } from "@domain/types/device-status.js";
import { MonitoringStatus } from "@domain/types/monitoring-status.js";
import { type InferSchemaType, model, Schema } from "mongoose";

const deviceSchema = new Schema(
	{
		_id: { type: String, required: true },
		name: { type: String, required: true },
		warehouseId: { type: String, required: true, ref: "Warehouse" },
		lastMeasurementId: { type: String, required: true, ref: "Measurement" },
		deviceStatus: { type: Object.values(DeviceStatus), required: true },
		MonitoringStatus: { type: Object.values(MonitoringStatus), required: true },
	},
	{
		timestamps: false,
	},
);

export const DeviceModel = model("Device", deviceSchema);
export type DeviceDocument = InferSchemaType<typeof deviceSchema>;
