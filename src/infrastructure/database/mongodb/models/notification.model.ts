import { NotificationChannel } from "@domain/types/notification-channel.js";
import { type InferSchemaType, model, Schema } from "mongoose";

const notificationSchema = new Schema(
	{
		_id: { type: String, required: true },
		alertId: { type: String, required: true, ref: "Alert" },
		recipientId: { type: String, required: true, ref: "User" },
		channels: {
			type: [String],
			enum: Object.values(NotificationChannel),
			required: true,
		},
		createdAt: { type: Date, required: true },
		readedAt: { type: Date, required: false },
	},
	{
		timestamps: true,
	},
);

export const NotificationModel = model("Notification", notificationSchema);
export type NotificationDocument = InferSchemaType<typeof notificationSchema>;
