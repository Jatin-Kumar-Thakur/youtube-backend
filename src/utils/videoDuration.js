// import ffmpeg from "fluent-ffmpeg";

// const getVideoDuration = (filePath) => {
//     return new Promise((resolve, reject) => {
//         ffmpeg.ffprobe(filePath, (err, metadata) => {
//             if (err) return reject(err);
//             const durationInSeconds = metadata.format.duration;
//             resolve(durationInSeconds);
//         });
//     });
// };

// export default getVideoDuration;

import { getVideoDurationInSeconds } from 'get-video-duration';
import fs from 'fs';
const getVideoDuration = async (filePath) => {
    const stream = fs.createReadStream(filePath);
    const duration = await getVideoDurationInSeconds(stream);
    return duration;
};

export default getVideoDuration;