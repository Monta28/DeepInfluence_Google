
import ExpertProfile from './ExpertProfile';


export default async function ExpertPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ExpertProfile expertId={id} />;
}
