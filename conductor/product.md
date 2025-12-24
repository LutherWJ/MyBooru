# Initial Concept
MyBooru is a personal media gallery application ported from Electron to Wails. It combines a Go backend with a Vue 3 frontend, using SQLite for data storage and FFmpeg for media processing.

# Product Guide - MyBooru

## Vision
MyBooru is a lightweight, high-performance personal media gallery application designed to provide a superior alternative to traditional directory-based file systems for managing large media libraries. It empowers users to organize, discover, and enjoy their media through a robust tagging system and powerful search capabilities, all within a privacy-focused, local-first desktop environment.

## Target Audience
- **Private Media Collectors:** Individuals seeking a secure, local solution to manage their personal media collections without relying on cloud services.
- **Power Users:** Users with extensive libraries who require advanced metadata management, complex search functionality, and efficient organizational tools.

## Core Goals
- **Efficiency over File Systems:** Provide a more flexible and intuitive way to manage media than standard folders, using metadata and tags as the primary organizational axis.
- **High Performance:** Leverage the Wails framework and Go backend to ensure a responsive UI and fast processing, even with very large libraries.
- **Local-First & Private:** Ensure all data, including the SQLite database and media files, remains strictly on the user's local machine.

## Key Features
- **Advanced Tagging System:** Support for categorized tags (General, Artist, Metadata), tag aliases for consistency, and tag implications to automate relationships.
- **Powerful Search Engine:** A custom query parser allowing for inclusive, exclusive, and optional tag filters, along with the ability to save frequent searches.
- **Rich Visual Browsing:** An optimized gallery view for rapid scanning, detailed individual media views, and user-defined collections for thematic organization.
- **Content-Addressed Storage:** Automatic deduplication using MD5 hashing to ensure library integrity and save disk space.
