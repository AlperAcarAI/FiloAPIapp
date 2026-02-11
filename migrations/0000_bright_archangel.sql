CREATE TABLE "access_levels" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"code" varchar(20) NOT NULL,
	"hierarchy_level" integer NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "access_levels_name_unique" UNIQUE("name"),
	CONSTRAINT "access_levels_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "access_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "access_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "api_client_permissions" (
	"client_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"granted_by" integer,
	CONSTRAINT "api_client_permissions_client_id_permission_id_pk" PRIMARY KEY("client_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "api_clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"company_id" integer,
	"user_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_endpoints" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"endpoint" varchar(255) NOT NULL,
	"method" varchar(10) NOT NULL,
	"description" text,
	"required_permissions" text[],
	"rate_limit" integer DEFAULT 100,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_endpoints_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"key_hash" text NOT NULL,
	"key" text,
	"permissions" text[],
	"allowed_domains" text[] NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_rate_limit" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"endpoint_id" integer,
	"request_count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp DEFAULT now() NOT NULL,
	"window_end" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_request_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer,
	"api_key_id" integer,
	"user_id" integer,
	"endpoint_id" integer,
	"method" varchar(10) NOT NULL,
	"endpoint" varchar(255) NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"request_body" text,
	"response_status" integer,
	"response_time" integer,
	"error_message" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"user_id" integer,
	"token" text NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_usage_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"api_client_id" integer,
	"endpoint" varchar(255) NOT NULL,
	"method" varchar(10) NOT NULL,
	"status_code" integer NOT NULL,
	"response_time_ms" integer NOT NULL,
	"request_size_bytes" integer DEFAULT 0,
	"response_size_bytes" integer DEFAULT 0,
	"ip_address" varchar(45),
	"user_agent" text,
	"request_timestamp" timestamp DEFAULT now() NOT NULL,
	"error_message" text,
	"request_body_hash" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "api_usage_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"api_client_id" integer NOT NULL,
	"endpoint" varchar(255) NOT NULL,
	"method" varchar(10) NOT NULL,
	"usage_date" date NOT NULL,
	"total_requests" integer DEFAULT 0,
	"success_requests" integer DEFAULT 0,
	"error_requests" integer DEFAULT 0,
	"avg_response_time_ms" numeric(8, 2) DEFAULT '0',
	"min_response_time_ms" integer DEFAULT 0,
	"max_response_time_ms" integer DEFAULT 0,
	"total_data_transferred_bytes" bigint DEFAULT 0,
	CONSTRAINT "unique_api_stats" UNIQUE("api_client_id","endpoint","method","usage_date")
);
--> statement-breakpoint
CREATE TABLE "asset_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_id" integer NOT NULL,
	"personnel_id" integer,
	"doc_type_id" integer NOT NULL,
	"description" varchar(255),
	"doc_link" text,
	"upload_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"file_name" varchar(255),
	"file_size" integer,
	"mime_type" varchar(100),
	"file_hash" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" integer,
	"model_year" integer NOT NULL,
	"plate_number" varchar(20) NOT NULL,
	"chassis_no" varchar(50),
	"engine_no" varchar(50),
	"ownership_type_id" integer NOT NULL,
	"owner_company_id" integer,
	"register_no" varchar(50),
	"register_date" date,
	"purchase_date" date,
	"utts_no" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "assets_plate_number_unique" UNIQUE("plate_number")
);
--> statement-breakpoint
CREATE TABLE "assets_damage_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_id" integer NOT NULL,
	"personnel_id" integer,
	"damage_type_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"event_date" date NOT NULL,
	"amount_cents" integer NOT NULL,
	"documents" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"policy_id" integer,
	CONSTRAINT "amount_cents_check" CHECK (amount_cents >= 0)
);
--> statement-breakpoint
CREATE TABLE "assets_maintenance" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_id" integer NOT NULL,
	"maintenance_type_id" integer NOT NULL,
	"maintenance_date" date NOT NULL,
	"due_by_date" date,
	"km_reading" integer,
	"amount_cents" integer NOT NULL,
	"description" text,
	"service_provider" varchar(100),
	"warranty_until" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	CONSTRAINT "amount_cents_check" CHECK (amount_cents >= 0),
	CONSTRAINT "km_reading_check" CHECK (km_reading >= 0)
);
--> statement-breakpoint
CREATE TABLE "assets_personel_assignment" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_id" integer NOT NULL,
	"personnel_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets_policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_id" integer NOT NULL,
	"policy_type_id" integer NOT NULL,
	"seller_company_id" integer NOT NULL,
	"insurance_company_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"policy_number" varchar(100) NOT NULL,
	"amount_cents" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"pid" integer,
	CONSTRAINT "assets_policies_asset_id_policy_number_unique" UNIQUE("asset_id","policy_number"),
	CONSTRAINT "amount_cents_check" CHECK (amount_cents >= 0)
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_name" varchar(64) NOT NULL,
	"record_id" integer NOT NULL,
	"operation" varchar(10) NOT NULL,
	"old_values" text,
	"new_values" text,
	"changed_fields" text[],
	"user_id" integer,
	"api_client_id" integer,
	"ip_address" varchar(45),
	"user_agent" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "car_brands" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "car_brands_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "car_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"type_id" integer NOT NULL,
	"capacity" integer NOT NULL,
	"detail" text,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "car_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "car_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"country_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"tax_no" varchar(50),
	"tax_office" varchar(100),
	"address" varchar(255),
	"phone" varchar(50),
	"city_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "companies_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "company_type_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"type_id" integer NOT NULL,
	CONSTRAINT "company_type_matches_company_id_type_id_unique" UNIQUE("company_id","type_id")
);
--> statement-breakpoint
CREATE TABLE "company_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	CONSTRAINT "company_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"phone_code" varchar(10),
	CONSTRAINT "countries_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "damage_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "damage_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "doc_main_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "doc_main_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "doc_sub_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"main_type_id" integer NOT NULL,
	"name" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_required_for_personnel" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" varchar(20) NOT NULL,
	"entity_id" integer NOT NULL,
	"doc_type_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"file_path" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" integer,
	"mime_type" varchar(100),
	"file_hash" varchar(64),
	"uploaded_by" integer NOT NULL,
	"upload_date" timestamp DEFAULT now() NOT NULL,
	"validity_start_date" date,
	"validity_end_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "entity_type_check" CHECK (entity_type IN ('personnel', 'asset', 'company', 'work_area', 'operation'))
);
--> statement-breakpoint
CREATE TABLE "fin_accounts_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"fin_cur_ac_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"date" date NOT NULL,
	"payment_type_id" integer NOT NULL,
	"is_done" boolean DEFAULT false NOT NULL,
	"done_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fin_current_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_debit" boolean NOT NULL,
	"description" varchar(255),
	"payer_company_id" integer NOT NULL,
	"payee_company_id" integer NOT NULL,
	"amount_cents" integer NOT NULL,
	"transaction_date" date NOT NULL,
	"is_done" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"payment_method_id" integer,
	"payment_status" varchar(20) DEFAULT 'beklemede',
	"payment_reference" varchar(100),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fo_outage_process" (
	"id" serial PRIMARY KEY NOT NULL,
	"firm_id" integer NOT NULL,
	"processor_firm_id" integer NOT NULL,
	"cause_of_outage" text,
	"root_build_name" varchar(255),
	"root_build_code" varchar(100),
	"output_start_point" varchar(255),
	"start_date" date NOT NULL,
	"end_date" date,
	"start_clock" varchar(8),
	"end_clock" varchar(8),
	"area_of_outage" text,
	"supervisor_id" integer,
	"processor_supervisor" varchar(255),
	"worker_chef_id" integer,
	"pyp_id" integer,
	"status" varchar(20) DEFAULT 'planned' NOT NULL,
	"coordinat_x" varchar,
	"coordinat_y" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fo_outage_process_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"outage_process_id" integer NOT NULL,
	"asset_id" integer NOT NULL,
	CONSTRAINT "unique_outage_asset" UNIQUE("outage_process_id","asset_id")
);
--> statement-breakpoint
CREATE TABLE "fo_outage_process_personnels" (
	"id" serial PRIMARY KEY NOT NULL,
	"outage_process_id" integer NOT NULL,
	"personnel_id" integer NOT NULL,
	CONSTRAINT "unique_outage_personnel" UNIQUE("outage_process_id","personnel_id")
);
--> statement-breakpoint
CREATE TABLE "fuel_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_id" integer NOT NULL,
	"record_date" date NOT NULL,
	"current_kilometers" integer NOT NULL,
	"fuel_amount" numeric(8, 2) NOT NULL,
	"fuel_cost_cents" integer NOT NULL,
	"gas_station_name" varchar(100),
	"driver_id" integer,
	"notes" text,
	"receipt_number" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	CONSTRAINT "fuel_cost_cents_check" CHECK (fuel_cost_cents >= 0),
	CONSTRAINT "current_kilometers_check" CHECK (current_kilometers >= 0),
	CONSTRAINT "fuel_amount_check" CHECK (fuel_amount > 0)
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(150) NOT NULL,
	"ip_address" varchar(45) NOT NULL,
	"user_agent" text,
	"success" boolean DEFAULT false NOT NULL,
	"attempt_time" timestamp DEFAULT now() NOT NULL,
	"failure_reason" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "maintenance_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "maintenance_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "material_code_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"material_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	"company_material_code" varchar(100) NOT NULL,
	"company_material_name" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	CONSTRAINT "unique_material_company_mapping" UNIQUE("material_id","company_id")
);
--> statement-breakpoint
CREATE TABLE "material_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"parent_type_id" integer,
	"hierarchy_level" integer DEFAULT 0 NOT NULL,
	"full_path" varchar(500),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "material_units" (
	"id" serial PRIMARY KEY NOT NULL,
	"material_id" integer NOT NULL,
	"unit_id" integer NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"conversion_note" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	CONSTRAINT "unique_material_unit" UNIQUE("material_id","unit_id")
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type_id" integer,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	CONSTRAINT "materials_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ownership_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "ownership_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "password_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "payment_methods_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "payment_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "payment_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "penalties" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_id" integer NOT NULL,
	"driver_id" integer,
	"penalty_type_id" integer NOT NULL,
	"amount_cents" integer NOT NULL,
	"discounted_amount_cents" integer NOT NULL,
	"penalty_date" date NOT NULL,
	"last_date" date,
	"status" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "penalty_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(255),
	"penalty_score" integer NOT NULL,
	"amount_cents" integer NOT NULL,
	"discounted_amount_cents" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_date" date
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "personnel" (
	"id" serial PRIMARY KEY NOT NULL,
	"tc_no" bigint,
	"name" varchar(50) NOT NULL,
	"surname" varchar(50) NOT NULL,
	"birthdate" date,
	"nation_id" integer,
	"birthplace_id" integer,
	"address" varchar(255),
	"phone_no" varchar(50),
	"iban" varchar(34),
	"status" varchar(20),
	"company_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	CONSTRAINT "personnel_tc_no_unique" UNIQUE("tc_no")
);
--> statement-breakpoint
CREATE TABLE "personnel_access" (
	"id" serial PRIMARY KEY NOT NULL,
	"personnel_id" integer NOT NULL,
	"workarea_id" integer,
	"type_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	CONSTRAINT "unique_personnel_workarea_type" UNIQUE("personnel_id","workarea_id","type_id")
);
--> statement-breakpoint
CREATE TABLE "personnel_company_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"personnel_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	"position_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "personnel_company_matches_personnel_id_company_id_is_active_unique" UNIQUE("personnel_id","company_id","is_active")
);
--> statement-breakpoint
CREATE TABLE "personnel_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"personnel_id" integer NOT NULL,
	"doc_type_id" integer NOT NULL,
	"description" varchar(255),
	"doc_link" text,
	"upload_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"file_name" varchar(255),
	"file_size" integer,
	"mime_type" varchar(100),
	"file_hash" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "personnel_positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "personnel_positions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "personnel_stuff_matcher" (
	"id" serial PRIMARY KEY NOT NULL,
	"personnel_id" integer NOT NULL,
	"stuff_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "personnel_work_areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"personnel_id" integer NOT NULL,
	"work_area_id" integer NOT NULL,
	"position_id" integer NOT NULL,
	"project_id" integer,
	"start_date" date NOT NULL,
	"end_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "policy_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "policy_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "progress_payment_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"progress_payment_id" integer NOT NULL,
	"material_id" integer NOT NULL,
	"unit_id" integer NOT NULL,
	"quantity" numeric(12, 4) NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"line_total_cents" integer NOT NULL,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	CONSTRAINT "unique_payment_material" UNIQUE("progress_payment_id","material_id"),
	CONSTRAINT "check_quantity_positive" CHECK (quantity > 0),
	CONSTRAINT "check_unit_price" CHECK (unit_price_cents >= 0),
	CONSTRAINT "check_line_total" CHECK (line_total_cents >= 0)
);
--> statement-breakpoint
CREATE TABLE "progress_payment_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	CONSTRAINT "progress_payment_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "progress_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_number" varchar(50) NOT NULL,
	"payment_date" date NOT NULL,
	"team_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"pyp_id" integer,
	"payment_type_id" integer NOT NULL,
	"total_amount_cents" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"notes" text,
	"submitted_at" timestamp,
	"submitted_by" integer,
	"approved_at" timestamp,
	"approved_by" integer,
	"rejection_reason" text,
	"payment_date_actual" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	CONSTRAINT "progress_payments_payment_number_unique" UNIQUE("payment_number"),
	CONSTRAINT "idx_progress_payments_number" UNIQUE("payment_number"),
	CONSTRAINT "check_total_amount" CHECK (total_amount_cents >= 0),
	CONSTRAINT "check_status_value" CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'paid'))
);
--> statement-breakpoint
CREATE TABLE "project_pyps" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text,
	"status" varchar(20) DEFAULT 'planned' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "uniq_project_pyps_code" UNIQUE("project_id","code")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"po_company_id" integer NOT NULL,
	"pp_company_id" integer NOT NULL,
	"work_area_id" integer,
	"start_date" date NOT NULL,
	"end_date" date,
	"status" varchar(20) DEFAULT 'planned' NOT NULL,
	"city_id" integer,
	"project_total_price" numeric(15, 2),
	"completion_rate" numeric(5, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "projects_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "rate_limit_buckets" (
	"id" serial PRIMARY KEY NOT NULL,
	"identifier" varchar(100) NOT NULL,
	"bucket_type" varchar(20) NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp DEFAULT now() NOT NULL,
	"window_end" timestamp NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"blocked_until" timestamp,
	CONSTRAINT "unique_identifier_bucket" UNIQUE("identifier","bucket_type")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"revoked_at" timestamp,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "rental_agreements" (
	"id" serial PRIMARY KEY NOT NULL,
	"agreement_number" varchar(50) NOT NULL,
	"rental_company_id" integer NOT NULL,
	"tenant_company_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"is_short_term" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "rental_agreements_agreement_number_unique" UNIQUE("agreement_number")
);
--> statement-breakpoint
CREATE TABLE "rental_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"agreement_id" integer NOT NULL,
	"asset_id" integer NOT NULL,
	"mount_cents" integer NOT NULL,
	"vat_percent" numeric(5, 2) NOT NULL,
	"km_month_limit" integer NOT NULL,
	"km_total_limit" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "security_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"event_type" varchar(50) NOT NULL,
	"severity" varchar(10) DEFAULT 'medium' NOT NULL,
	"description" text NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"device_fingerprint" text,
	"location" text,
	"metadata" text,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_by" integer,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" text NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stuff" (
	"id" serial PRIMARY KEY NOT NULL,
	"stuff_code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"value" varchar(255),
	"type" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "stuff_stuff_code_unique" UNIQUE("stuff_code")
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"personnel_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	CONSTRAINT "check_member_dates" CHECK (end_date IS NULL OR end_date >= start_date)
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"company_id" integer NOT NULL,
	"supervisor_id" integer,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "trip_rentals" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_id" integer NOT NULL,
	"rental_company_id" integer NOT NULL,
	"driver_id" integer,
	"trip_date" date NOT NULL,
	"trip_start_time" varchar(5),
	"trip_end_time" varchar(5),
	"from_location" varchar(255) NOT NULL,
	"to_location" varchar(255) NOT NULL,
	"route_description" text,
	"distance_km" numeric(10, 2),
	"price_per_trip_cents" integer NOT NULL,
	"additional_costs_cents" integer DEFAULT 0,
	"total_amount_cents" integer NOT NULL,
	"trip_status" varchar(20) DEFAULT 'planned' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "unit_conversions" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_unit_id" integer NOT NULL,
	"to_unit_id" integer NOT NULL,
	"conversion_factor" numeric(10, 4) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	CONSTRAINT "unique_unit_conversion" UNIQUE("from_unit_id","to_unit_id"),
	CONSTRAINT "check_different_units" CHECK (from_unit_id != to_unit_id),
	CONSTRAINT "check_positive_factor" CHECK (conversion_factor > 0)
);
--> statement-breakpoint
CREATE TABLE "unit_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"material_id" integer NOT NULL,
	"unit_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	"price_cents" integer NOT NULL,
	"valid_from" date NOT NULL,
	"valid_until" date,
	"currency" varchar(3) DEFAULT 'TRY' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	CONSTRAINT "check_price_positive" CHECK (price_cents >= 0),
	CONSTRAINT "check_validity_dates" CHECK (valid_until IS NULL OR valid_until >= valid_from)
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"symbol" varchar(10),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	CONSTRAINT "units_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_access_rights" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"access_level_id" integer NOT NULL,
	"access_scope" text,
	"granted_by" integer,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_devices" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"device_fingerprint" text NOT NULL,
	"device_name" varchar(100),
	"device_type" varchar(20),
	"browser_info" text,
	"os_info" varchar(100),
	"screen_resolution" varchar(20),
	"timezone" varchar(50),
	"language" varchar(10),
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_trusted" boolean DEFAULT false NOT NULL,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"times_used" integer DEFAULT 1,
	CONSTRAINT "unique_user_device" UNIQUE("user_id","device_fingerprint")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "user_security_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"is_account_locked" boolean DEFAULT false NOT NULL,
	"lock_reason" varchar(100),
	"locked_at" timestamp,
	"locked_until" timestamp,
	"password_changed_at" timestamp DEFAULT now(),
	"email_verified" boolean DEFAULT false NOT NULL,
	"email_verify_token" text,
	"email_verify_expires" timestamp,
	"max_concurrent_sessions" integer DEFAULT 5,
	"require_password_change" boolean DEFAULT false NOT NULL,
	"last_password_check" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_security_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(150) NOT NULL,
	"password_hash" text NOT NULL,
	"company_id" integer NOT NULL,
	"personnel_id" integer,
	"department" varchar(50),
	"position_level" integer DEFAULT 1,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_personnel_id_unique" UNIQUE("personnel_id")
);
--> statement-breakpoint
CREATE TABLE "work_areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"city_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"address" varchar(255),
	"manager_id" integer,
	"start_date" date NOT NULL,
	"end_date" date,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_client_permissions" ADD CONSTRAINT "api_client_permissions_client_id_api_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."api_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_client_permissions" ADD CONSTRAINT "api_client_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_client_permissions" ADD CONSTRAINT "api_client_permissions_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_clients" ADD CONSTRAINT "api_clients_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_clients" ADD CONSTRAINT "api_clients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_client_id_api_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."api_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_rate_limit" ADD CONSTRAINT "api_rate_limit_client_id_api_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."api_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_rate_limit" ADD CONSTRAINT "api_rate_limit_endpoint_id_api_endpoints_id_fk" FOREIGN KEY ("endpoint_id") REFERENCES "public"."api_endpoints"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_request_logs" ADD CONSTRAINT "api_request_logs_client_id_api_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."api_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_request_logs" ADD CONSTRAINT "api_request_logs_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_request_logs" ADD CONSTRAINT "api_request_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_request_logs" ADD CONSTRAINT "api_request_logs_endpoint_id_api_endpoints_id_fk" FOREIGN KEY ("endpoint_id") REFERENCES "public"."api_endpoints"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_client_id_api_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."api_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_usage_logs" ADD CONSTRAINT "api_usage_logs_api_client_id_api_clients_id_fk" FOREIGN KEY ("api_client_id") REFERENCES "public"."api_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_usage_stats" ADD CONSTRAINT "api_usage_stats_api_client_id_api_clients_id_fk" FOREIGN KEY ("api_client_id") REFERENCES "public"."api_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_documents" ADD CONSTRAINT "asset_documents_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_documents" ADD CONSTRAINT "asset_documents_personnel_id_personnel_id_fk" FOREIGN KEY ("personnel_id") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_documents" ADD CONSTRAINT "asset_documents_doc_type_id_doc_sub_types_id_fk" FOREIGN KEY ("doc_type_id") REFERENCES "public"."doc_sub_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_documents" ADD CONSTRAINT "asset_documents_created_by_personnel_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_model_id_car_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."car_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_ownership_type_id_ownership_types_id_fk" FOREIGN KEY ("ownership_type_id") REFERENCES "public"."ownership_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_owner_company_id_companies_id_fk" FOREIGN KEY ("owner_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_created_by_personnel_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_updated_by_personnel_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets_damage_data" ADD CONSTRAINT "assets_damage_data_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets_damage_data" ADD CONSTRAINT "assets_damage_data_personnel_id_personnel_id_fk" FOREIGN KEY ("personnel_id") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets_damage_data" ADD CONSTRAINT "assets_damage_data_damage_type_id_damage_types_id_fk" FOREIGN KEY ("damage_type_id") REFERENCES "public"."damage_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets_damage_data" ADD CONSTRAINT "assets_damage_data_policy_id_assets_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."assets_policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets_maintenance" ADD CONSTRAINT "assets_maintenance_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets_maintenance" ADD CONSTRAINT "assets_maintenance_maintenance_type_id_maintenance_types_id_fk" FOREIGN KEY ("maintenance_type_id") REFERENCES "public"."maintenance_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets_maintenance" ADD CONSTRAINT "assets_maintenance_created_by_personnel_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets_maintenance" ADD CONSTRAINT "assets_maintenance_updated_by_personnel_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets_personel_assignment" ADD CONSTRAINT "assets_personel_assignment_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets_personel_assignment" ADD CONSTRAINT "assets_personel_assignment_personnel_id_personnel_id_fk" FOREIGN KEY ("personnel_id") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets_policies" ADD CONSTRAINT "assets_policies_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets_policies" ADD CONSTRAINT "assets_policies_policy_type_id_policy_types_id_fk" FOREIGN KEY ("policy_type_id") REFERENCES "public"."policy_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets_policies" ADD CONSTRAINT "assets_policies_seller_company_id_companies_id_fk" FOREIGN KEY ("seller_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets_policies" ADD CONSTRAINT "assets_policies_insurance_company_id_companies_id_fk" FOREIGN KEY ("insurance_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_api_client_id_api_clients_id_fk" FOREIGN KEY ("api_client_id") REFERENCES "public"."api_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_models" ADD CONSTRAINT "car_models_brand_id_car_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."car_brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_models" ADD CONSTRAINT "car_models_type_id_car_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."car_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_type_matches" ADD CONSTRAINT "company_type_matches_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_type_matches" ADD CONSTRAINT "company_type_matches_type_id_company_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."company_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doc_sub_types" ADD CONSTRAINT "doc_sub_types_main_type_id_doc_main_types_id_fk" FOREIGN KEY ("main_type_id") REFERENCES "public"."doc_main_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_doc_type_id_doc_sub_types_id_fk" FOREIGN KEY ("doc_type_id") REFERENCES "public"."doc_sub_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fin_accounts_details" ADD CONSTRAINT "fin_accounts_details_fin_cur_ac_id_fin_current_accounts_id_fk" FOREIGN KEY ("fin_cur_ac_id") REFERENCES "public"."fin_current_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fin_accounts_details" ADD CONSTRAINT "fin_accounts_details_payment_type_id_payment_types_id_fk" FOREIGN KEY ("payment_type_id") REFERENCES "public"."payment_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fin_current_accounts" ADD CONSTRAINT "fin_current_accounts_payer_company_id_companies_id_fk" FOREIGN KEY ("payer_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fin_current_accounts" ADD CONSTRAINT "fin_current_accounts_payee_company_id_companies_id_fk" FOREIGN KEY ("payee_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fin_current_accounts" ADD CONSTRAINT "fin_current_accounts_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fo_outage_process" ADD CONSTRAINT "fo_outage_process_firm_id_companies_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fo_outage_process" ADD CONSTRAINT "fo_outage_process_processor_firm_id_companies_id_fk" FOREIGN KEY ("processor_firm_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fo_outage_process" ADD CONSTRAINT "fo_outage_process_supervisor_id_personnel_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fo_outage_process" ADD CONSTRAINT "fo_outage_process_worker_chef_id_personnel_id_fk" FOREIGN KEY ("worker_chef_id") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fo_outage_process" ADD CONSTRAINT "fo_outage_process_pyp_id_project_pyps_id_fk" FOREIGN KEY ("pyp_id") REFERENCES "public"."project_pyps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fo_outage_process" ADD CONSTRAINT "fo_outage_process_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fo_outage_process" ADD CONSTRAINT "fo_outage_process_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fo_outage_process_assets" ADD CONSTRAINT "fo_outage_process_assets_outage_process_id_fo_outage_process_id_fk" FOREIGN KEY ("outage_process_id") REFERENCES "public"."fo_outage_process"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fo_outage_process_assets" ADD CONSTRAINT "fo_outage_process_assets_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fo_outage_process_personnels" ADD CONSTRAINT "fo_outage_process_personnels_outage_process_id_fo_outage_process_id_fk" FOREIGN KEY ("outage_process_id") REFERENCES "public"."fo_outage_process"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fo_outage_process_personnels" ADD CONSTRAINT "fo_outage_process_personnels_personnel_id_personnel_id_fk" FOREIGN KEY ("personnel_id") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuel_records" ADD CONSTRAINT "fuel_records_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuel_records" ADD CONSTRAINT "fuel_records_driver_id_personnel_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuel_records" ADD CONSTRAINT "fuel_records_created_by_personnel_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuel_records" ADD CONSTRAINT "fuel_records_updated_by_personnel_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_code_mappings" ADD CONSTRAINT "material_code_mappings_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_code_mappings" ADD CONSTRAINT "material_code_mappings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_code_mappings" ADD CONSTRAINT "material_code_mappings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_code_mappings" ADD CONSTRAINT "material_code_mappings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_types" ADD CONSTRAINT "material_types_parent_type_id_material_types_id_fk" FOREIGN KEY ("parent_type_id") REFERENCES "public"."material_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_types" ADD CONSTRAINT "material_types_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_types" ADD CONSTRAINT "material_types_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_units" ADD CONSTRAINT "material_units_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_units" ADD CONSTRAINT "material_units_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_units" ADD CONSTRAINT "material_units_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_units" ADD CONSTRAINT "material_units_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_type_id_material_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."material_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_history" ADD CONSTRAINT "password_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penalties" ADD CONSTRAINT "penalties_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penalties" ADD CONSTRAINT "penalties_driver_id_personnel_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penalties" ADD CONSTRAINT "penalties_penalty_type_id_penalty_types_id_fk" FOREIGN KEY ("penalty_type_id") REFERENCES "public"."penalty_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penalties" ADD CONSTRAINT "penalties_created_by_personnel_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penalties" ADD CONSTRAINT "penalties_updated_by_personnel_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel" ADD CONSTRAINT "personnel_nation_id_countries_id_fk" FOREIGN KEY ("nation_id") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel" ADD CONSTRAINT "personnel_birthplace_id_cities_id_fk" FOREIGN KEY ("birthplace_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel" ADD CONSTRAINT "personnel_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel" ADD CONSTRAINT "personnel_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel" ADD CONSTRAINT "personnel_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_access" ADD CONSTRAINT "personnel_access_personnel_id_personnel_id_fk" FOREIGN KEY ("personnel_id") REFERENCES "public"."personnel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_access" ADD CONSTRAINT "personnel_access_workarea_id_work_areas_id_fk" FOREIGN KEY ("workarea_id") REFERENCES "public"."work_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_access" ADD CONSTRAINT "personnel_access_type_id_access_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."access_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_access" ADD CONSTRAINT "personnel_access_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_company_matches" ADD CONSTRAINT "personnel_company_matches_personnel_id_personnel_id_fk" FOREIGN KEY ("personnel_id") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_company_matches" ADD CONSTRAINT "personnel_company_matches_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_company_matches" ADD CONSTRAINT "personnel_company_matches_position_id_personnel_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."personnel_positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_documents" ADD CONSTRAINT "personnel_documents_personnel_id_personnel_id_fk" FOREIGN KEY ("personnel_id") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_documents" ADD CONSTRAINT "personnel_documents_doc_type_id_doc_sub_types_id_fk" FOREIGN KEY ("doc_type_id") REFERENCES "public"."doc_sub_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_documents" ADD CONSTRAINT "personnel_documents_created_by_personnel_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_stuff_matcher" ADD CONSTRAINT "personnel_stuff_matcher_personnel_id_personnel_id_fk" FOREIGN KEY ("personnel_id") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_stuff_matcher" ADD CONSTRAINT "personnel_stuff_matcher_stuff_id_stuff_id_fk" FOREIGN KEY ("stuff_id") REFERENCES "public"."stuff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_work_areas" ADD CONSTRAINT "personnel_work_areas_personnel_id_personnel_id_fk" FOREIGN KEY ("personnel_id") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_work_areas" ADD CONSTRAINT "personnel_work_areas_work_area_id_work_areas_id_fk" FOREIGN KEY ("work_area_id") REFERENCES "public"."work_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_work_areas" ADD CONSTRAINT "personnel_work_areas_position_id_personnel_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."personnel_positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_work_areas" ADD CONSTRAINT "personnel_work_areas_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_work_areas" ADD CONSTRAINT "personnel_work_areas_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_work_areas" ADD CONSTRAINT "personnel_work_areas_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_payment_details" ADD CONSTRAINT "progress_payment_details_progress_payment_id_progress_payments_id_fk" FOREIGN KEY ("progress_payment_id") REFERENCES "public"."progress_payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_payment_details" ADD CONSTRAINT "progress_payment_details_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_payment_details" ADD CONSTRAINT "progress_payment_details_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_payment_details" ADD CONSTRAINT "progress_payment_details_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_payment_details" ADD CONSTRAINT "progress_payment_details_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_payment_types" ADD CONSTRAINT "progress_payment_types_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_payment_types" ADD CONSTRAINT "progress_payment_types_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_payments" ADD CONSTRAINT "progress_payments_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_payments" ADD CONSTRAINT "progress_payments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_payments" ADD CONSTRAINT "progress_payments_pyp_id_project_pyps_id_fk" FOREIGN KEY ("pyp_id") REFERENCES "public"."project_pyps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_payments" ADD CONSTRAINT "progress_payments_payment_type_id_progress_payment_types_id_fk" FOREIGN KEY ("payment_type_id") REFERENCES "public"."progress_payment_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_payments" ADD CONSTRAINT "progress_payments_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_payments" ADD CONSTRAINT "progress_payments_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_payments" ADD CONSTRAINT "progress_payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_payments" ADD CONSTRAINT "progress_payments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_pyps" ADD CONSTRAINT "project_pyps_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_pyps" ADD CONSTRAINT "project_pyps_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_pyps" ADD CONSTRAINT "project_pyps_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_po_company_id_companies_id_fk" FOREIGN KEY ("po_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_pp_company_id_companies_id_fk" FOREIGN KEY ("pp_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_work_area_id_work_areas_id_fk" FOREIGN KEY ("work_area_id") REFERENCES "public"."work_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_agreements" ADD CONSTRAINT "rental_agreements_rental_company_id_companies_id_fk" FOREIGN KEY ("rental_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_agreements" ADD CONSTRAINT "rental_agreements_tenant_company_id_companies_id_fk" FOREIGN KEY ("tenant_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_assets" ADD CONSTRAINT "rental_assets_agreement_id_rental_agreements_id_fk" FOREIGN KEY ("agreement_id") REFERENCES "public"."rental_agreements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_assets" ADD CONSTRAINT "rental_assets_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_personnel_id_personnel_id_fk" FOREIGN KEY ("personnel_id") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_supervisor_id_personnel_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_rentals" ADD CONSTRAINT "trip_rentals_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_rentals" ADD CONSTRAINT "trip_rentals_rental_company_id_companies_id_fk" FOREIGN KEY ("rental_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_rentals" ADD CONSTRAINT "trip_rentals_driver_id_personnel_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_rentals" ADD CONSTRAINT "trip_rentals_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_rentals" ADD CONSTRAINT "trip_rentals_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_conversions" ADD CONSTRAINT "unit_conversions_from_unit_id_units_id_fk" FOREIGN KEY ("from_unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_conversions" ADD CONSTRAINT "unit_conversions_to_unit_id_units_id_fk" FOREIGN KEY ("to_unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_conversions" ADD CONSTRAINT "unit_conversions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_conversions" ADD CONSTRAINT "unit_conversions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_prices" ADD CONSTRAINT "unit_prices_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_prices" ADD CONSTRAINT "unit_prices_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_prices" ADD CONSTRAINT "unit_prices_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_prices" ADD CONSTRAINT "unit_prices_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_prices" ADD CONSTRAINT "unit_prices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_prices" ADD CONSTRAINT "unit_prices_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_access_rights" ADD CONSTRAINT "user_access_rights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_access_rights" ADD CONSTRAINT "user_access_rights_access_level_id_access_levels_id_fk" FOREIGN KEY ("access_level_id") REFERENCES "public"."access_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_access_rights" ADD CONSTRAINT "user_access_rights_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_security_settings" ADD CONSTRAINT "user_security_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_personnel_id_personnel_id_fk" FOREIGN KEY ("personnel_id") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_areas" ADD CONSTRAINT "work_areas_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_areas" ADD CONSTRAINT "work_areas_manager_id_personnel_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."personnel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_api_rate_limit_client_endpoint" ON "api_rate_limit" USING btree ("client_id","endpoint_id");--> statement-breakpoint
CREATE INDEX "idx_api_rate_limit_window" ON "api_rate_limit" USING btree ("window_start","window_end");--> statement-breakpoint
CREATE INDEX "idx_api_logs_timestamp" ON "api_request_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_api_logs_client_endpoint" ON "api_request_logs" USING btree ("client_id","endpoint_id");--> statement-breakpoint
CREATE INDEX "idx_api_usage_client_id" ON "api_usage_logs" USING btree ("api_client_id");--> statement-breakpoint
CREATE INDEX "idx_api_usage_endpoint" ON "api_usage_logs" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "idx_api_usage_timestamp" ON "api_usage_logs" USING btree ("request_timestamp");--> statement-breakpoint
CREATE INDEX "idx_api_usage_status" ON "api_usage_logs" USING btree ("status_code");--> statement-breakpoint
CREATE INDEX "idx_api_stats_client_date" ON "api_usage_stats" USING btree ("api_client_id","usage_date");--> statement-breakpoint
CREATE INDEX "idx_api_stats_endpoint_date" ON "api_usage_stats" USING btree ("endpoint","usage_date");--> statement-breakpoint
CREATE INDEX "idx_assets_maintenance_asset_date" ON "assets_maintenance" USING btree ("asset_id","maintenance_date");--> statement-breakpoint
CREATE INDEX "idx_assets_maintenance_due_by_date" ON "assets_maintenance" USING btree ("due_by_date");--> statement-breakpoint
CREATE INDEX "idx_assets_maintenance_type" ON "assets_maintenance" USING btree ("maintenance_type_id");--> statement-breakpoint
CREATE INDEX "idx_audit_table_record" ON "audit_logs" USING btree ("table_name","record_id");--> statement-breakpoint
CREATE INDEX "idx_audit_user" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_timestamp" ON "audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_car_models_capacity" ON "car_models" USING btree ("capacity");--> statement-breakpoint
CREATE INDEX "idx_documents_entity" ON "documents" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_documents_file_hash" ON "documents" USING btree ("file_hash");--> statement-breakpoint
CREATE INDEX "idx_documents_upload_date" ON "documents" USING btree ("upload_date");--> statement-breakpoint
CREATE INDEX "idx_fo_outage_process_firm" ON "fo_outage_process" USING btree ("firm_id");--> statement-breakpoint
CREATE INDEX "idx_fo_outage_process_processor_firm" ON "fo_outage_process" USING btree ("processor_firm_id");--> statement-breakpoint
CREATE INDEX "idx_fo_outage_process_pyp" ON "fo_outage_process" USING btree ("pyp_id");--> statement-breakpoint
CREATE INDEX "idx_fo_outage_process_dates" ON "fo_outage_process" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_fo_outage_process_active" ON "fo_outage_process" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_fo_outage_assets_process" ON "fo_outage_process_assets" USING btree ("outage_process_id");--> statement-breakpoint
CREATE INDEX "idx_fo_outage_assets_asset" ON "fo_outage_process_assets" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "idx_fo_outage_personnels_process" ON "fo_outage_process_personnels" USING btree ("outage_process_id");--> statement-breakpoint
CREATE INDEX "idx_fo_outage_personnels_personnel" ON "fo_outage_process_personnels" USING btree ("personnel_id");--> statement-breakpoint
CREATE INDEX "idx_fuel_records_asset_date" ON "fuel_records" USING btree ("asset_id","record_date");--> statement-breakpoint
CREATE INDEX "idx_fuel_records_kilometers" ON "fuel_records" USING btree ("current_kilometers");--> statement-breakpoint
CREATE INDEX "idx_login_attempts_email" ON "login_attempts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_login_attempts_ip" ON "login_attempts" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "idx_login_attempts_time" ON "login_attempts" USING btree ("attempt_time");--> statement-breakpoint
CREATE INDEX "idx_material_mappings_material" ON "material_code_mappings" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "idx_material_mappings_company" ON "material_code_mappings" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_material_mappings_code" ON "material_code_mappings" USING btree ("company_material_code");--> statement-breakpoint
CREATE INDEX "idx_material_types_parent" ON "material_types" USING btree ("parent_type_id");--> statement-breakpoint
CREATE INDEX "idx_material_types_level" ON "material_types" USING btree ("hierarchy_level");--> statement-breakpoint
CREATE INDEX "idx_material_types_name" ON "material_types" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_material_types_active" ON "material_types" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_material_units_material" ON "material_units" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "idx_material_units_unit" ON "material_units" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "idx_material_units_active" ON "material_units" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_material_units_primary" ON "material_units" USING btree ("material_id","is_primary");--> statement-breakpoint
CREATE INDEX "idx_materials_code" ON "materials" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_materials_type" ON "materials" USING btree ("type_id");--> statement-breakpoint
CREATE INDEX "idx_materials_name" ON "materials" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_materials_active" ON "materials" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_password_history_user" ON "password_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_password_history_time" ON "password_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_personnel_access_personnel" ON "personnel_access" USING btree ("personnel_id");--> statement-breakpoint
CREATE INDEX "idx_personnel_access_workarea" ON "personnel_access" USING btree ("workarea_id");--> statement-breakpoint
CREATE INDEX "idx_personnel_access_type" ON "personnel_access" USING btree ("type_id");--> statement-breakpoint
CREATE INDEX "idx_personnel_work_areas_personnel" ON "personnel_work_areas" USING btree ("personnel_id");--> statement-breakpoint
CREATE INDEX "idx_personnel_work_areas_work_area" ON "personnel_work_areas" USING btree ("work_area_id");--> statement-breakpoint
CREATE INDEX "idx_personnel_work_areas_project" ON "personnel_work_areas" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_personnel_work_areas_active" ON "personnel_work_areas" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_payment_details_payment" ON "progress_payment_details" USING btree ("progress_payment_id");--> statement-breakpoint
CREATE INDEX "idx_payment_details_material" ON "progress_payment_details" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "idx_payment_details_unit" ON "progress_payment_details" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "idx_payment_types_name" ON "progress_payment_types" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_progress_payments_team_date" ON "progress_payments" USING btree ("team_id","payment_date");--> statement-breakpoint
CREATE INDEX "idx_progress_payments_project_date" ON "progress_payments" USING btree ("project_id","payment_date");--> statement-breakpoint
CREATE INDEX "idx_progress_payments_status" ON "progress_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_progress_payments_date" ON "progress_payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "idx_progress_payments_active" ON "progress_payments" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_project_pyps_project" ON "project_pyps" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_project_pyps_status" ON "project_pyps" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_projects_code" ON "projects" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_projects_po_company" ON "projects" USING btree ("po_company_id");--> statement-breakpoint
CREATE INDEX "idx_projects_pp_company" ON "projects" USING btree ("pp_company_id");--> statement-breakpoint
CREATE INDEX "idx_projects_work_area" ON "projects" USING btree ("work_area_id");--> statement-breakpoint
CREATE INDEX "idx_projects_status" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_projects_dates" ON "projects" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_rate_limit_identifier_bucket" ON "rate_limit_buckets" USING btree ("identifier","bucket_type");--> statement-breakpoint
CREATE INDEX "idx_rate_limit_window" ON "rate_limit_buckets" USING btree ("window_end");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_expires_at" ON "refresh_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_hash" ON "refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_rental_assets_vat_kmh" ON "rental_assets" USING btree ("vat_percent","km_month_limit");--> statement-breakpoint
CREATE INDEX "idx_security_events_user" ON "security_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_security_events_type" ON "security_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_security_events_severity" ON "security_events" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_security_events_time" ON "security_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_security_events_ip" ON "security_events" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "idx_team_members_team" ON "team_members" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_team_members_personnel" ON "team_members" USING btree ("personnel_id");--> statement-breakpoint
CREATE INDEX "idx_team_members_dates" ON "team_members" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_teams_company" ON "teams" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_teams_supervisor" ON "teams" USING btree ("supervisor_id");--> statement-breakpoint
CREATE INDEX "idx_teams_name" ON "teams" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_teams_active" ON "teams" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_trip_rentals_asset_date" ON "trip_rentals" USING btree ("asset_id","trip_date");--> statement-breakpoint
CREATE INDEX "idx_trip_rentals_company_date" ON "trip_rentals" USING btree ("rental_company_id","trip_date");--> statement-breakpoint
CREATE INDEX "idx_trip_rentals_status" ON "trip_rentals" USING btree ("trip_status");--> statement-breakpoint
CREATE INDEX "idx_unit_conversions_from" ON "unit_conversions" USING btree ("from_unit_id");--> statement-breakpoint
CREATE INDEX "idx_unit_conversions_to" ON "unit_conversions" USING btree ("to_unit_id");--> statement-breakpoint
CREATE INDEX "idx_unit_prices_material" ON "unit_prices" USING btree ("material_id");--> statement-breakpoint
CREATE INDEX "idx_unit_prices_unit" ON "unit_prices" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "idx_unit_prices_project" ON "unit_prices" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_unit_prices_company" ON "unit_prices" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_unit_prices_validity" ON "unit_prices" USING btree ("valid_from","valid_until");--> statement-breakpoint
CREATE INDEX "idx_unit_prices_active" ON "unit_prices" USING btree ("project_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_units_name" ON "units" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_units_is_active" ON "units" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_user_devices_user_id" ON "user_devices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_devices_fingerprint" ON "user_devices" USING btree ("device_fingerprint");