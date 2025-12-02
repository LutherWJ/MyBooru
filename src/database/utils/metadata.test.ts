import {getMultimediaMetadata} from "./metadata";

const path = './image.png';
const result = await getMultimediaMetadata(path);
if (!result.ok) {
    console.error(`Error: ${result.error}`);
    console.log('closing');
    process.exit(1);
}
console.log(result.value);
