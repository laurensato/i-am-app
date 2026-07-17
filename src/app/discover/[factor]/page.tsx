export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FactorType, FACTOR_META } from '@/lib/types'
import DiscoverClient from './DiscoverClient'

export default async function DiscoverPage({ params }: { params: Promise<{ factor: string }> }) {
  const { factor } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  if (!FACTOR_META[factor as FactorType]) redirect('/dashboard')

  const { data: factorRow } = await supabase
    .from('identity_factors')
    .select('*')
    .eq('user_id', user.id)
    .eq('factor_type', factor)
    .single()

  if (!factorRow) redirect('/dashboard')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, age, gender')
    .eq('user_id', user.id)
    .single()

  return (
    <DiscoverClient
      factor={factor as FactorType}
      factorRow={factorRow}
      profile={profile}
      userId={user.id}
    />
  )
}
