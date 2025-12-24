package server

import "net/http"

func (s *Server) setupRoutes() *http.ServeMux {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /media/", s.handleGetMedia)
	mux.HandleFunc("GET /thumbnail/", s.handleGetThumbnail)
	mux.HandleFunc("POST /upload/init", s.handleUploadInit)
	mux.HandleFunc("POST /upload/chunk", s.handleUploadChunk)
	mux.HandleFunc("POST /upload/finalize", s.handleUploadFinalize)

	return mux
}
