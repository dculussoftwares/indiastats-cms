'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { toast } from '@payloadcms/ui'

import type { ImportPredictionsResult } from '@/lib/importPredictions'

import './index.scss'

const baseClass = 'importPredictions'

interface PredictorOption {
  id: string
  name: string
  bio?: string
  imagePath?: string
}

interface ParsedFile {
  predictions: Array<Record<string, unknown>>
  count: number
}

export const ImportPredictions: React.FC = () => {
  const [predictorMode, setPredictorMode] = useState<'existing' | 'new'>('existing')
  const [predictors, setPredictors] = useState<PredictorOption[]>([])
  const [selectedPredictorId, setSelectedPredictorId] = useState('')
  const [editPredictorName, setEditPredictorName] = useState('')
  const [editPredictorBio, setEditPredictorBio] = useState('')
  const [editPredictorImage, setEditPredictorImage] = useState('')
  const [newPredictorName, setNewPredictorName] = useState('')
  const [newPredictorBio, setNewPredictorBio] = useState('')
  const [newPredictorImage, setNewPredictorImage] = useState('')
  const [stateCode, setStateCode] = useState('TN')
  const [electionYear, setElectionYear] = useState(2026)
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [savingField, setSavingField] = useState<'name' | 'bio' | 'imagePath' | null>(null)
  const [result, setResult] = useState<ImportPredictionsResult | null>(null)
  const [showErrors, setShowErrors] = useState(false)

  useEffect(() => {
    fetch('/api/predictors?where[isActive][equals]=true&limit=100&sort=name', {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        const docs = (data?.docs ?? []) as Array<{
          id: string | number
          name: string
          bio?: string
          imagePath?: string
        }>
        const options = docs.map((doc) => ({
          id: String(doc.id),
          name: doc.name,
          bio: doc.bio ?? '',
          imagePath: doc.imagePath ?? '',
        }))
        setPredictors(options)
        if (options.length > 0 && !selectedPredictorId) {
          setSelectedPredictorId(options[0].id)
          setEditPredictorName(options[0].name)
          setEditPredictorBio(options[0].bio ?? '')
          setEditPredictorImage(options[0].imagePath ?? '')
        }
      })
      .catch(() => {
        /* predictors will be empty, user can create new */
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFieldSave = useCallback(
    async (field: 'name' | 'bio' | 'imagePath', value: string) => {
      if (!selectedPredictorId) return
      setSavingField(field)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 20000)
      try {
        const res = await fetch('/next/update-predictor', {
          method: 'POST',
          credentials: 'include',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ predictorId: selectedPredictorId, field, value }),
        })
        clearTimeout(timeout)
        const data = await res.json()
        if (res.ok && data.success && data.doc) {
          setPredictors((prev) =>
            prev.map((p) =>
              p.id === selectedPredictorId
                ? { ...p, name: data.doc.name, bio: data.doc.bio ?? '', imagePath: data.doc.imagePath ?? '' }
                : p,
            ),
          )
          if (field === 'name') setEditPredictorName(data.doc.name)
          if (field === 'bio') setEditPredictorBio(data.doc.bio ?? '')
          if (field === 'imagePath') setEditPredictorImage(data.doc.imagePath ?? '')
          toast.success(`${field === 'imagePath' ? 'Image Path' : field.charAt(0).toUpperCase() + field.slice(1)} saved.`)
        } else {
          toast.error(data?.error ?? `Save failed (${res.status}).`)
        }
      } catch (err) {
        clearTimeout(timeout)
        const isAbort = err instanceof Error && err.name === 'AbortError'
        toast.error(isAbort ? 'Save timed out.' : 'Save failed — server may be unreachable.')
      } finally {
        setSavingField(null)
      }
    },
    [selectedPredictorId],
  )

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setParsedFile(null)
    setFileError(null)
    setResult(null)

    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string)
        const predictions = json?.prediction

        if (!Array.isArray(predictions) || predictions.length === 0) {
          setFileError('JSON must contain a non-empty "prediction" array.')
          return
        }

        setParsedFile({ predictions, count: predictions.length })
      } catch {
        setFileError('Invalid JSON file.')
      }
    }
    reader.readAsText(file)
  }, [])

  const canSubmit =
    !loading &&
    parsedFile &&
    stateCode &&
    electionYear &&
    (predictorMode === 'existing' ? selectedPredictorId : newPredictorName && newPredictorImage)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!canSubmit || !parsedFile) return

      setLoading(true)
      setResult(null)

      const body: Record<string, unknown> = {
        stateCode,
        electionYear,
        predictions: parsedFile.predictions,
      }

      if (predictorMode === 'existing') {
        body.predictorId = selectedPredictorId
      } else {
        body.newPredictor = {
          name: newPredictorName,
          bio: newPredictorBio || undefined,
          imagePath: newPredictorImage,
        }
      }

      try {
        toast.promise(
          new Promise<void>((resolve, reject) => {
            fetch('/next/import-predictions', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            })
              .then(async (res) => {
                const data = await res.json()
                if (res.ok && data.success) {
                  setResult(data.result as ImportPredictionsResult)
                  resolve()
                } else {
                  reject(data.error || 'Import failed')
                }
              })
              .catch((err) => reject(err))
          }),
          {
            loading: `Importing ${parsedFile.count} predictions...`,
            success: 'Import complete!',
            error: 'Import failed. Check errors below.',
          },
        )
      } catch {
        /* handled by toast */
      } finally {
        setLoading(false)
      }
    },
    [
      canSubmit,
      parsedFile,
      stateCode,
      electionYear,
      predictorMode,
      selectedPredictorId,
      newPredictorName,
      newPredictorBio,
      newPredictorImage,
    ],
  )

  return (
    <div className={baseClass}>
      <h4 className={`${baseClass}__title`}>Import Predictions</h4>

      <form onSubmit={handleSubmit}>
        <div className={`${baseClass}__radioGroup`}>
          <label className={`${baseClass}__radioLabel`}>
            <input
              type="radio"
              name="predictorMode"
              checked={predictorMode === 'existing'}
              onChange={() => setPredictorMode('existing')}
            />
            Existing Predictor
          </label>
          <label className={`${baseClass}__radioLabel`}>
            <input
              type="radio"
              name="predictorMode"
              checked={predictorMode === 'new'}
              onChange={() => setPredictorMode('new')}
            />
            New Predictor
          </label>
        </div>

        {predictorMode === 'existing' ? (
          <>
            <div className={`${baseClass}__field`}>
              <label className={`${baseClass}__label`}>Predictor</label>
              <select
                className={`${baseClass}__select`}
                value={selectedPredictorId}
                onChange={(e) => {
                  const id = e.target.value
                  setSelectedPredictorId(id)
                  const predictor = predictors.find((p) => p.id === id)
                  if (predictor) {
                    setEditPredictorName(predictor.name)
                    setEditPredictorBio(predictor.bio ?? '')
                    setEditPredictorImage(predictor.imagePath ?? '')
                  }
                }}
              >
                {predictors.length === 0 && <option value="">No predictors found</option>}
                {predictors.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={`${baseClass}__field`}>
              <label className={`${baseClass}__label`}>Predictor Name</label>
              <div className={`${baseClass}__fieldRow`}>
                <input
                  className={`${baseClass}__input`}
                  type="text"
                  value={editPredictorName}
                  onChange={(e) => setEditPredictorName(e.target.value)}
                  placeholder="Predictor name"
                />
                <button
                  className={`${baseClass}__saveBtn`}
                  type="button"
                  disabled={savingField !== null || !editPredictorName}
                  onClick={() => handleFieldSave('name', editPredictorName)}
                >
                  {savingField === 'name' ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
            <div className={`${baseClass}__field`}>
              <label className={`${baseClass}__label`}>Bio</label>
              <div className={`${baseClass}__fieldRow`} style={{ alignItems: 'flex-start' }}>
                <textarea
                  className={`${baseClass}__textarea`}
                  value={editPredictorBio}
                  onChange={(e) => setEditPredictorBio(e.target.value)}
                  placeholder="Short bio for the predictor"
                />
                <button
                  className={`${baseClass}__saveBtn`}
                  type="button"
                  disabled={savingField !== null}
                  onClick={() => handleFieldSave('bio', editPredictorBio)}
                >
                  {savingField === 'bio' ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
            <div className={`${baseClass}__field`}>
              <label className={`${baseClass}__label`}>Image Path</label>
              <div className={`${baseClass}__fieldRow`}>
                <input
                  className={`${baseClass}__input`}
                  type="text"
                  value={editPredictorImage}
                  onChange={(e) => setEditPredictorImage(e.target.value)}
                  placeholder="/images/predictor.png"
                />
                <button
                  className={`${baseClass}__saveBtn`}
                  type="button"
                  disabled={savingField !== null}
                  onClick={() => handleFieldSave('imagePath', editPredictorImage)}
                >
                  {savingField === 'imagePath' ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={`${baseClass}__field`}>
              <label className={`${baseClass}__label`}>Predictor Name</label>
              <input
                className={`${baseClass}__input`}
                type="text"
                value={newPredictorName}
                onChange={(e) => setNewPredictorName(e.target.value)}
                placeholder="e.g. JVC Sreeram (Bulls Eye)"
              />
            </div>
            <div className={`${baseClass}__field`}>
              <label className={`${baseClass}__label`}>Bio</label>
              <textarea
                className={`${baseClass}__textarea`}
                value={newPredictorBio}
                onChange={(e) => setNewPredictorBio(e.target.value)}
                placeholder="Short bio for the predictor"
              />
            </div>
            <div className={`${baseClass}__field`}>
              <label className={`${baseClass}__label`}>Image Path</label>
              <input
                className={`${baseClass}__input`}
                type="text"
                value={newPredictorImage}
                onChange={(e) => setNewPredictorImage(e.target.value)}
                placeholder="/images/predictor.png"
              />
            </div>
          </>
        )}

        <div className={`${baseClass}__row`}>
          <div className={`${baseClass}__field`}>
            <label className={`${baseClass}__label`}>State Code</label>
            <input
              className={`${baseClass}__input`}
              type="text"
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
            />
          </div>
          <div className={`${baseClass}__field`}>
            <label className={`${baseClass}__label`}>Election Year</label>
            <input
              className={`${baseClass}__input`}
              type="number"
              value={electionYear}
              onChange={(e) => setElectionYear(Number(e.target.value))}
            />
          </div>
        </div>

        <div className={`${baseClass}__field`}>
          <label className={`${baseClass}__label`}>Prediction JSON File</label>
          <input
            className={`${baseClass}__input`}
            type="file"
            accept=".json"
            onChange={handleFileChange}
          />
          {fileError && (
            <div className={`${baseClass}__fileInfo`} style={{ color: 'var(--theme-error-500)' }}>
              {fileError}
            </div>
          )}
          {parsedFile && (
            <div className={`${baseClass}__fileInfo`}>
              <span className={`${baseClass}__fileCount`}>{parsedFile.count}</span> predictions
              ready to import
            </div>
          )}
        </div>

        <button className={`${baseClass}__button`} type="submit" disabled={!canSubmit}>
          {loading ? 'Importing...' : 'Import Predictions'}
        </button>
      </form>

      {result && (
        <div className={`${baseClass}__result`}>
          <div className={`${baseClass}__resultRow`}>
            <span className={`${baseClass}__resultLabel`}>Predictor:</span>
            <span>{result.predictorName}</span>
          </div>
          <div className={`${baseClass}__resultRow`}>
            <span className={`${baseClass}__resultLabel`}>Total:</span>
            <span>{result.total}</span>
          </div>
          <div className={`${baseClass}__resultRow`}>
            <span className={`${baseClass}__resultLabel`}>Created:</span>
            <span>{result.created}</span>
          </div>
          <div className={`${baseClass}__resultRow`}>
            <span className={`${baseClass}__resultLabel`}>Updated:</span>
            <span>{result.updated}</span>
          </div>
          {result.errors.length > 0 && (
            <div className={`${baseClass}__errors`}>
              <button
                className={`${baseClass}__errorToggle`}
                type="button"
                onClick={() => setShowErrors(!showErrors)}
              >
                {result.errors.length} error{result.errors.length !== 1 ? 's' : ''}{' '}
                {showErrors ? '(hide)' : '(show)'}
              </button>
              {showErrors && (
                <ul className={`${baseClass}__errorList`}>
                  {result.errors.map((err, i) => (
                    <li key={i}>
                      <strong>{err.assemblyId}:</strong> {err.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
