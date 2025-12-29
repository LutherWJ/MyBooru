import useTabStore from "@/stores/tabStore";

let isListening: boolean = false;

const useGlobalKeyboard = () => {
  const tabStore = useTabStore();

  const handleNumKey = (key: string) => {
    const num = parseInt(key) - 1;
    tabStore.setActiveIndex(num);
  };

  const handleKeydown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();

    if (event.ctrlKey) {
      switch (key) {
        case "t":
          const id = tabStore.addTab("Gallery");
          tabStore.setActiveTab(id);
          break;
        case "w":
          tabStore.removeTab(tabStore.activeTabID);
          break;
        case "tab":
          tabStore.rotateTab();
          break;
        case "1":
          handleNumKey(key);
          break;
        case "2":
          handleNumKey(key);
          break;
        case "3":
          handleNumKey(key);
          break;
        case "4":
          handleNumKey(key);
          break;
        case "5":
          handleNumKey(key);
          break;
        case "6":
          handleNumKey(key);
          break;
        case "7":
          handleNumKey(key);
          break;
        case "8":
          handleNumKey(key);
          break;
        case "9":
          handleNumKey(key);
          break;
        case "0":
          handleNumKey("10"); // Special case
          break;
      }
    }
  };

  const enable = () => {
    if (isListening) return;
    isListening = true;
    window.addEventListener("keydown", handleKeydown);
  };

  const disable = () => {
    if (!isListening) return;
    isListening = false;
    window.addEventListener("keydown", handleKeydown);
  };

  return {
    enable,
    disable,
  };
};

export default useGlobalKeyboard;
