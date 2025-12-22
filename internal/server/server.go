package server

import (
	"context"
	"errors"
	"fmt"
	"mybooru/internal/database"
	"mybooru/internal/fileops"
	"mybooru/internal/models"
	"net"
	"net/http"
	"time"
)

type Server struct {
	db       *database.DB
	server   http.Server
	listener net.Listener
	port     int
	config   models.Config
	paths    fileops.AppPaths
}

func NewServer(db *database.DB, config models.Config, paths fileops.AppPaths) *Server {
	return &Server{
		db:     db,
		config: config,
		paths:  paths,
	}
}

func (s *Server) Start() error {

	// Try the config port, otherwise attempt a random port
	address := fmt.Sprintf("localhost:%d", s.config.Port)
	listener, err := net.Listen("tcp", address)
	s.port = s.config.Port
	if err != nil {
		listener, err = net.Listen("tcp", "localhost:0")
		if err != nil {
			return err
		}
		s.port = listener.Addr().(*net.TCPAddr).Port
	}

	s.listener = listener
	mux := s.setupRoutes()
	s.server.Handler = s.corsMiddleware(s.securityMiddleware(mux))

	go func() {
		fmt.Printf("Server started on port %d\n", s.port)
		if err := s.server.Serve(listener); err != nil && errors.Is(err, http.ErrServerClosed) {
			fmt.Printf("Server error: %v\n", err)
		}
	}()

	return nil
}

func (s *Server) Stop() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return s.server.Shutdown(ctx)
}

func (s *Server) GetPort() int {
	return s.port
}
