package server

import (
	"encoding/json"
	"net/http"
	"path/filepath"
	"strings"
)

func (s *Server) handleMedia(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/media/")
	if path == "" || path == r.URL.Path {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	ext := filepath.Ext(path)
	hash := strings.TrimSuffix(path, ext)

	mediaPath, err := s.paths.GetMediaFilePath(hash, ext)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	http.ServeFile(w, r, mediaPath)
}

func (s *Server) handleThumbnail(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/thumbnail")
	if path == "" || path == r.URL.Path {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	ext := filepath.Ext(path)
	hash := strings.TrimSuffix(path, ext)

	thumbPath, err := s.paths.GetThumbnailPath(hash, s.config.ThumbnailSize)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	http.ServeFile(w, r, thumbPath)
}

func (s *Server) handleUploadInit(w http.ResponseWriter, r *http.Request) {
	var req struct {
		TotalSize int64 `json:"totalSize"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	id, err := s.paths.StartUpload(req.TotalSize)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"sessionID": id,
	})
}

func (s *Server) handleUploadChunk(w http.ResponseWriter, r *http.Request) {
	sessionID := r.URL.Query().Get("sessionID")

	err := s.paths.UploadChunk(sessionID, r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func (s *Server) handleUploadFinalize(w http.ResponseWriter, r *http.Request) {
	sessionID := r.URL.Query().Get("sessionID")
	tagList := r.URL.Query().Get("tags")

	mediaID, err := s.paths.FinalizeUpload(s.db, &s.config, sessionID, tagList)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int64{
		"mediaID": mediaID,
	})
}

func (s *Server) handleSearch(w http.ResponseWriter, r *http.Request) {

}
