import VideoPlayer from './VideoPlayer';

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VideoPlayer videoId={id} />;
}