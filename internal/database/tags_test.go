package database

import (
	"testing"

	"mybooru/internal/models"
)

func TestCreateTag(t *testing.T) {
	db := SetupTestDB(t)

	tests := []struct {
		name      string
		input     *models.CreateTagInput
		wantError bool
	}{
		{
			name: "create general tag",
			input: &models.CreateTagInput{
				Name:     "cat",
				Category: models.TagCategoryGeneral,
			},
			wantError: false,
		},
		{
			name: "create artist tag",
			input: &models.CreateTagInput{
				Name:     "artist_name",
				Category: models.TagCategoryArtist,
			},
			wantError: false,
		},
		{
			name: "create character tag",
			input: &models.CreateTagInput{
				Name:     "character_name",
				Category: models.TagCategoryCharacter,
			},
			wantError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			id, err := db.CreateTag(tt.input)

			if tt.wantError {
				AssertError(t, err, "CreateTag should return error")
				return
			}

			AssertNoError(t, err, "CreateTag failed")

			if id <= 0 {
				t.Errorf("Expected positive ID, got %d", id)
			}

			tag, err := db.GetTagByID(id)
			AssertNoError(t, err, "GetTagByID failed")

			AssertEqual(t, tag.Name, tt.input.Name, "Tag name mismatch")
			AssertEqual(t, tag.Category, tt.input.Category, "Tag category mismatch")
			AssertEqual(t, tag.UsageCount, 0, "Initial usage count should be 0")
		})
	}
}

func TestGetTagByName(t *testing.T) {
	db := SetupTestDB(t)

	id, err := db.CreateTag(&models.CreateTagInput{
		Name:     "test_tag",
		Category: models.TagCategoryGeneral,
	})
	AssertNoError(t, err, "CreateTag failed")

	tests := []struct {
		name      string
		tagName   string
		wantError bool
	}{
		{
			name:      "existing tag exact case",
			tagName:   "test_tag",
			wantError: false,
		},
		{
			name:      "existing tag different case",
			tagName:   "TEST_TAG",
			wantError: false,
		},
		{
			name:      "non-existent tag",
			tagName:   "nonexistent",
			wantError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tag, err := db.GetTagByName(tt.tagName)

			if tt.wantError {
				AssertError(t, err, "GetTagByName should return error")
				if err != ErrNotFound {
					t.Errorf("Expected ErrNotFound, got %v", err)
				}
				return
			}

			AssertNoError(t, err, "GetTagByName failed")
			AssertEqual(t, tag.ID, id, "Tag ID mismatch")
		})
	}
}

func TestGetOrCreateTag(t *testing.T) {
	db := SetupTestDB(t)

	tag1, err := db.GetOrCreateTag("new_tag", models.TagCategoryGeneral)
	AssertNoError(t, err, "GetOrCreateTag failed on first call")

	if tag1.Name != "new_tag" {
		t.Errorf("Expected tag name 'new_tag', got %q", tag1.Name)
	}

	tag2, err := db.GetOrCreateTag("new_tag", models.TagCategoryGeneral)
	AssertNoError(t, err, "GetOrCreateTag failed on second call")

	if tag1.ID != tag2.ID {
		t.Errorf("Expected same tag ID on second call, got %d and %d", tag1.ID, tag2.ID)
	}
}

func TestDeleteTag(t *testing.T) {
	db := SetupTestDB(t)

	id, err := db.CreateTag(&models.CreateTagInput{
		Name:     "to_delete",
		Category: models.TagCategoryGeneral,
	})
	AssertNoError(t, err, "CreateTag failed")

	err = db.DeleteTag(id)
	AssertNoError(t, err, "DeleteTag failed")

	_, err = db.GetTagByID(id)
	AssertError(t, err, "GetTagByID should fail for deleted tag")

	if err != ErrNotFound {
		t.Errorf("Expected ErrNotFound for deleted tag, got %v", err)
	}

	err = db.DeleteTag(999999)
	AssertError(t, err, "DeleteTag should fail for non-existent tag")
}
