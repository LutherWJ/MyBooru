import {models} from "../../wailsjs/go/models.ts";
import {ref} from "vue";
import {GetMediaByID, GetTagsByMediaID} from "../../wailsjs/go/app/App";

const useMedia = () => {
    const media = ref<models.Media>();
    const tags = ref<models.Tag[]>();

    const init = async (mediaID: number) => {
        try {
            const [mediaRes, tagsRes] = await Promise.all([GetMediaByID(mediaID), GetTagsByMediaID(mediaID)]);
            media.value = mediaRes;
            tags.value = tagsRes;
        } catch (err) {
            console.error(err);
            return;
        }
    }

    return {
        media,
        tags,
        init
    }
}

export default useMedia