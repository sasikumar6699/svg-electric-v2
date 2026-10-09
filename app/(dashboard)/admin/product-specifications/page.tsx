import { redirect } from 'next/navigation';

export default function LegacyProductSpecsPage() {
  redirect('/admin/panel-upgradations');
}