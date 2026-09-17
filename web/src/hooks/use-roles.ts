import { keccak256, toBytes, zeroHash } from 'viem'
import { useAccount, useReadContracts } from 'wagmi'
import { badgeAbi } from '@/lib/badge-abi'
import { badgeAddress, chain, isConfigured } from '@/lib/config'

export const STAFF_ROLE = keccak256(toBytes('STAFF_ROLE'))
export const ADMIN_ROLE = zeroHash

const contract = { address: badgeAddress, abi: badgeAbi, chainId: chain.id } as const
const ZERO = '0x0000000000000000000000000000000000000000' as const

/** Staff can run check-ins; admins can also pause the contract and manage staff. */
export function useRoles() {
  const { address } = useAccount()
  const query = useReadContracts({
    allowFailure: false,
    contracts: [
      { ...contract, functionName: 'hasRole', args: [STAFF_ROLE, address ?? ZERO] },
      { ...contract, functionName: 'hasRole', args: [ADMIN_ROLE, address ?? ZERO] },
      { ...contract, functionName: 'paused' },
    ],
    query: { enabled: isConfigured && !!address },
  })
  const [isStaff = false, isAdmin = false, paused = false] = query.data ?? []
  return { isStaff, isAdmin, paused, isLoading: !!address && query.isLoading }
}
