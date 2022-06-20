interface Media {
  url: string;
  duration: number;
  preview: string;
  dims: number[];
  size: number;
}

interface MediaFormats {
  gif: Media;
  tinygifpreview: Media;
  nanowebm: Media;
  tinygif: Media;
  mp4: Media;
  nanogif: Media;
  webm: Media;
  nanomp4: Media;
  tinywebm: Media;
  gifpreview: Media;
  mediumgif: Media;
  loopedmp4: Media;
  nanogifpreview: Media;
  tinymp4: Media;
}

interface Result {
  id: string;
  title: string;
  media_formats: MediaFormats;
  created: number;
  content_description: string;
  itemurl: string;
  url: string;
  tags: string[];
  flags: string[];
  hasaudio: boolean;
}

export interface SearchResponse {
  results: Result[];
  next: string;
}
