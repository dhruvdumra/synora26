export function shortAddress(address: string | undefined) {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function badgeNumber(tokenId: bigint | number) {
  return `#${tokenId.toString().padStart(3, '0')}`
}

const numberFormat = new Intl.NumberFormat('en-US')

export function formatNumber(value: bigint | number) {
  return numberFormat.format(value)
}

export function decodeTokenUri(uri: string): { image: string; name: string } | null {
  const prefix = 'data:application/json;base64,'
  if (!uri.startsWith(prefix)) return null
  try {
    const binary = atob(uri.slice(prefix.length))
    const json = new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)))
    const metadata = JSON.parse(json) as { image?: string; name?: string }
    if (!metadata.image) return null
    return { image: metadata.image, name: metadata.name ?? '' }
  } catch {
    return null
  }
}
