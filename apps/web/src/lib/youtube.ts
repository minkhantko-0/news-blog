/** Extracts the video ID from youtube.com/watch?v=, youtu.be/, /shorts/, /embed/ and /live/ URLs. */
export function youtubeId(url: string | undefined): string | undefined {
  return url?.match(/(?:youtu\.be\/|[?&]v=|\/(?:shorts|embed|live)\/)([\w-]{11})/)?.[1];
}
