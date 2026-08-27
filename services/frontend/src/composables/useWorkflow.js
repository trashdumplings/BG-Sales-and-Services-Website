import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const noop = () => {}

/**
 * Generic multi-stage approve/reject workflow shell state.
 * Entity-specific concerns (which API endpoint each verb maps to, how
 * canAct/canRevert are computed, how history entries are built) are all
 * supplied by the caller — this hook only owns stage/view/modal state.
 *
 * Callback props are read via a ref (updated every render, no dependency
 * array) rather than depended on directly, so callers can pass inline
 * arrow functions without creating a new identity each render — otherwise
 * effects keyed on those callbacks would re-fire every render.
 */
export function useWorkflow({
  stages = [],
  fetchList,
  getStatus = (record) => record?.status,
  getCanAct = () => false,
  getCanRevert = () => false,
  onForward = noop,
  onRevert = noop,
  buildHistory = () => [],
  currentUser = null,
}) {
  const optionsRef = useRef(null)
  optionsRef.current = { fetchList, getStatus, getCanAct, getCanRevert, onForward, onRevert, buildHistory, currentUser }

  const [activeStage, setActiveStage] = useState(stages[0]?.key ?? null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [view, setView] = useState('list')
  const [selectedRecord, setSelectedRecord] = useState(null)

  const [remarksState, setRemarksState] = useState({ open: false, verb: 'forward', record: null, submitting: false })

  const reload = useCallback(async () => {
    const { fetchList: currentFetchList } = optionsRef.current
    if (!currentFetchList) return
    try {
      setLoading(true)
      setError(null)
      const result = await currentFetchList(activeStage)
      setRecords(Array.isArray(result) ? result : [])
    } catch (err) {
      setError(err?.message || 'Failed to load records')
    } finally {
      setLoading(false)
    }
  }, [activeStage])

  useEffect(() => {
    reload()
  }, [reload])

  const openList = useCallback(() => {
    setView('list')
    setSelectedRecord(null)
  }, [])

  const openCreate = useCallback(() => {
    setSelectedRecord(null)
    setView('form')
  }, [])

  const openRecord = useCallback((record) => {
    setSelectedRecord(record)
    setView('form')
  }, [])

  const canAct = useCallback(
    (record) => optionsRef.current.getCanAct(record, optionsRef.current.currentUser),
    []
  )
  const canRevert = useCallback(
    (record) => optionsRef.current.getCanRevert(record, optionsRef.current.currentUser),
    []
  )

  const openFor = useCallback((record, verb) => {
    setRemarksState({ open: true, verb, record, submitting: false })
  }, [])

  const closeRemarks = useCallback(() => {
    setRemarksState((prev) => ({ ...prev, open: false, submitting: false }))
  }, [])

  const submitRemarks = useCallback(async (remarks) => {
    const { verb, record } = remarksState
    if (!record) return

    const { onForward: currentOnForward, onRevert: currentOnRevert } = optionsRef.current
    const action = verb === 'revert' ? currentOnRevert : currentOnForward

    setRemarksState((prev) => ({ ...prev, submitting: true }))
    try {
      await action(record, remarks)
      setRemarksState({ open: false, verb: 'forward', record: null, submitting: false })
      openList()
      await reload()
    } catch (err) {
      setRemarksState((prev) => ({ ...prev, submitting: false }))
      throw err
    }
  }, [remarksState, openList, reload])

  const history = useMemo(
    () => (selectedRecord ? buildHistory(selectedRecord) : []),
    [selectedRecord, buildHistory]
  )

  return {
    activeStage,
    setActiveStage,
    records,
    loading,
    error,
    reload,
    view,
    openList,
    openCreate,
    openRecord,
    selectedRecord,
    remarksModal: {
      open: remarksState.open,
      verb: remarksState.verb,
      record: remarksState.record,
      submitting: remarksState.submitting,
      openFor,
      close: closeRemarks,
      submit: submitRemarks,
    },
    history,
    canAct,
    canRevert,
    getStatus,
    stages,
  }
}

export default useWorkflow
