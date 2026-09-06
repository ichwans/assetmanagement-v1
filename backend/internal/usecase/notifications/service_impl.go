package notifications

import (
	"context"
	"strconv"
	"time"

	"github.com/hashicorp/go-uuid"
	"gitlab.com/riski/internal/domain/entities"
	"gitlab.com/riski/internal/domain/repositories"
	"gitlab.com/riski/internal/pkg/constants"
	"gitlab.com/riski/internal/pkg/log"
)

type service struct{ repo repositories.Notifications }

func NewService(repo repositories.Notifications) Service { return &service{repo: repo} }

func (s *service) List(ctx context.Context, q ListQuery) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] notifications.List - START", "userId", q.UserID, "type", q.Type, "read", q.Read, "limit", q.Limit, "page", q.Page)

	// Parse filters
	var (
		readPtr *bool
		limit   int64 = 20
		page    int64 = 1
	)
	if q.Read == "true" {
		b := true
		readPtr = &b
	}
	if q.Read == "false" {
		b := false
		readPtr = &b
	}
	if q.Limit != "" {
		if v, err := strconv.ParseInt(q.Limit, 10, 64); err == nil && v > 0 {
			limit = v
		}
	}
	if q.Page != "" {
		if v, err := strconv.ParseInt(q.Page, 10, 64); err == nil && v > 0 {
			page = v
		}
	}

	rows, total, err := s.repo.List(ctx, q.UserID, q.Type, readPtr, page, limit)
	if err != nil {
		log.Error(ctx, "[USECASE] notifications.List - Repository error", err.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
	}

	// map entities -> dto
	out := make([]Notification, 0, len(rows))
	for _, r := range rows {
		out = append(out, fromEntity(r))
	}

	// pagination envelope
	pd := map[string]interface{}{
		"results": out,
		"pagination": map[string]interface{}{
			"page":        page,
			"totalPages":  (total + limit - 1) / limit,
			"totalItems":  total,
			"limit":       limit,
			"hasNext":     page*limit < total,
			"hasPrevious": page > 1,
		},
	}

	log.Info(ctx, "[USECASE] notifications.List - SUCCESS", "count", len(out))
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: pd}, nil
}

func (s *service) Create(ctx context.Context, in CreateNotificationReq) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] notifications.Create - START", "userId", in.UserID, "type", in.Type)
	id, _ := uuid.GenerateUUID()
	n := entities.Notification{
		ID:        id,
		UserID:    in.UserID,
		Type:      in.Type,
		Title:     in.Title,
		Message:   in.Message,
		Link:      in.Link,
		Read:      false,
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}
	if err := s.repo.Insert(ctx, n); err != nil {
		log.Error(ctx, "[USECASE] notifications.Create - Repository error", err.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
	}
	log.Info(ctx, "[USECASE] notifications.Create - SUCCESS")
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: fromEntity(n)}, nil
}

func (s *service) MarkRead(ctx context.Context, userID string, ids []string) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] notifications.MarkRead - START", "userId", userID, "count", len(ids))
	if err := s.repo.MarkRead(ctx, userID, ids); err != nil {
		log.Error(ctx, "[USECASE] notifications.MarkRead - Repository error", err.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
	}
	log.Info(ctx, "[USECASE] notifications.MarkRead - SUCCESS")
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: struct{}{}}, nil
}

func (s *service) MarkAllRead(ctx context.Context, userID string) (constants.DefaultResponse, error) {
	log.Info(ctx, "[USECASE] notifications.MarkAllRead - START", "userId", userID)
	if err := s.repo.MarkAllRead(ctx, userID); err != nil {
		log.Error(ctx, "[USECASE] notifications.MarkAllRead - Repository error", err.Error())
		return constants.DefaultResponse{Status: constants.STATUS_SERVER_ERROR, Message: constants.MESSAGE_SERVER_ERROR, Data: struct{}{}}, nil
	}
	log.Info(ctx, "[USECASE] notifications.MarkAllRead - SUCCESS")
	return constants.DefaultResponse{Status: constants.STATUS_SUCCESS, Message: constants.MESSAGE_SUCCESS, Data: struct{}{}}, nil
}

func fromEntity(e entities.Notification) Notification {
	return Notification{
		ID:        e.ID,
		UserID:    e.UserID,
		Type:      e.Type,
		Title:     e.Title,
		Message:   e.Message,
		Link:      e.Link,
		Read:      e.Read,
		CreatedAt: e.CreatedAt.Format(time.RFC3339),
	}
}
