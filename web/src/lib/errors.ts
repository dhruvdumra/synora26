import {
  BaseError,
  ContractFunctionRevertedError,
  InsufficientFundsError,
  UserRejectedRequestError,
} from 'viem'

const CONTRACT_ERRORS: Record<string, string> = {
  AlreadyHasBadge: 'This wallet already holds a pass.',
  NoBadge: 'Mint a pass with this wallet first.',
  AlreadyCheckedIn: 'That pass is already checked in to this session.',
  SessionNotActive: 'This session is closed. Reopen it to check people in.',
  UnknownSession: 'That session does not exist.',
  InvalidSessionName: 'Session names need between 1 and 64 characters.',
  InvalidBatchSize: 'A batch can hold between 1 and 200 pass numbers.',
  InvalidPoints: 'Points must be between 1 and 10.',
  SignatureExpired: 'This connect code has expired. Ask for a fresh one.',
  DeadlineTooFar: 'This connect code is not valid.',
  InvalidSignature: 'This connect code was not signed by the pass holder.',
  CannotConnectToSelf: 'You cannot connect with your own pass.',
  AlreadyConnected: 'You are already connected with this attendee.',
  NotCheckedInYet: 'Both passes need at least one session check-in before connecting.',
  Soulbound: 'Passes stay with the wallet that earned them and cannot be transferred.',
  EnforcedPause: 'The organizers have paused the pass contract.',
  AccessControlUnauthorizedAccount: 'This wallet does not have permission for that action.',
  ERC721NonexistentToken: 'No pass exists with that number.',
}

/** Turns wallet, RPC and contract errors into one plain sentence for the UI. */
export function describeError(error: unknown): string {
  if (error instanceof BaseError) {
    const reverted = error.walk((e) => e instanceof ContractFunctionRevertedError)
    if (reverted instanceof ContractFunctionRevertedError) {
      const name = reverted.data?.errorName
      if (name && CONTRACT_ERRORS[name]) return CONTRACT_ERRORS[name]
      if (name) return `The contract rejected this action (${name}).`
    }
    if (error.walk((e) => e instanceof UserRejectedRequestError)) {
      return 'Request cancelled in your wallet.'
    }
    if (error.walk((e) => e instanceof InsufficientFundsError)) {
      return 'Not enough Sepolia ETH for gas. Ask staff for a sponsored mint.'
    }
    return error.shortMessage
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}
