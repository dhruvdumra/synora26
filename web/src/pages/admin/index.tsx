import { LockIcon, PauseIcon, PlayIcon, ShieldCheckIcon, WalletIcon } from '@phosphor-icons/react'
import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useAccount } from 'wagmi'
import { Page, PageHeader, StatePanel } from '@/components/page'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WalletButton } from '@/components/wallet-button'
import type { ActionRecord } from '@/hooks/use-contract-action'
import { useContractAction } from '@/hooks/use-contract-action'
import { useRoles } from '@/hooks/use-roles'
import { useSessions } from '@/hooks/use-sessions'
import { shortAddress } from '@/lib/format'
import { ActivityLog } from './activity-log'
import { BadgeActionsPanel } from './badge-actions-panel'
import { CheckInPanel } from './check-in-panel'
import { SessionsPanel } from './sessions-panel'

export function AdminPage() {
  const { address, isConnected } = useAccount()
  const { isStaff, isAdmin, paused, isLoading } = useRoles()

  if (!isConnected) {
    return (
      <Page>
        <StatePanel icon={<WalletIcon weight="bold" />} title="Door console" action={<WalletButton size="lg" />}>
          Connect a staff wallet to run sessions and check people in.
        </StatePanel>
      </Page>
    )
  }
  if (isLoading) {
    return (
      <Page>
        <Skeleton className="mb-10 h-14 w-72" />
        <Skeleton className="h-96" />
      </Page>
    )
  }
  if (!isStaff) {
    return (
      <Page>
        <StatePanel icon={<LockIcon weight="bold" />} title="Not a staff wallet">
          {shortAddress(address)} does not hold the staff role on the pass contract. An admin can grant it.
        </StatePanel>
      </Page>
    )
  }
  return <Console isAdmin={isAdmin} paused={paused} />
}

function Console({ isAdmin, paused }: { isAdmin: boolean; paused: boolean }) {
  const { sessions, isLoading } = useSessions()
  const [params, setParams] = useSearchParams()
  const [records, setRecords] = useState<ActionRecord[]>([])
  const { send, busy } = useContractAction()

  const selectedParam = params.get('session')
  const selectedId = selectedParam && /^\d+$/.test(selectedParam) ? BigInt(selectedParam) : sessions.find((s) => s.active)?.id
  const selected = sessions.find((session) => session.id === selectedId && session.active)

  const upsertRecord = useCallback((record: ActionRecord) => {
    setRecords((current) => {
      const exists = current.some((item) => item.id === record.id)
      const next = exists ? current.map((item) => (item.id === record.id ? record : item)) : [record, ...current]
      return next.slice(0, 20)
    })
  }, [])

  return (
    <Page>
      <PageHeader
        title="Door console"
        description={
          paused
            ? 'The contract is paused. Minting, check-ins and connections are blocked until it is resumed.'
            : 'Open sessions, scan passes and record talks. Every action is signed and lands on-chain.'
        }
        actions={
          isAdmin && (
            <Button
              variant={paused ? 'default' : 'outline'}
              disabled={busy !== null}
              onClick={() =>
                void send(paused ? 'unpause' : 'pause', [], {
                  pending: paused ? 'Resuming contract' : 'Pausing contract',
                  success: paused ? 'Contract resumed' : 'Contract paused',
                  onRecord: upsertRecord,
                })
              }
            >
              {paused ? <PlayIcon weight="bold" data-icon="inline-start" /> : <PauseIcon weight="bold" data-icon="inline-start" />}
              {paused ? 'Resume contract' : 'Pause contract'}
            </Button>
          )
        }
      />

      <div className="grid gap-10 lg:grid-cols-[300px_1fr] lg:gap-14">
        <SessionsPanel
          sessions={sessions}
          isLoading={isLoading}
          selected={selected?.id}
          onSelect={(id) => setParams({ session: id.toString() }, { replace: true })}
          onRecord={upsertRecord}
        />

        <div className="flex flex-col gap-10">
          <Tabs defaultValue="checkin" className="gap-6">
            <TabsList>
              <TabsTrigger value="checkin">Check in</TabsTrigger>
              <TabsTrigger value="actions">Talks, points and mints</TabsTrigger>
            </TabsList>
            <TabsContent value="checkin">
              <CheckInPanel session={selected} onRecord={upsertRecord} />
            </TabsContent>
            <TabsContent value="actions">
              <BadgeActionsPanel onRecord={upsertRecord} />
            </TabsContent>
          </Tabs>

          <ActivityLog records={records} />

          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheckIcon weight="bold" className="size-3.5" />
            {isAdmin ? 'Admin wallet: can pause the contract and manage staff.' : 'Staff wallet: can run sessions and check-ins.'}
          </p>
        </div>
      </div>
    </Page>
  )
}
