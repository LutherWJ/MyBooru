export namespace models {
	
	export class Config {
	    port: number;
	    thumbnail_sizes: number;
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.port = source["port"];
	        this.thumbnail_sizes = source["thumbnail_sizes"];
	    }
	}
	export class Media {
	    ID: number;
	    MD5: string;
	    FileExt: string;
	    MediaType: string;
	    MimeType: string;
	    FileSize: number;
	    Width: sql.NullInt64;
	    Height: sql.NullInt64;
	    Duration: sql.NullFloat64;
	    Codec: sql.NullString;
	    Rating: string;
	    IsFavorite: boolean;
	    TagCount: number;
	    TagCountGeneral: number;
	    TagCountArtist: number;
	    TagCountCopyright: number;
	    TagCountCharacter: number;
	    TagCountMetadata: number;
	    ParentID: sql.NullInt64;
	    HasChildren: boolean;
	    SourceURL: sql.NullString;
	    CreatedAt: number;
	    UpdatedAt: number;
	    LastViewedAt: sql.NullInt64;
	
	    static createFrom(source: any = {}) {
	        return new Media(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.MD5 = source["MD5"];
	        this.FileExt = source["FileExt"];
	        this.MediaType = source["MediaType"];
	        this.MimeType = source["MimeType"];
	        this.FileSize = source["FileSize"];
	        this.Width = this.convertValues(source["Width"], sql.NullInt64);
	        this.Height = this.convertValues(source["Height"], sql.NullInt64);
	        this.Duration = this.convertValues(source["Duration"], sql.NullFloat64);
	        this.Codec = this.convertValues(source["Codec"], sql.NullString);
	        this.Rating = source["Rating"];
	        this.IsFavorite = source["IsFavorite"];
	        this.TagCount = source["TagCount"];
	        this.TagCountGeneral = source["TagCountGeneral"];
	        this.TagCountArtist = source["TagCountArtist"];
	        this.TagCountCopyright = source["TagCountCopyright"];
	        this.TagCountCharacter = source["TagCountCharacter"];
	        this.TagCountMetadata = source["TagCountMetadata"];
	        this.ParentID = this.convertValues(source["ParentID"], sql.NullInt64);
	        this.HasChildren = source["HasChildren"];
	        this.SourceURL = this.convertValues(source["SourceURL"], sql.NullString);
	        this.CreatedAt = source["CreatedAt"];
	        this.UpdatedAt = source["UpdatedAt"];
	        this.LastViewedAt = this.convertValues(source["LastViewedAt"], sql.NullInt64);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class SearchResult {
	    Media: Media[];
	    TotalCount: number;
	    FirstID: number;
	    LastID: number;
	    HasMore: boolean;
	
	    static createFrom(source: any = {}) {
	        return new SearchResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Media = this.convertValues(source["Media"], Media);
	        this.TotalCount = source["TotalCount"];
	        this.FirstID = source["FirstID"];
	        this.LastID = source["LastID"];
	        this.HasMore = source["HasMore"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Tag {
	    ID: number;
	    Name: string;
	    Category: number;
	    UsageCount: number;
	    CreatedAt: number;
	
	    static createFrom(source: any = {}) {
	        return new Tag(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Name = source["Name"];
	        this.Category = source["Category"];
	        this.UsageCount = source["UsageCount"];
	        this.CreatedAt = source["CreatedAt"];
	    }
	}

}

export namespace sql {
	
	export class NullFloat64 {
	    Float64: number;
	    Valid: boolean;
	
	    static createFrom(source: any = {}) {
	        return new NullFloat64(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Float64 = source["Float64"];
	        this.Valid = source["Valid"];
	    }
	}
	export class NullInt64 {
	    Int64: number;
	    Valid: boolean;
	
	    static createFrom(source: any = {}) {
	        return new NullInt64(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Int64 = source["Int64"];
	        this.Valid = source["Valid"];
	    }
	}
	export class NullString {
	    String: string;
	    Valid: boolean;
	
	    static createFrom(source: any = {}) {
	        return new NullString(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.String = source["String"];
	        this.Valid = source["Valid"];
	    }
	}

}

