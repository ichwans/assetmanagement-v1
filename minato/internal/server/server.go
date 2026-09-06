package server

import (
	"gitlab.com/riski/internal/infrastructure/container"
	"gitlab.com/riski/internal/server/http"
)

func StartService(container *container.Container) {
	http.StartH2CServer(container)
}
