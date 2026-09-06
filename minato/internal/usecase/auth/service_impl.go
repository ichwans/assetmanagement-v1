package auth

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gitlab.com/riski/internal/domain/entities"
	"gitlab.com/riski/internal/domain/repositories"
	"gitlab.com/riski/internal/pkg/constants"
	"gitlab.com/riski/internal/pkg/log"
	"gitlab.com/riski/internal/pkg/mail"
	"gitlab.com/riski/internal/config"
	util "gitlab.com/riski/internal/pkg/utils"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type service struct{ userRepository repositories.User }

func NewService(userRepository repositories.User) *service {
	return &service{userRepository: userRepository}
}

func (s *service) Login(ctx context.Context, req LoginReq) (res constants.DefaultResponse, err error) {
	log.Info(ctx, "[USECASE] auth.Login - START", "email", req.Email)

	usr, count, err := s.userRepository.GetAllUser(ctx, entities.GetUsersReq{
		Limit: 10,
		Page:  1,
	})

	log.Info(ctx, "[USECASE] auth.Login - Fetched users", "count", count, "users", usr)

	email := strings.TrimSpace(req.Email)
	if email == "" || len(req.Password) < 6 {
		log.Info(ctx, "[USECASE] auth.Login - Invalid input", "email_empty", email == "", "password_too_short", len(req.Password) < 6)
		res = constants.DefaultResponse{Status: constants.STATUS_INVALID_REQUEST_FORMAT, Message: constants.MESSAGE_INVALID_REQUEST_FORMAT, Data: nil}
		return res, nil
	}

	// Verify credential from DB
	log.Info(ctx, "[USECASE] auth.Login - Fetching user credential", "email", email)
	cred, err := s.userRepository.GetUserCredentialByEmail(ctx, email)
	if err != nil {
		log.Error(ctx, "[USECASE] auth.Login - Error fetching credential", err.Error())
	}
	if err != nil || cred == nil || !util.CheckPasswordHash(cred.PasswordHash, req.Password) {
		log.Info(ctx, "[USECASE] auth.Login - Auth failed", "cred_nil", cred == nil, "password_mismatch", cred != nil && !util.CheckPasswordHash(cred.PasswordHash, req.Password))
		res = constants.DefaultResponse{Status: constants.STATUS_UNAUTHORIZED, Message: constants.MESSAGE_UNAUTHORIZED, Data: nil}
		return res, nil
	}

	log.Info(ctx, "[USECASE] auth.Login - Fetching user detail", "email", email)
	userDetail, err := s.userRepository.GetUserByEmail(ctx, email)
	if err != nil || userDetail == nil {
		log.Info(ctx, "[USECASE] auth.Login - User detail not found", "email", email)
		res = constants.DefaultResponse{Status: constants.STATUS_UNAUTHORIZED, Message: constants.MESSAGE_UNAUTHORIZED, Data: nil}
		return res, nil
	}

	log.Info(ctx, "[USECASE] auth.Login - Generating JWT token", "user_id", userDetail.ID.Hex())
	tokenId := userDetail.ID.Hex()
	token, exp, err := util.JwtSign(tokenId, email, userDetail.UserType)
	if err != nil {
		log.Error(ctx, "[USECASE] auth.Login - JWT sign error", err.Error())
		res = constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: nil}
		return res, nil
	}
	payload := LoginRes{
		Token:   token,
		Expires: exp,
		Profile: map[string]interface{}{"email": email, "role": userDetail.UserType},
	}

	log.Info(ctx, "[USECASE] auth.Login - SUCCESS", "user_type", userDetail.UserType)
	res = constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: payload}
	return
}

func (s *service) Me(ctx context.Context) (res constants.DefaultResponse, err error) {
	log.Info(ctx, "[USECASE] auth.Me - START")

	p := util.GetProfile(ctx)
	if p.Email == "" {
		log.Info(ctx, "[USECASE] auth.Me - No email in profile")
		res = constants.DefaultResponse{Status: constants.STATUS_UNAUTHORIZED, Message: constants.MESSAGE_UNAUTHORIZED, Data: nil}
		return res, nil
	}

	log.Info(ctx, "[USECASE] auth.Me - Profile found", "email", p.Email, "id", p.ID)

	userId, err := primitive.ObjectIDFromHex(p.ID)
	if err != nil {
		log.Error(ctx, "[USECASE] auth.Me - Invalid user ID format", "id", p.ID, "error", err.Error())
		res = constants.DefaultResponse{Status: constants.STATUS_UNAUTHORIZED, Message: constants.MESSAGE_UNAUTHORIZED, Data: nil}
		return res, nil
	}

	log.Info(ctx, "[USECASE] auth.Me - Fetching user by ID", "user_id", userId.Hex())
	userDetail, err := s.userRepository.GetUserByID(ctx, userId)
	if err != nil {
		log.Error(ctx, "[USECASE] auth.Me - Error fetching user", err.Error())
	}
	if err != nil || userDetail == nil {
		log.Info(ctx, "[USECASE] auth.Me - User not found", "id", p.ID)
		res = constants.DefaultResponse{Status: constants.STATUS_UNAUTHORIZED, Message: constants.MESSAGE_UNAUTHORIZED, Data: nil}
		return res, nil
	}

	mapData := map[string]interface{}{
		"id":    userDetail.ID,
		"email": userDetail.Email,
		"role":  userDetail.UserType,
	}

	log.Info(ctx, "[USECASE] auth.Me - SUCCESS", "email", userDetail.Email, "role", userDetail.UserType)
	res = constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: mapData}
	return
}

