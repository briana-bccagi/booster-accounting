let dbError: string | null = null

export function setDbError(error: string) {
  dbError = error
}

export function getDbError() {
  return dbError
}

export function clearDbError() {
  dbError = null
}

