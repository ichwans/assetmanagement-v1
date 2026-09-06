package cmd

import (
	"gitlab.com/riski/internal/infrastructure/container"
	"gitlab.com/riski/internal/server"
)

func Run() {
	server.StartService(container.New())
}
