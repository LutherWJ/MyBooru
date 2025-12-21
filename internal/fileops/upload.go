package fileops

import (
	"crypto/md5"
	"crypto/rand"
	"encoding/base64"
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
func GetMultimediaMetadata(ffprobePath string, path string) (*models.FFprobeMetadata, error) {
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
func GenerateThumbnail(ffmpegPath, mediaPath, thumbPath string, mediaType models.MediaType) error {
	// Ensure thumbnail directory exists
	if err := os.MkdirAll(filepath.Dir(thumbPath), 0755); err != nil {
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

func generateUUID() (string, error) {
	b := make([]byte, 8)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("failed to generate random bytes: %w", err)
	}
	return fmt.Sprintf("%d-%s", time.Now().UnixNano(), hex.EncodeToString(b)), nil
}

func (paths *AppPaths) StartUpload(totalSize int64) (sessionID string, err error) {
	id, err := generateUUID()
	if err != nil {
		fmt.Printf("ERROR: Failed to generate UUID: %v\n", err)
		return "", err
	}

	// Ensure temp directory exists
	if err := os.MkdirAll(paths.TempDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create temp directory: %w", err)
	}

	tempPath := filepath.Join(paths.TempDir, id+".tmp")
	tempFile, err := os.Create(tempPath)
	if err != nil {
		return "", fmt.Errorf("failed to create temp file: %w", err)
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

	fmt.Printf("LOG: Upload session %s created successfully\n", id)
	return id, nil
}

func (paths *AppPaths) UploadChunk(sessionID string, base64Data string) error {
	// Decode Base64
	data, err := base64.StdEncoding.DecodeString(base64Data)
	if err != nil {
		fmt.Printf("ERROR: Failed to decode base64 data: %v\n", err)
		return fmt.Errorf("failed to decode base64: %w", err)
	}

	uploadSessionsMu.Lock()
	defer uploadSessionsMu.Unlock()

	session := uploadSessions[sessionID]
	if session == nil {
		fmt.Printf("ERROR: Session %s not found\n", sessionID)
		return ErrSessionNotFound
	}

	n, err := session.TempFile.Write(data)

	if err != nil {
		fmt.Printf("ERROR: Failed to write chunk for session %s: %v\n", sessionID, err)
		_ = session.TempFile.Close()
		_ = os.Remove(session.TempFilePath)
		delete(uploadSessions, sessionID)
		return err
	}

	session.Hash.Write(data)
	session.BytesWritten += int64(n)

	return nil
}

func (paths *AppPaths) FinalizeUpload(db *database.DB, sessionID string, tagList string) (int64, error) {
	uploadSessionsMu.Lock()
	session := uploadSessions[sessionID]
	uploadSessionsMu.Unlock()

	if session == nil {
		fmt.Printf("ERROR: Session %s not found during finalization\n", sessionID)
		return 0, ErrSessionNotFound
	}

	_ = session.TempFile.Close()
	fmt.Printf("LOG: Temp file closed, bytes written: %d\n", session.BytesWritten)

	cleanupSession := func() {
		uploadSessionsMu.Lock()
		delete(uploadSessions, sessionID)
		uploadSessionsMu.Unlock()
	}

	tmpCleanup := func() {
		_ = os.Remove(session.TempFilePath)
		cleanupSession()
	}

	fmt.Printf("LOG: Extracting metadata from %s\n", session.TempFilePath)
	metadata, err := GetMultimediaMetadata(paths.FFprobe, session.TempFilePath)
	if err != nil {
		fmt.Printf("ERROR: Failed to get metadata: %v\n", err)
		tmpCleanup()
		return 0, err
	}
	fmt.Printf("LOG: Metadata extracted - format: %s, codec: %s\n", metadata.Format, metadata.Codec)

	ext := FormatToExtension(metadata.Format)
	mediaType, err := ParseMediaType(ext)
	if err != nil {
		fmt.Printf("ERROR: Failed to parse media type for extension %s: %v\n", ext, err)
		tmpCleanup()
		return 0, err
	}
	fmt.Printf("LOG: Media type: %s, extension: %s\n", mediaType, ext)

	md5Hash := hex.EncodeToString(session.Hash.Sum(nil))
	fmt.Printf("LOG: MD5 hash: %s\n", md5Hash)

	path, err := paths.GetMediaFilePath(md5Hash, ext)
	if err != nil {
		fmt.Printf("ERROR: Failed to get media file path: %v\n", err)
		tmpCleanup()
		return 0, err
	}

	// Ensure media directory exists
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		fmt.Printf("ERROR: Failed to create media directory: %v\n", err)
		tmpCleanup()
		return 0, err
	}

	err = os.Rename(session.TempFilePath, path)
	if err != nil {
		srcFile, err := os.Open(session.TempFilePath)
		if err != nil {
			fmt.Printf("ERROR: Failed to open temp file for copy: %v\n", err)
			tmpCleanup()
			return 0, err
		}
		defer srcFile.Close()

		destFile, err := os.Create(path)
		if err != nil {
			fmt.Printf("ERROR: Failed to create destination file: %v\n", err)
			tmpCleanup()
			return 0, err
		}
		defer destFile.Close()

		_, err = io.Copy(destFile, srcFile)
		if err != nil {
			fmt.Printf("ERROR: Failed to copy file: %v\n", err)
			_ = os.Remove(path)
			tmpCleanup()
			return 0, err
		}

		_ = os.Remove(session.TempFilePath)
		fmt.Printf("LOG: File copied successfully\n")
	} else {
		fmt.Printf("LOG: File moved successfully\n")
	}

	thumbPath, err := paths.GetThumbnailPath(md5Hash, DEFAULT_THUMBNAIL_SIZE)
	if err != nil {
		fmt.Printf("ERROR: Failed to get thumbnail path: %v\n", err)
		_ = os.Remove(path)
		cleanupSession()
		return 0, err
	}

	fmt.Printf("LOG: Generating thumbnail at %s\n", thumbPath)
	if err := GenerateThumbnail(paths.FFmpeg, path, thumbPath, mediaType); err != nil {
		fmt.Printf("WARN: Failed to generate thumbnail: %v\n", err)
	}

	media := &models.CreateMediaInput{
		MD5:       md5Hash,
		FileExt:   ext,
		MediaType: mediaType,
		MimeType:  string(mediaType) + "/" + metadata.Codec,
		FileSize:  metadata.FileSize,
		Width:     metadata.Width,
		Height:    metadata.Height,
		Duration:  metadata.Duration,
		Codec:     &metadata.Codec,
		Rating:    models.RatingSafe,
	}

	fmt.Printf("LOG: Creating database transaction\n")
	tx, err := db.Begin()
	if err != nil {
		fmt.Printf("ERROR: Failed to begin transaction: %v\n", err)
		_ = os.Remove(path)
		cleanupSession()
		return 0, fmt.Errorf("failed to begin transaction: %w", err)
	}

	dbCleanup := func() {
		_ = tx.Rollback()
		_ = os.Remove(path)
		cleanupSession()
	}

	fmt.Printf("LOG: Creating media record in database\n")
	id, err := db.CreateMedia(media)
	if err != nil {
		fmt.Printf("ERROR: Failed to create media record: %v\n", err)
		dbCleanup()
		return 0, err
	}
	fmt.Printf("LOG: Media record created with ID: %d\n", id)

	tags, err := ParseTags(tagList)
	if err != nil {
		fmt.Printf("ERROR: Failed to parse tags: %v\n", err)
		dbCleanup()
		return 0, fmt.Errorf("invalid tag format: %w", err)
	}

	if len(tags) > 0 && tagList != "" {
		fmt.Printf("LOG: Adding %d tags: %v\n", len(tags), tags)
		if err := database.AddTagsToMediaInTx(tx, id, tags); err != nil {
			fmt.Printf("ERROR: Failed to add tags: %v\n", err)
			dbCleanup()
			return 0, fmt.Errorf("failed to add tags: %w", err)
		}
	}

	fmt.Printf("LOG: Committing transaction\n")
	err = tx.Commit()
	if err != nil {
		fmt.Printf("ERROR: Failed to commit transaction: %v\n", err)
		dbCleanup()
		return 0, err
	}

	cleanupSession()
	fmt.Printf("LOG: Upload finalized successfully, media ID: %d\n", id)
	return id, nil
}

func TagPost(db *database.DB, mediaID int64, tagInput string) error {
	tags, err := ParseTags(tagInput)
	if err != nil {
		return fmt.Errorf("invalid tag format: %w", err)
	}
	return db.AddTagsToMediaTx(mediaID, tags)
}

// CleanupUploadSessions closes and removes any active temporary upload files
func (paths *AppPaths) CleanupUploadSessions() {
	uploadSessionsMu.Lock()
	defer uploadSessionsMu.Unlock()

	for id, session := range uploadSessions {
		fmt.Printf("LOG: Cleaning up upload session %s\n", id)
		_ = session.TempFile.Close()
		_ = os.Remove(session.TempFilePath)
		delete(uploadSessions, id)
	}
}
