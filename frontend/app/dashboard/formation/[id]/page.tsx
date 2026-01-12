
import { useState } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import FormationDetail from './FormationDetail';


export default async function FormationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FormationDetail formationId={id} />;
}
