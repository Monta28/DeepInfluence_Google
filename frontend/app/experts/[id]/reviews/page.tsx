import ExpertReviews from './ExpertReviews';

export default async function ExpertReviewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ExpertReviews expertId={id} />;
}
