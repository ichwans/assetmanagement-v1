package user

import (
	"context"
	"strconv"
	"strings"

	"gitlab.com/riski/internal/domain/entities"
	"gitlab.com/riski/internal/domain/repositories"
	"gitlab.com/riski/internal/pkg/constants"
	"gitlab.com/riski/internal/pkg/log"
	"gitlab.com/riski/internal/pkg/utils"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type service struct {
	userRepo repositories.User
}

func NewService(
	userRepo repositories.User,
) *service {
	return &service{
		userRepo: userRepo,
	}
}

func (s *service) GetAllUser(ctx context.Context, req GetUsersReq) (res constants.DefaultResponse, err error) {
	log.Info(ctx, "[USECASE] user.GetAllUser - START", "page", req.Page, "limit", req.Limit, "state", req.State)

	profile := utils.GetProfile(ctx)
	if profile.Email == "" {
		log.Info(ctx, "[USECASE] user.GetAllUser - Unauthorized, no email in profile")
		res = constants.DefaultResponse{
			Status:  constants.STATUS_UNAUTHORIZED,
			Message: "Unauthorized",
			Data:    nil,
		}
		return res, nil
	}

	limit, err := strconv.Atoi(req.Limit)
	if err != nil {
		log.Error(ctx, "[USECASE] user.GetAllUser - Invalid limit value", "limit", req.Limit, "error", err.Error())
		res = constants.DefaultResponse{
			Status:  constants.STATUS_INVALID_REQUEST_FORMAT,
			Message: "Invalid value of limit parameter",
			Data:    nil,
		}

		return res, nil
	}
	page, err := strconv.Atoi(req.Page)
	if err != nil {
		log.Error(ctx, "[USECASE] user.GetAllUser - Invalid page value", "page", req.Page, "error", err.Error())
		res = constants.DefaultResponse{
			Status:  constants.STATUS_INVALID_REQUEST_FORMAT,
			Message: "Invalid value of page parameter",
			Data:    nil,
		}

		return res, nil
	}

	if req.State != "" {
		validStates := map[string]bool{
			constants.USER_STATE_ACTIVE:   true,
			constants.USER_STATE_INACTIVE: true,
			constants.USER_STATE_BANNED:   true,
		}
		if !validStates[strings.ToLower(req.State)] {
			log.Info(ctx, "[USECASE] user.GetAllUser - Invalid state value", "state", req.State)
			res = constants.DefaultResponse{
				Status:  constants.STATUS_INVALID_REQUEST_FORMAT,
				Message: "Invalid value of state parameter",
				Data:    nil,
			}
			return res, nil
		}
	}

	getUserReq := entities.GetUsersReq{
		Id:     req.Id,
		Status: req.Status,
		IdType: req.IdType,
		Limit:  limit,
		Page:   page,
		Name:   req.Name,
		State:  req.State,
	}

	log.Info(ctx, "[USECASE] user.GetAllUser - Fetching from repository")
	docs, count, err := s.userRepo.GetAllUser(ctx, getUserReq)
	if err != nil {
		log.Error(ctx, "[USECASE] user.GetAllUser - Repository error", err.Error())
		res = constants.DefaultResponse{
			Status:  constants.STATUS_NO_DATA,
			Message: constants.MESSAGE_DATA_NOT_FOUND,
			Data:    make([]string, 0),
		}

		return res, nil
	}

	log.Info(ctx, "[USECASE] user.GetAllUser - SUCCESS", "total_count", count, "returned_count", len(docs))
	res = constants.DefaultResponse{
		Status:  constants.STATUS_SUCCESS,
		Message: constants.MESSAGE_SUCCESS,
		Data:    utils.GetPaginationResponse(docs, count, utils.PaginationParam{Page: uint(page), Limit: uint(limit)}),
	}
	return
}

func (s *service) GetUserDetail(ctx context.Context, req GetUserDetailReq) (res constants.DefaultResponse, err error) {
	log.Info(ctx, "[USECASE] user.GetUserDetail - START", "id", req.Id)

	// Basic validation (echo validator also enforces required tag in handler)
	if strings.TrimSpace(req.Id) == "" {
		log.Info(ctx, "[USECASE] user.GetUserDetail - Empty user ID")
		res = constants.DefaultResponse{
			Status:  constants.STATUS_INVALID_REQUEST_FORMAT,
			Message: "Invalid user id",
			Data:    nil,
		}
		return res, nil
	}

	userId, err := primitive.ObjectIDFromHex(strings.TrimSpace(req.Id))
	if err != nil {
		log.Error(ctx, "[USECASE] user.GetUserDetail - Invalid ObjectID format", "id", req.Id, "error", err.Error())
		res = constants.DefaultResponse{
			Status:  constants.STATUS_INVALID_REQUEST_FORMAT,
			Message: "Invalid user id format",
			Data:    nil,
		}
		return res, nil
	}

	log.Info(ctx, "[USECASE] user.GetUserDetail - Fetching from repository", "user_id", userId.Hex())
	doc, err := s.userRepo.GetUserByID(ctx, userId)
	if err != nil {
		log.Error(ctx, "[USECASE] user.GetUserDetail - Repository error", err.Error())
		res = constants.DefaultResponse{
			Status:  constants.STATUS_SERVER_ERROR,
			Message: constants.MESSAGE_SERVER_ERROR,
			Data:    nil,
		}
		return res, nil
	}
	if doc == nil {
		log.Info(ctx, "[USECASE] user.GetUserDetail - User not found", "id", req.Id)
		res = constants.DefaultResponse{
			Status:  constants.STATUS_NO_DATA,
			Message: constants.MESSAGE_DATA_NOT_FOUND,
			Data:    struct{}{},
		}
		return res, nil
	}

	log.Info(ctx, "[USECASE] user.GetUserDetail - SUCCESS", "email", doc.Email)
	res = constants.DefaultResponse{
		Status:  constants.STATUS_SUCCESS,
		Message: constants.MESSAGE_SUCCESS,
		Data:    doc,
	}
	return
}

func (s *service) ChangeStatus(ctx context.Context, req ChangeStatusReq) (res constants.DefaultResponse, err error) {
	log.Info(ctx, "[USECASE] user.ChangeStatus - START", "user_id", req.Id, "status", req.Status)

	profile := utils.GetProfile(ctx)
	if profile.Email == "" {
		log.Info(ctx, "[USECASE] user.ChangeStatus - Unauthorized, no email in profile")
		res = constants.DefaultResponse{
			Status:  constants.STATUS_UNAUTHORIZED,
			Message: constants.MESSAGE_UNAUTHORIZED,
			Data:    nil,
		}
		return res, nil
	}

	// RBAC: only admin-like users may change status
	log.Info(ctx, "[USECASE] user.ChangeStatus - Checking RBAC", "actor_email", profile.Email)
	if cred, _ := s.userRepo.GetUserCredentialByEmail(ctx, profile.Email); cred != nil {
		role := strings.ToLower(cred.UserType)
		if role != "admin" && role != "admin_asset" {
			log.Info(ctx, "[USECASE] user.ChangeStatus - Forbidden, role not allowed", "role", role)
			res = constants.DefaultResponse{Status: constants.STATUS_FORBIDDEN, Message: constants.MESSAGE_FORBIDDEN, Data: nil}
			return res, nil
		}
	}

	id := strings.TrimSpace(req.Id)
	if id == "" {
		log.Info(ctx, "[USECASE] user.ChangeStatus - Empty user ID")
		res = constants.DefaultResponse{
			Status:  constants.STATUS_INVALID_REQUEST_FORMAT,
			Message: "Invalid user id",
			Data:    nil,
		}
		return res, nil
	}

	// Normalize and validate status
	st := strings.ToLower(strings.TrimSpace(req.Status))
	valid := map[string]bool{
		constants.USER_STATE_ACTIVE:   true,
		constants.USER_STATE_INACTIVE: true,
		constants.USER_STATE_BANNED:   true,
	}
	if !valid[st] {
		log.Info(ctx, "[USECASE] user.ChangeStatus - Invalid status value", "status", req.Status)
		res = constants.DefaultResponse{
			Status:  constants.STATUS_INVALID_REQUEST_FORMAT,
			Message: "Invalid status value",
			Data:    nil,
		}
		return res, nil
	}

	log.Info(ctx, "[USECASE] user.ChangeStatus - Updating status in repository", "user_id", id, "new_status", st)
	if err = s.userRepo.UpdateUserStatus(ctx, id, st, req.Reason, profile.Email); err != nil {
		log.Error(ctx, "[USECASE] user.ChangeStatus - Repository error", err.Error())
		res = constants.DefaultResponse{
			Status:  constants.STATUS_SERVER_ERROR,
			Message: constants.MESSAGE_SERVER_ERROR,
			Data:    nil,
		}
		return res, nil
	}

	log.Info(ctx, "[USECASE] user.ChangeStatus - SUCCESS")
	res = constants.DefaultResponse{
		Status:  constants.STATUS_SUCCESS,
		Message: constants.MESSAGE_SUCCESS,
		Data:    struct{}{},
	}
	return
}

func (s *service) GetUserByEmail(ctx context.Context, email string) (doc *entities.User, err error) {
	return s.userRepo.GetUserByEmail(ctx, email)
}

func (s *service) GetUserCredentialByEmail(ctx context.Context, email string) (cred *entities.UserCredential, err error) {
	return s.userRepo.GetUserCredentialByEmail(ctx, email)
}

func (s *service) CreateUser(ctx context.Context, req CreateUserReq) (res constants.DefaultResponse, err error) {
	log.Info(ctx, "[USECASE] user.CreateUser - START", "email", req.Email, "user_type", req.UserType)

	profile := utils.GetProfile(ctx)
	if profile.Email == "" {
		log.Info(ctx, "[USECASE] user.CreateUser - Unauthorized, no email in profile")
		res = constants.DefaultResponse{Status: constants.STATUS_UNAUTHORIZED, Message: constants.MESSAGE_UNAUTHORIZED, Data: nil}
		return res, nil
	}

	// RBAC: only admin-like users may create
	log.Info(ctx, "[USECASE] user.CreateUser - Checking RBAC", "actor_email", profile.Email)
	if cred, _ := s.userRepo.GetUserCredentialByEmail(ctx, profile.Email); cred != nil {
		role := strings.ToLower(cred.UserType)
		if role != "admin" && role != "admin_asset" {
			log.Info(ctx, "[USECASE] user.CreateUser - Forbidden, role not allowed", "role", role)
			res = constants.DefaultResponse{Status: constants.STATUS_FORBIDDEN, Message: constants.MESSAGE_FORBIDDEN, Data: nil}
			return res, nil
		}
	}

	// Basic validation beyond echo tags
	email := strings.TrimSpace(req.Email)
	if email == "" || len(req.Password) < 8 || len(req.FullName) < 2 {
		log.Info(ctx, "[USECASE] user.CreateUser - Validation failed", "email_empty", email == "", "password_short", len(req.Password) < 8, "fullname_short", len(req.FullName) < 2)
		res = constants.DefaultResponse{Status: constants.STATUS_INVALID_REQUEST_FORMAT, Message: constants.MESSAGE_INVALID_REQUEST_FORMAT, Data: nil}
		return res, nil
	}

	// Prevent duplicate
	log.Info(ctx, "[USECASE] user.CreateUser - Checking duplicate email", "email", email)
	if exist, _ := s.userRepo.GetUserByEmail(ctx, email); exist != nil {
		log.Info(ctx, "[USECASE] user.CreateUser - Email already exists", "email", email)
		res = constants.DefaultResponse{Status: constants.STATUS_CONFLICT, Message: constants.MESSAGE_CONFLICT, Data: nil}
		return res, nil
	}

	// Hash password
	log.Info(ctx, "[USECASE] user.CreateUser - Hashing password")
	hashed, hashErr := utils.HashPassword(req.Password)
	if hashErr != nil {
		log.Error(ctx, "[USECASE] user.CreateUser - Hash password error", hashErr.Error())
		res = constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: nil}
		return res, nil
	}

	log.Info(ctx, "[USECASE] user.CreateUser - Inserting to repository")
	err = s.userRepo.CreateUser(ctx, entities.UserCredential{
		Email:        email,
		PasswordHash: hashed,
		UserType:     strings.ToLower(req.UserType),
		FullName:     req.FullName,
	})
	if err != nil {
		log.Error(ctx, "[USECASE] user.CreateUser - Repository error", err.Error())
		res = constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: nil}
		return res, nil
	}

	log.Info(ctx, "[USECASE] user.CreateUser - SUCCESS", "email", email)
	res = constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: map[string]interface{}{"email": email, "userType": strings.ToLower(req.UserType)}}
	return
}

