import ReservationForm from './ReservationForm';

export default async function ReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReservationForm formationId={id} />;
}
