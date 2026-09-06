CREATE TABLE public.banks (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
	"name" varchar(32) NOT NULL,
	"code" varchar(32) NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
	deleted_at timestamptz NULL,
	CONSTRAINT banks_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_banks_deleted_at ON public.banks USING btree (deleted_at);
