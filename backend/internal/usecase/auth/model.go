package auth

type (
	LoginReq struct {
		Email    string `json:"email" validate:"required,email"`
		Password string `json:"password" validate:"required,min=6"`
	}

	LoginRes struct {
		Token   string                 `json:"token"`
		Expires int64                  `json:"expires"`
		Profile map[string]interface{} `json:"profile"`
	}
)
