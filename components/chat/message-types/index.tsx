'use client'

import { UrlInput } from './url-input'
import { CardSelector } from './card-selector'
import { LocationPicker } from './location-picker'
import { ConfirmationButtons } from './confirmation-buttons'
import { LoadingIndicator } from './loading-indicator'
import { AnalysisResult } from './analysis-result'

export interface MessageComponent {
  component: string
  props: Record<string, any>
}

export function renderMessageComponent(
  component: MessageComponent,
  onSubmit: (data: any) => void
) {
  switch (component.component) {
    case 'url_input':
      return <UrlInput onSubmit={onSubmit} {...component.props} />
    
    case 'card_selector':
      return <CardSelector onSubmit={onSubmit} {...component.props} />
    
    case 'location_picker':
      return <LocationPicker onSubmit={onSubmit} {...component.props} />
    
    case 'confirmation_buttons':
      return <ConfirmationButtons onSubmit={onSubmit} {...component.props} />
    
    case 'loading_indicator':
      return <LoadingIndicator {...component.props} />
    
    case 'analysis_result':
      return <AnalysisResult {...component.props} />
    
    default:
      return null
  }
}

export {
  UrlInput,
  CardSelector,
  LocationPicker,
  ConfirmationButtons,
  LoadingIndicator,
  AnalysisResult,
}

