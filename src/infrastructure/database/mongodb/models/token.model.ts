import { TokenType } from "@domain/types/token-type.js";
import { type InferSchemaType, model, Schema } from "mongoose";

const tokenSchema = new Schema(
	{
		_id: { type: String, required: true },
		userId: { type: String, required: true, ref: "User" },
		type: { type: String, enum: Object.values(TokenType), required: true },
		valueHash: { type: String, required: true },
		expiresAt: { type: Date, required: true },
	},
	{
		timestamps: true,
	},
);

export const TokenModel = model("Token", tokenSchema);
export type TokenDocument = InferSchemaType<typeof tokenSchema>;
