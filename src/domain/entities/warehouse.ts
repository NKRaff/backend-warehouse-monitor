import type { MeasurementLimits } from "@domain/object-values/measurement-limits.js";
import type { StorageCategory } from "@domain/types/storage-category.js";
import type { StorageCondition } from "@domain/types/storage-condition.js";
import type { WarehouseStatus } from "@domain/types/warehouse-status.js";
import { UnprocessableEntityError } from "@shared/errors/unprocessable-entity-error.js";

type WarehouseProps = {
	readonly id: string;
	name: string;
	condition: StorageCondition;
	category: StorageCategory;
	status: WarehouseStatus;
	description: string;
	limits?: MeasurementLimits;
};

export class Warehouse {
	private constructor(private props: WarehouseProps) {
		if (this.props.name.length < 4) {
			throw new UnprocessableEntityError(
				"Nome do armazém deve ter no minimo 4 caracteres",
			);
		}
	}

	static create(
		props: Omit<WarehouseProps, "status"> &
			Partial<Pick<WarehouseProps, "description">>,
	): Warehouse {
		props.name = props.name.trim();

		return new Warehouse({
			...props,
			description: props.description.trim() ?? "No description",
			status: "inactive",
		});
	}

	static restore(props: WarehouseProps): Warehouse {
		return new Warehouse(props);
	}

	activate(): void {
		if (!this.props.limits) {
			throw new UnprocessableEntityError(
				"Não é possível ativar o monitoramento sem definir os limites",
			);
		}
		this.props.status = "active";
	}

	deactivate(): void {
		this.props.status = "inactive";
	}

	get id(): string {
		return this.props.id;
	}

	get name(): string {
		return this.props.name;
	}

	get condition(): StorageCondition {
		return this.props.condition;
	}

	get category(): StorageCategory {
		return this.props.category;
	}
	get status(): WarehouseStatus {
		return this.props.status;
	}
	get description(): string {
		return this.props.description;
	}
	get limits(): MeasurementLimits | undefined {
		return this.props.limits;
	}
}
