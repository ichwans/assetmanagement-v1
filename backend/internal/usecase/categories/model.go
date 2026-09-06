package categories

type (
	Category struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Slug        string `json:"slug"`
		Description string `json:"description"`
		Icon        string `json:"icon"`
	}

	Location struct {
		ID       string `json:"id"`
		Name     string `json:"name"`
		Building string `json:"building"`
		Floor    string `json:"floor"`
		Room     string `json:"room"`
	}
)
