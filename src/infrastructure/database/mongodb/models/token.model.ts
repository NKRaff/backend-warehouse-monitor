import { type InferSchemaType, model, Schema } from "mongoose";

const tokenSchema = new Schema(
	{
		_id: { type: String, required: true },
		userId: { type: String, required: true, ref: "User" },
		type: { type: String, required: true },
		valueHash: { type: String, required: true },
		expiresAt: { type: Date, required: true },
	},
	{
		timestamps: true,
	},
);

export const TokenModel = model("Token", tokenSchema);
export type TokenDocument = InferSchemaType<typeof tokenSchema>;
