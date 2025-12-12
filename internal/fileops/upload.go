package fileops

import (
	"crypto/md5"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"hash"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"mybooru/internal/database"
	"mybooru/internal/models"
)

var (
	ErrUnsupportedFormat = errors.New("unsupported media format")
	ErrInvalidFile       = errors.New("invalid or corrupted media file")
	ErrSessionNotFound   = errors.New("session not found")

	uploadSessions   = make(map[string]*UploadSession)
	uploadSessionsMu sync.Mutex
)

const DEFAULT_THUMBNAIL_SIZE = 300 // Height and Width in pixels
type UploadSession struct {
	ID           string
	Mimetype     string
	TotalSize    int64
	TempFilePath string
	TempFile     *os.File
	BytesWritten int64
	Hash         hash.Hash
	CreatedAt    time.Time
}

// FFprobeOutput represents the JSON output from ffprobe
type FFprobeOutput struct {
	Streams []struct {
		CodecName string  `json:"codec_name"`
		Width     *int64  `json:"width"`
		Height    *int64  `json:"height"`
		Duration  *string `json:"duration"`
	} `json:"streams"`
	Format struct {
		FormatName string `json:"format_name"`
		Size       string `json:"size"`
	} `json:"format"`
}

// GetMultimediaMetadata extracts metadata from a media file using ffprobe
func GetMultimediaMetadata(path string) (*models.FFprobeMetadata, error) {
	ffprobePath, err := exec.LookPath("ffprobe")
	if err != nil {
		return nil, fmt.Errorf("ffprobe not found in PATH: %w", err)
	}

	args := []string{
		"-v", "quiet",
		"-print_format", "json",
		"-show_format",
		"-show_streams",
		path,
	}

	output, err := exec.Command(ffprobePath, args...).Output()
	if err != nil {
		if strings.Contains(err.Error(), "Invalid data found") {
			return nil, ErrInvalidFile
		}
		return nil, fmt.Errorf("ffprobe failed: %w", err)
	}

	var result FFprobeOutput
	if err := json.Unmarshal(output, &result); err != nil {
		return nil, fmt.Errorf("failed to parse ffprobe output: %w", err)
	}

	if len(result.Streams) == 0 {
		return nil, ErrInvalidFile
	}

	stream := result.Streams[0]
	metadata := &models.FFprobeMetadata{
		Codec:  stream.CodecName,
		Format: strings.Split(result.Format.FormatName, ",")[0],
		Width:  stream.Width,
		Height: stream.Height,
	}

	// Parse file size
	var fileSize int64
	fmt.Sscanf(result.Format.Size, "%d", &fileSize)
	metadata.FileSize = fileSize

	// Parse duration if present
	if stream.Duration != nil && *stream.Duration != "" {
		var duration float64
		if _, err := fmt.Sscanf(*stream.Duration, "%f", &duration); err == nil {
			metadata.Duration = &duration
		}
	}

	return metadata, nil
}

// GenerateThumbnail creates a thumbnail for a media file using ffmpeg
func GenerateThumbnail(mediaPath, thumbPath string, mediaType models.MediaType) error {
	ffmpegPath, err := exec.LookPath("ffmpeg")
	if err != nil {
		return fmt.Errorf("ffmpeg not found in PATH: %w", err)
	}

	// Ensure thumbnail directory exists
	if err := EnsureDirectoryExists(filepath.Dir(thumbPath)); err != nil {
		return err
	}

	var args []string

	switch mediaType {
	case models.MediaTypeImage:
		args = []string{
			"-i", mediaPath,
			"-vf", fmt.Sprintf("scale=%d:%d:force_original_aspect_ratio=increase,crop=%d:%d", DEFAULT_THUMBNAIL_SIZE, DEFAULT_THUMBNAIL_SIZE, DEFAULT_THUMBNAIL_SIZE, DEFAULT_THUMBNAIL_SIZE),
			"-y", // Overwrite output file
			thumbPath,
		}

	case models.MediaTypeVideo:
		args = []string{
			"-i", mediaPath,
			"-vf", fmt.Sprintf("scale=%d:%d:force_original_aspect_ratio=increase,crop=%d:%d", DEFAULT_THUMBNAIL_SIZE, DEFAULT_THUMBNAIL_SIZE, DEFAULT_THUMBNAIL_SIZE, DEFAULT_THUMBNAIL_SIZE),
			"-frames:v", "1",
			"-y",
			thumbPath,
		}

	case models.MediaTypeAudio:
		// Audio files don't need thumbnails
		return nil

	default:
		return ErrUnsupportedFormat
	}

	cmd := exec.Command(ffmpegPath, args...)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("ffmpeg thumbnail generation failed: %w", err)
	}

	return nil
}

