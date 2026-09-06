package user

import (
	"time"

	"github.com/google/uuid"
	"gitlab.com/riski/internal/pkg/constants"
)

// * Requests
type (
	GetUsersReq struct {
		Id     string `query:"id"`
		Status string `query:"status"`
		IdType string `query:"idtype"`
		Limit  string `query:"limit"`
		Page   string `query:"page"`
		Name   string `query:"name"`
		State  string `query:"state"`
	}

	GetUserDetailReq struct {
		Id string `param:"id" validate:"required"`
	}

	CheckEKYCReq struct {
		Id string `param:"id"`
	}

	EKYCRequestRejectReason struct {
		Reason string `json:"reason"`
		Code   string `json:"code"`
	}

	EKYCRequestPersonal struct {
		FullName  string `json:"fullName" validate:"omitempty,min=2,max=100"`
		MSISDN    string `json:"msisdn" validate:"omitempty,e164,IsValidIDPhoneNumber"`
		Email     string `json:"email" validate:"omitempty,email"`
		BirthDate string `json:"birthDate" validate:"omitempty"`
		Country   string `json:"country" validate:"omitempty"`
		Gender    string `json:"gender" validate:"omitempty,oneof=male female"`
	}

	EKYCRequestAddress struct {
		Address          string `json:"address" validate:"omitempty"`
		Province         string `json:"province" validate:"omitempty"`
		ProvinceLabel    string `json:"provinceLabel" validate:"omitempty"`
		City             string `json:"city" validate:"omitempty"`
		CityLabel        string `json:"cityLabel" validate:"omitempty"`
		District         string `json:"district" validate:"omitempty"`
		DistrictLabel    string `json:"districtLabel" validate:"omitempty"`
		SubDistrict      string `json:"subDistrict" validate:"omitempty"`
		SubDistrictLabel string `json:"subDistrictLabel" validate:"omitempty"`
		PostalCode       string `json:"postalCode" validate:"omitempty"`
	}

	EKYCRequestIdentity struct {
		IdentityType   string `json:"identityType" validate:"omitempty,oneof=KTP Passport SIM"`
		IdentityNumber string `json:"identityNumber" validate:"omitempty,number,max=16"`
		IdentityImage  string `json:"identityImage" validate:"omitempty"`
		SelfieImage    string `json:"selfieImage" validate:"omitempty"`
	}

	EKYCRequest struct {
		Step         int                      `json:"step" validate:"omitempty,oneof=0 1 2"`
		Personal     EKYCRequestPersonal      `json:"personal" validate:"omitempty"`
		Address      EKYCRequestAddress       `json:"address" validate:"omitempty"`
		Identity     EKYCRequestIdentity      `json:"identity" validate:"omitempty"`
		Status       string                   `json:"status" validate:"omitempty"` // * Used in Response Value
		RejectReason *EKYCRequestRejectReason `json:"rejectReason,omitempty"  validate:"omitempty"`
		CreatedAt    time.Time                `json:"createdAt"`
		UpdatedAt    time.Time                `json:"updatedAt"`
		ReviewedBy   string                   `json:"reviewedBy"`
		State        string                   `json:"state"`
	}

	ApprovalEKYCReq struct {
		Id     string `json:"id" validate:"required"`
		Status string `json:"status" validate:"required,oneof=approve reject"`
		Reason string `json:"reason"`
	}

	ChangeStatusReq struct {
		Id     string `json:"id" validate:"required"`
		Status string `json:"status" validate:"required,oneof=inactive banned active"`
		Reason string `json:"reason"`
	}

	CreateUserReq struct {
		FullName string `json:"fullName" validate:"required,min=2,max=100"`
		Email    string `json:"email" validate:"required,email"`
		Password string `json:"password" validate:"required,min=8"`
		UserType string `json:"userType" validate:"required,oneof=admin user auditor head_unit purchasing admin_asset"`
	}

	UpdateUserReq struct {
		// Path param is set in handler: req.Id = c.Param("id")
		Id       string `json:"-"`
		FullName string `json:"fullName" validate:"omitempty,min=2,max=100"`
		UserType string `json:"userType" validate:"omitempty,oneof=admin user auditor head_unit purchasing admin_asset"`
	}

	ChangePasswordReq struct {
		CurrentPassword string `json:"currentPassword" validate:"required,min=6"`
		NewPassword     string `json:"newPassword" validate:"required,min=8"`
	}
)

// * Responses
type (
	CheckEKYCResponse struct {
		constants.DefaultResponse
		Data EKYCRequest `json:"data"`
	}

	User struct {
		ID           int       `json:"id" `
		UUID         uuid.UUID `json:"uuid" `
		FullName     string    `json:"fullName"`
		Email        string    `json:"email" `
		Msisdn       string    `json:"msisdn" `
		UserType     string    `json:"userType" `
		Status       string    `json:"status" `
		Tier         string    `json:"tier" `
		IdentityType string    `json:"identityType"`
		ReviewedBy   string    `json:"reviewedBy" `
		State        string    `json:"state"`
		CreatedAt    string    `json:"createdAt" `
		UpdatedAt    string    `json:"updatedAt" `
		DeletedAt    *string   `json:"deletedAt,omitempty"`
	}

	StateReason struct {
		UpdatedBy string `json:"updatedBy"`
		Reason    string `json:"reason"`
	}

	UserDetail struct {
		ID             int64       `json:"id" db:"id"`
		UUID           uuid.UUID   `json:"uuid" db:"uuid"`
		FullName       string      `json:"fullName" db:"full_name"`
		Email          string      `json:"email" db:"email"`
		Msisdn         string      `json:"msisdn" db:"msisdn"`
		BirthDate      string      `json:"birthDate" db:"birth_date"`
		Gender         string      `json:"gender" db:"gender"`
		Country        string      `json:"country" db:"country"`
		Address        string      `json:"address" db:"address"`
		Province       string      `json:"province" db:"province"`
		City           string      `json:"city" db:"city"`
		District       string      `json:"district" db:"district"`
		SubDistrict    string      `json:"subDistrict" db:"sub_district"`
		PostalCode     string      `json:"postalCode" db:"postal_code"`
		IdentityType   string      `json:"identityType" db:"identity_type"`
		IdentityNumber string      `json:"identityNumber" db:"identity_number"`
		SelfieImage    string      `json:"selfieImage" db:"selfie_image"`
		IdentityImage  string      `json:"identityImage" db:"identity_image"`
		UserType       string      `json:"userType" db:"user_type"`
		Status         string      `json:"status" db:"status"`
		ReviewedBy     string      `json:"reviewedBy" db:"reviewed_by"`
		State          string      `json:"state"`
		StateDetail    StateReason `json:"stateDetail" db:"state_detail"`
		CreatedAt      time.Time   `json:"createdAt" db:"created_at"`
		UpdatedAt      time.Time   `json:"updatedAt" db:"updated_at"`
	}
)
