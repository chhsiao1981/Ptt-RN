import 'react-native'
import React from 'react'
import App from '../App'
import { render } from '@testing-library/react-native'
import { cleanup } from '@testing-library/react-native'

// Note: test renderer must be required after react-native.

describe('app', () => {
  afterEach(cleanup)

  it('renders correctly', () => {
    render(<App />)
  })

  /*
  it('renders correctly', () => {
    render(<App />)
  })
  */
})