// HashAndWriteFile computes MD5 hash while writing a file
func HashAndWriteFile(src io.Reader, destPath string) (string, error) {
	if err := EnsureDirectoryExists(filepath.Dir(destPath)); err != nil {
		return "", err
	}

	destFile, err := os.Create(destPath)
	if err != nil {
		return "", fmt.Errorf("failed to create file: %w", err)
	}
	defer destFile.Close()

	hash := md5.New()
	writer := io.MultiWriter(destFile, hash)

	if _, err := io.Copy(writer, src); err != nil {
		os.Remove(destPath)
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	return hex.EncodeToString(hash.Sum(nil)), nil
}

// FormatToExtension converts ffprobe format names to file extensions
func FormatToExtension(format string) string {
	formatMap := map[string]string{
		// Images
		"image2":    "jpg",
		"jpeg_pipe": "jpg",
		"mjpeg":     "jpg",
		"png_pipe":  "png",
		"gif":       "gif",
		"webp":      "webp",
		"webp_pipe": "webp",
		"bmp_pipe":  "bmp",
		"tiff_pipe": "tiff",
		"ico":       "ico",
		"svg":       "svg",
		"heif":      "heic",
		"avif":      "avif",
		// Videos
		"mov":       "mov",
		"mp4":       "mp4",
		"matroska":  "mkv",
		"webm":      "webm",
		"avi":       "avi",
		"asf":       "wmv",
		"flv":       "flv",
		"mpegts":    "ts",
		"mpeg":      "mpg",
		"mpegvideo": "mpg",
		"m2ts":      "m2ts",
		"mts":       "mts",
		"vob":       "vob",
		"3gp":       "3gp",
		"ogv":       "ogv",
		// Audio
		"mp3":  "mp3",
		"wav":  "wav",
		"ogg":  "ogg",
		"oga":  "oga",
		"m4a":  "m4a",
		"flac": "flac",
		"aac":  "aac",
		"opus": "opus",
		"midi": "mid",
		"ape":  "ape",
		"wv":   "wv",
		"tta":  "tta",
	}

	if ext, ok := formatMap[format]; ok {
		return ext
	}
	return format
}

// ParseMediaType determines media type from file extension
func ParseMediaType(ext string) (models.MediaType, error) {
	imageExts := map[string]bool{
		"jpg": true, "jpeg": true, "png": true, "gif": true, "webp": true,
		"bmp": true, "tiff": true, "ico": true, "svg": true, "heic": true, "avif": true,
	}
	videoExts := map[string]bool{
		"mp4": true, "mkv": true, "webm": true, "avi": true, "mov": true,
		"wmv": true, "flv": true, "ts": true, "mpg": true, "m2ts": true,
		"mts": true, "vob": true, "3gp": true, "ogv": true,
	}
	audioExts := map[string]bool{
		"mp3": true, "wav": true, "ogg": true, "oga": true, "m4a": true,
		"flac": true, "aac": true, "opus": true, "mid": true, "ape": true,
		"wv": true, "tta": true,
	}

	ext = strings.TrimPrefix(strings.ToLower(ext), ".")

	if imageExts[ext] {
		return models.MediaTypeImage, nil
	}
	if videoExts[ext] {
		return models.MediaTypeVideo, nil
	}
	if audioExts[ext] {
		return models.MediaTypeAudio, nil
	}
	return "", ErrUnsupportedFormat
}

func generateUUID() string {
	b := make([]byte, 8)
	rand.Read(b)
	return fmt.Sprintf("%d-%s", time.Now().UnixNano(), hex.EncodeToString(b))
}

func StartUpload(totalSize int64) (sessionID string, err error) {
	id := generateUUID()
	tempPath := os.TempDir() + "/" + id + ".tmp"

	tempFile, err := os.Create(tempPath)
	if err != nil {
		fmt.Printf("Failed to create temp file: %v\n", err)
		return "", err
	}

	uploadSessionsMu.Lock()
	uploadSessions[id] = &UploadSession{
		ID:           id,
		TotalSize:    totalSize,
		TempFilePath: tempPath,
		TempFile:     tempFile,
		Hash:         md5.New(),
		CreatedAt:    time.Now(),
	}
	uploadSessionsMu.Unlock()

	return id, nil
}

func uploadChunk(sessionID string, data []byte) error {
	uploadSessionsMu.Lock()
	defer uploadSessionsMu.Unlock()

	session := uploadSessions[sessionID]
	if session == nil {
		return ErrSessionNotFound
	}

	n, err := session.TempFile.Write(data)
	if err != nil {
		_ = session.TempFile.Close()
		_ = os.Remove(session.TempFilePath)
		delete(uploadSessions, sessionID)
		return err
	}

	session.Hash.Write(data)
	session.BytesWritten += int64(n)

	return nil
}

func FinalizeUpload(db *database.DB, sessionID string, tags []string) (int64, error) {
	uploadSessionsMu.Lock()
	defer uploadSessionsMu.Unlock()

	session := uploadSessions[sessionID]
	if session == nil {
		return 0, ErrSessionNotFound
	}

	_ = session.TempFile.Close()

	tmpCleanup := func() {
		_ = os.Remove(session.TempFilePath)
		delete(uploadSessions, sessionID)
	}

	metadata, err := GetMultimediaMetadata(session.TempFilePath)
	if err != nil {
		tmpCleanup()
		return 0, err
	}

	ext := FormatToExtension(metadata.Format)
	mediaType, err := ParseMediaType(ext)
	if err != nil {
		tmpCleanup()
		return 0, err
	}

	md5Hash := hex.EncodeToString(session.Hash.Sum(nil))

	path, err := GetMediaFilePath(md5Hash, ext)
	if err != nil {
		tmpCleanup()
		return 0, err
	}

	err = os.Rename(session.TempFilePath, path)
	if err != nil {
		tmpCleanup()
		return 0, err
	}

	media := &models.CreateMediaInput{
		FilePath:  path,
		MD5:       md5Hash,
		MediaType: mediaType,
		MimeType:  string(mediaType) + "/" + metadata.Codec,
		FileSize:  metadata.FileSize,
		Width:     metadata.Width,
		Height:    metadata.Height,
		Duration:  metadata.Duration,
		Codec:     &metadata.Codec,
		Rating:    models.RatingSafe,
	}

	tx, err := db.Begin()

	dbCleanup := func() {
		_ = os.Remove(path)
		_ = tx.Rollback()
		delete(uploadSessions, sessionID)
	}

	if err != nil {
		dbCleanup()
		return 0, err
	}

	id, err := db.CreateMedia(media)
	if err != nil {
		dbCleanup()
		return 0, err
	}

	// TODO: add tags to post

	err = tx.Commit()
	if err != nil {
		dbCleanup()
		return 0, err
	}

	delete(uploadSessions, sessionID)
	return id, nil
}