func (s *service) UpdateUser(ctx context.Context, req UpdateUserReq) (res constants.DefaultResponse, err error) {
	log.Info(ctx, "[USECASE] user.UpdateUser - START", "user_id", req.Id)

	profile := utils.GetProfile(ctx)
	if profile.Email == "" {
		log.Info(ctx, "[USECASE] user.UpdateUser - Unauthorized, no email in profile")
		res = constants.DefaultResponse{Status: constants.STATUS_UNAUTHORIZED, Message: constants.MESSAGE_UNAUTHORIZED, Data: nil}
		return res, nil
	}

	// RBAC: only admin-like users may update profile
	log.Info(ctx, "[USECASE] user.UpdateUser - Checking RBAC", "actor_email", profile.Email)
	if cred, _ := s.userRepo.GetUserCredentialByEmail(ctx, profile.Email); cred != nil {
		role := strings.ToLower(cred.UserType)
		if role != "admin" && role != "admin_asset" {
			log.Info(ctx, "[USECASE] user.UpdateUser - Forbidden, role not allowed", "role", role)
			res = constants.DefaultResponse{Status: constants.STATUS_FORBIDDEN, Message: constants.MESSAGE_FORBIDDEN, Data: nil}
			return res, nil
		}
	}

	id := strings.TrimSpace(req.Id)
	fullName := strings.TrimSpace(req.FullName)
	userType := strings.ToLower(strings.TrimSpace(req.UserType))
	if id == "" || (fullName == "" && userType == "") {
		log.Info(ctx, "[USECASE] user.UpdateUser - Validation failed", "id_empty", id == "", "no_updates", fullName == "" && userType == "")
		res = constants.DefaultResponse{Status: constants.STATUS_INVALID_REQUEST_FORMAT, Message: constants.MESSAGE_INVALID_REQUEST_FORMAT, Data: nil}
		return res, nil
	}

	if userType != "" {
		valid := map[string]bool{"admin": true, "user": true, "auditor": true, "head_unit": true, "purchasing": true, "admin_asset": true}
		if !valid[userType] {
			log.Info(ctx, "[USECASE] user.UpdateUser - Invalid userType", "user_type", userType)
			res = constants.DefaultResponse{Status: constants.STATUS_INVALID_REQUEST_FORMAT, Message: "Invalid userType value", Data: nil}
			return res, nil
		}
	}

	log.Info(ctx, "[USECASE] user.UpdateUser - Updating in repository", "user_id", id, "full_name", fullName, "user_type", userType)
	if err = s.userRepo.UpdateUserProfile(ctx, id, fullName, userType, profile.Email); err != nil {
		log.Error(ctx, "[USECASE] user.UpdateUser - Repository error", err.Error())
		res = constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: nil}
		return res, nil
	}

	log.Info(ctx, "[USECASE] user.UpdateUser - SUCCESS")
	res = constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: struct{}{}}
	return
}

