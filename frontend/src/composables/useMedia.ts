import { models } from "../../wailsjs/go/models.ts";
import { ref } from "vue";
import { GetMediaByID, GetTagsByMediaID } from "../../wailsjs/go/app/App";
import useTabStore from "@/stores/tabStore.ts";

const useMedia = () => {
  const media = ref<models.Media>();
  const tags = ref<models.Tag[]>();
  const isEditing = ref<boolean>(false);

  const tabStore = useTabStore();

  const init = async (mediaID: number) => {
    try {
      const [mediaRes, tagsRes] = await Promise.all([
        GetMediaByID(mediaID),
        GetTagsByMediaID(mediaID),
      ]);
      media.value = mediaRes;
      tags.value = tagsRes;
    } catch (err) {
      console.error(err);
      return;
    }
  };

  const handleKeydown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();

    if (!event.ctrlKey) {
      switch (key) {
        case "b":
          tabStore.goBack();
          break;
        case "e":
          isEditing.value = true;
          break;
        case "esc":
          isEditing.value = false;
      }
    }
  };

  return {
    media,
    tags,
    init,
  };
};

export default useMedia;

