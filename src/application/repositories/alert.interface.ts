import type { Alert } from "@domain/entities/alert.js";

export interface IAlertRepository {
	save(alert: Alert): Promise<void>;
}
