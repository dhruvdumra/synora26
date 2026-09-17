import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type { ContractFunctionArgs, ContractFunctionName, TransactionReceipt } from 'viem'
import { useAccount, usePublicClient, useWriteContract } from 'wagmi'
import { badgeAbi } from '@/lib/badge-abi'
import { badgeAddress, chain, explorerLink } from '@/lib/config'
import { describeError } from '@/lib/errors'
import { formatNumber } from '@/lib/format'

type WriteName = ContractFunctionName<typeof badgeAbi, 'nonpayable'>
type WriteArgs<N extends WriteName> = ContractFunctionArgs<typeof badgeAbi, 'nonpayable', N>

export interface ActionRecord {
  id: string
  label: string
  status: 'pending' | 'confirmed' | 'failed'
  hash?: `0x${string}`
  blockNumber?: bigint
  gasUsed?: bigint
  error?: string
  startedAt: number
  confirmedMs?: number
}

interface SendOptions {
  /** Short present-tense description, e.g. "Checking in #004". */
  pending: string
  /** Short past-tense description, e.g. "Checked in #004". Can read the receipt's logs for real outcomes. */
  success: string | ((receipt: TransactionReceipt) => string)
  onRecord?: (record: ActionRecord) => void
}

/**
 * Sends a badge contract transaction, waits for the receipt and reports progress through toasts.
 * Returns the receipt on success or null when the wallet, RPC or contract rejected it.
 */
export function useContractAction() {
  const client = usePublicClient({ chainId: chain.id })
  const { address: account } = useAccount()
  const queryClient = useQueryClient()
  const { writeContractAsync } = useWriteContract()
  const [busy, setBusy] = useState<string | null>(null)

  const send = useCallback(
    async <N extends WriteName>(
      functionName: N,
      args: WriteArgs<N>,
      { pending, success, onRecord }: SendOptions,
    ): Promise<TransactionReceipt | null> => {
      const record: ActionRecord = {
        id: crypto.randomUUID(),
        label: pending,
        status: 'pending',
        startedAt: Date.now(),
      }
      const toastId = toast.loading(pending, { description: 'Confirm in your wallet.' })
      setBusy(functionName)
      onRecord?.(record)

      try {
        if (!client) throw new Error('No connection to the network.')
        // Simulate first: surfaces the contract's exact custom error for every wallet type and avoids
        // paying gas for a transaction that would revert.
        const { request } = await client.simulateContract({
          address: badgeAddress,
          abi: badgeAbi,
          functionName,
          args,
          account,
        } as Parameters<typeof client.simulateContract>[0])
        const hash = await writeContractAsync(request as Parameters<typeof writeContractAsync>[0])
        toast.loading(pending, { id: toastId, description: 'Waiting for the block.' })
        onRecord?.({ ...record, hash })

        const receipt = await client.waitForTransactionReceipt({ hash })
        if (receipt.status !== 'success') throw new Error('The transaction reverted.')

        const successLabel = typeof success === 'function' ? success(receipt) : success
        const confirmed: ActionRecord = {
          ...record,
          label: successLabel,
          hash,
          status: 'confirmed',
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed,
          confirmedMs: Date.now() - record.startedAt,
        }
        onRecord?.(confirmed)
        const link = explorerLink.tx(hash)
        toast.success(successLabel, {
          id: toastId,
          description: `Block ${receipt.blockNumber} with ${formatNumber(receipt.gasUsed)} gas`,
          action: link ? { label: 'View', onClick: () => window.open(link, '_blank', 'noopener') } : undefined,
        })
        void queryClient.invalidateQueries()
        return receipt
      } catch (error) {
        const message = describeError(error)
        onRecord?.({ ...record, status: 'failed', error: message })
        toast.error(message, { id: toastId, description: undefined })
        return null
      } finally {
        setBusy(null)
      }
    },
    [account, client, queryClient, writeContractAsync],
  )

  return { send, busy }
}
