export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  const { data: factors } = await supabase
    .from('identity_factors')
    .select('*')
    .eq('user_id', user.id)

  const today = new Date().toISOString().split('T')[0]
  const { data: dailyMessage } = await supabase
    .from('daily_messages')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  return (
    <DashboardClient
      profile={profile}
      factors={factors ?? []}
      dailyMessage={dailyMessage}
      userId={user.id}
    />
  )
}
