import BookExpertForm from './BookExpertForm';

export default async function BookExpertPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookExpertForm expertId={id} />;
}