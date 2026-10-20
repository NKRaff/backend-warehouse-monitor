import { UserRole } from "@domain/types/user-role.js";
import { type InferSchemaType, model, Schema } from "mongoose";

const userSchema = new Schema(
	{
		_id: { type: String, required: true },
		name: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		role: { type: String, enum: Object.values(UserRole), required: true },
		emailVerified: { type: Boolean, required: true, default: false },
		deletedAt: { type: Date, require: false },
	},
	{
		timestamps: true,
	},
);

export const UserModel = model("User", userSchema);
export type UserDocument = InferSchemaType<typeof userSchema>;
