package server

import "net/http"

func (s *Server) setupRoutes() *http.ServeMux {
	mux := http.NewServeMux()

	mux.HandleFunc("/media/", s.handleMedia)
	mux.HandleFunc("/thumbnail", s.handleThumbnail)
	mux.HandleFunc("POST /upload/init", s.handleUploadInit)
	mux.HandleFunc("POST /upload/chunk", s.handleUploadChunk)
	mux.HandleFunc("POST /upload/finalize", s.handleUploadFinalize)
	mux.HandleFunc("GET /search", s.handleSearch)

	return mux
}
