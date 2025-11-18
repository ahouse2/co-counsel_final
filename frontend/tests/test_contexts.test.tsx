import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { CaseProvider, useCaseContext } from '../src/context/CaseContext'
import { HaloProvider, useHaloContext } from '../src/context/HaloContext'

function CaseConsumer() {
  const ctx = useCaseContext()
  return <div data-testid="case-id">{ctx.activeCase?.id ?? 'none'}</div>
}

function CaseSetter() {
  const ctx = useCaseContext()
  React.useEffect(() => {
    ctx.setActiveCase('CASE-TEST')
  }, [])
  return null
}

function HaloConsumer() {
  const ctx = useHaloContext()
  return (
    <>
      <div data-testid="halo-mod">{ctx.activeModuleId}</div>
      <div data-testid="halo-sub">{ctx.activeSubmoduleId}</div>
    </>
  )
}

function HaloSetter() {
  const ctx = useHaloContext()
  React.useEffect(() => {
    ctx.setActiveModuleId('evidence')
    ctx.setActiveSubmoduleId('ocr')
  }, [])
  return null
}

test('CaseContext bootstraps and can set active case', async () => {
  render(
    <CaseProvider>
      <CaseConsumer />
      <CaseSetter />
    </CaseProvider>
  )
  expect(screen.getByTestId('case-id').textContent).toBe('none')
  await waitFor(() => {
    expect(screen.getByTestId('case-id').textContent).toBe('CASE-TEST')
  })
})

test('HaloContext initializes and can be updated', async () => {
  render(
    <HaloProvider>
      <HaloConsumer />
      <HaloSetter />
    </HaloProvider>
  )
  // initial values per HaloProvider defaults
  expect(screen.getByTestId('halo-mod').textContent).toBe('graph')
  expect(screen.getByTestId('halo-sub').textContent).toBe('vector')
  await waitFor(() => {
    // after setter runs
    expect(screen.getByTestId('halo-mod').textContent).toBe('evidence')
    expect(screen.getByTestId('halo-sub').textContent).toBe('ocr')
  })
})
