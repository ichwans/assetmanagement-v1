package dashboard

type (
	Stats struct {
		TotalAssets       int     `json:"totalAssets"`
		ActiveAssets      int     `json:"activeAssets"`
		BorrowedAssets    int     `json:"borrowedAssets"`
		MaintenanceAssets int     `json:"maintenanceAssets"`
		DisposedAssets    int     `json:"disposedAssets"`
		TotalValue        float64 `json:"totalValue"`
	}

	CategoryCount struct {
		Slug  string `json:"slug"`
		Name  string `json:"name"`
		Count int    `json:"count"`
	}
)