func (s *service) ChangeMyPassword(ctx context.Context, req ChangePasswordReq) (res constants.DefaultResponse, err error) {
	log.Info(ctx, "[USECASE] user.ChangeMyPassword - START")

	profile := utils.GetProfile(ctx)
	if profile.Email == "" {
		log.Info(ctx, "[USECASE] user.ChangeMyPassword - Unauthorized, no email in profile")
		return constants.DefaultResponse{Status: constants.STATUS_UNAUTHORIZED, Message: constants.MESSAGE_UNAUTHORIZED, Data: nil}, nil
	}

	log.Info(ctx, "[USECASE] user.ChangeMyPassword - Validating password length", "email", profile.Email)
	if len(req.NewPassword) < 8 || len(req.CurrentPassword) < 6 {
		log.Info(ctx, "[USECASE] user.ChangeMyPassword - Password validation failed", "new_password_short", len(req.NewPassword) < 8, "current_password_short", len(req.CurrentPassword) < 6)
		return constants.DefaultResponse{Status: constants.STATUS_INVALID_REQUEST_FORMAT, Message: constants.MESSAGE_INVALID_REQUEST_FORMAT, Data: nil}, nil
	}

	log.Info(ctx, "[USECASE] user.ChangeMyPassword - Fetching credential")
	cred, err := s.userRepo.GetUserCredentialByEmail(ctx, profile.Email)
	if err != nil {
		log.Error(ctx, "[USECASE] user.ChangeMyPassword - Error fetching credential", err.Error())
	}
	if err != nil || cred == nil {
		log.Info(ctx, "[USECASE] user.ChangeMyPassword - Credential not found")
		return constants.DefaultResponse{Status: constants.STATUS_UNAUTHORIZED, Message: constants.MESSAGE_UNAUTHORIZED, Data: nil}, nil
	}

	log.Info(ctx, "[USECASE] user.ChangeMyPassword - Verifying current password")
	if !utils.CheckPasswordHash(cred.PasswordHash, req.CurrentPassword) {
		log.Info(ctx, "[USECASE] user.ChangeMyPassword - Current password mismatch")
		return constants.DefaultResponse{Status: constants.STATUS_INVALID_PASSWORD, Message: constants.MESSAGE_INVALID_PASSWORD, Data: nil}, nil
	}

	log.Info(ctx, "[USECASE] user.ChangeMyPassword - Hashing new password")
	hashed, herr := utils.HashPassword(req.NewPassword)
	if herr != nil {
		log.Error(ctx, "[USECASE] user.ChangeMyPassword - Hash error", herr.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: nil}, nil
	}

	log.Info(ctx, "[USECASE] user.ChangeMyPassword - Updating password in repository")
	if err := s.userRepo.UpdateUserPasswordByEmail(ctx, profile.Email, hashed); err != nil {
		log.Error(ctx, "[USECASE] user.ChangeMyPassword - Repository error", err.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: nil}, nil
	}

	log.Info(ctx, "[USECASE] user.ChangeMyPassword - SUCCESS")
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: struct{}{}}, nil
}
