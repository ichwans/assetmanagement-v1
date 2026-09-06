CREATE TABLE public.user_banks (
	id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  bank_id uuid NOT NULL,
	account_holder_name varchar(32) NOT NULL,
	account_number varchar(32) NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
	deleted_at timestamptz NULL,
	CONSTRAINT user_banks_pkey PRIMARY KEY (id),
	CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id),
	CONSTRAINT fk_bank_id FOREIGN KEY (bank_id) REFERENCES banks(id)
);
CREATE INDEX idx_user_banks_deleted_at ON public.user_banks USING btree (deleted_at);