// ForgotPassword generates a reset token and (in real deployment) sends an email.
func (s *service) ForgotPassword(ctx context.Context, req ForgotPasswordReq) (res constants.DefaultResponse, err error) {
	log.Info(ctx, "[USECASE] auth.ForgotPassword - START", "email", req.Email)
	// additional entry to make sure this method hits log file
	log.Info(ctx, "[USECASE] auth.ForgotPassword - entered service")

	email := strings.TrimSpace(req.Email)
	if email == "" {
		res = constants.DefaultResponse{Status: constants.STATUS_INVALID_REQUEST_FORMAT, Message: constants.MESSAGE_INVALID_REQUEST_FORMAT, Data: nil}
		return res, nil
	}

	user, err := s.userRepository.GetUserByEmail(ctx, email)
	if err != nil {
		log.Error(ctx, "[USECASE] auth.ForgotPassword - repo error", err.Error())
	}
	if user == nil {
		// inform caller that the address isn't registered
		log.Info(ctx, "[USECASE] auth.ForgotPassword - email not found")
		res = constants.DefaultResponse{Status: constants.STATUS_NO_DATA, Message: "Email tidak terdaftar", Data: nil}
		return res, nil
	}

	// create token and persist
	token := uuid.NewString()
	expires := time.Now().Add(1 * time.Hour)
	if err := s.userRepository.SetResetToken(ctx, email, token, expires); err != nil {
		log.Error(ctx, "[USECASE] auth.ForgotPassword - unable to save token", err.Error())
	}

	// send reset link by email
	frontend := config.GetString("frontend.url")
	if frontend == "" {
		frontend = "http://localhost:3000"
	}
	resetLink := fmt.Sprintf("%s/reset-password?token=%s", strings.TrimRight(frontend, "/"), token)
	subject := "Instruksi Reset Password Asset Hub"
	body := fmt.Sprintf("Silakan klik tautan berikut untuk mereset password Anda:\n\n%s\n\nJika Anda tidak meminta reset, abaikan email ini.", resetLink)
	if err := mail.Send(email, subject, body); err != nil {
		log.Error(ctx, "[USECASE] auth.ForgotPassword - email send error", err.Error())
	} else {
		log.Info(ctx, "[USECASE] auth.ForgotPassword - email sent", "to", email)
	}

	res = constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: nil}
	return
}

// ResetPassword validates token and updates the password.
func (s *service) ResetPassword(ctx context.Context, req ResetPasswordReq) (res constants.DefaultResponse, err error) {
	log.Info(ctx, "[USECASE] auth.ResetPassword - START")

	if req.Token == "" || len(req.Password) < 6 {
		res = constants.DefaultResponse{Status: constants.STATUS_INVALID_REQUEST_FORMAT, Message: constants.MESSAGE_INVALID_REQUEST_FORMAT, Data: nil}
		return res, nil
	}

	email, err := s.userRepository.GetEmailByResetToken(ctx, req.Token)
	if err != nil || email == "" {
		log.Info(ctx, "[USECASE] auth.ResetPassword - invalid token")
		res = constants.DefaultResponse{Status: constants.STATUS_UNAUTHORIZED, Message: "Token tidak valid atau sudah kadaluarsa", Data: nil}
		return res, nil
	}

	hashed, _ := util.HashPassword(req.Password)
	if err := s.userRepository.UpdateUserPasswordByEmail(ctx, email, hashed); err != nil {
		log.Error(ctx, "[USECASE] auth.ResetPassword - update password failed", err.Error())
	}
	// consume token so it cannot be reused
	if err := s.userRepository.ClearResetToken(ctx, req.Token); err != nil {
		log.Error(ctx, "[USECASE] auth.ResetPassword - clear token failed", err.Error())
	}

	res = constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: nil}
	return
}
