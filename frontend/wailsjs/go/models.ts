export namespace database {
	
	export class Stats {
	    MediaCount: number;
	    TagCount: number;
	    ViewHistoryCount: number;
	    TotalFileSize: number;
	
	    static createFrom(source: any = {}) {
	        return new Stats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.MediaCount = source["MediaCount"];
	        this.TagCount = source["TagCount"];
	        this.ViewHistoryCount = source["ViewHistoryCount"];
	        this.TotalFileSize = source["TotalFileSize"];
	    }
	}

}

export namespace models {
	
	export class CreateTagInput {
	    Name: string;
	    Category: number;
	
	    static createFrom(source: any = {}) {
	        return new CreateTagInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Name = source["Name"];
	        this.Category = source["Category"];
	    }
	}
	export class Media {
	    ID: number;
	    FilePath: string;
	    MD5: string;
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
	    TagCountMetadata: number;
	    TagCountArtist: number;
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
	        this.FilePath = source["FilePath"];
	        this.MD5 = source["MD5"];
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
	        this.TagCountMetadata = source["TagCountMetadata"];
	        this.TagCountArtist = source["TagCountArtist"];
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
	export class SearchQuery {
	    IncludeTags: string[];
	    OptionalTags: string[];
	    ExcludeTags: string[];
	    Rating: string[];
	    MinWidth?: number;
	    MaxWidth?: number;
	    MinHeight?: number;
	    MaxHeight?: number;
	    MinFileSize?: number;
	    MaxFileSize?: number;
	    HasParent?: boolean;
	    HasChildren?: boolean;
	    ParentID?: number;
	    IsFavorite?: boolean;
	    // Go type: time
	    CreatedAfter?: any;
	    // Go type: time
	    CreatedBefore?: any;
	    MediaTypes: string[];
	    Limit: number;
	    Offset: number;
	
	    static createFrom(source: any = {}) {
	        return new SearchQuery(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.IncludeTags = source["IncludeTags"];
	        this.OptionalTags = source["OptionalTags"];
	        this.ExcludeTags = source["ExcludeTags"];
	        this.Rating = source["Rating"];
	        this.MinWidth = source["MinWidth"];
	        this.MaxWidth = source["MaxWidth"];
	        this.MinHeight = source["MinHeight"];
	        this.MaxHeight = source["MaxHeight"];
	        this.MinFileSize = source["MinFileSize"];
	        this.MaxFileSize = source["MaxFileSize"];
	        this.HasParent = source["HasParent"];
	        this.HasChildren = source["HasChildren"];
	        this.ParentID = source["ParentID"];
	        this.IsFavorite = source["IsFavorite"];
	        this.CreatedAfter = this.convertValues(source["CreatedAfter"], null);
	        this.CreatedBefore = this.convertValues(source["CreatedBefore"], null);
	        this.MediaTypes = source["MediaTypes"];
	        this.Limit = source["Limit"];
	        this.Offset = source["Offset"];
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
	export class UpdateMediaInput {
	    Rating?: string;
	    IsFavorite?: boolean;
	    ParentID?: number;
	    SourceURL?: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateMediaInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Rating = source["Rating"];
	        this.IsFavorite = source["IsFavorite"];
	        this.ParentID = source["ParentID"];
	        this.SourceURL = source["SourceURL"];
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

