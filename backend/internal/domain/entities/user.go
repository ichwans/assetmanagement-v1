package entities

import (
	"time"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type GetUsersReq struct {
	Id        string `json:"id"`
	Status    string `json:"status"`
	IdType    string `json:"idtype"`
	StartDate string `json:"startdate"`
	EndDate   string `json:"enddate"`
	Limit     int    `json:"limit"`
	Page      int    `json:"page"`
	Name      string `json:"name"`
	State     string `json:"state"`
}

type User struct {
	ID        primitive.ObjectID `json:"id" bson:"_id"`
	FullName  string             `json:"fullName" bson:"full_name"`
	Email     string             `json:"email" bson:"email"`
	UserType  string             `json:"userType" bson:"user_type"`
	Status    string             `json:"status" bson:"status"`
	CreatedAt time.Time          `json:"createdAt" bson:"created_at"`
	UpdatedAt time.Time          `json:"updatedAt" bson:"updated_at"`
}

type UserDetail struct {
	ID             int64     `json:"id" bson:"id"`
	UUID           uuid.UUID `json:"uuid" bson:"uuid"`
	FullName       string    `json:"fullName" bson:"full_name"`
	Email          string    `json:"email" bson:"email"`
	Msisdn         string    `json:"msisdn" bson:"msisdn"`
	BirthDate      string    `json:"birthDate" bson:"birth_date"`
	Gender         string    `json:"gender" bson:"gender"`
	Country        string    `json:"country" bson:"country"`
	Address        string    `json:"address" bson:"address"`
	Province       string    `json:"province" bson:"province"`
	City           string    `json:"city" bson:"city"`
	District       string    `json:"district" bson:"district"`
	SubDistrict    string    `json:"subDistrict" bson:"sub_district"`
	PostalCode     string    `json:"postalCode" bson:"postal_code"`
	IdentityType   string    `json:"identityType" bson:"identity_type"`
	IdentityNumber string    `json:"identityNumber" bson:"identity_number"`
	SelfieImage    string    `json:"selfieImage" bson:"selfie_image"`
	IdentityImage  string    `json:"identityImage" bson:"identity_image"`
	UserType       string    `json:"userType" bson:"user_type"`
	Status         string    `json:"status" bson:"status"`
	ReviewedBy     string    `json:"reviewedBy" bson:"reviewed_by"`
	State          string    `json:"state" bson:"state"`
	CreatedAt      time.Time `json:"createdAt" bson:"created_at"`
	UpdatedAt      time.Time `json:"updatedAt" bson:"updated_at"`
}

type UserMetrix struct {
	TotalUser           int `bson:"total_user" json:"totalUser"`
	TotalAccountBasic   int `bson:"total_account_basic" json:"totalAccountBasic"`
	TotalAccountPremium int `bson:"total_account_premium" json:"totalAccountPremium"`
	NewUser             int `bson:"new_user" json:"newUser"`
	NewUserBasic        int `bson:"new_account_basic" json:"newAccountBasic"`
	NewUserPremium      int `bson:"new_account_premium" json:"newAccountPremium"`
}

type UserState struct {
	ID_       primitive.ObjectID `bson:"_id" json:"-"`
	UserId    string             `bson:"user_id" json:"userId"`
	State     string             `bson:"state" json:"state"`
	Reason    string             `bson:"reason" json:"reason"`
	ChangedBy string             `bson:"changed_by" json:"changedBy"`
	CreatedAt time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt time.Time          `bson:"Updated_at" json:"updatedAt"`
}

// UserCredential represents auth-related fields fetched during login
type UserCredential struct {
	Email        string `bson:"email" json:"email"`
	PasswordHash string `bson:"password" json:"-"`
	UserType     string `bson:"user_type" json:"userType"`
	FullName     string `bson:"full_name" json:"fullName"`
}
