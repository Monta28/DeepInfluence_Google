// app/experts/[id]/contact/page.tsx
import ContactExpertForm from './ContactExpertForm';

export default async function ContactExpertPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ContactExpertForm expertId={id} />;
}
